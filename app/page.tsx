"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CT_HERO_URL    = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80";
const CT_STEAK_URL   = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80";
const CT_SALMON_URL  = "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80";
const CT_DESSERT_URL = "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80";
const EXAMPLE_MENU_URL = "/menu/gavinrgallant-1";

function useScrollAnimation() {
  useEffect(() => {
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add("is-visible"); });
    }, { threshold: 0.12 });
    document.querySelectorAll("[data-animate]").forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

function DLLogoLight({ width = 44, height = 40 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 44 40" fill="none">
      <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="#8b6914" strokeWidth="2.6" strokeLinejoin="round" />
      <line x1="26" y1="3" x2="26" y2="37" stroke="#2c2a26" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="26" y1="37" x2="42" y2="37" stroke="#2c2a26" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function DLLogoDark({ width = 44, height = 40 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 44 40" fill="none">
      <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="#c9a030" strokeWidth="2.6" strokeLinejoin="round" />
      <line x1="26" y1="3" x2="26" y2="37" stroke="#faf8f5" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="26" y1="37" x2="42" y2="37" stroke="#faf8f5" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function DLLogoNav({ scrolled, width = 32, height = 29 }: { scrolled: boolean; width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 44 40" fill="none">
      <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke={scrolled ? "#8b6914" : "#c9a030"} strokeWidth="2.6" strokeLinejoin="round" />
      <line x1="26" y1="3" x2="26" y2="37" stroke={scrolled ? "#2c2a26" : "#ffffff"} strokeWidth="2.6" strokeLinecap="round" />
      <line x1="26" y1="37" x2="42" y2="37" stroke={scrolled ? "#2c2a26" : "#ffffff"} strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

const FEATURES = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: "Instant updates",
    desc: "Change prices, add items, or mark things 86'd. Your live menu updates the moment you save.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
    ),
    title: "Your brand, your style",
    desc: "Set your colors, font, hero photo, and logo. Every menu is completely unique to your restaurant.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8C8 10 5.9 16.17 3.82 22M2 6c8-4 16-2 18 6-2 4-6 6-12 6" />
      </svg>
    ),
    title: "Dietary labels",
    desc: "Mark dishes as vegan, gluten-free, spicy, nut-free, and more. Guests filter in one tap.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    title: "Beautiful photos",
    desc: "Upload dish photos that display in elegant horizontal cards. Make guests hungry before they arrive.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    title: "Custom categories",
    desc: "Starters, mains, desserts — or anything you want. Full control over your menu structure and order.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: "QR code ready",
    desc: "Every menu gets a shareable link and QR code the moment you sign up. Print, post, share.",
  },
];

const STEPS = [
  {
    num: "1",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
      </svg>
    ),
    title: "Create your account",
    desc: "Sign up free in 30 seconds. DineLinks automatically creates your restaurant profile — no setup wizard, no onboarding call.",
  },
  {
    num: "2",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
    title: "Build your menu",
    desc: "Add dishes, upload photos, set prices, create categories. Most restaurants finish in under 10 minutes.",
  },
  {
    num: "3",
    icon: (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </svg>
    ),
    title: "Share with guests",
    desc: "Copy your link, download your QR code, add it to Instagram or your website. You're live immediately.",
  },
];

const LANGUAGES = [
  { flag: "🇨🇦", name: "English" },
  { flag: "🇫🇷", name: "Français" },
  { flag: "🇪🇸", name: "Español" },
  { flag: "🇸🇦", name: "العربية", rtl: true },
  { flag: "🇨🇳", name: "中文" },
  { flag: "🇯🇵", name: "日本語" },
  { flag: "🇰🇷", name: "한국어" },
];

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false);

  useScrollAnimation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <>
      <style>{`
        [data-animate]{opacity:0;transform:translateY(28px);transition:opacity 0.65s ease-out,transform 0.65s ease-out}
        [data-animate="fade-left"]{transform:translateX(-28px)}
        [data-animate="fade-right"]{transform:translateX(28px)}
        [data-animate].is-visible{opacity:1;transform:none}
        @media(prefers-reduced-motion:reduce){[data-animate]{opacity:1;transform:none;transition:none}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes wave{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-6px) rotate(1deg)}}
        .anim-float{animation:float 3.8s ease-in-out infinite}
      `}</style>

      {/* ── SECTION 1 — NAVBAR ──────────────────────────────────────────────── */}
      <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-[#faf8f5]/92 backdrop-blur-md border-b border-[#2c2a26]/10"
          : "bg-transparent"
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <DLLogoNav scrolled={scrolled} width={32} height={29} />
            <span className="text-xl select-none">
              <span style={{ fontFamily: "Georgia, serif", color: scrolled ? "#2c2a26" : "#ffffff", fontWeight: 400 }}>Dine</span>
              <span style={{ fontFamily: "Georgia, serif", color: scrolled ? "#8b6914" : "#c9a030", fontWeight: 700 }}>Links</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", id: "features" },
              { label: "How it works", id: "how-it-works" },
              { label: "Languages", id: "languages" },
              { label: "Pricing", id: "pricing" },
            ].map(({ label, id }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={`text-sm transition-colors ${scrolled ? "text-[#2c2a26]/70 hover:text-[#2c2a26]" : "text-white/90 hover:text-white"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className={`text-sm transition-colors ${scrolled ? "text-[#2c2a26] hover:text-[#8b6914]" : "text-white/80 hover:text-white"}`}
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className={`rounded-xl px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity ${scrolled ? "bg-[#8b6914] text-white" : "bg-white text-[#8b6914]"}`}
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── SECTION 2 — HERO ────────────────────────────────────────────────── */}
      <section className="min-h-screen bg-[#faf8f5] flex items-center py-16">
        <div className="max-w-6xl mx-auto px-6 w-full flex flex-col lg:flex-row items-center gap-16">

          {/* Left column */}
          <div className="flex-1" data-animate="fade-right">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8b6914]/40 bg-[#8b6914]/8 px-4 py-1.5 text-sm text-[#8b6914] font-medium">
              ✦ Free to start — no credit card needed
            </span>
            <h1 style={{ fontFamily: "Georgia, serif" }} className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-[#2c2a26] leading-tight mt-6">
              Your restaurant menu, beautifully digital.
            </h1>
            <p className="text-lg sm:text-xl text-[#6b6560] max-w-xl mt-5 leading-relaxed">
              Create a stunning digital menu in minutes. Share it with a link or QR code. Update items and prices instantly — no reprints, no delays, no app needed.
            </p>
            <div className="flex gap-4 mt-8 flex-wrap">
              <Link
                href="/signup"
                className="bg-[#8b6914] text-white rounded-xl px-7 py-3.5 text-base font-semibold hover:opacity-90 transition-opacity"
              >
                Create your free menu →
              </Link>
              <Link
                href={EXAMPLE_MENU_URL}
                className="rounded-xl px-7 py-3.5 text-base font-medium border-2 border-[#2c2a26]/20 text-[#2c2a26] hover:bg-[#2c2a26]/5 transition-colors"
              >
                See example menu
              </Link>
            </div>
            <div className="mt-5 flex gap-5 flex-wrap text-sm text-[#6b6560]">
              <span>✓ Free forever</span>
              <span>✓ Live in 2 minutes</span>
              <span>✓ 7 languages</span>
            </div>
          </div>

          {/* Right column — phone mockup */}
          <div className="flex-1 flex flex-col items-center" data-animate="fade-left">
            <div className="anim-float rounded-3xl overflow-hidden shadow-2xl border-4 border-[#2c2a26]/10 max-w-sm w-full mx-auto bg-white">
              {/* Hero bar */}
              <div className="relative h-48 overflow-hidden">
                <img src={CT_HERO_URL} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <p className="absolute bottom-3 w-full text-center text-white font-serif text-xl font-semibold drop-shadow">
                  The Copper Table
                </p>
                <div className="absolute top-3 right-3 bg-[#2c2a26]/80 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                  EN ▾
                </div>
              </div>

              {/* Category tabs */}
              <div className="bg-white border-b border-gray-100 px-3 py-2 flex gap-2">
                <span className="text-gray-400 text-xs px-3 py-1">Starters</span>
                <span className="bg-[#b45309]/10 text-[#b45309] border border-[#b45309]/30 rounded-xl px-3 py-1 text-xs font-semibold">Mains</span>
                <span className="text-gray-400 text-xs px-3 py-1">Desserts</span>
              </div>

              {/* Dietary legend */}
              <div className="mx-3 mt-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 flex gap-3 text-xs text-gray-400">
                <span>★ Chef&apos;s pick</span>
                <span>🌾 GF</span>
                <span>🌿 Veg</span>
              </div>

              {/* Item cards */}
              <div className="space-y-2 mx-3 mt-2 mb-3">
                <div className="flex bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <img src={CT_STEAK_URL} alt="Seared Duck Confit" className="w-20 h-20 object-cover flex-shrink-0" />
                  <div className="p-2.5">
                    <p className="text-sm font-serif font-semibold text-[#2c2a26]">Seared Duck Confit</p>
                    <p className="text-[#b45309] text-sm font-bold">$24.00</p>
                    <span className="text-[10px] text-gray-400">★ Chef&apos;s pick</span>
                  </div>
                </div>
                <div className="flex bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <img src={CT_SALMON_URL} alt="Atlantic Salmon" className="w-20 h-20 object-cover flex-shrink-0" />
                  <div className="p-2.5">
                    <p className="text-sm font-serif font-semibold text-[#2c2a26]">Atlantic Salmon</p>
                    <p className="text-[#b45309] text-sm font-bold">$22.00</p>
                    <span className="text-[10px] text-gray-400">🌾 GF</span>
                  </div>
                </div>
              </div>

              <p className="px-3 pb-3 text-center text-[10px] text-gray-300">Tap any item to see details</p>
            </div>

            <p className="hidden lg:block mt-4 text-center text-xs text-[#8b6914]/70">
              ↑ Example menu built with DineLinks
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 3 — STATS BAR ───────────────────────────────────────────── */}
      <section className="bg-[#2c2a26] py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8" data-animate>
            {[
              { num: "2 min", label: "Average setup time" },
              { num: "0", label: "Reprints after going digital" },
              { num: "7", label: "Languages supported" },
              { num: "∞", label: "Menu updates per month" },
            ].map(({ num, label }) => (
              <div key={label} className="text-center">
                <p style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#c9a030]">{num}</p>
                <p className="text-sm text-[#faf8f5]/60 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 4 — FEATURES ────────────────────────────────────────────── */}
      <section id="features" className="bg-[#faf8f5] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div data-animate>
            <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">FEATURES</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl sm:text-5xl font-semibold text-[#2c2a26] max-w-2xl">
              Everything your restaurant needs
            </h2>
            <p className="text-lg text-[#6b6560] max-w-xl mt-4">
              No technical skills required. Set up in minutes, update in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                data-animate="fade-up"
                style={{ transitionDelay: `${i * 0.1}s` }}
                className="bg-white rounded-2xl border border-[#2c2a26]/8 p-6 hover:-translate-y-1 hover:border-[#8b6914]/40 hover:shadow-lg transition-all duration-300"
              >
                <div className="w-10 h-10 rounded-xl bg-[#8b6914]/10 flex items-center justify-center mb-4 text-[#8b6914]">
                  {f.icon}
                </div>
                <h3 className="text-base font-semibold text-[#2c2a26] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6b6560] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 5 — LIVE DEMO ───────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div data-animate="fade-up">
            <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">SEE IT IN ACTION</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#2c2a26]">
              This is what your customers see
            </h2>
            <p className="text-lg text-[#6b6560] max-w-xl mx-auto mt-4">
              A real menu built with DineLinks. Browse items, see dietary info, change the language.
            </p>
          </div>

          {/* Browser mockup */}
          <div className="max-w-2xl mx-auto mt-12 rounded-2xl overflow-hidden shadow-xl border border-[#2c2a26]/10" data-animate="fade-up">
            {/* Browser chrome */}
            <div className="bg-[#f5f5f5] border-b border-gray-200 px-4 py-3 flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                <div className="w-3 h-3 rounded-full bg-[#28c840]" />
              </div>
              <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-gray-500 border border-gray-200 text-left">
                dinelinks.com/menu/the-copper-table
              </div>
            </div>

            {/* Menu content */}
            <div className="bg-[#fdf8f3]">
              <div className="relative h-36 overflow-hidden">
                <img src={CT_HERO_URL} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <p className="absolute bottom-3 w-full text-center text-white font-serif text-lg font-semibold drop-shadow">
                  The Copper Table
                </p>
                <div className="absolute top-3 right-3 bg-[#2c2a26]/80 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                  EN ▾
                </div>
              </div>

              {/* Tab strip */}
              <div className="bg-[#fdf8f3]/95 backdrop-blur-sm border-b border-[#b45309]/10 px-4 py-3 flex gap-2">
                <span className="text-gray-400 text-xs px-3 py-1 rounded-xl">Starters</span>
                <span className="bg-[#b45309]/10 text-[#b45309] border border-[#b45309]/30 rounded-xl px-3 py-1 text-xs font-semibold">Mains</span>
                <span className="text-gray-400 text-xs px-3 py-1 rounded-xl">Desserts</span>
              </div>

              {/* Dietary legend */}
              <div className="mx-3 mt-2 rounded-xl border border-gray-100 bg-white px-3 py-2 flex gap-3 text-xs text-gray-400">
                <span>★ Chef&apos;s pick</span>
                <span>🌾 GF</span>
                <span>🌿 Veg</span>
                <span>🌱 Vegan</span>
              </div>

              {/* Filter row */}
              <div className="mx-3 mt-1.5 flex gap-2 text-xs">
                <span className="bg-[#b45309]/8 text-[#b45309] rounded-lg px-2.5 py-1 font-medium border border-[#b45309]/20">All</span>
                <span className="text-gray-400 rounded-lg px-2.5 py-1 border border-gray-100">🌾 GF only</span>
                <span className="text-gray-400 rounded-lg px-2.5 py-1 border border-gray-100">🌿 Veg</span>
              </div>

              {/* Item cards */}
              <div className="space-y-2 mx-3 mt-2 mb-3">
                <div className="flex bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <img src={CT_STEAK_URL} alt="Seared Duck Confit" className="w-20 h-20 object-cover flex-shrink-0" />
                  <div className="p-2.5">
                    <p className="text-sm font-serif font-semibold text-[#2c2a26]">Seared Duck Confit</p>
                    <p className="text-[#b45309] text-sm font-bold">$24.00</p>
                    <span className="text-[10px] text-gray-400">★ Chef&apos;s pick</span>
                  </div>
                </div>
                <div className="flex bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <img src={CT_SALMON_URL} alt="Atlantic Salmon" className="w-20 h-20 object-cover flex-shrink-0" />
                  <div className="p-2.5">
                    <p className="text-sm font-serif font-semibold text-[#2c2a26]">Atlantic Salmon</p>
                    <p className="text-[#b45309] text-sm font-bold">$22.00</p>
                    <span className="text-[10px] text-gray-400">🌾 GF</span>
                  </div>
                </div>
                <div className="flex bg-white rounded-xl border border-gray-100 overflow-hidden">
                  <img src={CT_DESSERT_URL} alt="Warm Chocolate Fondant" className="w-20 h-20 object-cover flex-shrink-0" />
                  <div className="p-2.5">
                    <p className="text-sm font-serif font-semibold text-[#2c2a26]">Warm Chocolate Fondant</p>
                    <p className="text-[#b45309] text-sm font-bold">$12.00</p>
                    <span className="text-[10px] text-gray-400">🌿 Vegetarian</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <Link href={EXAMPLE_MENU_URL} className="text-[#8b6914] font-medium text-sm hover:underline">
              View example menu →
            </Link>
          </div>
        </div>
      </section>

      {/* ── SECTION 6 — LANGUAGES ───────────────────────────────────────────── */}
      <section id="languages" className="bg-[#faf8f5] py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div data-animate="fade-up">
            <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">MULTILINGUAL</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#2c2a26]">
              Speak every customer&apos;s language
            </h2>
            <p className="text-lg text-[#6b6560] max-w-xl mx-auto mt-4">
              Guests tap one button and your entire menu translates instantly. Item names, descriptions, categories — everything. Powered by real machine translation.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-12 max-w-2xl mx-auto">
            {LANGUAGES.map((lang, i) => (
              <div key={lang.name} className="flex flex-col items-center gap-1">
                <button
                  type="button"
                  data-animate="fade-up"
                  style={{ transitionDelay: `${i * 0.08}s` }}
                  className="rounded-full border border-[#8b6914]/25 bg-white px-5 py-2.5 flex items-center gap-2.5 text-sm font-medium text-[#2c2a26] shadow-sm hover:border-[#8b6914]/60 hover:shadow-md transition-all"
                >
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
                {lang.rtl && (
                  <span className="text-[10px] text-[#8b6914]/60">RTL fully supported</span>
                )}
              </div>
            ))}
          </div>

          <div className="max-w-xl mx-auto mt-10 rounded-2xl border border-[#8b6914]/30 bg-[#8b6914]/5 p-6 text-center" data-animate="fade-up">
            <p className="text-[#2c2a26] text-sm leading-relaxed">
              Perfect for restaurants in tourist areas, diverse neighborhoods, and cities with international visitors. One menu, seven languages, zero extra work.
            </p>
          </div>
        </div>
      </section>

      {/* ── SECTION 7 — HOW IT WORKS ────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div data-animate="fade-up">
            <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">HOW IT WORKS</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#2c2a26]">
              Up and running in 3 steps
            </h2>
          </div>

          <div className="relative flex flex-col sm:flex-row gap-8 mt-14 max-w-4xl mx-auto">
            {/* Connecting line on desktop */}
            <div className="hidden sm:block absolute top-7 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-0.5 bg-[#8b6914]/20 z-0" />

            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="flex-1 text-center relative z-10"
                data-animate="fade-up"
                style={{ transitionDelay: `${i * 0.15}s` }}
              >
                <div className="w-14 h-14 rounded-full border-2 border-[#8b6914] bg-[#8b6914]/8 flex items-center justify-center mx-auto text-[#8b6914] font-serif text-2xl font-semibold">
                  {step.num}
                </div>
                <div className="text-[#8b6914] mx-auto mt-3 flex justify-center">{step.icon}</div>
                <h3 className="font-semibold text-[#2c2a26] mt-3">{step.title}</h3>
                <p className="text-sm text-[#6b6560] leading-relaxed mt-2">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 8 — THEMES ──────────────────────────────────────────────── */}
      <section className="bg-[#2c2a26] py-24">
        <div className="max-w-6xl mx-auto px-6 text-center" data-animate="fade-up">
          <p className="text-xs font-semibold tracking-widest text-[#c9a030] uppercase mb-3">FULLY CUSTOMIZABLE</p>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#faf8f5]">
            Make it yours
          </h2>
          <p className="text-[#faf8f5]/70 max-w-lg mx-auto mt-4">
            Your menu should look like your restaurant, not a template. Choose any colors, fonts, and upload your own photos.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-6 mt-14 items-start">

            {/* Card 1 — Villa Romana (Italian fine dining, dark wine) */}
            <div
              className="anim-float rounded-2xl overflow-hidden shadow-lg border border-[#c9963a]/20 flex-shrink-0 w-full sm:w-48"
              style={{ background: "#1a0a0a", animationDelay: "0s" }}
            >
              <div className="h-20 relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&q=75" alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute top-2 left-2 bg-black/40 rounded-lg p-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="11" stroke="#c9963a" strokeWidth="1.2"/>
                    <text x="12" y="17" textAnchor="middle" fill="#c9963a" fontFamily="Georgia,serif" fontSize="13">V</text>
                  </svg>
                </div>
                <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-semibold drop-shadow">Villa Romana</p>
              </div>
              <div className="px-3 py-2 space-y-1.5">
                <div className="flex gap-1">
                  <span className="text-[10px] font-semibold rounded-lg px-2 py-0.5" style={{ background: "#c9963a22", color: "#c9963a" }}>Antipasti</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg p-2 border border-[#c9963a]/15" style={{ background: "#2a1a0a" }}>
                  <div className="w-9 h-9 rounded bg-[#c9963a]/20 flex-shrink-0 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=100&q=60" alt="" className="w-full h-full object-cover opacity-60" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-[#faf8f5]">Burrata &amp; Prosciutto</p>
                    <p className="text-[10px] font-bold" style={{ color: "#c9963a" }}>$18</p>
                  </div>
                </div>
                <p className="text-[9px] text-center opacity-40 italic text-[#faf8f5]">Playfair Display</p>
              </div>
            </div>

            {/* Card 2 — Takumi (modern Japanese, dark + teal) */}
            <div
              className="anim-float rounded-2xl overflow-hidden shadow-lg border border-[#00d4aa]/20 flex-shrink-0 w-full sm:w-48"
              style={{ background: "#0d0d0d", animationDelay: "0.7s" }}
            >
              <div className="h-20 relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&q=75" alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute top-2 left-2 bg-black/40 rounded-lg p-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <rect x="1" y="1" width="22" height="22" rx="3" stroke="#00d4aa" strokeWidth="1.2"/>
                    <text x="12" y="17" textAnchor="middle" fill="#00d4aa" fontFamily="system-ui" fontSize="13">匠</text>
                  </svg>
                </div>
                <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-semibold drop-shadow">Takumi</p>
              </div>
              <div className="px-3 py-2 space-y-1.5">
                <div className="flex gap-1">
                  <span className="text-[10px] font-semibold rounded-lg px-2 py-0.5" style={{ background: "#00d4aa22", color: "#00d4aa" }}>Nigiri</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg p-2 border border-[#00d4aa]/15" style={{ background: "#1a1a1a" }}>
                  <div className="w-9 h-9 rounded bg-[#00d4aa]/15 flex-shrink-0 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=100&q=60" alt="" className="w-full h-full object-cover opacity-60" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-white">Salmon Nigiri ×3</p>
                    <p className="text-[10px] font-bold" style={{ color: "#00d4aa" }}>$16</p>
                  </div>
                </div>
                <p className="text-[9px] text-center opacity-40 italic text-white">Geist Sans</p>
              </div>
            </div>

            {/* Card 3 — Sol Café (beachside, bright orange) */}
            <div
              className="anim-float rounded-2xl overflow-hidden shadow-lg border border-[#f97316]/20 flex-shrink-0 w-full sm:w-48"
              style={{ background: "#fff8ed", animationDelay: "1.4s" }}
            >
              <div className="h-20 relative overflow-hidden">
                <img src="https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=300&q=75" alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/20" />
                <div className="absolute top-2 left-2 bg-white/30 backdrop-blur-sm rounded-lg p-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="5" fill="#f97316"/>
                    <line x1="12" y1="2" x2="12" y2="5" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="12" y1="19" x2="12" y2="22" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="2" y1="12" x2="5" y2="12" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
                    <line x1="19" y1="12" x2="22" y2="12" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/>
                  </svg>
                </div>
                <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-semibold drop-shadow">Sol Café</p>
              </div>
              <div className="px-3 py-2 space-y-1.5">
                <div className="flex gap-1">
                  <span className="text-[10px] font-semibold rounded-lg px-2 py-0.5" style={{ background: "#f9731622", color: "#f97316" }}>Smoothies</span>
                </div>
                <div className="flex items-center gap-2 rounded-2xl p-2 bg-white border border-[#f97316]/15">
                  <div className="w-9 h-9 rounded bg-orange-100 flex-shrink-0 overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=100&q=60" alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium text-[#2c2a26]">Mango Sunrise Bowl</p>
                    <p className="text-[10px] font-bold" style={{ color: "#f97316" }}>$13</p>
                  </div>
                </div>
                <p className="text-[9px] text-center opacity-40 italic text-[#2c2a26]">Pacifico</p>
              </div>
            </div>
          </div>

          <p className="text-[#faf8f5]/60 text-sm text-center mt-8">
            Dark &amp; elegant · Minimalist &amp; modern · Bright &amp; playful — your menu, your personality
          </p>
        </div>
      </section>

      {/* ── SECTION 9 — PRICING ─────────────────────────────────────────────── */}
      <section id="pricing" className="bg-[#faf8f5] py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">PRICING</p>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#2c2a26]">
            Simple, honest pricing
          </h2>
          <p className="text-lg text-[#6b6560] max-w-md mx-auto mt-4">
            Start free. No hidden fees, no commissions on orders, no credit card required.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mt-14">
            {/* FREE */}
            <div className="bg-white rounded-3xl border-2 border-[#2c2a26]/10 p-8 text-left" data-animate="fade-right">
              <span className="inline-flex rounded-full bg-green-100 text-green-700 text-xs font-semibold px-3 py-1">
                Free forever
              </span>
              <p style={{ fontFamily: "Georgia, serif" }} className="text-5xl font-semibold text-[#2c2a26] mt-4">$0</p>
              <p className="text-sm text-[#6b6560]">/ month, forever</p>
              <p className="text-sm text-[#6b6560] mt-2">Perfect for getting started</p>
              <hr className="my-6 border-[#2c2a26]/10" />
              <ul className="space-y-3 text-sm text-[#2c2a26]">
                {[
                  "1 digital menu",
                  "Unlimited menu items",
                  "7 languages supported",
                  "QR code & shareable link",
                  "Dietary labels & filters",
                  "Custom categories",
                  "Real-time updates",
                  "Custom colors & fonts",
                  "Upload logo & photos",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-[#8b6914]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full py-3 rounded-xl border-2 border-[#8b6914] text-[#8b6914] font-semibold text-center hover:bg-[#8b6914] hover:text-white transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* PRO */}
            <div className="bg-[#2c2a26] rounded-3xl border-2 border-[#8b6914]/50 p-8 text-left" data-animate="fade-left">
              <span className="inline-flex rounded-full bg-[#8b6914]/20 text-[#c9a030] text-xs font-semibold px-3 py-1">
                Coming soon
              </span>
              <p style={{ fontFamily: "Georgia, serif" }} className="text-5xl font-semibold text-[#faf8f5] mt-4">$12</p>
              <p className="text-sm text-[#faf8f5]/60">/ month</p>
              <p className="text-sm text-[#faf8f5]/60 mt-2">For growing restaurants</p>
              <hr className="my-6 border-[#faf8f5]/10" />
              <ul className="space-y-3 text-sm text-[#faf8f5]/80">
                {[
                  "Everything in Free",
                  "Custom domain name",
                  "Advanced analytics",
                  "Multiple menus",
                  "Remove DineLinks branding",
                  "Priority email support",
                  "Early access to new features",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-[#c9a030]">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="mt-8 block w-full py-3 rounded-xl bg-[#8b6914] text-white font-semibold text-center hover:opacity-90 transition-opacity"
              >
                Join the waitlist
              </Link>
              <p className="mt-3 text-[#faf8f5]/40 text-xs text-center">Be first to know when Pro launches</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 10 — FINAL CTA ──────────────────────────────────────────── */}
      <section className="bg-[#8b6914] py-28 text-center">
        <div className="max-w-2xl mx-auto px-6" data-animate="fade-up">
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl sm:text-5xl font-semibold text-white">
            Ready to go digital?
          </h2>
          <p className="text-xl text-white/80 max-w-md mx-auto mt-5">
            Join restaurants already using DineLinks. Takes 2 minutes. Free forever.
          </p>
          <Link
            href="/signup"
            className="mt-10 inline-block bg-white text-[#8b6914] font-semibold text-lg px-10 py-4 rounded-xl hover:bg-[#faf8f5] transition-colors shadow-lg"
          >
            Create your free menu →
          </Link>
          <p className="mt-6 text-white/50 text-sm">Free forever · No credit card · Live in 2 minutes</p>
        </div>
      </section>

      {/* ── SECTION 11 — FOOTER ─────────────────────────────────────────────── */}
      <footer className="bg-[#2c2a26] py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <DLLogoDark width={32} height={29} />
            <span className="text-lg select-none">
              <span style={{ fontFamily: "Georgia, serif", color: "#faf8f5", fontWeight: 400 }}>Dine</span>
              <span style={{ fontFamily: "Georgia, serif", color: "#c9a030", fontWeight: 700 }}>Links</span>
            </span>
          </div>

          <div className="flex gap-6 text-sm text-[#faf8f5]/50 flex-wrap justify-center">
            <button type="button" onClick={() => scrollTo("features")} className="hover:text-[#faf8f5]/80 transition-colors">
              Features
            </button>
            <button type="button" onClick={() => scrollTo("how-it-works")} className="hover:text-[#faf8f5]/80 transition-colors">
              How it works
            </button>
            <button type="button" onClick={() => scrollTo("pricing")} className="hover:text-[#faf8f5]/80 transition-colors">
              Pricing
            </button>
            <Link href="/login" className="hover:text-[#faf8f5]/80 transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-[#faf8f5]/80 transition-colors">Sign up</Link>
          </div>

          <p className="text-sm text-[#faf8f5]/30">© 2025 DineLinks</p>
        </div>
      </footer>
    </>
  );
}
