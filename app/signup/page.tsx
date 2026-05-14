"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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

function generateSlug(restaurantName: string): string {
  return restaurantName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40)
    + "-" + Math.random().toString(36).slice(2, 6);
}

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

export default function SignupPage() {
  const router = useRouter();
  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createSupabaseClient();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const pwError = validatePassword(password);
    if (pwError) { setError(pwError); return; }
    if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    const slug = generateSlug(restaurantName.trim());
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { restaurant_name: restaurantName.trim(), restaurant_slug: slug } },
    });
    if (error) { setError(error.message); setLoading(false); }
    else { router.push("/admin"); router.refresh(); }
  };

  const passwordError = password ? validatePassword(password) : null;
  const confirmError = confirmPassword && password !== confirmPassword ? "Passwords do not match." : null;

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 relative overflow-hidden">
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

        {/* Trial callout */}
        <div className="w-full bg-[#8b6914] rounded-2xl px-5 py-3 text-center mb-3 shadow-lg">
          <p className="text-white font-semibold text-sm">🎉 First 2 months free — no credit card required</p>
        </div>

        {/* Frosted glass card */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-2xl border border-white/60 shadow-2xl p-8">
          <h1 className="text-2xl font-serif font-semibold text-gray-900 mb-1 text-center">Create your menu</h1>
          <p className="text-sm text-gray-500 mb-6 text-center">Set up your restaurant account</p>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Restaurant name</label>
              <input
                type="text"
                required
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                placeholder="e.g. Joe's Pizza"
                className="w-full px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
              />
            </div>

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
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
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
                  aria-label={showPassword ? "Hide password" : "Show password"}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
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
                  aria-label={showConfirm ? "Hide password" : "Show password"}
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
              {loading ? "Creating account…" : "Create account"}
            </button>
            <p className="text-xs text-center text-gray-400 mt-2">No credit card required · Cancel anytime</p>
          </form>

          <p className="text-sm text-center text-gray-500 mt-6">
            Already have an account?{" "}
            <Link href="/login" className="text-[#8b6914] font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
