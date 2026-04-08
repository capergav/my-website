"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/app/lib/supabase";
import Link from "next/link";

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  ) : (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  );
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
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);
  const supabase = createSupabaseClient();

  // Supabase sends the token in the URL hash as #access_token=...&type=recovery
  // The Supabase client picks this up automatically on mount via onAuthStateChange
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setSessionReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [supabase]);

  const passwordError = password ? (
    password.length < 8 ? "At least 8 characters" :
    !/[A-Z]/.test(password) ? "At least one uppercase letter" : null
  ) : null;
  const confirmError = confirmPassword && password !== confirmPassword ? "Passwords do not match." : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordError) { setError(passwordError); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.push("/admin"), 2000);
    }
  };

  if (!sessionReady) {
    return (
      <p className="text-sm text-gray-500 text-center mt-4">
        Waiting for your reset link to be verified… If nothing happens, try clicking the link in your email again.
      </p>
    );
  }

  if (done) {
    return (
      <p className="text-sm text-green-700 bg-green-50 rounded-lg px-3 py-3 text-center mt-4">
        Password updated! Redirecting you to the admin…
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`w-full px-3 py-2 pr-10 rounded-lg border bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8b6914] ${
              passwordError ? "border-red-300" : "border-gray-200"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
        <div className="mt-1.5 space-y-1">
          <Rule met={password.length >= 8} text="At least 8 characters" />
          <Rule met={/[A-Z]/.test(password)} text="At least one uppercase letter" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm new password</label>
        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className={`w-full px-3 py-2 pr-10 rounded-lg border bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8b6914] ${
              confirmError ? "border-red-300" : "border-gray-200"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowConfirm((s) => !s)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
            tabIndex={-1}
          >
            <EyeIcon open={showConfirm} />
          </button>
        </div>
        {confirmError && <p className="text-xs text-red-600 mt-1">{confirmError}</p>}
      </div>

      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-[#8b6914] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
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
          Set new password
        </h1>
        <p className="text-sm text-gray-500 text-center">
          Choose a strong password for your account.
        </p>

        <Suspense fallback={<p className="text-sm text-gray-400 text-center mt-4">Loading…</p>}>
          <ResetForm />
        </Suspense>

        <p className="text-sm text-center text-gray-500 mt-6">
          <Link href="/login" className="text-[#8b6914] font-medium hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
