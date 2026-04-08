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
      setError(error.message);
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

      {/* Frosted glass card */}
      <div className="relative z-10 w-full max-w-sm bg-white/90 backdrop-blur-sm rounded-2xl border border-white/60 shadow-xl p-8">
        {/* Gold book icon */}
        <div className="flex justify-center mb-5">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#8b6914" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>

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
    </main>
  );
}
