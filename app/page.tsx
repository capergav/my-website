"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { WheatOff, Leaf, BarChart3, Star, Flame, Sprout, MilkOff, ShieldCheck } from "lucide-react";
import { AnalyticsDemo } from "@/app/components/AnalyticsDemo";
import { useIsMobile } from "@/lib/useIsMobile";
import {
  motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence,
} from 'motion/react';

// ── Image constants ────────────────────────────────────────────────────────────
const CT_HERO_URL    = "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80";
const CT_STEAK_URL   = "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80";
const CT_SALMON_URL  = "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=400&q=80";
const CT_DESSERT_URL = "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=400&q=80";
const CT_PASTA_URL   = "https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&q=80";
const FRIES_IMAGE_URL  = "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=200&q=80";
const BURGER_IMAGE_URL = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200&q=80";
const EXAMPLE_MENU_URL = "/menu/gavinrgallant-1";
const LIVE_DEMO_URL    = "https://dinelinks.com/menu/glenngallant-1";

// ── Logo components ────────────────────────────────────────────────────────────
function DLLogoDark({ width = 44, height = 40 }: { width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 44 40" fill="none">
      <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="#c9a030" strokeWidth="2.6" strokeLinejoin="round" />
      <line x1="26" y1="3" x2="26" y2="37" stroke="#faf8f5" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="26" y1="37" x2="42" y2="37" stroke="#faf8f5" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
function DLLogoNav({ width = 32, height = 29 }: { scrolled: boolean; width?: number; height?: number }) {
  return (
    <svg width={width} height={height} viewBox="0 0 44 40" fill="none">
      <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="var(--accent)" strokeWidth="2.6" strokeLinejoin="round" />
      <line x1="26" y1="3" x2="26" y2="37" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
      <line x1="26" y1="37" x2="42" y2="37" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}

// ── CountUp ────────────────────────────────────────────────────────────────────
function CountUp({ to, duration = 1.5, prefix = "", suffix = "" }: { to: number | string; duration?: number; prefix?: string; suffix?: string }) {
  const [val, setVal] = useState<number | string>(to);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (typeof to !== 'number') { setVal(to); return; }
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVal(0);
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
  return <span ref={ref}>{prefix}{val}{suffix}</span>;
}

// ── FeatureCard3D ──────────────────────────────────────────────────────────────
function FeatureCard3D({ feature, delay, rm }: { feature: typeof FEATURES[0]; delay: number; rm: boolean }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const rotX = useSpring(useTransform(my, [-0.5, 0.5], [6, -6]), { stiffness: 150, damping: 20 });
  const rotY = useSpring(useTransform(mx, [-0.5, 0.5], [-6, 6]), { stiffness: 150, damping: 20 });
  const [hovered, setHovered] = useState(false);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (rm || !cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width - 0.5);
    my.set((e.clientY - r.top) / r.height - 0.5);
  };
  const onLeave = () => { mx.set(0); my.set(0); setHovered(false); };

  return (
    <motion.div
      ref={cardRef}
      className="relative bg-gradient-to-br from-white to-[#faf8f5] rounded-2xl border border-[#2c2a26]/8 p-6 overflow-hidden group cursor-default"
      style={{
        transformPerspective: 800,
        transformStyle: 'preserve-3d',
        rotateX: rm ? 0 : rotX,
        rotateY: rm ? 0 : rotY,
      }}
      onMouseMove={onMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={onLeave}
      whileHover={rm ? {} : { borderColor: '#8b6914', y: -6, boxShadow: '0 16px 40px -12px rgba(139,105,20,0.15)' }}
      {...(rm ? {} : {
        initial: { opacity: 0, y: 30 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true },
        transition: { duration: 0.5, delay },
      })}
    >
      {/* Gold shimmer sweep */}
      {!rm && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(110deg, transparent 20%, rgba(201,160,48,0.08) 50%, transparent 80%)' }}
          initial={{ x: '-120%' }}
          animate={hovered ? { x: '120%' } : { x: '-120%' }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      )}

      {/* +/- corner icon */}
      <div className="absolute top-4 right-4 w-5 h-5 flex items-center justify-center transition-colors text-[#2c2a26]/25 group-hover:text-[#8b6914]">
        <motion.span
          className="text-base leading-none font-light select-none"
          animate={hovered && !rm ? { rotate: 45 } : { rotate: 0 }}
          transition={{ duration: 0.2 }}
        >+</motion.span>
      </div>

      <motion.div
        className="feature-icon-wrap w-10 h-10 rounded-xl bg-[#8b6914]/10 flex items-center justify-center mb-4 text-[#8b6914]"
        animate={hovered && !rm ? { rotate: 360 } : { rotate: 0 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      >
        {feature.icon}
      </motion.div>
      <h3 className="text-base font-semibold text-[#2c2a26] mb-2">{feature.title}</h3>
      <p className="text-sm text-[#6b6560] leading-relaxed">{feature.desc}</p>
    </motion.div>
  );
}

// ── Live Translation Demo ──────────────────────────────────────────────────────
type DemoLang = { categoryName: string; categoryNote: string; items: [string, string, string] };
const DEMO_TRANSLATIONS: Record<string, DemoLang> = {
  "English":  { categoryName: "Mains", categoryNote: "All entrées served with soup or salad and house bread.", items: ["Seared Duck Confit", "Atlantic Salmon", "Crème Brûlée"] },
  "Français": { categoryName: "Plats principaux", categoryNote: "Tous les plats sont servis avec soupe ou salade et pain maison.", items: ["Confit de Canard Saisi", "Saumon de l'Atlantique", "Crème Brûlée"] },
  "Español":  { categoryName: "Platos principales", categoryNote: "Todos los platos se sirven con sopa o ensalada y pan de la casa.", items: ["Pato Confitado Dorado", "Salmón del Atlántico", "Crema Catalana"] },
  "العربية":  { categoryName: "الأطباق الرئيسية", categoryNote: "تقدم جميع الأطباق الرئيسية مع الحساء أو السلطة وخبز البيت.", items: ["بط كونفيت مقلي", "سلمون أطلنطي", "كريم بروليه"] },
  "中文":     { categoryName: "主菜", categoryNote: "所有主菜均配汤或沙拉以及自制面包。", items: ["煎鸭腿肉", "大西洋三文鱼", "焦糖布丁"] },
  "한국어":   { categoryName: "메인 요리", categoryNote: "모든 메인 요리는 수프 또는 샐러드와 홈메이드 빵과 함께 제공됩니다.", items: ["구운 오리 콩피", "대서양 연어", "크렘 브륄레"] },
  "ਪੰਜਾਬੀ":  { categoryName: "ਮੁੱਖ ਪਕਵਾਨ", categoryNote: "ਸਾਰੇ ਮੁੱਖ ਪਕਵਾਨ ਸੂਪ ਜਾਂ ਸਲਾਦ ਅਤੇ ਘਰੇਲੂ ਰੋਟੀ ਨਾਲ ਪਰੋਸੇ ਜਾਂਦੇ ਹਨ।", items: ["ਸੀਅਰਡ ਡੱਕ ਕੌਂਫਿਟ", "ਅਟਲਾਂਟਿਕ ਸੈਲਮਨ", "ਕ੍ਰੇਮ ਬਰੂਲੀ"] },
  "廣東話":   { categoryName: "主菜", categoryNote: "所有主菜均配湯或沙律及自家製麵包。", items: ["煎鴨腿", "大西洋三文魚", "焦糖布甸"] },
  "Filipino": { categoryName: "Pangunahing Putahe", categoryNote: "Lahat ng pangunahing putahe ay may kasamang sopas o salad at tinapay.", items: ["Inihaw na Pato", "Atlantikong Salmon", "Krema Brulée"] },
  "हिन्दी":   { categoryName: "मुख्य व्यंजन", categoryNote: "सभी मुख्य व्यंजन सूप या सलाद और घर की बनी रोटी के साथ परोसे जाते हैं।", items: ["सीयर्ड डक कॉन्फिट", "अटलांटिक सालमन", "क्रेम ब्रूले"] },
};
const DEMO_PRICES = ["$24.00", "$22.00", "$14.00"];
const DEMO_IMAGES = [CT_STEAK_URL, CT_SALMON_URL, CT_DESSERT_URL];

function LiveTranslationDemo({ rm }: { rm: boolean }) {
  const [activeLang, setActiveLang] = useState("English");
  const langData = DEMO_TRANSLATIONS[activeLang] ?? DEMO_TRANSLATIONS["English"];
  const { categoryName, categoryNote, items: names } = langData;

  return (
    <section id="languages" className="bg-white py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <motion.div className="text-center mb-14"
          {...(rm ? {} : { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } })}
        >
          <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">MULTILINGUAL</p>
          <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl sm:text-5xl font-semibold text-[#2c2a26]">
            Tap a language. Watch it translate.
          </h2>
          <p className="text-lg text-[#6b6560] max-w-xl mx-auto mt-4">
            Guests tap one button and your entire menu translates instantly. Powered by real machine translation.
          </p>
          <motion.div className="h-0.5 bg-[#8b6914] mt-4 mx-auto origin-left" style={{ width: 80 }}
            {...(rm ? {} : { initial: { scaleX: 0 }, whileInView: { scaleX: 1 }, viewport: { once: true }, transition: { duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] } })}
          />
        </motion.div>

        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
          {/* Phone mockup */}
          <motion.div
            className="flex-shrink-0 w-full lg:w-auto flex justify-center"
            {...(rm ? {} : { initial: { opacity: 0, x: -30 }, whileInView: { opacity: 1, x: 0 }, viewport: { once: true }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } })}
          >
            <div className="rounded-3xl overflow-hidden shadow-2xl border-4 border-[#2c2a26]/10 w-64 sm:w-72 bg-white">
              <div className="relative h-32 overflow-hidden">
                <img src={CT_HERO_URL} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <p className="absolute bottom-3 w-full text-center text-white font-serif text-lg font-semibold drop-shadow">The Copper Table</p>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-sm">
                  <span className="text-xs font-medium text-gray-900">{activeLang.length > 8 ? activeLang.slice(0,7)+'…' : activeLang}</span>
                  <svg className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              <div className="mx-3 mt-3 mb-1">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${activeLang}-cat`}
                    className="text-[10px] font-bold text-[#2c2a26] uppercase tracking-widest mb-0.5"
                    initial={rm ? {} : { rotateX: -60, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={rm ? {} : { rotateX: 60, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 25 }}
                    style={{ display: 'inline-block', transformStyle: 'preserve-3d', transformOrigin: 'center' }}
                  >
                    {categoryName}
                  </motion.p>
                </AnimatePresence>
                <AnimatePresence mode="wait">
                  <motion.p
                    key={`${activeLang}-note`}
                    className="text-[9px] italic text-gray-400 mb-2"
                    initial={rm ? {} : { rotateX: -60, opacity: 0 }}
                    animate={{ rotateX: 0, opacity: 1 }}
                    exit={rm ? {} : { rotateX: 60, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 250, damping: 25, delay: 0.03 }}
                    style={{ display: 'block', transformStyle: 'preserve-3d', transformOrigin: 'center' }}
                  >
                    {categoryNote}
                  </motion.p>
                </AnimatePresence>
              </div>
              {/* Dietary key */}
              <div className="flex items-center gap-2 text-[10px] text-[#6b6560] py-1 px-3">
                <span className="font-medium tracking-wide uppercase">Dietary Key</span>
                <span className="flex items-center gap-1"><WheatOff size={11} className="text-[#6b6560]" /> Gluten Free</span>
                <span className="flex items-center gap-1"><Leaf size={11} className="text-[#6b6560]" /> Vegan</span>
              </div>
              <div className="space-y-2 mx-3 mb-3">
                {names.map((name, idx) => (
                  <div key={`${activeLang}-${idx}`} className="flex bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <img src={DEMO_IMAGES[idx]} alt={name} className="w-16 h-16 object-cover flex-shrink-0" />
                    <div className="p-2.5 flex flex-col justify-center min-w-0">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={`${activeLang}-name-${idx}`}
                          className="text-sm font-serif font-semibold text-[#2c2a26] leading-snug"
                          initial={rm ? {} : { rotateX: -60, opacity: 0 }}
                          animate={{ rotateX: 0, opacity: 1 }}
                          exit={rm ? {} : { rotateX: 60, opacity: 0 }}
                          transition={{ type: 'spring', stiffness: 250, damping: 25, delay: idx * 0.06 }}
                          style={{ display: 'inline-block', transformStyle: 'preserve-3d', transformOrigin: 'center' }}
                        >
                          {name}
                        </motion.p>
                      </AnimatePresence>
                      <p className="text-[#8b6914] text-sm font-bold">{DEMO_PRICES[idx]}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 opacity-60 text-[#2c2a26]">
                        {idx === 0 && <><Star size={11} /><WheatOff size={11} /></>}
                        {idx === 1 && <><WheatOff size={11} /><Leaf size={11} /></>}
                        {idx === 2 && <Star size={11} />}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pb-3 text-center">
                <span className="inline-flex items-center gap-1.5 text-[10px] text-gray-300">
                  <svg width="10" height="9" viewBox="0 0 44 40" fill="none">
                    <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
                    <line x1="26" y1="3" x2="26" y2="37" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <line x1="26" y1="37" x2="42" y2="37" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Powered by DineLinks
                </span>
              </div>
            </div>
          </motion.div>

          {/* Language selector — pill buttons */}
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#2c2a26] mb-4 text-center lg:text-left">Tap a language to preview it live:</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 w-full">
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.name}
                  type="button"
                  onClick={() => setActiveLang(lang.name)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-full border transition-colors touch-manipulation w-full ${
                    activeLang === lang.name
                      ? "border-[#8b6914] bg-[#8b6914]/5 text-[#8b6914]"
                      : "border-[#e8e4dd] bg-white text-[#2c2a26] hover:border-[#8b6914] hover:text-[#8b6914]"
                  }`}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.name}</span>
                </button>
              ))}
            </div>
            <motion.div
              className="mt-8 rounded-2xl border border-[#8b6914]/30 bg-[#8b6914]/5 p-5"
              {...(rm ? {} : { initial: { opacity: 0 }, whileInView: { opacity: 1 }, viewport: { once: true }, transition: { duration: 0.6, delay: 0.3 } })}
            >
              <p className="text-[#2c2a26] text-sm leading-relaxed">
                Perfect for restaurants in tourist areas, diverse neighborhoods, and cities with international visitors.{' '}
                <strong>One menu, 10 languages, zero extra work.</strong>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Section divider ────────────────────────────────────────────────────────────
