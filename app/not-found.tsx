import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="min-h-screen flex flex-col items-center justify-center px-4 text-center"
      style={{ background: "#faf8f5" }}
    >
      {/* Logo */}
      <Link href="/" className="flex flex-col items-center gap-2 mb-8 no-underline group">
        <div className="w-14 h-14 rounded-2xl bg-[#8b6914] flex items-center justify-center shadow-lg group-hover:opacity-90 transition-opacity">
          <svg width="32" height="29" viewBox="0 0 44 40" fill="none">
            <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinejoin="round"/>
            <line x1="26" y1="3" x2="26" y2="37" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round"/>
            <line x1="26" y1="37" x2="42" y2="37" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round"/>
          </svg>
        </div>
        <span style={{ fontFamily: "Georgia, serif" }} className="text-lg font-semibold">
          <span className="text-[#2c2a26]">Dine</span><span className="text-[#8b6914]">Links</span>
        </span>
      </Link>

      <p
        style={{ fontFamily: "Georgia, serif", color: "#8b6914" }}
        className="text-8xl font-semibold mb-4"
      >
        404
      </p>

      <h1
        style={{ fontFamily: "Georgia, serif" }}
        className="text-2xl sm:text-3xl font-semibold text-[#2c2a26] mb-3"
      >
        We couldn&apos;t find that page
      </h1>

      <p className="text-[#6b6560] text-base max-w-sm mb-8">
        It may have been moved, or the link might be broken.
      </p>

      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Link
          href="/"
          className="bg-[#8b6914] text-white font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
        >
          Back to home
        </Link>
        <Link
          href="/contact"
          className="text-[#8b6914] font-medium text-sm hover:underline underline-offset-4"
        >
          Contact support
        </Link>
      </div>
    </main>
  );
}
