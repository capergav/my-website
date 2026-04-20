import Link from "next/link";

export default function TermsPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4 py-16"
      style={{
        backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl max-w-2xl w-full p-8 sm:p-12">
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
        <p className="text-sm text-[#6b6560] mb-8">Last updated: April 19, 2026</p>

        <div className="space-y-6 text-[#2c2a26] text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-base mb-2">Agreement</h2>
            <p>By creating an account and using DineLinks, you agree to these terms. If you don&apos;t agree, please don&apos;t use the service.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Account & Trial</h2>
            <p>New accounts receive a <strong>2-month free trial</strong> with no credit card required. After the trial period ends, your menu will be paused until you subscribe. The current price is <strong>$25/month</strong>. Prices may change with 30 days notice.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Your Content</h2>
            <p>You own all the content you create on DineLinks — your menu items, descriptions, photos, and branding. You grant us a license to display this content to your guests as part of the service. You are responsible for ensuring you have the rights to any photos or text you upload.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Cancellation</h2>
            <p>You can cancel your subscription at any time from your billing portal. Cancellation takes effect at the end of your current billing period. After cancellation, your menu will be paused but your data is retained for 90 days in case you reactivate.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Payments</h2>
            <p>Payments are processed by Stripe. Your card is charged monthly on your billing date. All prices are in USD.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Refunds</h2>
            <p>We don&apos;t offer refunds for partial months, but you can cancel anytime and you won&apos;t be charged for the next period. If you believe you were charged in error, contact us and we&apos;ll make it right.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Liability</h2>
            <p>DineLinks is provided as-is. We are not liable for any loss of business, revenue, or data resulting from service interruptions. We aim for high uptime but cannot guarantee 100% availability.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Changes to Terms</h2>
            <p>We may update these terms from time to time. We&apos;ll email you before significant changes. Continuing to use DineLinks after changes take effect means you accept the new terms.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Contact</h2>
            <p>Questions? Email us at <a href="mailto:gavinrgallant@gmail.com" className="text-[#8b6914] underline">gavinrgallant@gmail.com</a>.</p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-200">
          <Link href="/" className="text-sm text-[#6b6560] hover:text-[#2c2a26] transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