function SectionDivider({ from, to }: { from: string; to: string }) {
  return (
    <div style={{ background: from, display: 'block', lineHeight: 0 }}>
      <svg viewBox="0 0 1440 28" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block', width: '100%' }} preserveAspectRatio="none">
        <polygon points="0,28 1440,0 1440,28" fill={to} />
      </svg>
    </div>
  );
}

// ── Data ───────────────────────────────────────────────────────────────────────
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
    desc: "Choose from 10 curated theme presets or build your own with a custom color picker. Upload your logo, hero photo, and category images.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8C8 10 5.9 16.17 3.82 22M2 6c8-4 16-2 18 6-2 4-6 6-12 6" />
      </svg>
    ),
    title: "Dietary labels",
    desc: "Chef's favorite, vegan, gluten-free, spicy, nut-free, dairy-free, vegetarian — mark any dish and guests filter in one tap.",
  },
  {
    icon: <BarChart3 className="w-5 h-5" />,
    title: "Built-in analytics",
    desc: "See exactly how customers use your menu — top items, peak hours, language preferences, and device breakdown. Make data-driven decisions about your menu.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
    title: "Custom categories",
    desc: "Starters, mains, desserts — or anything you want. Add category images, write category notes, and drag-to-reorder.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: "QR code ready",
    desc: "4 styles and 3 templates (QR Only, With Tagline, Table Card). Download as PNG and print or post anywhere. Shareable link included.",
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
    desc: "Add dishes, upload photos, set prices, create categories. Most restaurants finish in under 30 minutes.",
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
  { flag: "🇮🇳", name: "ਪੰਜਾਬੀ" },
  { flag: "🇭🇰", name: "廣東話" },
  { flag: "🇵🇭", name: "Filipino" },
  { flag: "🇮🇳", name: "हिन्दी" },
];

