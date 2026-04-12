"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/app/lib/supabase";
import Link from "next/link";

const BG_URL = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80";

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
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    if (!/[A-Z]/.test(password)) { setError("Must contain at least one uppercase letter."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) { setError(error.message); setLoading(false); return; }
    await supabase.auth.signOut();
    router.push("/login?reset=success");
  };

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

      {error && (
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
          {[
            { label: "New password", value: password, set: setPassword, show: showPw, toggle: () => setShowPw(s => !s) },
            { label: "Confirm password", value: confirm, set: setConfirm, show: showCf, toggle: () => setShowCf(s => !s) },
          ].map(({ label, value, set, show, toggle }) => (
            <div key={label}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"} required value={value}
                  onChange={(e) => set(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
                />
                <button type="button" onClick={toggle} tabIndex={-1}
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 text-xs">
                  {show ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          ))}
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
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-[#8b6914] flex items-center justify-center shadow-lg mb-3">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <p className="text-white/80 text-xs font-semibold uppercase tracking-[0.2em]">MenuSnap</p>
        </div>
        <Suspense fallback={<div className="bg-white/95 rounded-2xl p-8 text-center text-gray-400 text-sm">Loading…</div>}>
          <ResetForm />
        </Suspense>
      </div>
    </main>
  );
}
