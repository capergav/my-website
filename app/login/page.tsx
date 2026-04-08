"use client";

import { useState, Suspense } from "react";
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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/admin";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseClient();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push(next); router.refresh(); }
  };

  return (
    <form onSubmit={handleLogin} className="space-y-4">
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
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <Link href="/forgot-password" className="text-xs text-[#8b6914] hover:underline">
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 pr-10 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>
      </div>
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 rounded-lg bg-[#8b6914] text-white font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      {/* Blurred background image */}
      <div
        className="absolute inset-0 bg-cover bg-center scale-105"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1920&q=80)",
          filter: "blur(8px)",
        }}
      />
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Logo mark + card wrapper */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        {/* Gold rounded icon above card */}
        <div className="w-14 h-14 rounded-2xl bg-[#8b6914] flex items-center justify-center shadow-lg mb-3">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        {/* MenuSnap label */}
        <p className="text-white text-xs font-semibold uppercase tracking-widest mb-5">MenuSnap</p>

        {/* Frosted glass card */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl p-8">
          <h1 className="text-2xl font-serif font-semibold text-gray-900 mb-1 text-center">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-6 text-center">Sign in to manage your menu</p>
          <Suspense fallback={<div className="text-sm text-gray-400">Loading…</div>}>
            <LoginForm />
          </Suspense>
          <p className="text-sm text-center text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#8b6914] font-medium hover:underline">Sign up</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
