"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/app/lib/supabase";
import Link from "next/link";

const BG_URL = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80";

function validatePassword(pw: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter.";
  return null;
}

function Rule({ met, text }: { met: boolean; text: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-xs flex-shrink-0 ${met ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
        {met ? "✓" : "·"}
      </span>
      <span className={`text-xs ${met ? "text-green-600" : "text-gray-400"}`}>{text}</span>
    </div>
  );
}

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseClient();

  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCf, setShowCf] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const tokenHash = searchParams.get("token_hash");
    const type = searchParams.get("type");

    if (tokenHash && type === "recovery") {
      supabase.auth
        .verifyOtp({ token_hash: tokenHash, type: "recovery" })
        .then(({ error }) => {
          if (error) {
            setError("This reset link has expired or already been used. Please request a new one.");
          } else {
            setReady(true);
          }
        });
    } else {
      setError("Invalid reset link. Please request a new password reset.");
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      // A missing/expired session means the recovery link is no longer valid —
      // surface a clear message and send them back to request a new one, rather
      // than leaking Supabase's raw "Auth session missing!" text.
      const msg = /session|expired|token/i.test(error.message)
        ? "Your reset link has expired. Please request a new password reset."
        : error.message;
      setError(msg);
      setLoading(false);
      return;
    }
    await supabase.auth.signOut();
    router.push("/login?reset=success");
  };

  const passwordError = password ? validatePassword(password) : null;

  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-white/60 shadow-2xl p-8">
      <h1 className="text-2xl font-serif font-semibold text-gray-900 mb-1">New password</h1>
      <p className="text-sm text-gray-500 mb-6">Choose a strong password for your account.</p>

      {!ready && !error && (
        <div className="text-center py-6">
          <div className="w-8 h-8 border-2 border-[#8b6914] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-400">Verifying your reset link…</p>
        </div>
      )}

      {error && !ready && (
        <div className="space-y-4">
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-3">{error}</p>
          <Link href="/forgot-password"
            className="block w-full text-center py-2.5 rounded-xl bg-[#8b6914] text-white font-medium text-sm hover:opacity-90 transition-opacity">
            Request a new reset link
          </Link>
        </div>
      )}

      {ready && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"} required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full px-3 py-2.5 pr-10 rounded-xl border bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914] ${
                  passwordError ? "border-red-300" : "border-gray-200"
                }`}
              />
              <button type="button" onClick={() => setShowPw(s => !s)} tabIndex={-1}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600">
                {showPw ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <div className="mt-1.5 space-y-1">
              <Rule met={password.length >= 8} text="At least 8 characters" />
              <Rule met={/[A-Z]/.test(password)} text="At least one uppercase letter" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
            <div className="relative">
              <input
                type={showCf ? "text" : "password"} required value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={`w-full px-3 py-2.5 pr-10 rounded-xl border bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914] ${
                  confirm && password !== confirm ? "border-red-300" : "border-gray-200"
                }`}
              />
              <button type="button" onClick={() => setShowCf(s => !s)} tabIndex={-1}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600">
                {showCf ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {confirm && password !== confirm && <p className="text-xs text-red-600 mt-1">Passwords do not match.</p>}
          </div>

          {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full py-2.5 rounded-xl bg-[#8b6914] text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
            {loading ? "Saving…" : "Set new password"}
          </button>
        </form>
      )}

      <p className="text-sm text-center text-gray-500 mt-6">
        <Link href="/login" className="text-[#8b6914] font-medium hover:underline">Back to sign in</Link>
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative">
      <div className="absolute inset-0 overflow-hidden">
        <img src={BG_URL} alt="" className="w-full h-full object-cover scale-105" />
        <div className="absolute inset-0 backdrop-blur-md bg-black/40" />
      </div>
      <div className="relative z-10 w-full max-w-sm">
        <Link href="/" className="flex flex-col items-center no-underline cursor-pointer mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#8b6914] flex items-center justify-center shadow-lg mb-3">
            <svg width="28" height="25" viewBox="0 0 44 40" fill="none">
              <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="#ffffff" strokeWidth="2.6" strokeLinejoin="round"/>
              <line x1="26" y1="3" x2="26" y2="37" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round"/>
              <line x1="26" y1="37" x2="42" y2="37" stroke="#ffffff" strokeWidth="2.6" strokeLinecap="round"/>
            </svg>
          </div>
          <p className="text-white/80 text-xs font-semibold uppercase tracking-[0.2em]">DineLinks</p>
        </Link>
        <Suspense fallback={<div className="bg-white/95 rounded-2xl p-8 text-center text-gray-400 text-sm">Loading…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
