import Link from "next/link";

export default function PrivacyPage() {
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

        <h1 style={{ fontFamily: "Georgia, serif" }} className="text-3xl font-semibold text-[#2c2a26] mb-1">Privacy Policy</h1>
        <p className="text-sm text-[#6b6560] mb-8">Last updated: April 19, 2026</p>

        <div className="space-y-6 text-[#2c2a26] text-sm leading-relaxed">
          <section>
            <h2 className="font-semibold text-base mb-2">Information We Collect</h2>
            <p>We collect the email address and password you provide when signing up. We also collect the menu content you create (dish names, descriptions, prices, photos, and settings). We do not collect payment card details — payments are processed securely by Stripe.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">How We Use It</h2>
            <p>Your information is used to provide the DineLinks service — creating and displaying your digital menu, managing your account, and processing your subscription. We do not sell your data to third parties or use it for advertising.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Data Storage</h2>
            <p>Your data is stored securely using <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-[#8b6914] underline">Supabase</a>, a hosted database platform. Menu photos are stored in Supabase Storage. All data is hosted on servers in the United States.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Cookies</h2>
            <p>We use a session cookie to keep you logged in. We do not use tracking cookies or third-party analytics cookies. Your public menu page does not set any cookies for your guests.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Your Rights</h2>
            <p>You can delete your account and all associated data at any time by contacting us. You can export or modify your menu data from your admin panel at any time.</p>
          </section>

          <section>
            <h2 className="font-semibold text-base mb-2">Contact</h2>
            <p>Questions about this policy? Email us at <a href="mailto:gavinrgallant@gmail.com" className="text-[#8b6914] underline">gavinrgallant@gmail.com</a>.</p>
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
