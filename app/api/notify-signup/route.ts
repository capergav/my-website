export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createSupabaseServerClient } from '@/app/lib/supabase';

// Founder-only business alert. Fired once from the signup flow after a new
// restaurant account is created. Sends a single email to hello@dinelinks.com
// with the new signup + a full business snapshot. NEVER goes to the owner.
//
// Protection: identity comes from the session cookie. Only the freshly
// authenticated owner (or any logged-in user) can trigger it — anonymous
// callers get 401, so the founder inbox can't be spammed from the open web.

const FOUNDER_EMAIL = 'hello@dinelinks.com';
const FROM = 'DineLinks <noreply@dinelinks.com>';
const PRICE_CAD = 25;
const DAY_MS = 86400000;

function fmtDate(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-CA', { year: 'numeric', month: 'short', day: 'numeric' });
}

function fmtDateTime(d: Date | null): string {
  if (!d || isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-CA', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Toronto',
  }) + ' ET';
}

function esc(str: string): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

type SubRow = {
  user_id: string;
  status: string | null;
  stripe_subscription_id: string | null;
  trial_end: string | null;
};

export async function POST() {
  // Identity strictly from the session cookie — never trusted from the body.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  try {
    const now = new Date();

    // ── Pull every restaurant, subscription, and menu-item owner id ──────────
    const [{ data: restaurants }, { data: subs }, { data: items }] = await Promise.all([
      supabaseAdmin.from('restaurants').select('id, owner_id, name, slug'),
      supabaseAdmin.from('subscriptions').select('user_id, status, stripe_subscription_id, trial_end'),
      supabaseAdmin.from('menu_items').select('restaurant_id'),
    ]);

    const allRestaurants = restaurants ?? [];
    const subByUser = new Map<string, SubRow>();
    for (const s of (subs ?? []) as SubRow[]) subByUser.set(s.user_id, s);

    // Which restaurants have at least one menu item (onboarding signal).
    const restaurantsWithItems = new Set<string>();
    for (const it of items ?? []) restaurantsWithItems.add((it as { restaurant_id: string }).restaurant_id);

    // ── Auth users: id → { email, created_at } (paginated) ───────────────────
    const userMap = new Map<string, { email: string; createdAt: Date }>();
    for (let page = 1; page <= 20; page++) {
      const { data: list } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 1000 });
      const batch = list?.users ?? [];
      for (const u of batch) {
        userMap.set(u.id, {
          email: u.email ?? '—',
          createdAt: u.created_at ? new Date(u.created_at) : now,
        });
      }
      if (batch.length < 1000) break;
    }

    // ── Lightweight aggregate counts (guest feedback + menu views) ───────────
    const [{ count: feedbackCount }, { count: viewCount }] = await Promise.all([
      supabaseAdmin.from('guest_feedback').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('menu_analytics').select('*', { count: 'exact', head: true }).eq('event_type', 'page_view'),
    ]);

    // ── Classify each restaurant ─────────────────────────────────────────────
    type Client = {
      name: string;
      email: string;
      statusLabel: string;
      daysSinceSignup: number;
      trialDaysLeft: number | null;
      hasItems: boolean;
      signupAt: Date;
    };

    let trialingCount = 0;   // trialing, no stripe sub
    let subscribedCount = 0; // has stripe_subscription_id (incl mid-trial)
    let activeCount = 0;     // status active
    let canceledCount = 0;
    let neverOnboarded = 0;
    const payingUsers = new Set<string>();
    const clients: Client[] = [];

    for (const r of allRestaurants) {
      const ownerId = r.owner_id as string;
      const sub = ownerId ? subByUser.get(ownerId) : undefined;
      const u = ownerId ? userMap.get(ownerId) : undefined;
      const signupAt = u?.createdAt ?? now;
      const hasSub = !!sub?.stripe_subscription_id;
      const status = sub?.status ?? 'trialing';
      const hasItems = restaurantsWithItems.has(r.id as string);

      let statusLabel = 'Trial';
      if (status === 'canceled') { statusLabel = 'Canceled'; canceledCount++; }
      else if (status === 'active') { statusLabel = 'Active (paying)'; activeCount++; payingUsers.add(ownerId); }
      else if (hasSub) { statusLabel = 'Subscribed (mid-trial)'; }
      else { statusLabel = 'Trial'; trialingCount++; }

      if (hasSub) { subscribedCount++; payingUsers.add(ownerId); }
      if (!hasItems) neverOnboarded++;

      let trialDaysLeft: number | null = null;
      if (status === 'trialing' && sub?.trial_end) {
        trialDaysLeft = Math.max(0, Math.ceil((new Date(sub.trial_end).getTime() - now.getTime()) / DAY_MS));
      }

      clients.push({
        name: (r.name as string) ?? 'Untitled',
        email: u?.email ?? '—',
        statusLabel,
        daysSinceSignup: Math.max(0, Math.floor((now.getTime() - signupAt.getTime()) / DAY_MS)),
        trialDaysLeft,
        hasItems,
        signupAt,
      });
    }

    const totalRestaurants = allRestaurants.length;
    const newLast7 = clients.filter((c) => now.getTime() - c.signupAt.getTime() <= 7 * DAY_MS).length;
    const newLast30 = clients.filter((c) => now.getTime() - c.signupAt.getTime() <= 30 * DAY_MS).length;
    const mrr = payingUsers.size * PRICE_CAD;
    const conversion = totalRestaurants > 0 ? (subscribedCount / totalRestaurants) * 100 : 0;

    // Sort client list newest signup first.
    clients.sort((a, b) => b.signupAt.getTime() - a.signupAt.getTime());

    // ── The new signup itself (session user) ─────────────────────────────────
    const newRestaurant = allRestaurants.find((r) => r.owner_id === user.id);
    const newSub = subByUser.get(user.id);
    const newUser = userMap.get(user.id);
    const newName = (newRestaurant?.name as string) ?? user.user_metadata?.restaurant_name ?? 'Untitled';
    const newSlug = (newRestaurant?.slug as string) ?? '';
    const newEmail = newUser?.email ?? user.email ?? '—';
    const signupAt = newUser?.createdAt ?? now;
    const trialEnd = newSub?.trial_end ? new Date(newSub.trial_end) : null;

    // ── Build the email HTML ─────────────────────────────────────────────────
    const cardCell = (label: string, value: string, accent = '#2c2a26') => `
      <td style="padding: 6px;" width="50%">
        <div style="background:#f7f5f1;border:1px solid #e8e4dd;border-radius:12px;padding:14px 16px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;color:#8a857c;">${label}</div>
          <div style="font-size:22px;font-weight:700;color:${accent};margin-top:4px;">${value}</div>
        </div>
      </td>`;

    const statusColor: Record<string, string> = {
      'Active (paying)': '#1a7f4b',
      'Subscribed (mid-trial)': '#8b6914',
      'Trial': '#5b7fb5',
      'Canceled': '#b45050',
    };

    const clientRows = clients.map((c, i) => `
      <tr style="background:${i % 2 ? '#faf9f6' : '#ffffff'};">
        <td style="padding:10px 12px;font-size:13px;color:#2c2a26;font-weight:600;">${esc(c.name)}</td>
        <td style="padding:10px 12px;font-size:12px;color:#6b6560;">${esc(c.email)}</td>
        <td style="padding:10px 12px;font-size:12px;"><span style="color:${statusColor[c.statusLabel] ?? '#6b6560'};font-weight:600;">${esc(c.statusLabel)}</span></td>
        <td style="padding:10px 12px;font-size:12px;color:#6b6560;text-align:center;">${c.daysSinceSignup}d</td>
        <td style="padding:10px 12px;font-size:12px;color:#6b6560;text-align:center;">${c.trialDaysLeft != null ? c.trialDaysLeft + 'd' : '—'}</td>
        <td style="padding:10px 12px;font-size:12px;text-align:center;">${c.hasItems ? '<span style="color:#1a7f4b;">●</span>' : '<span style="color:#b45050;">○</span>'}</td>
      </tr>`).join('');

    const html = `
    <div style="background:#efece6;padding:24px 0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
      <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

        <!-- Header -->
        <div style="background:#2c2a26;padding:22px 28px;">
          <span style="font-size:20px;font-weight:700;color:#ffffff;">Dine</span><span style="font-size:20px;font-weight:700;color:#8b6914;">Links</span>
          <div style="color:#a39d94;font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:2px;">New signup alert</div>
        </div>

        <!-- New signup block -->
        <div style="padding:24px 28px 8px;">
          <h1 style="font-size:20px;color:#2c2a26;margin:0 0 4px;">🎉 ${esc(newName)}</h1>
          <p style="color:#8a857c;font-size:13px;margin:0 0 16px;">just signed up for DineLinks</p>
          <table width="100%" style="border-collapse:collapse;font-size:14px;">
            <tr><td style="padding:5px 0;color:#8a857c;width:130px;">Owner email</td><td style="padding:5px 0;color:#2c2a26;">${esc(newEmail)}</td></tr>
            <tr><td style="padding:5px 0;color:#8a857c;">Live menu</td><td style="padding:5px 0;"><a href="https://dinelinks.com/menu/${esc(newSlug)}" style="color:#8b6914;">dinelinks.com/menu/${esc(newSlug)}</a></td></tr>
            <tr><td style="padding:5px 0;color:#8a857c;">Signed up</td><td style="padding:5px 0;color:#2c2a26;">${fmtDateTime(signupAt)}</td></tr>
            <tr><td style="padding:5px 0;color:#8a857c;">Trial ends</td><td style="padding:5px 0;color:#2c2a26;">${fmtDate(trialEnd)}</td></tr>
          </table>
        </div>

        <!-- Snapshot -->
        <div style="padding:20px 22px 4px;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#8b6914;font-weight:700;padding:0 6px 8px;">Business snapshot</div>
          <table width="100%" style="border-collapse:collapse;">
            <tr>${cardCell('Total signups', String(totalRestaurants))}${cardCell('Est. MRR', '$' + mrr + ' CAD', '#1a7f4b')}</tr>
            <tr>${cardCell('On free trial', String(trialingCount))}${cardCell('Subscribed', String(subscribedCount))}</tr>
            <tr>${cardCell('Active paying', String(activeCount), '#1a7f4b')}${cardCell('Canceled', String(canceledCount), '#b45050')}</tr>
            <tr>${cardCell('New · last 7d', String(newLast7))}${cardCell('New · last 30d', String(newLast30))}</tr>
            <tr>${cardCell('Trial → paid', conversion.toFixed(1) + '%')}${cardCell('Never onboarded', String(neverOnboarded), neverOnboarded > 0 ? '#b45050' : '#2c2a26')}</tr>
            <tr>${cardCell('Total menu views', String(viewCount ?? 0))}${cardCell('Guest reviews', String(feedbackCount ?? 0))}</tr>
          </table>
          <p style="font-size:11px;color:#a39d94;padding:6px 8px 0;margin:0;">MRR = paying customers (active + committed) × $${PRICE_CAD} CAD. “Never onboarded” = 0 menu items added.</p>
        </div>

        <!-- Client list -->
        <div style="padding:20px 22px 24px;">
          <div style="font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#8b6914;font-weight:700;padding:0 2px 10px;">Full client list (${totalRestaurants})</div>
          <table width="100%" style="border-collapse:collapse;border:1px solid #e8e4dd;border-radius:8px;overflow:hidden;">
            <thead>
              <tr style="background:#2c2a26;">
                <th style="padding:9px 12px;text-align:left;font-size:11px;color:#e8e4dd;text-transform:uppercase;letter-spacing:0.5px;">Restaurant</th>
                <th style="padding:9px 12px;text-align:left;font-size:11px;color:#e8e4dd;text-transform:uppercase;letter-spacing:0.5px;">Owner</th>
                <th style="padding:9px 12px;text-align:left;font-size:11px;color:#e8e4dd;text-transform:uppercase;letter-spacing:0.5px;">Status</th>
                <th style="padding:9px 12px;text-align:center;font-size:11px;color:#e8e4dd;text-transform:uppercase;letter-spacing:0.5px;">Age</th>
                <th style="padding:9px 12px;text-align:center;font-size:11px;color:#e8e4dd;text-transform:uppercase;letter-spacing:0.5px;">Trial</th>
                <th style="padding:9px 12px;text-align:center;font-size:11px;color:#e8e4dd;text-transform:uppercase;letter-spacing:0.5px;">Menu</th>
              </tr>
            </thead>
            <tbody>${clientRows}</tbody>
          </table>
          <p style="font-size:11px;color:#a39d94;padding:8px 2px 0;margin:0;">Age = days since signup · Trial = days left · Menu ● = has items, ○ = empty</p>
        </div>

        <div style="background:#f7f5f1;padding:16px 28px;border-top:1px solid #e8e4dd;">
          <p style="font-size:12px;color:#a39d94;margin:0;">Automated founder alert · DineLinks</p>
        </div>
      </div>
    </div>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to: FOUNDER_EMAIL,
        subject: `🎉 New signup: ${newName} — ${totalRestaurants} total, $${mrr} MRR`,
        html,
      }),
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    // Never let a reporting failure surface to the signup flow.
    console.error('notify-signup error:', err);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}
