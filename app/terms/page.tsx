import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "DineLinks terms of service.",
};

export default function TermsPage() {
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

          <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl font-semibold text-[#2c2a26] mb-1">Terms of Service</h1>
          <p className="text-sm text-[#6b6560] mb-8">Effective date: April 29, 2026</p>

          <div className="space-y-6 text-[#2c2a26] text-sm leading-relaxed">
            <section>
              <h2 className="font-semibold text-base mb-2">Acceptance of terms</h2>
              <p>By using DineLinks, you agree to these Terms. If you do not agree, do not use the service.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">The service</h2>
              <p>DineLinks provides digital menu hosting, multilingual translation, QR code generation, and analytics for independent restaurants and food businesses.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Free trial</h2>
              <p>New accounts receive a 60-day free trial with no credit card required. After the trial, your menu will pause until you start a subscription. No charges occur unless you actively start a paid subscription.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Pricing and billing</h2>
              <p>Subscriptions are CA$25.00 per month, billed via Stripe in Canadian dollars (CAD). Prices are subject to change with 30 days&apos; notice. Applicable taxes (GST/HST) will be added based on your billing location. Charges renew automatically each month until cancelled.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Cancellation</h2>
              <p>You can cancel anytime from your billing settings. Your menu will remain active until the end of your current billing period. No partial refunds for unused time.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Refunds</h2>
              <p>All payments are non-refundable except where required by law. If you experience a billing error, contact us within 30 days at <a href="mailto:hello@dinelinks.com" className="text-[#8b6914] underline">hello@dinelinks.com</a>.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Your content</h2>
              <p>You retain all rights to the content you upload (menu items, photos, descriptions). By uploading, you grant DineLinks a limited license to display and translate your content as part of the service. You are responsible for ensuring you have the rights to all content you upload.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Acceptable use</h2>
              <p>Do not use DineLinks to: upload illegal or infringing content, impersonate another business, transmit malware, or interfere with the service. We may suspend accounts that violate these rules.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Service availability</h2>
              <p>We aim for 99.9% uptime but do not guarantee uninterrupted service. Maintenance, outages, or third-party failures may occasionally affect availability.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Limitation of liability</h2>
              <p>DineLinks is provided &apos;as is&apos; without warranties. To the maximum extent permitted by Canadian law, our liability for any claim is limited to the amount you paid in the previous 12 months.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Termination</h2>
              <p>You can delete your account at any time. We may terminate accounts that violate these Terms. Upon termination, your data is removed within 30 days.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Governing law</h2>
              <p>These Terms are governed by the laws of Ontario, Canada. Disputes will be resolved in Ontario courts.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Changes</h2>
              <p>We may update these Terms with 30 days&apos; notice. Continued use after changes constitutes acceptance.</p>
            </section>

            <section>
              <h2 className="font-semibold text-base mb-2">Contact</h2>
              <p>Questions? Email <a href="mailto:hello@dinelinks.com" className="text-[#8b6914] underline">hello@dinelinks.com</a>.</p>
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
