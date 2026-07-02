import Link from "next/link";
import type { Metadata } from "next";

// TODO: Implement full billing page with:
// - Stripe customer portal embed (easiest path)
// - View/update payment method
// - View invoices
// - Cancel subscription
// - Reactivate subscription

export const metadata: Metadata = {
  title: "Upgrade",
};

export default function BillingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "#faf8f5" }}>
      <div className="max-w-md w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#8b6914] flex items-center justify-center shadow-lg mx-auto mb-6">
          <svg width="32" height="29" viewBox="0 0 44 40" fill="none">
            <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinejoin="round"/>
            <line x1="26" y1="3" x2="26" y2="37" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round"/>
            <line x1="26" y1="37" x2="42" y2="37" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round"/>
          </svg>
        </div>
        <h1 className="text-2xl font-serif font-semibold text-[#2c2a26] mb-2">Start your 60-day free trial</h1>
        <p className="text-sm text-[#6b6560] mb-2">
          Full access to DineLinks for 60 days free, then $25 CAD/month. Cancel anytime.
        </p>
        <p className="text-sm text-[#6b6560] mb-8">
          Head back to your admin dashboard and click{" "}<strong>DineLinks Monthly</strong>{" "}in the top navigation to begin.
        </p>
        <Link
          href="/admin"
          className="inline-block bg-[#8b6914] text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          Back to dashboard
        </Link>
        <p className="text-xs text-[#6b6560]/70 mt-6">
          Need help with billing?{" "}
          <a href="mailto:support@dinelinks.com" className="text-[#8b6914] hover:underline underline-offset-4">
            Email support@dinelinks.com
          </a>
        </p>
      </div>
    </main>
  );
}
