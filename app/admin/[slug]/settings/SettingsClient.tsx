"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/app/lib/supabase";
import { AccountDangerZone } from "../AccountDangerZone";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "zh", label: "中文" },
  { value: "ar", label: "العربية" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "pt", label: "Português" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
];

type Props = {
  slug: string;
  restaurantId: string;
  userEmail: string;
  notifyTrialEnding: boolean;
  notifyProductUpdates: boolean;
  defaultLanguage: string;
  subStatus: string | null;
  trialDaysLeft: number | null;
  cancelAtPeriodEnd: boolean;
  periodEnd: Date | null;
};

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[#e8e4dd] bg-white divide-y divide-[#e8e4dd] overflow-hidden">
      {children}
    </div>
  );
}

function SettingRow({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-[#faf8f5] transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#2c2a26]">{label}</p>
        {sublabel && <p className="text-xs text-[#6b6560] mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function MiniToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 ${checked ? "bg-[var(--accent)]" : "bg-gray-200"}`}>
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform mt-0.5 ml-0.5 ${checked ? "translate-x-[20px]" : "translate-x-0"}`} />
    </button>
  );
}

export function SettingsClient({
  slug, restaurantId, userEmail,
  notifyTrialEnding: initTrial,
  notifyProductUpdates: initProduct, defaultLanguage: initLang,
  subStatus, trialDaysLeft, cancelAtPeriodEnd, periodEnd,
}: Props) {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const [notifyTrial, setNotifyTrial]   = useState(initTrial);
  const [notifyProduct, setNotifyProduct] = useState(initProduct);
  const [savingNotifs, setSavingNotifs] = useState(false);

  const [defaultLang, setDefaultLang]   = useState(initLang);
  const [savingPrefs, setSavingPrefs]   = useState(false);

  const [pwLoading, setPwLoading]       = useState(false);
  const [pwSent, setPwSent]             = useState(false);

  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const showMsg = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const saveNotifs = async () => {
    setSavingNotifs(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        notify_trial_ending: notifyTrial,
        notify_product_updates: notifyProduct,
      },
    });
    setSavingNotifs(false);
    if (error) showMsg("err", error.message);
    else showMsg("ok", "Preferences saved.");
  };

  const savePrefs = async () => {
    setSavingPrefs(true);
    const { error } = await supabase
      .from("restaurants")
      .update({ default_language: defaultLang })
      .eq("id", restaurantId);
    setSavingPrefs(false);
    if (error) showMsg("err", error.message);
    else showMsg("ok", "Preferences saved.");
  };

  const sendPasswordReset = async () => {
    setPwLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPwLoading(false);
    if (error) showMsg("err", error.message);
    else { setPwSent(true); showMsg("ok", "Password reset email sent — check your inbox."); }
  };

  const signOutAll = async () => {
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
  };

  const openPortal = async () => {
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantSlug: slug }),
    });
    const data = await res.json();
    if (data.url) window.open(data.url, "_blank");
    else alert("Unable to open billing portal. Email hello@dinelinks.com");
  };

  const openCheckout = async () => {
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const planLabel = (() => {
    if (!subStatus || subStatus === "none") return "No active plan";
    if (subStatus === "trialing")
      return trialDaysLeft !== null && trialDaysLeft > 0
        ? `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
        : "Free trial — expired";
    if (subStatus === "active" && cancelAtPeriodEnd && periodEnd)
      return `Pro plan — Cancels on ${periodEnd.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`;
    if (subStatus === "active") return "Pro plan — Active";
    if (subStatus === "past_due") return "Pro Plan — Payment past due";
    if (subStatus === "canceled") return "No active plan";
    return subStatus;
  })();

  const sectionHeader = (label: string, color = "text-[var(--accent)]") => (
    <h2 className={`text-xs font-semibold uppercase tracking-widest ${color} mb-3`}>{label}</h2>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8" style={{ background: "#faf8f5", minHeight: "100vh" }}>

      {/* Toast */}
      {msg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium text-white ${msg.type === "ok" ? "bg-green-600" : "bg-red-600"}`}>
          {msg.text}
        </div>
      )}

      {/* Header */}
      <header>
        <a href={`/admin/${slug}`} className="inline-flex items-center gap-1.5 text-sm text-[#6b6560] hover:text-[#2c2a26] transition-colors mb-4">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to menu editor
        </a>
        <h1 className="font-serif text-3xl font-semibold text-[#2c2a26]">Account settings</h1>
        <p className="text-sm text-[#6b6560] mt-1">These settings apply to your DineLinks account, not your menu.</p>
      </header>

      {/* ACCOUNT */}
      <section>
        {sectionHeader("Account")}
        <SectionCard>
          <SettingRow label="Email" sublabel="Your login email address">
            <span className="text-sm text-[#6b6560] font-mono">{userEmail}</span>
          </SettingRow>
        </SectionCard>
      </section>

      {/* SECURITY */}
      <section>
        {sectionHeader("Security")}
        <SectionCard>
          <SettingRow label="Change password" sublabel="We'll email you a reset link">
            <button type="button" onClick={sendPasswordReset} disabled={pwLoading || pwSent}
              className="px-4 py-2 text-sm font-medium border border-[#e8e4dd] rounded-lg hover:bg-[#f5f1ea] transition-colors disabled:opacity-50">
              {pwSent ? "Email sent ✓" : pwLoading ? "Sending…" : "Send reset email"}
            </button>
          </SettingRow>
          <SettingRow label="Sign out everywhere" sublabel="Ends all active sessions on all devices">
            <button type="button" onClick={signOutAll}
              className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
              Sign out all
            </button>
          </SettingRow>
        </SectionCard>
      </section>

      {/* NOTIFICATIONS */}
      <section>
        {sectionHeader("Notifications")}
        <SectionCard>
          <SettingRow label="Trial ending reminders" sublabel="Emails when your trial is about to expire">
            <MiniToggle checked={notifyTrial} onChange={(v) => { setNotifyTrial(v); }} />
          </SettingRow>
          <SettingRow label="Product updates" sublabel="New features and announcements from DineLinks (opt-in)">
            <MiniToggle checked={notifyProduct} onChange={(v) => { setNotifyProduct(v); }} />
          </SettingRow>
        </SectionCard>
        <button type="button" onClick={saveNotifs} disabled={savingNotifs}
          className="mt-3 px-5 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
          {savingNotifs ? "Saving…" : "Save notification settings"}
        </button>
      </section>

      {/* BILLING */}
      <section>
        {sectionHeader("Billing")}
        <SectionCard>
          <SettingRow label="Current plan" sublabel={planLabel}>
            {subStatus === "trialing" ? (
              <button type="button" onClick={openCheckout}
                className="px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity">
                Subscribe — $25 CAD/mo
              </button>
            ) : subStatus === "active" && cancelAtPeriodEnd ? (
              <button type="button" onClick={openPortal}
                className="px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity">
                Resubscribe
              </button>
            ) : subStatus === "active" ? (
              <button type="button" onClick={openPortal}
                className="px-4 py-2 text-sm font-medium border border-[#e8e4dd] rounded-lg hover:bg-[#f5f1ea] transition-colors">
                Manage subscription
              </button>
            ) : (
              <button type="button" onClick={openCheckout}
                className="px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity">
                Subscribe to continue
              </button>
            )}
          </SettingRow>
          {subStatus === "active" && cancelAtPeriodEnd && (
            <div className="px-4 py-2 text-xs text-[#6b6560]">Your plan will cancel at end of billing period.</div>
          )}
          <SettingRow label="Invoices" sublabel="View and download past invoices">
            <button type="button" onClick={openPortal}
              className="px-4 py-2 text-sm font-medium border border-[#e8e4dd] rounded-lg hover:bg-[#f5f1ea] transition-colors">
              View invoices
            </button>
          </SettingRow>
        </SectionCard>
      </section>

      {/* PREFERENCES */}
      <section>
        {sectionHeader("Preferences")}
        <SectionCard>
          <div className="px-4 py-3.5">
            <label className="block text-sm font-medium text-[#2c2a26] mb-1.5">Default menu language</label>
            <p className="text-xs text-[#6b6560] mb-2">The language shown first when customers open your menu.</p>
            <select value={defaultLang} onChange={(e) => setDefaultLang(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[#e8e4dd] bg-white text-sm text-[#2c2a26] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </SectionCard>
        <button type="button" onClick={savePrefs} disabled={savingPrefs}
          className="mt-3 px-5 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50">
          {savingPrefs ? "Saving…" : "Save preferences"}
        </button>
      </section>

      {/* DANGER ZONE */}
      <section>
        {sectionHeader("Danger zone", "text-red-600")}
        <AccountDangerZone />
      </section>

    </div>
  );
}
