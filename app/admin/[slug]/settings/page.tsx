export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabase";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { SettingsClient } from "./SettingsClient";

export const metadata: Metadata = { title: "Account Settings — DineLinks" };

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/admin/${slug}/settings`);

  const meta = user.user_metadata ?? {};

  // Subscription info
  const admin = getSupabaseAdmin();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("status, trial_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const trialDaysLeft = sub?.status === "trialing" && sub?.trial_end
    ? Math.max(0, Math.ceil((new Date(sub.trial_end).getTime() - Date.now()) / 86400000))
    : null;

  return (
    <SettingsClient
      slug={slug}
      userEmail={user.email ?? ""}
      displayName={meta.display_name ?? ""}
      notifyWeeklyAnalytics={meta.notify_weekly_analytics ?? true}
      notifyTrialEnding={meta.notify_trial_ending ?? true}
      notifyProductUpdates={meta.notify_product_updates ?? false}
      defaultLanguage={meta.default_language ?? "en"}
      subStatus={sub?.status ?? null}
      trialDaysLeft={trialDaysLeft}
    />
  );
}
