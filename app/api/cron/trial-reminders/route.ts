import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

export async function GET(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const now = new Date();
  const targets = [7, 3, 1];

  for (const daysLeft of targets) {
    const dayStart = new Date(now.getTime() + (daysLeft - 0.5) * 86400000).toISOString();
    const dayEnd   = new Date(now.getTime() + (daysLeft + 0.5) * 86400000).toISOString();

    const { data: trials } = await admin
      .from("subscriptions")
      .select("user_id, trial_end")
      .eq("status", "trialing")
      .gte("trial_end", dayStart)
      .lte("trial_end", dayEnd);

    for (const trial of trials ?? []) {
      // Skip users who already have an active or past_due subscription
      const { data: activeSub } = await admin
        .from("subscriptions")
        .select("status")
        .eq("user_id", trial.user_id)
        .in("status", ["active", "past_due"])
        .limit(1)
        .maybeSingle();
      if (activeSub) continue;

      const { data: { user } } = await admin.auth.admin.getUserById(trial.user_id);
      if (!user?.email) continue;

      const { data: restaurant } = await admin
        .from("restaurants")
        .select("slug")
        .eq("owner_id", trial.user_id)
        .maybeSingle();

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "DineLinks <noreply@dinelinks.com>",
          to: user.email,
          subject:
            daysLeft === 1
              ? "⚠️ Your DineLinks trial ends tomorrow"
              : `Your DineLinks trial ends in ${daysLeft} days`,
          html: `
            <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 20px;">
              <h1 style="color: #2c2a26;">Your trial ends in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}</h1>
              <p style="color: #6b6560; line-height: 1.6;">
                Hi there, your 60-day DineLinks trial is ending soon.
                To keep your menu live and accessible to your customers,
                subscribe before your trial ends.
              </p>
              <p style="color: #6b6560; line-height: 1.6;">
                <strong>If you don't subscribe, your menu will be paused</strong>
                and visitors will see an "unavailable" message until you sign up.
              </p>
              <p style="color: #9a9591; font-size: 13px; margin-top: 16px; font-style: italic;">
                Already subscribed? Ignore this email.
              </p>
              <a href="https://dinelinks.com/admin/${restaurant?.slug ?? ''}?subscribe=1"
                 style="display: inline-block; background: #8b6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">
                Add payment method
              </a>
              <p style="color: #9a9591; font-size: 13px; margin-top: 40px;">
                Questions? Email us at hello@dinelinks.com<br>
                — Gavin, DineLinks
              </p>
            </div>
          `,
        }),
      });
    }
  }

  // Cancellation warning — day before period ends
  const tomorrowStart = new Date(now.getTime() + 12 * 3600000).toISOString();
  const tomorrowEnd = new Date(now.getTime() + 36 * 3600000).toISOString();

  const { data: cancelling } = await admin
    .from("subscriptions")
    .select("user_id, current_period_end")
    .eq("status", "active")
    .eq("cancel_at_period_end", true)
    .gte("current_period_end", tomorrowStart)
    .lte("current_period_end", tomorrowEnd);

  for (const sub of cancelling ?? []) {
    const { data: { user } } = await admin.auth.admin.getUserById(sub.user_id);
    if (!user?.email) continue;

    const { data: restData } = await admin
      .from("restaurants")
      .select("slug")
      .eq("owner_id", sub.user_id)
      .maybeSingle();

    const endDate = new Date(sub.current_period_end).toLocaleDateString(
      "en-CA", { year: "numeric", month: "long", day: "numeric" }
    );

    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "DineLinks <noreply@dinelinks.com>",
        to: user.email,
        subject: "Your DineLinks subscription ends tomorrow",
        html: `
          <div style="font-family: Georgia, serif; max-width: 520px; margin: 0 auto; padding: 40px 20px; color: #2c2a26;">
            <div style="margin-bottom: 28px;">
              <span style="font-size: 22px; font-weight: 700; color: #2c2a26;">Dine</span><span style="font-size: 22px; font-weight: 700; color: #8b6914;">Links</span>
            </div>
            <h1 style="font-size: 26px; font-weight: 600; color: #2c2a26; margin: 0 0 16px;">Your subscription ends tomorrow</h1>
            <p style="color: #6b6560; line-height: 1.7; margin: 0 0 14px; font-size: 15px;">
              Your DineLinks subscription is set to cancel on <strong style="color: #2c2a26;">${endDate}</strong>.
              After that, your menu will go offline and customers won't be able to view it.
            </p>
            <p style="color: #6b6560; line-height: 1.7; margin: 0 0 28px; font-size: 15px;">
              If you'd like to keep your menu live, tap below to resubscribe.
            </p>
            <a href="https://dinelinks.com/admin/${restData?.slug ?? ''}?subscribe=1"
               style="display: inline-block; background: #8b6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 15px;">
              Keep my menu live →
            </a>
            <div style="border-top: 1px solid #e8e4dd; margin-top: 40px; padding-top: 20px;">
              <p style="color: #9a9591; font-size: 13px; margin: 0; line-height: 1.6;">
                If you meant to cancel, no action needed — your menu will go offline after ${endDate}.<br><br>
                Questions? Email us at hello@dinelinks.com<br>
                — Gavin, DineLinks
              </p>
            </div>
          </div>
        `,
      }),
    });
  }

  return NextResponse.json({ ok: true });
}
