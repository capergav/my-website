"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { WheatOff, Flame, Leaf } from "lucide-react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from 'motion/react';

const CT_HERO_URL    = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80";
const CT_STEAK_URL   = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80";
const CT_SALMON_URL  = "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80";
const CT_DESSERT_URL = "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80";
const EXAMPLE_MENU_URL = "/menu/gavinrgallant-1";

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

function DLLogoNav({ scrolled: _scrolled, width = 32, height = 29 }: { scrolled: boolean; width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 44 40" fill="none">
      <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinejoin="round" />
      <line x1="26" y1="3" x2="26" y2="37" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="26" y1="37" x2="42" y2="37" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

function CountUp({ to, duration = 1.5 }: { to: number | string; duration?: number }) {
  const [val, setVal] = useState<number | string>(typeof to === 'number' ? 0 : to);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (typeof to !== 'number') { setVal(to); return; }
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        const start = performance.now();
        const tick = (now: number) => {
          const t = Math.min(1, (now - start) / (duration * 1000));
          const eased = 1 - Math.pow(1 - t, 3);
          setVal(Math.round(to * eased));
          if (t < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{val}</span>;
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
  { flag: "🇰🇷", name: "한국어" },
];

export default function HomePage() {
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rm = prefersReducedMotion;

  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    import("@/app/lib/supabase").then(({ createSupabaseClient }) => {
      createSupabaseClient().auth.getUser().then(({ data }) => {
        setIsLoggedIn(!!data.user);
      });
    });
  }, []);

  // 3D tilt for hero phone mockup
  const heroRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [3, -3]), { stiffness: 100, damping: 20 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-6, 6]), { stiffness: 100, damping: 20 });

  // Scroll parallax
  const { scrollY } = useScroll();
  const phoneY = useTransform(scrollY, [0, 600], [0, rm ? 0 : -60]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (rm || !heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5);
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5);
  };

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  // Shared whileInView enter animation
  const enter = (delay = 0) => rm ? {} : {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-100px' } as const,
    transition: { duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] as const },
  };

  const underline = (delay = 0.2) => rm ? {} : {
    initial: { scaleX: 0 },
    whileInView: { scaleX: 1 },
    viewport: { once: true } as const,
    transition: { duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] as const },
  };

  return (
    <>
      <style>{`
        @keyframes shine{0%{transform:translateX(-100%)}100%{transform:translateX(200%)}}
        .cta-shine{position:relative;overflow:hidden}
        .cta-shine::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 40%,rgba(255,255,255,0.2) 50%,transparent 60%);transform:translateX(-100%);pointer-events:none}
        .cta-shine:hover::after{animation:shine 700ms ease-out}
        @media(prefers-reduced-motion:reduce){.cta-shine::after{display:none}}
      `}</style>

      {/* ── NAVBAR ──────────────────────────────────────────────────────────── */}
      <nav className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-background/92 backdrop-blur-md border-b border-foreground/10"
          : "bg-background/80 backdrop-blur-sm"
      }`}>
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5">
            <DLLogoNav scrolled={scrolled} width={32} height={29} />
            <span className="text-xl select-none">
              <span style={{ fontFamily: "Georgia, serif", color: "var(--foreground)", fontWeight: 400 }}>Dine</span>
              <span style={{ fontFamily: "Georgia, serif", color: "var(--accent)", fontWeight: 700 }}>Links</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", id: "features" },
              { label: "How it works", id: "how-it-works" },
              { label: "Languages", id: "languages" },
              { label: "Pricing", id: "pricing" },
            ].map(({ label, id }) => (
              <button key={id} type="button" onClick={() => scrollTo(id)}
                className="text-sm transition-colors text-foreground/70 hover:text-foreground">
                {label}
              </button>
            ))}
            <Link href="/contact" className="text-sm transition-colors text-foreground/70 hover:text-foreground">Contact</Link>
          </div>

          <div className="flex items-center gap-3">
            {!isLoggedIn && <Link href="/login" className="text-sm transition-colors text-foreground/70 hover:text-foreground">Sign in</Link>}
            <Link href={isLoggedIn ? '/admin' : '/signup'} className="rounded-xl px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity bg-[#8b6914] text-white">
              {isLoggedIn ? 'Go to my menu' : 'Get started free'}
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <section
        ref={heroRef}
        className="relative min-h-screen bg-[#faf8f5] flex items-center py-16 overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      >
        {/* Floating blobs */}
        {!rm && (
          <>
            <motion.div
              className="absolute top-20 right-10 w-96 h-96 rounded-full bg-[#8b6914]/5 blur-3xl pointer-events-none"
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-20 left-10 w-[500px] h-[500px] rounded-full bg-[#c9a030]/5 blur-3xl pointer-events-none"
              animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
          </>
        )}

        <div className="max-w-6xl mx-auto px-6 w-full flex flex-col lg:flex-row items-center gap-16 relative z-10">

          {/* Left column */}
          <motion.div
            className="flex-1"
            initial={rm ? {} : { opacity: 0, x: -28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: rm ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-[#8b6914]/40 bg-[#8b6914]/8 px-4 py-1.5 text-sm text-[#8b6914] font-medium">
              ✦ No setup fee — live in 30 minutes
            </span>
            <motion.h1
              style={{ fontFamily: "Georgia, serif" }}
              className="text-5xl sm:text-6xl lg:text-7xl font-semibold text-[#2c2a26] leading-tight mt-6"
              initial={rm ? {} : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: rm ? 0 : 0.7, ease: [0.22, 1, 0.36, 1], delay: rm ? 0 : 0.1 }}
            >
              Your restaurant menu, beautifully digital.
            </motion.h1>
            <p className="text-lg sm:text-xl text-[#6b6560] max-w-xl mt-5 leading-relaxed">
              Create a stunning digital menu in minutes. Share it with a link or QR code. Update items and prices instantly — no reprints, no delays, no app needed.
            </p>
            <div className="flex gap-4 mt-8 flex-wrap">
              <motion.div
                whileHover={rm ? {} : { scale: 1.03, y: -2 }}
                whileTap={rm ? {} : { scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link href={isLoggedIn ? '/admin' : '/signup'} className="cta-shine bg-[#8b6914] text-white rounded-xl px-7 py-3.5 text-base font-semibold hover:opacity-90 transition-opacity inline-block">
                  {isLoggedIn ? 'Go to my menu →' : 'Get started →'}
                </Link>
              </motion.div>
              <Link href={EXAMPLE_MENU_URL} className="rounded-xl px-7 py-3.5 text-base font-medium border-2 border-[#2c2a26]/20 text-[#2c2a26] hover:bg-[#2c2a26]/5 transition-colors">
                See a real menu →
              </Link>
            </div>
            <div className="mt-5 flex gap-5 flex-wrap text-sm text-[#6b6560]">
              <span>✓ No setup fee</span>
              <span>✓ Live in 30 minutes</span>
              <span>✓ First 2 months free</span>
            </div>
          </motion.div>

          {/* Right column — phone mockup */}
          <motion.div
            className="flex-1 flex flex-col items-center"
            initial={rm ? {} : { opacity: 0, x: 28 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: rm ? 0 : 0.7, ease: [0.22, 1, 0.36, 1], delay: rm ? 0 : 0.15 }}
          >
            <motion.div style={{ y: phoneY }}>
              <motion.div
                style={{
                  rotateX: rm ? 0 : rotateX,
                  rotateY: rm ? 0 : rotateY,
                  transformPerspective: 1000,
                  transformStyle: 'preserve-3d',
                }}
                animate={rm ? {} : { y: [0, -14, 0] }}
                transition={rm ? {} : { duration: 3.8, repeat: Infinity, ease: 'easeInOut' }}
                className="relative"
              >
                <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-[#2c2a26]/10 max-w-sm w-full mx-auto bg-white">
                  {/* Hero bar */}
                  <div className="relative h-48 overflow-hidden">
                    <img src={CT_HERO_URL} alt="" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                    <p className="absolute bottom-3 w-full text-center text-white font-serif text-xl font-semibold drop-shadow">
                      The Copper Table
                    </p>
                    {/* C logo — Fix 3 */}
                    <div className="absolute top-3 left-3 bg-black/30 backdrop-blur-sm rounded-lg p-1.5">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="11" fill="none" stroke="#c9a030" strokeWidth="1.5"/>
                        <text x="12" y="17" textAnchor="middle" fill="#c9a030" fontFamily="Georgia,serif" fontSize="13" fontWeight="600">C</text>
                      </svg>
                    </div>
                    <div className="absolute top-3 right-3 bg-[#2c2a26]/80 text-white text-xs px-2.5 py-1 rounded-lg flex items-center gap-1">
                      EN ▾
                    </div>
                  </div>

                  {/* Category tabs */}
                  <div className="bg-white border-b border-gray-100 flex gap-3 px-3 py-3 overflow-x-auto">
                    {[
                      { name: "Starters", img: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=150&q=70", active: false },
                      { name: "Mains",    img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=150&q=70", active: true  },
                      { name: "Desserts", img: "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=150&q=70", active: false },
                    ].map(cat => (
                      <button key={cat.name} type="button" className="flex flex-col items-center gap-1 flex-shrink-0">
                        <div className={`w-12 h-12 rounded-xl overflow-hidden ${cat.active ? "ring-2 ring-[#b45309] ring-offset-2" : ""}`}>
                          <img src={cat.img} className="w-full h-full object-cover" alt={cat.name} />
                        </div>
                        <span className={`text-[10px] font-semibold uppercase tracking-wide ${cat.active ? "text-[#b45309]" : "text-gray-400"}`}>{cat.name}</span>
                      </button>
                    ))}
                  </div>

                  {/* Dietary legend */}
                  <div className="mx-3 mt-2 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 flex gap-3 text-xs text-gray-400 items-center">
                    <span className="flex items-center gap-1"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Chef&apos;s pick</span>
                    <span className="flex items-center gap-1"><WheatOff size={12} /> GF</span>
                    <span className="flex items-center gap-1"><Leaf size={12} /> Veg</span>
                  </div>

                  {/* Item cards */}
                  <div className="space-y-2 mx-3 mt-2 mb-3">
                    <div className="flex bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <img src={CT_STEAK_URL} alt="Seared Duck Confit" className="w-20 h-20 object-cover flex-shrink-0" />
                      <div className="p-2.5">
                        <p className="text-sm font-serif font-semibold text-[#2c2a26]">Seared Duck Confit</p>
                        <p className="text-[#b45309] text-sm font-bold">$24.00</p>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg> Chef&apos;s pick</span>
                      </div>
                    </div>
                    <div className="flex bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <img src={CT_SALMON_URL} alt="Atlantic Salmon" className="w-20 h-20 object-cover flex-shrink-0" />
                      <div className="p-2.5">
                        <p className="text-sm font-serif font-semibold text-[#2c2a26]">Atlantic Salmon</p>
                        <p className="text-[#b45309] text-sm font-bold">$22.00</p>
                        <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><WheatOff size={12} /> GF</span>
                      </div>
                    </div>
                  </div>

                  <p className="px-3 pb-3 text-center text-[10px] text-gray-300">Tap any item to see details</p>
                </div>
              </motion.div>
            </motion.div>

            <p className="hidden lg:block mt-4 text-center text-xs text-[#8b6914]/70">
              ↑ Example menu built with DineLinks
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ───────────────────────────────────────────────────────── */}
      <section className="bg-[#2c2a26] py-14">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { target: 30, suffix: " min", label: "Average setup time" },
              { target: 0,  suffix: "",     label: "Reprints after going digital" },
              { target: 6,  suffix: "",     label: "Languages supported" },
              { target: "Always", suffix: "", label: "Up-to-date menu" },
            ].map(({ target, suffix, label }, i) => (
              <motion.div key={label} className="text-center"
                {...(rm ? {} : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.5, delay: i * 0.1 },
                })}
              >
                <p style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#c9a030]">
                  <CountUp to={target} />{suffix}
                </p>
                <p className="text-sm text-[#faf8f5]/60 mt-1">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────────────── */}
      <section id="features" className="bg-[#faf8f5] py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...enter()}>
            <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">FEATURES</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl sm:text-5xl font-semibold text-[#2c2a26] max-w-2xl">
              Everything your restaurant needs
            </h2>
            <p className="text-lg text-[#6b6560] max-w-xl mt-4">No technical skills required. Set up in minutes, update in seconds.</p>
            <motion.div className="h-0.5 bg-[#8b6914] mt-4 origin-left" style={{ width: 80 }} {...underline()} />
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-14">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-white rounded-2xl border border-[#2c2a26]/8 p-6 hover:border-[#8b6914]/40 transition-colors duration-300"
                style={{ transformPerspective: 800, transformStyle: 'preserve-3d' }}
                {...(rm ? {} : {
                  initial: { opacity: 0, y: 30 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.5, delay: i * 0.08 },
                  whileHover: { y: -6, rotateX: 2, rotateY: -2, transition: { duration: 0.3 } },
                })}
              >
                <motion.div
                  className="w-10 h-10 rounded-xl bg-[#8b6914]/10 flex items-center justify-center mb-4 text-[#8b6914]"
                  style={{ transformStyle: 'preserve-3d' }}
                  whileHover={rm ? {} : { z: 20 }}
                >
                  {f.icon}
                </motion.div>
                <h3 className="text-base font-semibold text-[#2c2a26] mb-2">{f.title}</h3>
                <p className="text-sm text-[#6b6560] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ADMIN SHOWCASE ──────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div {...enter()}>
            <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">ADMIN PANEL</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#2c2a26]">
              Manage everything from one place
            </h2>
            <p className="text-lg text-[#6b6560] max-w-xl mt-4">
              Add dishes, drag to reorder, upload photos, toggle availability, set your theme — all without touching a line of code.
            </p>
            <motion.div className="h-0.5 bg-[#8b6914] mt-4 origin-left" style={{ width: 80 }} {...underline()} />
          </motion.div>

          <motion.div className="max-w-4xl mx-auto mt-14 rounded-2xl overflow-hidden shadow-2xl border border-[#2c2a26]/10" {...enter(0.1)}>
            {/* Header bar */}
            <div className="relative h-32 overflow-hidden">
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80" className="w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1816] via-[#1a1816]/70 to-[#1a1816]/30" />
              <div className="absolute bottom-4 left-6 flex items-center gap-2">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill="none" stroke="#c9a030" strokeWidth="1.5"/><text x="12" y="17" textAnchor="middle" fill="#c9a030" fontFamily="Georgia,serif" fontSize="13" fontWeight="600">C</text></svg>
                <span style={{ fontFamily: "Georgia, serif" }} className="text-white text-xl font-semibold">The Copper Table</span>
              </div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button type="button" className="bg-white/15 text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-1">🎨 Theme</button>
                <button type="button" className="bg-white/15 text-white text-xs px-3 py-1.5 rounded-lg border border-white/20 flex items-center gap-1">↗ View menu</button>
                <button type="button" className="bg-white/15 text-white text-xs px-2 py-1.5 rounded-lg border border-white/20">?</button>
              </div>
            </div>

            {/* Category tab strip */}
            <div className="bg-[#faf8f5] border-b border-[#2c2a26]/8 px-4 py-3 flex items-center gap-2">
              <span className="bg-[#8b6914] text-white text-xs font-semibold px-4 py-1.5 rounded-xl">Mains</span>
              <span className="bg-white border border-[#2c2a26]/10 text-[#6b6560] text-xs px-4 py-1.5 rounded-xl">Starters</span>
              <span className="bg-white border border-[#2c2a26]/10 text-[#6b6560] text-xs px-4 py-1.5 rounded-xl">Desserts</span>
              <button type="button" className="bg-[#8b6914] text-white text-xs px-4 py-1.5 rounded-xl ml-auto">+ Add item</button>
            </div>

            {/* Category note editor */}
            <div className="bg-[#faf8f5] mx-4 mt-3 rounded-xl border border-[#2c2a26]/8 px-4 py-3">
              <p className="text-[10px] uppercase tracking-widest text-[#6b6560] mb-2">Note for &ldquo;Mains&rdquo;</p>
              <div className="bg-white border border-[#2c2a26]/10 rounded-lg px-3 py-2 text-xs text-[#6b6560] w-full">All mains served with seasonal vegetables.</div>
              <button type="button" className="mt-2 text-[10px] bg-[#8b6914] text-white px-3 py-1 rounded-lg">Save note</button>
            </div>

            {/* Item cards */}
            <div className="space-y-2 mx-4 mt-3 mb-4">
              <div className="flex items-stretch bg-white rounded-2xl border border-[#2c2a26]/8 overflow-hidden shadow-sm">
                <div className="flex flex-col items-center justify-center px-2 gap-1 border-r border-[#2c2a26]/8 py-3">
                  <span className="text-[#8b6914] text-xs leading-none">▲</span>
                  <span className="text-[10px] text-[#6b6560]">1</span>
                  <span className="text-[#8b6914] text-xs leading-none">▼</span>
                </div>
                <img src="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=200&q=75" className="w-20 h-20 object-cover flex-shrink-0" alt="Seared Duck Confit" />
                <div className="p-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span style={{ fontFamily: "Georgia, serif" }} className="text-sm font-semibold text-[#2c2a26]">Seared Duck Confit</span>
                    <span className="text-[#8b6914] text-sm font-bold flex-shrink-0">$24.00</span>
                  </div>
                  <div className="mt-1.5 flex gap-1.5 flex-wrap">
                    <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 rounded-full px-2 py-0.5">Available</span>
                    <span className="text-[10px] bg-[#8b6914]/10 text-[#8b6914] rounded-lg px-2 py-0.5">Edit</span>
                    <span className="text-[10px] bg-red-50 text-red-600 rounded-lg px-2 py-0.5">Delete</span>
                  </div>
                </div>
              </div>

              <div className="flex items-stretch bg-white rounded-2xl border border-[#2c2a26]/8 overflow-hidden shadow-sm">
                <div className="flex flex-col items-center justify-center px-2 gap-1 border-r border-[#2c2a26]/8 py-3">
                  <span className="text-[#8b6914] text-xs leading-none">▲</span>
                  <span className="text-[10px] text-[#6b6560]">2</span>
                  <span className="text-[#8b6914] text-xs leading-none">▼</span>
                </div>
                <img src="https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=200&q=75" className="w-20 h-20 object-cover flex-shrink-0" alt="Atlantic Salmon" />
                <div className="p-3 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span style={{ fontFamily: "Georgia, serif" }} className="text-sm font-semibold text-[#2c2a26]">Atlantic Salmon</span>
                    <span className="text-[#8b6914] text-sm font-bold flex-shrink-0">$22.00</span>
                  </div>
                  <div className="mt-1 text-[10px] text-[#8b6914] font-medium">★ Chef&apos;s pick</div>
                  <div className="mt-1.5 flex gap-1.5 flex-wrap">
                    <span className="text-[10px] bg-red-50 text-red-600 border border-red-200 rounded-full px-2 py-0.5">Unavailable</span>
                    <span className="text-[10px] bg-[#8b6914]/10 text-[#8b6914] rounded-lg px-2 py-0.5">Edit</span>
                    <span className="text-[10px] bg-red-50 text-red-600 rounded-lg px-2 py-0.5">Delete</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[#faf8f5] border-t border-[#2c2a26]/8 px-6 py-3 flex items-center justify-between">
              <span className="text-xs text-[#6b6560]">2 items in Mains</span>
              <span className="text-xs text-[#8b6914]">All changes saved ✓</span>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-10 max-w-4xl mx-auto">
            {[
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />, title: "Drag to reorder", desc: "Sort your menu items and categories in any order with one click" },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />, title: "Toggle availability", desc: "Mark items as unavailable in seconds. They hide from your menu instantly." },
              { icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />, title: "Live theme preview", desc: "Change colors and fonts and see your menu update in real time" },
            ].map((item, i) => (
              <motion.div key={item.title} className="text-center" {...enter(i * 0.1)}>
                <svg className="w-5 h-5 text-[#8b6914] mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">{item.icon}</svg>
                <h3 className="text-sm font-semibold text-[#2c2a26] mt-2">{item.title}</h3>
                <p className="text-xs text-[#6b6560] mt-1">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LANGUAGES ───────────────────────────────────────────────────────── */}
      <section id="languages" className="bg-[#faf8f5] py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div {...enter()}>
            <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">MULTILINGUAL</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#2c2a26]">
              Speak every customer&apos;s language
            </h2>
            <p className="text-lg text-[#6b6560] max-w-xl mx-auto mt-4">
              Guests tap one button and your entire menu translates instantly. Item names, descriptions, categories — everything. Powered by real machine translation.
            </p>
            <motion.div className="h-0.5 bg-[#8b6914] mt-4 mx-auto origin-left" style={{ width: 80 }} {...underline()} />
          </motion.div>

          <div className="flex flex-wrap gap-3 justify-center mt-12 max-w-2xl mx-auto">

            {LANGUAGES.map((lang, i) => (
              <motion.div
                key={lang.name}
                className="flex flex-col items-center gap-1"
                {...(rm ? {} : {
                  initial: { opacity: 0, scale: 0.8, y: 20 },
                  whileInView: { opacity: 1, scale: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] as const },
                  whileHover: { scale: 1.08, y: -4 },
                })}
              >
                <button type="button" className="rounded-full border border-[#8b6914]/25 bg-white px-5 py-2.5 flex items-center gap-2.5 text-sm font-medium text-[#2c2a26] shadow-sm hover:border-[#8b6914]/60 hover:shadow-md transition-all">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </button>
                {lang.rtl && <span className="text-[10px] text-[#8b6914]/60">RTL fully supported</span>}
              </motion.div>
            ))}
          </div>

          <motion.div className="max-w-xl mx-auto mt-10 rounded-2xl border border-[#8b6914]/30 bg-[#8b6914]/5 p-6 text-center" {...enter(0.1)}>
            <p className="text-[#2c2a26] text-sm leading-relaxed">
              Perfect for restaurants in tourist areas, diverse neighborhoods, and cities with international visitors. One menu, six languages, zero extra work.
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── HOW IT WORKS ────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div {...enter()}>
            <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">HOW IT WORKS</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#2c2a26]">
              Up and running in 3 steps
            </h2>
            <motion.div className="h-0.5 bg-[#8b6914] mt-4 mx-auto origin-left" style={{ width: 80 }} {...underline()} />
          </motion.div>

          <div className="relative flex flex-col sm:flex-row gap-8 mt-14 max-w-4xl mx-auto">
            <div className="hidden sm:block absolute top-7 left-[calc(16.67%+28px)] right-[calc(16.67%+28px)] h-0.5 bg-[#8b6914]/20 z-0" />
            {STEPS.map((step, i) => (
              <motion.div key={step.num} className="flex-1 text-center relative z-10" {...enter(i * 0.15)}>
                <div className="w-14 h-14 rounded-full border-2 border-[#8b6914] bg-[#8b6914]/8 flex items-center justify-center mx-auto text-[#8b6914] font-serif text-2xl font-semibold">
                  {step.num}
                </div>
                <div className="text-[#8b6914] mx-auto mt-3 flex justify-center">{step.icon}</div>
                <h3 className="font-semibold text-[#2c2a26] mt-3">{step.title}</h3>
                <p className="text-sm text-[#6b6560] leading-relaxed mt-2">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── THEMES ──────────────────────────────────────────────────────────── */}
      <section className="bg-[#2c2a26] py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div {...enter()}>
            <p className="text-xs font-semibold tracking-widest text-[#c9a030] uppercase mb-3">FULLY CUSTOMIZABLE</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#faf8f5]">Make it yours</h2>
            <p className="text-[#faf8f5]/70 max-w-lg mx-auto mt-4">
              Your menu should look like your restaurant, not a template. Choose any colors, fonts, and upload your own photos.
            </p>
          </motion.div>

          <div className="flex flex-col sm:flex-row justify-center gap-6 mt-14 items-start" style={{ perspective: 1200 }}>

            {/* Villa Romana */}
            <motion.div {...(rm ? {} : { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } })}>
              <motion.div
                className="rounded-2xl overflow-hidden shadow-lg border border-[#c9963a]/20 flex-shrink-0 w-full sm:w-48"
                style={{ background: "#1a0a0a", transformStyle: 'preserve-3d' }}
                animate={rm ? {} : { y: [0, -6, 0] }}
                transition={rm ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0 }}
                whileHover={rm ? {} : { y: -8, rotateY: 4, scale: 1.03, z: 20 }}
              >
                <div className="h-20 relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&q=75" alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute top-2 left-2 bg-black/40 rounded-lg p-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" stroke="#c9963a" strokeWidth="1.2"/><text x="12" y="17" textAnchor="middle" fill="#c9963a" fontFamily="Georgia,serif" fontSize="13">V</text></svg>
                  </div>
                  <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-semibold drop-shadow">Villa Romana</p>
                </div>
                <div className="px-3 py-2 space-y-1.5">
                  <div className="flex gap-1"><span className="text-[10px] font-semibold rounded-lg px-2 py-0.5" style={{ background: "#c9963a22", color: "#c9963a" }}>Antipasti</span></div>
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
              </motion.div>
            </motion.div>

            {/* Takumi */}
            <motion.div {...(rm ? {} : { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.1 } })}>
              <motion.div
                className="rounded-2xl overflow-hidden shadow-lg border border-[#00d4aa]/20 flex-shrink-0 w-full sm:w-48"
                style={{ background: "#0d0d0d", transformStyle: 'preserve-3d' }}
                animate={rm ? {} : { y: [0, -6, 0] }}
                transition={rm ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                whileHover={rm ? {} : { y: -8, rotateY: 0, scale: 1.03, z: 20 }}
              >
                <div className="h-20 relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=300&q=75" alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="absolute top-2 left-2 bg-black/40 rounded-lg p-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="1" y="1" width="22" height="22" rx="3" stroke="#00d4aa" strokeWidth="1.2"/><text x="12" y="17" textAnchor="middle" fill="#00d4aa" fontFamily="system-ui" fontSize="13">匠</text></svg>
                  </div>
                  <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-semibold drop-shadow">Takumi</p>
                </div>
                <div className="px-3 py-2 space-y-1.5">
                  <div className="flex gap-1"><span className="text-[10px] font-semibold rounded-lg px-2 py-0.5" style={{ background: "#00d4aa22", color: "#00d4aa" }}>Nigiri</span></div>
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
              </motion.div>
            </motion.div>

            {/* Sol Café */}
            <motion.div {...(rm ? {} : { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.2 } })}>
              <motion.div
                className="rounded-2xl overflow-hidden shadow-lg border border-[#f97316]/20 flex-shrink-0 w-full sm:w-48"
                style={{ background: "#fff8ed", transformStyle: 'preserve-3d' }}
                animate={rm ? {} : { y: [0, -6, 0] }}
                transition={rm ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
                whileHover={rm ? {} : { y: -8, rotateY: -4, scale: 1.03, z: 20 }}
              >
                <div className="h-20 relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=300&q=75" alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/20" />
                  <div className="absolute top-2 left-2 bg-white/30 backdrop-blur-sm rounded-lg p-1">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#f97316"/><line x1="12" y1="2" x2="12" y2="5" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/><line x1="12" y1="19" x2="12" y2="22" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/><line x1="2" y1="12" x2="5" y2="12" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/><line x1="19" y1="12" x2="22" y2="12" stroke="#f97316" strokeWidth="2" strokeLinecap="round"/></svg>
                  </div>
                  <p className="absolute bottom-2 left-0 right-0 text-center text-white text-xs font-semibold drop-shadow">Sol Café</p>
                </div>
                <div className="px-3 py-2 space-y-1.5">
                  <div className="flex gap-1"><span className="text-[10px] font-semibold rounded-lg px-2 py-0.5" style={{ background: "#f9731622", color: "#f97316" }}>Smoothies</span></div>
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
              </motion.div>
            </motion.div>
          </div>

          <p className="text-[#faf8f5]/60 text-sm text-center mt-8">
            Dark &amp; elegant · Minimalist &amp; modern · Bright &amp; playful — your menu, your personality
          </p>
        </div>
      </section>

      {/* ── PRICING ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-[#faf8f5] py-24">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <motion.div {...enter()}>
            <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">PRICING</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#2c2a26]">Simple, honest pricing</h2>
            <p className="text-lg text-[#6b6560] max-w-md mx-auto mt-4">One plan. Everything included. No hidden fees, no commissions on orders.</p>
            <motion.div className="h-0.5 bg-[#8b6914] mt-4 mx-auto origin-left" style={{ width: 80 }} {...underline()} />
          </motion.div>

          <div className="max-w-sm mx-auto mt-14">
            <motion.div className="rounded-2xl bg-[#8b6914]/10 border border-[#8b6914]/30 px-6 py-3 text-center mb-6" {...enter(0.05)}>
              <p className="text-sm font-medium text-[#8b6914]">🎉 Launch offer — first 2 months free when you sign up now</p>
            </motion.div>
            <motion.div className="bg-[#2c2a26] rounded-3xl border-2 border-[#8b6914]/50 p-8 text-left" {...enter(0.1)}>
              <span className="inline-flex rounded-full bg-[#8b6914]/20 text-[#c9a030] text-xs font-semibold px-3 py-1">DineLinks</span>
              <p style={{ fontFamily: "Georgia, serif" }} className="text-5xl font-semibold text-[#faf8f5] mt-4">$25</p>
              <p className="text-sm text-[#faf8f5]/60">/ month</p>
              <p className="text-sm text-[#faf8f5]/60 mt-2">Everything you need to go digital</p>
              <hr className="my-6 border-[#faf8f5]/10" />
              <ul className="space-y-3 text-sm text-[#faf8f5]/80">
                {["1 digital menu","Unlimited menu items","6 languages supported","QR code & shareable link","Dietary labels & filters","Custom categories","Real-time updates","Custom colors & fonts","Upload logo & photos","Priority email support"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><span className="text-[#c9a030]">✓</span> {f}</li>
                ))}
              </ul>
              <motion.div
                className="mt-8"
                whileHover={rm ? {} : { scale: 1.02, y: -1 }}
                whileTap={rm ? {} : { scale: 0.98 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              >
                <Link href={isLoggedIn ? '/admin' : '/signup'} className="block w-full py-3 rounded-xl bg-[#8b6914] text-white font-semibold text-center hover:opacity-90 transition-opacity">
                  {isLoggedIn ? 'Go to my menu →' : 'Get started →'}
                </Link>
              </motion.div>
              <p className="mt-3 text-[#faf8f5]/40 text-xs text-center">No setup fee · Cancel anytime</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ───────────────────────────────────────────────────────── */}
      <section className="bg-[#8b6914] py-28 text-center">
        <div className="max-w-2xl mx-auto px-6">
          <motion.h2
            style={{ fontFamily: "Georgia, serif" }}
            className="text-4xl sm:text-5xl font-semibold text-white"
            {...(rm ? {} : {
              initial: { opacity: 0, y: 30 },
              whileInView: { opacity: 1, y: 0 },
              viewport: { once: true, margin: '-100px' },
              transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
            })}
          >
            Ready to go digital?
          </motion.h2>
          <p className="text-xl text-white/80 max-w-md mx-auto mt-5">First 2 months free — no credit card required.</p>
          <motion.div
            className="inline-block mt-10"
            whileHover={rm ? {} : { scale: 1.03, y: -2 }}
            whileTap={rm ? {} : { scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          >
            <Link href={isLoggedIn ? '/admin' : '/signup'} className="cta-shine bg-white text-[#8b6914] font-semibold text-lg px-10 py-4 rounded-xl hover:bg-[#faf8f5] transition-colors shadow-lg inline-block">
              {isLoggedIn ? 'Go to my menu →' : 'Get started →'}
            </Link>
          </motion.div>
          <p className="mt-6 text-white/50 text-sm">No setup fee · Cancel anytime · Live in 30 minutes</p>
        </div>
      </section>

      {/* ── FOOTER ──────────────────────────────────────────────────────────── */}
      <footer className="bg-[#2c2a26] py-12">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <DLLogoDark width={32} height={29} />
            <span className="text-lg select-none" style={{ fontFamily: "Georgia, serif", fontWeight: 700 }}>
              <motion.span
                style={{ backgroundImage: 'linear-gradient(90deg, #faf8f5, #c9a030, #faf8f5)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}
                animate={rm ? {} : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={rm ? {} : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              >
                DineLinks
              </motion.span>
            </span>
          </div>

          <div className="flex gap-6 text-sm text-[#faf8f5]/50 flex-wrap justify-center">
            <button type="button" onClick={() => scrollTo("features")} className="hover:text-[#faf8f5]/80 transition-colors">Features</button>
            <button type="button" onClick={() => scrollTo("how-it-works")} className="hover:text-[#faf8f5]/80 transition-colors">How it works</button>
            <button type="button" onClick={() => scrollTo("pricing")} className="hover:text-[#faf8f5]/80 transition-colors">Pricing</button>
            <Link href="/contact" className="hover:text-[#faf8f5]/80 transition-colors">Contact</Link>
            <Link href="/privacy" className="hover:text-[#faf8f5]/80 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-[#faf8f5]/80 transition-colors">Terms of Service</Link>
            <Link href="/login" className="hover:text-[#faf8f5]/80 transition-colors">Sign in</Link>
          </div>

          <p className="text-sm text-[#faf8f5]/30">© 2025 DineLinks</p>
        </div>
      </footer>
    </>
  );
}
