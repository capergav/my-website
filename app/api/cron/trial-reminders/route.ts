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
      const { data: activeSubs } = await admin
        .from("subscriptions")
        .select("status")
        .eq("user_id", trial.user_id)
        .in("status", ["active", "past_due"])
        .limit(1);
      if (activeSubs && activeSubs.length > 0) continue;

      const { data: { user } } = await admin.auth.admin.getUserById(trial.user_id);
      if (!user?.email) continue;

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
                Hi there, your 2-month DineLinks trial is ending soon.
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
              <a href="https://dinelinks.com/admin"
                 style="display: inline-block; background: #8b6914; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px;">
                Add payment method
              </a>
              <p style="color: #9a9591; font-size: 13px; margin-top: 40px;">
                Questions? Reply to this email.<br>
                — Gavin, DineLinks
              </p>
            </div>
          `,
        }),
      });
    }
  }

  return NextResponse.json({ ok: true });
}
