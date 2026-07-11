export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { createSupabaseServerClient } from '@/app/lib/supabase';

// This is OWNER → DINELINKS feedback (bug reports, feature requests, general
// thoughts from restaurant owners to us). Completely separate from the guest
// feedback feature (diner → restaurant) that lives in /api/feedback.

const VALID_TYPES = ['bug', 'feature', 'general'] as const;
type FeedbackType = (typeof VALID_TYPES)[number];

const TYPE_LABELS: Record<FeedbackType, string> = {
  bug: 'Bug report',
  feature: 'Feature request',
  general: 'General feedback',
};

// In-memory rate limiting: Map<userId, { count, resetAt }>
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return true;
  }

  entry.count++;
  return false;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export async function POST(req: NextRequest) {
  // Identity ALWAYS comes from the session cookie — never from the request body.
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: 'Too many submissions. Please try again later.' },
      { status: 429 }
    );
  }

  const { type, message } = await req.json().catch(() => ({}));

  // Validate type
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: 'Invalid feedback type' }, { status: 400 });
  }

  // Validate message
  if (!message || typeof message !== 'string' || !message.trim()) {
    return NextResponse.json({ error: 'Message is required' }, { status: 400 });
  }

  const trimmedMessage = message.trim().slice(0, 2000);
  const email = user.email ?? '';

  // Look up the owner's restaurant (denormalize the name so we can see who sent it).
  const { data: restaurant } = await supabaseAdmin
    .from('restaurants')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle();

  const restaurantId = restaurant?.id ?? null;
  const restaurantName = restaurant?.name ?? 'Unknown';

  // Insert via service role.
  const { error: insertError } = await supabaseAdmin.from('owner_feedback').insert({
    user_id: user.id,
    restaurant_id: restaurantId,
    restaurant_name: restaurantName,
    email,
    type,
    message: trimmedMessage,
  });

  if (insertError) {
    console.error('Owner feedback insert error:', insertError);
    return NextResponse.json({ error: 'Failed to submit feedback' }, { status: 500 });
  }

  // Notify us immediately via Resend. Don't fail the request if the email
  // doesn't send — the feedback is already saved.
  try {
    const label = TYPE_LABELS[type as FeedbackType];
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'DineLinks <noreply@dinelinks.com>',
        to: 'hello@dinelinks.com',
        reply_to: email || undefined,
        subject: `[${label}] from ${restaurantName}`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px 20px; color: #2c2a26;">
            <p style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 2px; color: #8b6914; margin: 0 0 8px;">${escapeHtml(label)}</p>
            <table style="width: 100%; font-family: -apple-system, Helvetica, sans-serif; font-size: 14px; border-collapse: collapse; margin-bottom: 20px;">
              <tr><td style="padding: 4px 12px 4px 0; color: #8a857c;">Restaurant</td><td style="padding: 4px 0;"><strong>${escapeHtml(restaurantName)}</strong></td></tr>
              <tr><td style="padding: 4px 12px 4px 0; color: #8a857c;">Owner</td><td style="padding: 4px 0;">${escapeHtml(email)}</td></tr>
            </table>
            <div style="font-family: -apple-system, Helvetica, sans-serif; font-size: 15px; line-height: 1.6; white-space: pre-wrap; padding: 16px; background: #f7f5f1; border-radius: 12px; border: 1px solid #e8e4dd;">${escapeHtml(trimmedMessage)}</div>
          </div>
        `,
      }),
    });
  } catch (emailErr) {
    console.error('Owner feedback email error:', emailErr);
  }

  return NextResponse.json({ success: true });
}