const BEFORE_ITEMS = [
  "📄 Reprinted menus every season",
  "💸 Print costs add up",
  "🗑️ Wasted paper when prices change",
  "🚫 Hard to update specials daily",
  "🌐 No translation for tourists",
  "⏰ Slow to react to inventory changes",
];

const AFTER_ITEMS = [
  "📱 One digital menu, always live",
  "💰 Update menus without reprinting",
  "🔄 Update prices in seconds",
  "✨ Mark items 86'd instantly",
  "🌍 10 languages, one menu",
  "⚡ Real-time inventory sync",
];

// ── Main component ─────────────────────────────────────────────────────────────
export default function HomePage() {
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const rm = prefersReducedMotion;
  const isMobile = useIsMobile();

  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // default to logged-in state
  const [ctaHovered, setCtaHovered] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterDone, setNewsletterDone] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [newsletterError, setNewsletterError] = useState('');
  const [demoMouse, setDemoMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    import("@/app/lib/supabase").then(({ createSupabaseClient }) => {
      createSupabaseClient().auth.getUser().then(({ data }) => {
        setIsLoggedIn(!!data.user);
      });
    });
  }, []);

  // Scroll
  const { scrollY, scrollYProgress } = useScroll();
  const phoneY = useTransform(scrollY, [0, 600], [0, rm ? 0 : -60]);
  // Parallax for blobs
  const blob1Y = useTransform(scrollY, [0, 2000], [0, rm ? 0 : -300]);
  const blob2Y = useTransform(scrollY, [0, 2000], [0, rm ? 0 : -180]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth - 0.5) * 2;
      const y = (e.clientY / window.innerHeight - 0.5) * 2;
      setDemoMouse({ x, y });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'DineLinks',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description: 'Digital QR code menus for restaurants. Customers scan to view menus in 10 languages. No reprinting — update in seconds.',
            url: 'https://dinelinks.com',
            featureList: [
              'QR code menu generation',
              '10 language automatic translation',
              'Real-time menu updates',
              'Mobile-optimized customer view',
              'Restaurant analytics dashboard',
              'No paper menu reprinting',
            ],
          }),
        }}
      />
      <style>{`
        @keyframes periodic-shimmer{0%,75%,100%{transform:translateX(-150%) skewX(-15deg);opacity:0}80%{opacity:1}95%{transform:translateX(150%) skewX(-15deg);opacity:0}}
        @keyframes banner-shine{0%{background-position:-200% center}100%{background-position:400% center}}
        @keyframes live-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.4;transform:scale(0.85)}}
        @keyframes ring-out{0%{transform:scale(1);opacity:0.7}100%{transform:scale(1.5);opacity:0}}
        @keyframes wiggle{0%,100%{transform:translateX(0)}33%{transform:translateX(2px)}66%{transform:translateX(-2px)}}
        .hero-primary-cta{position:relative;overflow:hidden}
        .hero-primary-cta::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 35%,rgba(255,255,255,0.22) 50%,transparent 65%);animation:periodic-shimmer 4s ease-in-out infinite;pointer-events:none}
        .pricing-banner-shine{background:linear-gradient(110deg,#7a5c12 30%,#c9a030 50%,#7a5c12 70%);background-size:200% 100%;animation:banner-shine 3s linear infinite}
        .live-dot{animation:live-pulse 2s ease-in-out infinite}
        .ring-pulse{animation:ring-out 0.5s ease-out forwards}
        .cta-shine{position:relative;overflow:hidden}
        .cta-shine::after{content:'';position:absolute;inset:0;background:linear-gradient(110deg,transparent 40%,rgba(255,255,255,0.2) 50%,transparent 60%);transform:translateX(-100%);pointer-events:none}
        .cta-shine:hover::after{animation:periodic-shimmer 700ms ease-out}
        @media(prefers-reduced-motion:reduce){.hero-primary-cta::after,.cta-shine::after,.pricing-banner-shine,.live-dot{animation:none}}
      `}</style>

      {/* ── Scroll progress bar ────────────────────────────────────────────────── */}
      {!rm && !isMobile && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-[3px] bg-[#8b6914] origin-left z-[60] pointer-events-none"
          style={{ scaleX: scrollYProgress }}
        />
      )}

      {/* ── NAVBAR ────────────────────────────────────────────────────────────── */}
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
            {!isLoggedIn && <Link href="/login" className="hidden sm:block text-sm transition-colors text-foreground/70 hover:text-foreground">Sign in</Link>}
            <Link href={isLoggedIn ? '/admin' : '/signup'} className="rounded-xl px-4 sm:px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity bg-[#8b6914] text-white">
              {isLoggedIn ? 'Go to my menu' : 'Start free'}
            </Link>
            {/* Hamburger — mobile only */}
            <button
              type="button"
              className="md:hidden flex flex-col gap-1.5 p-1.5 rounded-lg text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
              onClick={() => setMobileMenuOpen((o) => !o)}
              aria-label="Toggle menu"
            >
              <span className={`block w-5 h-0.5 bg-current transition-all ${mobileMenuOpen ? "rotate-45 translate-y-2" : ""}`} />
              <span className={`block w-5 h-0.5 bg-current transition-all ${mobileMenuOpen ? "opacity-0" : ""}`} />
              <span className={`block w-5 h-0.5 bg-current transition-all ${mobileMenuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-foreground/10 bg-background/98 px-6 py-4 flex flex-col gap-4">
            {[
              { label: "Features", id: "features" },
              { label: "How it works", id: "how-it-works" },
              { label: "Languages", id: "languages" },
              { label: "Pricing", id: "pricing" },
            ].map(({ label, id }) => (
              <button key={id} type="button" onClick={() => { scrollTo(id); setMobileMenuOpen(false); }}
                className="text-sm transition-colors text-foreground/70 hover:text-foreground text-left">
                {label}
              </button>
            ))}
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="text-sm transition-colors text-foreground/70 hover:text-foreground">Contact</Link>
            {!isLoggedIn && <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm transition-colors text-foreground/70 hover:text-foreground">Sign in</Link>}
            <Link href={isLoggedIn ? '/admin' : '/signup'} onClick={() => setMobileMenuOpen(false)} className="w-full text-center rounded-xl px-4 py-3 text-sm font-semibold bg-[#8b6914] text-white">
              {isLoggedIn ? 'Go to my menu' : 'Start free trial'}
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ──────────────────────────────────────────────────────────────── */}
      <section
        className="relative bg-[#faf8f5] pt-10 pb-16 md:pt-16 md:pb-24 lg:min-h-screen lg:flex lg:items-center overflow-hidden"
      >
        {/* Floating blobs with parallax */}
        {!rm && !isMobile && (
          <>
            <motion.div
              className="absolute top-20 right-10 w-96 h-96 rounded-full bg-[#8b6914]/5 blur-3xl pointer-events-none"
              style={{ y: blob1Y }}
              animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-20 left-10 w-[500px] h-[500px] rounded-full bg-[#c9a030]/5 blur-3xl pointer-events-none"
              style={{ y: blob2Y }}
              animate={{ x: [0, -40, 0], y: [0, 30, 0] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            />
          </>
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 w-full flex flex-col items-center text-center lg:flex-row lg:items-center lg:text-left gap-8 lg:gap-16 relative z-10">
          {/* Left column */}
          <motion.div
            className="flex-1 w-full"
            initial={rm ? {} : { opacity: 0, y: isMobile ? 16 : 0, x: isMobile ? 0 : -28 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: rm ? 0 : (isMobile ? 0.3 : 0.7), ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow */}
            <p className="text-xs font-bold tracking-[0.2em] text-[#8b6914] uppercase mb-4">
              DIGITAL MENUS FOR MODERN RESTAURANTS
            </p>

            <span className="inline-flex items-center gap-2 rounded-full border border-[#8b6914]/40 bg-[#8b6914]/8 px-4 py-1.5 text-sm text-[#8b6914] font-semibold">
              ✦ 60-day free trial · No credit card required
            </span>

            <motion.h1
              style={{ fontFamily: "Georgia, serif" }}
              className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl font-semibold text-[#2c2a26] leading-tight mt-6 max-w-4xl"
              initial={rm ? {} : { opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: rm ? 0 : 0.7, ease: [0.22, 1, 0.36, 1], delay: rm ? 0 : 0.1 }}
            >
              The digital menu your restaurant deserves.
            </motion.h1>

            <p className="text-lg sm:text-xl text-[#6b6560] max-w-xl mt-5 leading-relaxed">
              Stop reprinting menus. Customers scan a QR code and see your menu instantly — translated into 10 languages, updated in real time, and beautifully designed.
            </p>
            <p className="text-sm text-[#6b6560]/80 mt-3 leading-relaxed max-w-lg">
              Whether you&apos;re swapping the soup of the day or rebranding for the season, your menu updates the moment you save. No more outdated PDFs taped to walls. No more printer runs. Just a clean QR code on every table.
            </p>

            <div className="flex gap-4 mt-8 flex-wrap justify-center lg:justify-start">
              <div
                className="relative"
                onMouseEnter={() => setCtaHovered(true)}
                onMouseLeave={() => setCtaHovered(false)}
              >
                <motion.div
                  whileHover={rm ? {} : { scale: 1.03, y: -2 }}
                  whileTap={rm ? {} : { scale: 0.97 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                >
                  <Link
                    href={isLoggedIn ? '/admin' : '/signup'}
                    className="hero-primary-cta bg-[#8b6914] text-white rounded-xl px-7 py-3.5 text-base font-semibold hover:opacity-90 transition-opacity inline-flex items-center gap-2"
                  >
                    <span>{isLoggedIn ? 'Go to my menu' : 'Start free — 60 days'}</span>
                    <motion.span
                      animate={ctaHovered && !rm ? { x: 4 } : { x: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >→</motion.span>
                  </Link>
                </motion.div>
                {/* Gold ring pulse on hover */}
                <AnimatePresence>
                  {ctaHovered && !rm && (
                    <motion.span
                      className="absolute inset-0 rounded-xl border-2 border-[#8b6914]/50 pointer-events-none"
                      initial={{ scale: 1, opacity: 0.7 }}
                      animate={{ scale: 1.18, opacity: 0 }}
                      exit={{}}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  )}
                </AnimatePresence>
              </div>
              <Link href={EXAMPLE_MENU_URL} className="rounded-xl px-7 py-3.5 text-base font-medium border-2 border-[#2c2a26]/20 text-[#2c2a26] hover:bg-[#2c2a26]/5 transition-colors">
                See a real menu →
              </Link>
            </div>

            {/* Trust badges */}
            <div className="mt-6 flex flex-wrap gap-3 justify-center lg:justify-start">
              {[
                { icon: "🏪", text: "For independent restaurants" },
                { icon: "🌍", text: "10 languages" },
                { icon: "⚡", text: "Live in 30 min" },
                { icon: "💳", text: "No card required" },
              ].map((badge) => (
                <span key={badge.text} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6b6560] bg-white/80 border border-[#2c2a26]/10 rounded-full px-3 py-1.5">
                  <span>{badge.icon}</span>
                  <span>{badge.text}</span>
                </span>
              ))}
            </div>

            <div className="mt-4 flex gap-5 flex-wrap text-sm text-[#6b6560] justify-center lg:justify-start">
              <span>✓ No setup fee</span>
              <span>✓ Live in 30 minutes</span>
              <span className="font-bold text-[#8b6914]">✓ 60-day free trial</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-[#8b6914] flex items-center gap-2 justify-center lg:justify-start">
              <span className="live-dot inline-block w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
              No credit card required — cancel anytime
            </p>
          </motion.div>

          {/* Right column — phone mockup */}
          <motion.div
            className="flex-1 flex flex-col items-center w-full mt-6 lg:mt-0"
            initial={rm ? {} : { opacity: 0, y: isMobile ? 16 : 0, x: isMobile ? 0 : 28 }}
            animate={{ opacity: 1, x: 0, y: 0 }}
            transition={{ duration: rm ? 0 : (isMobile ? 0.3 : 0.7), ease: [0.22, 1, 0.36, 1], delay: rm ? 0 : 0.15 }}
          >
            <div
              style={{
                transform: `perspective(1000px) rotateY(${demoMouse.x * 6}deg) rotateX(${-demoMouse.y * 4}deg)`,
                transition: "transform 0.15s ease-out",
                maxHeight: 480,
              }}
              className="mx-auto w-[300px] rounded-[2.5rem] overflow-hidden shadow-2xl border border-[#e8e4dd]"
            >
                {/* Hero image */}
                <div className="relative overflow-hidden" style={{ height: 96 }}>
                  <img src={CT_HERO_URL} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <p className="absolute bottom-2 w-full text-center text-white font-serif text-base font-semibold drop-shadow">The Copper Table</p>
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1 shadow-sm">
                    <span className="text-[11px] font-medium text-gray-900">English</span>
                    <svg className="w-3 h-3 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {/* Category tabs — 5 tabs, overflow hints scroll */}
                <div className="flex gap-2 px-3 py-2 overflow-x-auto" style={{ background: '#ffffff', borderBottom: '1px solid rgba(44,42,38,0.08)', height: 90, scrollbarWidth: 'none' }}>
                  {[
                    { name: "Starters", img: FRIES_IMAGE_URL,  active: true  },
                    { name: "Mains",    img: BURGER_IMAGE_URL, active: false },
                    { name: "Desserts", img: "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=200&q=80", active: false },
                    { name: "Drinks",   img: "https://images.unsplash.com/photo-1551538827-9c037cb4f32a?w=200&q=80", active: false },
                    { name: "Specials", img: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200&q=80", active: false },
                  ].map(cat => (
                    <button key={cat.name} type="button" className="flex flex-col items-center gap-1 flex-shrink-0">
                      <div className={`w-14 h-14 rounded-xl overflow-hidden ${cat.active ? "ring-2 ring-[#8b6914] ring-offset-1 ring-offset-white" : ""}`}>
                        <img src={cat.img} className="w-full h-full object-cover" alt={cat.name} />
                      </div>
                      <span className={`text-[9px] font-semibold uppercase tracking-wide ${cat.active ? "text-[#8b6914]" : "text-[#6b6560]"}`}>{cat.name}</span>
                    </button>
                  ))}
                </div>
                {/* Category description */}
                <p className="text-[10px] text-[#6b6560] italic px-3 pt-1 pb-0">All starters served with house bread.</p>
                {/* Dietary key */}
                <div className="flex items-center gap-2 px-3 py-0.5 text-[10px] text-[#6b6560]">
                  <span className="font-medium tracking-wide">DIETARY KEY</span>
                  <span className="flex items-center gap-1"><WheatOff size={10} className="text-[#6b6560]" /> GF</span>
                  <span className="flex items-center gap-1"><Leaf size={10} className="text-[#6b6560]" /> Vegan</span>
                  <span className="flex items-center gap-1"><Sprout size={10} className="text-[#6b6560]" /> Veg</span>
                </div>
                {/* Menu items */}
                <div style={{ margin: "0 9px 6px" }}>
                  {/* Item 1 */}
                  <div style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#ffffff", borderRadius: 12, border: "1px solid #e8e4dd", marginBottom: 5 }}>
                    <img style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} src={FRIES_IMAGE_URL} alt="Twice-Cooked Chips" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#2c2a26", lineHeight: 1.3 }}>Twice-Cooked Chips</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#8b6914", flexShrink: 0 }}>$3.95</span>
                      </div>
                      <div style={{ display: "flex", gap: 4, margin: "2px 0" }}>
                        <WheatOff size={12} color="#6b6560" />
                        <Leaf size={12} color="#6b6560" />
                      </div>
                      <p style={{ fontSize: 11, color: "#6b6560", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>Chunky skin-on chips double-fried for extra crunch.</p>
                    </div>
                  </div>
                  {/* Item 2 */}
                  <div style={{ display: "flex", gap: 8, padding: "8px 10px", background: "#ffffff", borderRadius: 12, border: "1px solid #e8e4dd", marginBottom: 0 }}>
                    <img style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} src={CT_SALMON_URL} alt="Atlantic Salmon" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#2c2a26", lineHeight: 1.3 }}>Atlantic Salmon</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#8b6914", flexShrink: 0 }}>$24.00</span>
                      </div>
                      <div style={{ display: "flex", gap: 4, margin: "2px 0" }}>
                        <WheatOff size={12} color="#6b6560" />
                      </div>
                      <p style={{ fontSize: 11, color: "#6b6560", margin: 0, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>Pan-seared with lemon butter, capers, and seasonal greens.</p>
                    </div>
                  </div>
                </div>
                <div className="pb-2 text-center">
                  <span className="inline-flex items-center gap-1.5 text-[10px] text-[#2c2a26]/30">
                    <svg width="10" height="9" viewBox="0 0 44 40" fill="none">
                      <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
                      <line x1="26" y1="3" x2="26" y2="37" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      <line x1="26" y1="37" x2="42" y2="37" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Powered by DineLinks
                  </span>
                </div>
            </div>
            <p className="hidden lg:block mt-4 text-center text-xs text-[#8b6914]/70">↑ Example menu built with DineLinks</p>
          </motion.div>
        </div>
      </section>

      {/* ── STATS BAR ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#2c2a26] py-14">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { target: 30,       suffix: " min", label: "Average setup time" },
              { target: 0,        suffix: "",     label: "menu reprints" },
              { target: 10,       suffix: "",     label: "Languages supported" },
              { target: "Always", suffix: "",     label: "Up-to-date menu" },
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

      {/* ── SECTION DIVIDER: dark → white ─────────────────────────────────────── */}
      <SectionDivider from="#2c2a26" to="#ffffff" />

      {/* ── BEFORE VS AFTER ───────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-14" {...enter()}>
            <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">WHY GO DIGITAL</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl sm:text-5xl font-semibold text-[#2c2a26]">
              The old way vs the DineLinks way
            </h2>
            <motion.div className="h-0.5 bg-[#8b6914] mt-4 mx-auto origin-left" style={{ width: 80 }} {...underline()} />
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            {/* Before */}
            <motion.div
              className="flex-1 rounded-2xl border border-gray-200 p-8 bg-gray-50"
              style={{ filter: 'grayscale(0.6)' }}
              {...(rm ? {} : {
                initial: { opacity: 0, x: -30 },
                whileInView: { opacity: 0.75, x: 0 },
                viewport: { once: true },
                transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
              })}
            >
              <h3 className="font-semibold text-gray-500 text-lg mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-gray-400 inline-block" />
                The old way
              </h3>
              <ul className="space-y-3">
                {BEFORE_ITEMS.map((item, i) => (
                  <motion.li
                    key={item}
                    className="flex items-center gap-3 text-gray-500 text-sm"
                    {...(rm ? {} : {
                      initial: { opacity: 0, x: -15 },
                      whileInView: { opacity: 1, x: 0 },
                      viewport: { once: true },
                      transition: { duration: 0.4, delay: 0.1 + i * 0.07 },
                    })}
                  >
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Arrow */}
            <div className="flex items-center justify-center lg:flex-col py-4 lg:py-0">
              <motion.div
                className="text-[#8b6914] text-3xl font-bold lg:rotate-0 rotate-90"
                {...(rm ? {} : {
                  initial: { opacity: 0, scale: 0.5 },
                  whileInView: { opacity: 1, scale: 1 },
                  viewport: { once: true },
                  transition: { duration: 0.5, delay: 0.45, type: 'spring', stiffness: 200 },
                })}
              >→</motion.div>
            </div>

            {/* After */}
            <motion.div
              className="flex-1 rounded-2xl border-2 border-[#8b6914]/30 p-8 bg-[#faf8f5]"
              {...(rm ? {} : {
                initial: { opacity: 0, x: 40 },
                whileInView: { opacity: 1, x: 0 },
                viewport: { once: true },
                transition: { duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] },
              })}
            >
              <h3 style={{ fontFamily: "Georgia, serif" }} className="font-semibold text-[#8b6914] text-lg mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#8b6914] inline-block" />
                With DineLinks
              </h3>
              <ul className="space-y-3">
                {AFTER_ITEMS.map((item, i) => (
                  <motion.li
                    key={item}
                    className="flex items-center gap-3 text-[#2c2a26] text-sm font-medium"
                    {...(rm ? {} : {
                      initial: { opacity: 0, x: 15 },
                      whileInView: { opacity: 1, x: 0 },
                      viewport: { once: true },
                      transition: { duration: 0.4, delay: 0.5 + i * 0.07 },
                    })}
                  >
                    <span className="text-[#8b6914] flex-shrink-0">✓</span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────────────────────── */}
      <section id="features" className="bg-[#faf8f5] py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
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
              <FeatureCard3D key={f.title} feature={f} delay={i * 0.08} rm={rm} />
            ))}
          </div>
        </div>
      </section>

      {/* ── ANALYTICS SECTION ─────────────────────────────────────────────────── */}
      <section className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <motion.div className="text-center mb-14" {...enter()}>
            <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">ANALYTICS</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl sm:text-5xl font-semibold text-[#2c2a26]">
              Know what your customers love
            </h2>
            <p className="text-lg text-[#6b6560] max-w-2xl mx-auto mt-4">
              Every scan, click, and language switch is logged. See peak hours, most-viewed items, top-performing categories, and which languages your customers actually use — all in a beautiful dashboard.
            </p>
            <motion.div className="h-0.5 bg-[#8b6914] mt-4 mx-auto origin-left" style={{ width: 80 }} {...underline()} />
          </motion.div>

          <motion.div
            className="max-w-4xl mx-auto"
            {...(rm ? {} : { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } })}
          >
            <AnalyticsDemo />
          </motion.div>
        </div>
      </section>

      {/* ── LIVE TRANSLATION DEMO ─────────────────────────────────────────────── */}
      <LiveTranslationDemo rm={rm} />

      {/* ── ADMIN SHOWCASE ────────────────────────────────────────────────────── */}
      <section className="bg-[#faf8f5] py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
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

          <motion.div className="max-w-4xl mx-auto mt-14 rounded-2xl overflow-hidden shadow-2xl border border-[#2c2a26]/10 select-none" {...enter(0.1)}>
            {/* Header bar */}
            <div className="relative h-36 overflow-hidden bg-[#1a1816]">
              <img src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&q=80" className="absolute inset-0 w-full h-full object-cover" alt="" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1816]/90 via-[#1a1816]/55 to-[#1a1816]/25" />
              {/* Desktop branding bottom-left */}
              <div className="absolute bottom-4 left-5 flex flex-col">
                <span className="text-white/50 text-[10px] font-semibold uppercase tracking-widest mb-0.5">Admin Panel</span>
                <div className="flex items-center gap-2">
                  <svg width="20" height="18" viewBox="0 0 44 40" fill="none">
                    <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="#c9a030" strokeWidth="2.6" strokeLinejoin="round"/>
                    <line x1="26" y1="3" x2="26" y2="37" stroke="#faf8f5" strokeWidth="2.6" strokeLinecap="round"/>
                    <line x1="26" y1="37" x2="42" y2="37" stroke="#faf8f5" strokeWidth="2.6" strokeLinecap="round"/>
                  </svg>
                  <span style={{ fontFamily: "Georgia, serif" }} className="text-white text-lg font-semibold">The Copper Table</span>
                </div>
              </div>
              {/* Action buttons top-right — trial pill + hamburger menu */}
              <div className="absolute top-3 right-3 flex items-center gap-2">
                <span className="bg-[#8b6914] text-white text-[11px] px-2.5 py-1.5 rounded-lg font-medium flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white opacity-90" />
                  38d left — Subscribe
                </span>
                <span className="bg-white/20 text-white text-[11px] px-2.5 py-1.5 rounded-lg border border-white/40 font-medium flex items-center gap-1.5">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
                    <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
                    <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
                  </svg>
                  Menu
                </span>
              </div>
            </div>

            {/* Category tabs */}
            <div className="bg-[#faf8f5]/95 border-b border-[#2c2a26]/8 px-4 py-2.5 flex items-center gap-2 overflow-x-auto">
              <span className="bg-[#8b6914] text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex-shrink-0">Mains</span>
              <span className="bg-white border border-[#2c2a26]/10 text-[#6b6560] text-xs px-4 py-1.5 rounded-xl flex-shrink-0">Starters</span>
              <span className="bg-white border border-[#2c2a26]/10 text-[#6b6560] text-xs px-4 py-1.5 rounded-xl flex-shrink-0">Desserts</span>
              <span className="bg-white border border-[#2c2a26]/10 text-[#6b6560] text-xs px-4 py-1.5 rounded-xl flex-shrink-0">Cocktails</span>
              <span className="border-2 border-dashed border-[#8b6914]/30 text-[#8b6914] text-xs px-3 py-1.5 rounded-xl flex-shrink-0 flex items-center gap-1 font-semibold">
                + Add category
              </span>
              <span className="border border-[#2c2a26]/10 text-[#6b6560] text-xs px-3 py-1.5 rounded-xl flex-shrink-0 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                Manage
              </span>
              <div className="flex-1" />
              <span className="bg-[#8b6914] text-white text-xs px-4 py-1.5 rounded-xl flex-shrink-0 font-semibold flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                Add item to Mains
              </span>
            </div>

            {/* Category note */}
            <div className="mx-4 mt-3 p-3 rounded-xl border border-[#2c2a26]/8 bg-white flex items-center gap-3">
              <div className="flex-1">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-[#6b6560] mb-0.5">Note for &ldquo;Mains&rdquo;</p>
                <p className="text-xs text-[#2c2a26]">All mains served with seasonal vegetables and your choice of starch.</p>
              </div>
              <span className="text-xs bg-[#8b6914]/10 text-[#8b6914] px-3 py-1 rounded-lg font-medium flex-shrink-0">Save note</span>
            </div>

            {/* Item rows */}
            <div className="space-y-2 mx-4 mt-3 mb-4">
              {[
                { name: "Seared Duck Confit", price: "$24.00", desc: "24-hour confit leg, cherry jus, roasted fingerlings", img: CT_STEAK_URL, avail: true },
                { name: "Atlantic Salmon",    price: "$22.00", desc: "Pan-seared fillet, lemon beurre blanc, wilted greens", img: CT_SALMON_URL, avail: false },
                { name: "Crème Brûlée",       price: "$14.00", desc: "Classic vanilla custard, caramelised sugar top", img: CT_DESSERT_URL, avail: true },
              ].map((item) => (
                <div key={item.name} className="flex gap-3 p-3 bg-white rounded-xl border border-[#2c2a26]/8">
                  <img src={item.img} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" alt={item.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-semibold text-sm text-[#2c2a26]">{item.name}</span>
                      <span className="font-semibold text-sm text-[#8b6914] flex-shrink-0">{item.price}</span>
                    </div>
                    <p className="text-xs text-[#6b6560] mt-0.5 line-clamp-1">{item.desc}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 ${item.avail ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"}`}>
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${item.avail ? "bg-emerald-500" : "bg-gray-400"}`} />
                        {item.avail ? "Available" : "Unavailable"}
                      </span>
                      <span className="text-[10px] bg-[#8b6914]/10 text-[#8b6914] px-2 py-0.5 rounded-full font-medium">Edit</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="bg-[#faf8f5] border-t border-[#2c2a26]/8 px-5 py-2.5 flex items-center justify-between">
              <span className="text-xs text-[#6b6560]">3 items in Mains</span>
              <span className="text-xs text-emerald-600 font-medium">All changes saved ✓</span>
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

      {/* ── HOW IT WORKS ──────────────────────────────────────────────────────── */}
      <section id="how-it-works" className="bg-white py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
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

      {/* ── THEMES ────────────────────────────────────────────────────────────── */}
      <section className="bg-[#2c2a26] py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div {...enter()}>
            <p className="text-xs font-semibold tracking-widest text-[#c9a030] uppercase mb-3">FULLY CUSTOMIZABLE</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#faf8f5]">Make it yours</h2>
            <p className="text-[#faf8f5]/70 max-w-lg mx-auto mt-4">
              Your menu should look like your restaurant, not a template. Choose any colors, fonts, and upload your own photos.
            </p>
          </motion.div>

          <div className="flex flex-col items-center sm:flex-row sm:justify-center sm:items-start gap-6 mt-14" style={{ perspective: 1200 }}>
            {/* The Edison — Night Bar */}
            <motion.div {...(rm ? {} : { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5 } })}>
              <motion.div
                className="rounded-2xl overflow-hidden shadow-xl flex-shrink-0 w-full sm:w-72"
                style={{ background: "#0d0f14", transformStyle: 'preserve-3d', border: "1px solid rgba(0,180,216,0.2)" }}
                animate={rm ? {} : { y: [0, -6, 0] }}
                transition={rm ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                whileHover={rm ? {} : { y: -8, rotateY: 4, scale: 1.03, z: 20 }}
              >
                <div className="h-36 relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=400&q=75" alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(13,15,20,0.9) 0%, rgba(13,15,20,0.3) 60%, transparent 100%)" }} />
                  <p className="absolute bottom-3 left-4 text-white text-sm font-semibold drop-shadow">The Edison</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex gap-1">
                    <span className="text-[11px] font-semibold rounded-lg px-2.5 py-0.5" style={{ background: "#00b4d8", color: "#ffffff" }}>Cocktails</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "#161923", border: "1px solid rgba(0,180,216,0.12)" }}>
                    <p className="text-[12px] font-medium" style={{ color: "#e8f4f8" }}>Negroni Sbagliato</p>
                    <p className="text-[12px] font-bold" style={{ color: "#00b4d8" }}>$16</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Maison Lavande — Provençal Garden */}
            <motion.div {...(rm ? {} : { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.1 } })}>
              <motion.div
                className="rounded-2xl overflow-hidden shadow-xl flex-shrink-0 w-full sm:w-72"
                style={{ background: "#f5f0eb", transformStyle: 'preserve-3d', border: "1px solid rgba(124,79,138,0.2)" }}
                animate={rm ? {} : { y: [0, -6, 0] }}
                transition={rm ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
                whileHover={rm ? {} : { y: -8, scale: 1.03, z: 20 }}
              >
                <div className="h-36 relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&q=75" alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(45,32,53,0.75) 0%, rgba(45,32,53,0.2) 60%, transparent 100%)" }} />
                  <p className="absolute bottom-3 left-4 text-white text-sm font-semibold drop-shadow">Maison Lavande</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex gap-1">
                    <span className="text-[11px] font-semibold rounded-lg px-2.5 py-0.5" style={{ background: "#7c4f8a", color: "#ffffff" }}>Entrées</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "#fdfaf6", border: "1px solid rgba(124,79,138,0.12)" }}>
                    <p className="text-[12px] font-medium" style={{ color: "#2d2035" }}>Bouillabaisse</p>
                    <p className="text-[12px] font-bold" style={{ color: "#7c4f8a" }}>$32</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Kura — Izakaya */}
            <motion.div {...(rm ? {} : { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { duration: 0.5, delay: 0.2 } })}>
              <motion.div
                className="rounded-2xl overflow-hidden shadow-xl flex-shrink-0 w-full sm:w-72"
                style={{ background: "#fafafa", transformStyle: 'preserve-3d', border: "1px solid rgba(192,57,43,0.2)" }}
                animate={rm ? {} : { y: [0, -6, 0] }}
                transition={rm ? {} : { duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.6 }}
                whileHover={rm ? {} : { y: -8, rotateY: -4, scale: 1.03, z: 20 }}
              >
                <div className="h-36 relative overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=400&q=75" alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(26,26,26,0.8) 0%, rgba(26,26,26,0.25) 60%, transparent 100%)" }} />
                  <p className="absolute bottom-3 left-4 text-white text-sm font-semibold drop-shadow">Kura</p>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex gap-1">
                    <span className="text-[11px] font-semibold rounded-lg px-2.5 py-0.5" style={{ background: "#c0392b", color: "#ffffff" }}>Yakitori</span>
                  </div>
                  <div className="flex items-center justify-between rounded-lg px-3 py-2.5" style={{ background: "#ffffff", border: "1px solid rgba(192,57,43,0.12)" }}>
                    <p className="text-[12px] font-medium" style={{ color: "#1a1a1a" }}>Chicken Thigh ×3</p>
                    <p className="text-[12px] font-bold" style={{ color: "#c0392b" }}>$14</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          <p className="text-[#faf8f5]/60 text-sm text-center mt-8">
            Moody bar · French garden · Japanese minimal — your menu, your personality
          </p>
        </div>
      </section>

      {/* ── SECTION DIVIDER: dark → cream ─────────────────────────────────────── */}
      <SectionDivider from="#2c2a26" to="#faf8f5" />

      {/* ── PRICING ───────────────────────────────────────────────────────────── */}
      <section id="pricing" className="bg-[#faf8f5] pt-8 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <motion.div {...enter()}>
            <p className="text-xs font-semibold tracking-widest text-[#8b6914] uppercase mb-3">PRICING</p>
            <h2 style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#2c2a26]">Simple, honest pricing</h2>
            <p className="text-lg text-[#6b6560] max-w-md mx-auto mt-4">One plan. Everything included. No hidden fees, no commissions on orders.</p>
            <motion.div className="h-0.5 bg-[#8b6914] mt-4 mx-auto origin-left" style={{ width: 80 }} {...underline()} />
          </motion.div>

          <div className="max-w-sm mx-auto mt-14">
            {/* Banner with shine animation */}
            <motion.div
              className="pricing-banner-shine rounded-2xl px-6 py-4 text-center mb-6 shadow-md"
              {...enter(0.05)}
            >
              <p className="text-base font-bold text-white">🎉 <span className="underline underline-offset-2">60-day free trial</span> — no credit card required</p>
              <p className="text-xs text-white/80 mt-1">Start today, pay nothing for 60 days</p>
            </motion.div>

            {/* Pricing card */}
            <motion.div
              className="relative bg-[#2c2a26] rounded-3xl border-2 border-[#8b6914]/50 p-8 text-left"
              {...enter(0.1)}
              whileHover={rm ? {} : {
                rotateY: 3,
                y: -4,
                boxShadow: '0 24px 60px -10px rgba(139,105,20,0.25)',
                transition: { duration: 0.3 }
              }}
              style={{ transformPerspective: 800, transformStyle: 'preserve-3d' }}
            >
              {/* Most popular badge */}
              <div className="absolute -top-3 right-6 bg-[#c9a030] text-[#2c2a26] text-xs font-bold px-3 py-1 rounded-full shadow-md">
                ← Most popular
              </div>

              {/* Customer avatars */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex -space-x-2">
                  <div className="w-8 h-8 rounded-full bg-[#8b6914] border-2 border-[#2c2a26] flex items-center justify-center text-xs text-white font-semibold flex-shrink-0">M</div>
                  <div className="w-8 h-8 rounded-full bg-[#c9a030] border-2 border-[#2c2a26] flex items-center justify-center text-xs text-white font-semibold flex-shrink-0">R</div>
                  <div className="w-8 h-8 rounded-full bg-[#6b6560] border-2 border-[#2c2a26] flex items-center justify-center text-xs text-white font-semibold flex-shrink-0">A</div>
                </div>
                <p className="text-xs text-[#faf8f5]/50">Join restaurant owners already using DineLinks</p>
              </div>

              <span className="inline-flex rounded-full bg-[#8b6914]/20 text-[#c9a030] text-xs font-semibold px-3 py-1">DineLinks</span>
              <p style={{ fontFamily: "Georgia, serif" }} className="text-5xl font-semibold text-[#faf8f5] mt-4">$25</p>
              <p className="text-sm text-[#faf8f5]/60">/ month</p>
              <p className="text-sm text-[#faf8f5]/60 mt-2">Everything you need to go digital</p>
              <hr className="my-6 border-[#faf8f5]/10" />
              <ul className="space-y-3 text-sm text-[#faf8f5]/80">
                {["1 digital menu","Unlimited menu items","10 languages with auto-translation","4 QR code styles — downloadable PNG","10 curated theme presets + color picker","Dietary labels & filters","Item availability toggle","Drag-to-reorder items & categories","Live analytics dashboard","Upload logo & photos"].map((f) => (
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
              <p className="mt-3 text-[#faf8f5]/50 text-xs text-center">No credit card required · 60-day free trial · Cancel anytime</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── TRUST METRICS BAR ─────────────────────────────────────────────────── */}
      <section className="bg-[#2c2a26] py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { display: "30", suffix: " sec", label: "Average customer scan time", isNum: true, target: 30 },
              { display: "$0",  suffix: "",     label: "Reprint costs forever",       isNum: false, target: 0  },
              { display: "10", suffix: "",      label: "Languages supported",          isNum: true, target: 10 },
              { display: "24/7", suffix: "",    label: "Menu editing, anytime",        isNum: false, target: 0 },
            ].map(({ display, suffix, label, isNum, target }, i) => (
              <motion.div
                key={label}
                {...(rm ? {} : {
                  initial: { opacity: 0, y: 20 },
                  whileInView: { opacity: 1, y: 0 },
                  viewport: { once: true },
                  transition: { duration: 0.5, delay: i * 0.12 },
                })}
              >
                <p style={{ fontFamily: "Georgia, serif" }} className="text-4xl font-semibold text-[#c9a030]">
                  {isNum ? <CountUp to={target} suffix={suffix} /> : display}
                </p>
                <p className="text-sm text-[#faf8f5]/55 mt-1">{label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION DIVIDER: dark → gold ──────────────────────────────────────── */}
      <SectionDivider from="#2c2a26" to="#8b6914" />

      {/* ── FINAL CTA ─────────────────────────────────────────────────────────── */}
      <section className="bg-[#8b6914] pt-6 pb-28 text-center">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
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
          <p className="text-2xl font-semibold text-white max-w-md mx-auto mt-5">60-day free trial — no credit card required.</p>
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
          <p className="mt-6 text-white/60 text-sm">No setup fee · Cancel anytime · Live in 30 minutes</p>
        </div>
      </section>

      {/* ── SECTION DIVIDER: gold → dark ──────────────────────────────────────── */}
      <SectionDivider from="#8b6914" to="#2c2a26" />

      {/* ── FOOTER ────────────────────────────────────────────────────────────── */}
      <footer className="bg-[#2c2a26] pt-12 pb-10">
        {/* Animated gold top line */}
        {!rm && (
          <motion.div
            className="h-px w-full mb-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, #8b6914 20%, #c9a030 50%, #8b6914 80%, transparent 100%)',
              backgroundSize: '200% 100%',
            }}
            animate={{ backgroundPosition: ['0% center', '200% center'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          />
        )}

        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10">
          {/* Top row: logo + newsletter */}
          <div className="flex flex-col lg:flex-row items-start justify-between gap-10 pb-10 border-b border-[#faf8f5]/10">
            {/* Logo + tagline */}
            <div>
              <div className="flex items-center gap-2.5 mb-3">
                <DLLogoDark width={36} height={33} />
                <span className="text-2xl select-none" style={{ fontFamily: "Georgia, serif", fontWeight: 700 }}>
                  <motion.span
                    style={{ backgroundImage: 'linear-gradient(90deg, #faf8f5, #c9a030, #faf8f5)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', display: 'inline-block' }}
                    animate={rm ? {} : { backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    transition={rm ? {} : { duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    DineLinks
                  </motion.span>
                </span>
              </div>
              <p className="text-sm text-[#faf8f5]/50 max-w-xs">Beautiful QR menus in 10 languages. Update in seconds, no reprinting.</p>
            </div>

            {/* Newsletter */}
            <div className="w-full lg:w-auto lg:min-w-[320px]">
              <p className="text-sm font-semibold text-[#faf8f5] mb-1">Get tips for restaurant operators</p>
              <p className="text-xs text-[#faf8f5]/50 mb-3">Occasional advice on digital menus, hospitality ops, and growing your restaurant.</p>
              {newsletterDone ? (
                <motion.p
                  className="text-sm text-green-400 font-medium"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                >
                  You&apos;re in! ✓
                </motion.p>
              ) : (
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!newsletterEmail.trim()) return;
                    setNewsletterLoading(true);
                    setNewsletterError('');
                    try {
                      const res = await fetch('/api/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: newsletterEmail.trim() }),
                      });
                      if (res.ok) {
                        setNewsletterDone(true);
                      } else {
                        setNewsletterError('Something went wrong');
                      }
                    } catch {
                      setNewsletterError('Something went wrong');
                    } finally {
                      setNewsletterLoading(false);
                    }
                  }}
                  className="flex flex-col gap-2"
                >
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newsletterEmail}
                      onChange={(e) => setNewsletterEmail(e.target.value)}
                      placeholder="your@email.com"
                      required
                      className="flex-1 rounded-xl bg-[#faf8f5]/10 border border-[#faf8f5]/15 text-[#faf8f5] placeholder:text-[#faf8f5]/30 text-sm px-4 py-2.5 focus:outline-none focus:border-[#8b6914] transition-colors"
                    />
                    <motion.button
                      type="submit"
                      disabled={newsletterLoading}
                      className="bg-[#8b6914] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex-shrink-0 disabled:opacity-60"
                      whileHover={rm ? {} : { scale: 1.02 }}
                      whileTap={rm ? {} : { scale: 0.97 }}
                    >
                      {newsletterLoading ? 'Subscribing...' : 'Subscribe'}
                    </motion.button>
                  </div>
                  {newsletterError && (
                    <p className="text-sm text-red-400">{newsletterError}</p>
                  )}
                </form>
              )}
            </div>
          </div>

          {/* Middle row: nav + social */}
          <div className="flex flex-col sm:flex-row items-start justify-between gap-6 py-8 border-b border-[#faf8f5]/10">
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#faf8f5]/50">
              <button type="button" onClick={() => scrollTo("features")} className="hover:text-[#faf8f5]/80 transition-colors">Features</button>
              <button type="button" onClick={() => scrollTo("how-it-works")} className="hover:text-[#faf8f5]/80 transition-colors">How it works</button>
              <button type="button" onClick={() => scrollTo("pricing")} className="hover:text-[#faf8f5]/80 transition-colors">Pricing</button>
              <Link href="/contact" className="hover:text-[#faf8f5]/80 transition-colors">Contact</Link>
              <Link href="/privacy" className="hover:text-[#faf8f5]/80 transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-[#faf8f5]/80 transition-colors">Terms of Service</Link>
              <Link href="/login" className="hover:text-[#faf8f5]/80 transition-colors">Sign in</Link>
            </div>

            {/* Social icons */}
            <div className="flex items-center gap-3">
              {[
                { label: "Instagram", href: "#", icon: (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                )},
                { label: "Twitter/X", href: "#", icon: (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                )},
                { label: "LinkedIn", href: "#", icon: (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                )},
              ].map((s) => (
                <motion.a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="w-9 h-9 rounded-xl bg-[#faf8f5]/8 border border-[#faf8f5]/10 flex items-center justify-center text-[#faf8f5]/50 hover:text-[#c9a030] hover:border-[#c9a030]/30 transition-colors"
                  whileHover={rm ? {} : { scale: 1.1, y: -2 }}
                  whileTap={rm ? {} : { scale: 0.95 }}
                >
                  {s.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Bottom row */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p className="text-xs text-[#faf8f5]/30">© 2025 DineLinks. All rights reserved.</p>
            <p className="text-xs text-[#faf8f5]/20">Built for the world&apos;s best restaurants.</p>
          </div>
        </div>
      </footer>
    </>
  );
}
