import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upgrade | DineLinks",
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
        <h1 className="text-2xl font-serif font-semibold text-[#2c2a26] mb-2">Upgrade to DineLinks</h1>
        <p className="text-sm text-[#6b6560] mb-8">
          Full billing management is coming soon. For now, head back to your admin dashboard and use the
          {" "}<strong>Start subscription</strong> button in the top navigation.
        </p>
        <Link
          href="/admin"
          className="inline-block bg-[#8b6914] text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          Back to dashboard
        </Link>
      </div>
    </main>
  );
}
