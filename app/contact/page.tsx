"use client";

import Link from "next/link";

export default function ContactPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Blurred background */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80)",
          filter: "blur(8px)",
        }}
      />
      <div className="absolute inset-0 bg-black/40" />

      {/* Logo + card wrapper */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        {/* Logo mark — links home */}
        <Link href="/" className="flex flex-col items-center no-underline cursor-pointer mb-5">
          <div className="w-14 h-14 rounded-2xl bg-[#8b6914] flex items-center justify-center shadow-lg mb-3">
            <svg width="32" height="29" viewBox="0 0 44 40" fill="none">
              <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinejoin="round"/>
              <line x1="26" y1="3" x2="26" y2="37" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round"/>
              <line x1="26" y1="37" x2="42" y2="37" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-white text-xs font-semibold uppercase tracking-widest">DineLinks</p>
        </Link>

        {/* Frosted glass card */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl p-8">
          <h1 className="text-2xl font-serif font-semibold text-gray-900 text-center">Contact</h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            Questions about DineLinks? Reach out directly.
          </p>

          <hr className="mt-6 mb-6 border-gray-100" />

          <div className="space-y-0">
            {/* Row 1 — Name */}
            <div className="flex items-center gap-3 py-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-lg bg-[#8b6914]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span className="text-[#2c2a26] font-medium text-sm">Gavin Gallant</span>
            </div>

            {/* Row 2 — Email */}
            <div className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-lg bg-[#8b6914]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-[#8b6914]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <a
                href="mailto:hello@dinelinks.com"
                className="text-[#8b6914] text-sm font-medium hover:underline"
              >
                hello@dinelinks.com
              </a>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/" className="text-sm text-[#6b6560] hover:text-[#2c2a26] transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
