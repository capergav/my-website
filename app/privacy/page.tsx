import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How DineLinks handles your data.",
};

export default function PrivacyPage() {
  return (
    <div className="relative min-h-screen px-4 py-16">
      {/* Fixed blurred background — covers full viewport regardless of scroll */}
      <div
        className="fixed inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80')",
          filter: "blur(8px)",
          zIndex: -2,
        }}
      />
      <div className="fixed inset-0 bg-black/60" style={{ zIndex: -1 }} />

      <div className="flex justify-center">
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-2xl w-full p-8 sm:p-12">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 mb-8">
            <svg width="32" height="29" viewBox="0 0 44 40" fill="none">
              <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="#8b6914" strokeWidth="2.6" strokeLinejoin="round" />
              <line x1="26" y1="3" x2="26" y2="37" stroke="#2c2a26" strokeWidth="2.6" strokeLinecap="round" />
              <line x1="26" y1="37" x2="42" y2="37" stroke="#2c2a26" strokeWidth="2.6" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: "Georgia, serif" }} className="text-xl">
              <span className="text-[#2c2a26]">Dine</span>
              <span className="text-[#8b6914] font-bold">Links</span>
            </span>
          </Link>

          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl font-semibold text-[#2c2a26] mb-1">Privacy Policy</h1>
          <p className="text-sm text-[#6b6560] mb-8">Effective date: April 29, 2026</p>

          <div className="space-y-6 text-[#2c2a26] text-sm leading-relaxed">
            <section>
              <h2 className="font-semibold text-base mb-2">Introduction</h2>
              <p>DineLinks (&apos;we&apos;, &apos;us&apos;, &apos;our&apos;) operates dinelinks.com and provides digital menu services to restaurants. This policy explains what data we collect, how we use it, and your rights.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Information we collect</h2>
              <p className="mb-3"><strong>Account information:</strong> When you create an account, we collect your email address and a password (hashed with bcrypt — never stored in plain text). We may also collect your business name and contact info if you provide it.</p>
              <p className="mb-3"><strong>Restaurant data:</strong> Menu items, categories, descriptions, prices, photos, and themes you upload. This data is used solely to display your menu publicly.</p>
              <p className="mb-3"><strong>Payment information:</strong> We use Stripe to process payments. We never see or store your full credit card numbers — Stripe handles all payment data per PCI-DSS standards. We only store your Stripe customer ID and subscription status.</p>
              <p className="mb-3"><strong>Analytics:</strong> We collect anonymous, aggregated data about how customers interact with your menu (page views, item clicks, language preferences, device type, time of visit). No personally identifiable information about your customers is collected. Customer IP addresses are not stored.</p>
              <p><strong>Cookies and session storage:</strong> We use minimal cookies and browser session storage for authentication and to maintain analytics session IDs. We do not use third-party advertising cookies.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">How we use your information</h2>
              <p>To provide and improve the DineLinks service. To process payments via Stripe. To send you transactional emails (account verification, password reset, trial reminders, billing). To communicate updates about your account. We do not sell your data. We do not share your data with third parties for marketing.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Data storage and security</h2>
              <p>All data is stored in Supabase (PostgreSQL) on infrastructure hosted in North America. Passwords are hashed using bcrypt before storage and are never accessible in plain text — even to us. All data in transit is encrypted via TLS. Access to production data is limited to the founder of DineLinks.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Your rights</h2>
              <p>You can: View, edit, or delete your menu data at any time from your admin panel. Export your data on request. Delete your account permanently from your account settings, which will remove all associated data within 30 days. Request a copy of all data we hold about you by emailing <a href="mailto:privacy@dinelinks.com" className="text-[#8b6914] underline">privacy@dinelinks.com</a>.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Children&apos;s privacy</h2>
              <p>DineLinks is not intended for users under 16. We do not knowingly collect data from children.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Third parties we use</h2>
              <p>Stripe (payment processing). Resend (transactional email delivery). Vercel (hosting). Supabase (database). Google Translate API (menu translation). Each has its own privacy policy.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Changes to this policy</h2>
              <p>We may update this policy occasionally. Material changes will be communicated via email.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Contact</h2>
              <p>Questions? Email <a href="mailto:privacy@dinelinks.com" className="text-[#8b6914] underline">privacy@dinelinks.com</a> or use our <Link href="/contact" className="text-[#8b6914] underline">contact page</Link>.</p>
            </section>
          </div>

          <div className="mt-10 pt-6 border-t border-gray-200">
            <Link href="/" className="text-sm text-[#6b6560] hover:text-[#2c2a26] transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
