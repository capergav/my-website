'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createSupabaseClient } from '@/app/lib/supabase';

export default function PricingPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  const handleGetStarted = async () => {
    if (!user) { window.location.href = '/signup?redirect=/pricing'; return; }
    setLoading(true);
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, userEmail: user.email }),
    });
    const { url } = await res.json();
    if (url) window.location.href = url;
    else setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="font-serif text-4xl font-semibold text-[#2c2a26]">DineLinks</h1>
          <p className="text-[#6b6560] mt-2">Simple, honest pricing</p>
        </div>
        <div className="rounded-2xl bg-[#8b6914]/10 border border-[#8b6914]/30 px-6 py-3 text-center mb-4">
          <p className="text-sm font-medium text-[#8b6914]">🎉 First 2 months free</p>
        </div>
        <div className="bg-[#2c2a26] rounded-3xl border-2 border-[#8b6914]/50 p-8 text-white">
          <div className="text-center">
            <p className="text-5xl font-serif font-semibold">$25</p>
            <p className="text-sm text-white/60 mt-1">per month, after 2-month free trial</p>
          </div>
          <hr className="my-6 border-white/10"/>
          <ul className="space-y-2.5 text-sm text-white/80">
            {['Unlimited menu items','10 languages','QR code & shareable link','Dietary labels & filters','Custom categories','Real-time updates','Custom colors & fonts','Logo & hero image upload','Priority email support'].map(f => (
              <li key={f} className="flex gap-2"><span className="text-[#c9a030]">✓</span>{f}</li>
            ))}
          </ul>
          <button onClick={handleGetStarted} disabled={loading}
            className="w-full mt-8 bg-[#8b6914] text-white font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-50">
            {loading ? 'Loading...' : 'Start 2 months free'}
          </button>
          <p className="text-xs text-white/40 text-center mt-3">No credit card required · Cancel anytime</p>
        </div>
        <div className="text-center mt-6">
          <Link href="/" className="text-sm text-[#6b6560] hover:text-[#2c2a26]">← Back to home</Link>
        </div>
      </div>
    </main>
  );
}
