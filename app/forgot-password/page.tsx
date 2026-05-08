"use client";

import { useState } from "react";
import { createSupabaseClient } from "@/app/lib/supabase";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      console.error('Reset password error:', error);
      setError(`${error.message} (${(error as { status?: number }).status ?? 'unknown'})`);
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Blurred background */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80)",
          filter: "blur(6px)",
          transform: "scale(1.05)",
        }}
      />
      <div className="absolute inset-0 bg-black/30" />

      {/* Logo mark + card wrapper */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        {/* Gold rounded icon above card — links home */}
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
      <div className="w-full bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-8">
        <h1 className="text-2xl font-serif font-semibold text-gray-900 mb-1 text-center">
          Reset your password
        </h1>

        {sent ? (
          <>
            <p className="text-sm text-gray-600 text-center mt-3 mb-6">
              Check your inbox — we&apos;ve sent a reset link to <strong>{email}</strong>.
            </p>
            <Link
              href="/login"
              className="block w-full py-2.5 rounded-lg bg-[#8b6914] text-white font-medium text-center hover:opacity-90 transition-opacity"
            >
              Back to sign in
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-6 text-center">
              Enter your email and we&apos;ll send you a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
                />
              </div>
              {error && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-[#8b6914] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {loading ? "Sending…" : "Send reset link"}
              </button>
            </form>
            <p className="text-sm text-center text-gray-500 mt-6">
              <Link href="/login" className="text-[#8b6914] font-medium hover:underline">
                Back to sign in
              </Link>
            </p>
          </>
        )}
      </div>
      </div>
    </main>
  );
}
