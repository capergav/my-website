"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const TOUR_KEY = "dinelinks_tour_v3_done";

type Placement = "top" | "bottom" | "left" | "right";

type Step = {
  id: string;
  selector: string | null;
  mobileSelector?: string | null;
  requiresMobileSheet?: boolean;
  title: string;
  description: string;
  placement: Placement;
};

const STEPS: Step[] = [
  {
    id: "welcome",
    selector: null,
    title: "Welcome to DineLinks!",
    description: "Let's take a quick tour of your dashboard. You can skip at any time and replay it from Settings.",
    placement: "bottom",
  },
  {
    id: "menu",
    selector: "[data-tour='menu-area']",
    title: "Your menu",
    description: "This is where all your categories and items live. Drag to reorder, click to edit.",
    placement: "top",
  },
  {
    id: "add-item",
    selector: "[data-tour='add-item']",
    title: "Add your first item",
    description: "Click here to add dishes to your menu. Upload a photo, set the price, dietary flags, and availability.",
    placement: "left",
  },
  {
    id: "categories",
    selector: "[data-tour='add-category']",
    title: "Categories",
    description: "Group your items into categories like Appetizers, Mains, Desserts — drag tabs to reorder them.",
    placement: "bottom",
  },
  {
    id: "availability",
    selector: "[data-tour='availability-toggle']",
    title: "Item availability",
    description: "Toggle items on or off instantly — great for 86'd dishes or daily specials. Changes go live immediately.",
    placement: "right",
  },
  {
    id: "theme",
    selector: "[data-tour='theme-btn-desktop']",
    mobileSelector: "[data-tour='theme-btn-mobile']",
    requiresMobileSheet: true,
    title: "Theme & Branding",
    description: "Customize your menu's colors, fonts, and logo to match your restaurant's vibe.",
    placement: "bottom",
  },
  {
    id: "qr",
    selector: "[data-tour='qr-btn']",
    title: "QR Codes",
    description: "Generate printable QR codes for your tables — customers scan and see your menu instantly.",
    placement: "bottom",
  },
  {
    id: "view-menu",
    selector: "[data-tour='view-menu-desktop']",
    mobileSelector: "[data-tour='view-menu-mobile']",
    requiresMobileSheet: true,
    title: "Live preview",
    description: "See exactly what your customers see. Changes appear instantly — no refresh needed.",
    placement: "bottom",
  },
  {
    id: "share",
    selector: null,
    title: "Share your menu",
    description: "Copy your menu link or download QR codes to put on tables, windows, and business cards.",
    placement: "bottom",
  },
  {
    id: "settings",
    selector: "[data-tour='settings-btn']",
    mobileSelector: "[data-tour='settings-btn-mobile']",
    requiresMobileSheet: true,
    title: "Settings",
    description: "Manage your restaurant info, hours, and account here. You can also replay this tour anytime.",
    placement: "bottom",
  },
  {
    id: "done",
    selector: null,
    title: "You're all set! 🎉",
    description: "That's the tour! You can replay it anytime from Settings → Help, or by clicking the ? button.",
    placement: "bottom",
  },
];

const TIP_W = 320;
const GAP = 12;

type Spot = {
  x: number;
  y: number;
  w: number;
  h: number;
  has: boolean;
};

function noSpot(): Spot {
  return { x: 0, y: 0, w: 0, h: 0, has: false };
}

function spotFor(el: Element): Spot {
  const r = el.getBoundingClientRect();
  return { x: r.left, y: r.top, w: r.width, h: r.height, has: true };
}

type DesktopPos = { x: number; y: number };

function calcDesktopPos(el: Element, placement: Placement, spot: Spot): DesktopPos {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const tipH = 200;
  let x = 0, y = 0;

  switch (placement) {
    case "bottom":
      x = Math.max(8, Math.min(spot.x, W - TIP_W - 8));
      y = Math.min(spot.y + spot.h + GAP, H - tipH - 8);
      break;
    case "top":
      x = Math.max(8, Math.min(spot.x, W - TIP_W - 8));
      y = Math.max(8, spot.y - tipH - GAP);
      break;
    case "left":
      x = Math.max(8, spot.x - TIP_W - GAP);
      y = Math.max(8, Math.min(spot.y, H - tipH - 8));
      break;
    case "right":
      x = Math.min(spot.x + spot.w + GAP, W - TIP_W - 8);
      y = Math.max(8, Math.min(spot.y, H - tipH - 8));
      break;
  }
  return { x, y };
}

export function OnboardingTour({ tourKey }: { tourKey: number }) {
  const [step, setStep]         = useState(0);
  const [visible, setVisible]   = useState(false);
  const [isReady, setIsReady]   = useState(false);
  const [spot, setSpot]         = useState<Spot>(noSpot);
  const [deskPos, setDeskPos]   = useState<DesktopPos>({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const retryRef                = useRef(0);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setVisible(true);
  }, []);

  // Lock body scroll while tour is active
  useEffect(() => {
    if (visible) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = prev; };
    }
  }, [visible]);

  useEffect(() => {
    if (tourKey > 0) { setStep(0); setVisible(true); }
  }, [tourKey]);

  const current = STEPS[step];

  const calculate = useCallback(async () => {
    const mobile = window.innerWidth < 768;
    const selector = mobile && current.mobileSelector
      ? current.mobileSelector
      : current.selector;

    if (!selector) {
      setSpot(noSpot());
      setDeskPos({ x: window.innerWidth / 2 - TIP_W / 2, y: window.innerHeight / 2 - 110 });
      requestAnimationFrame(() => setIsReady(true));
      return;
    }

    const el = document.querySelector(selector);
    if (!el) {
      if (retryRef.current < 5) {
        retryRef.current++;
        setTimeout(calculate, 100);
      } else {
        setSpot(noSpot());
        setDeskPos({ x: window.innerWidth / 2 - TIP_W / 2, y: window.innerHeight / 2 - 110 });
        requestAnimationFrame(() => setIsReady(true));
      }
      return;
    }

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    await new Promise<void>((r) => setTimeout(r, 350));

    requestAnimationFrame(() => {
      const s = spotFor(el);
      setSpot(s);
      if (!mobile) {
        setDeskPos(calcDesktopPos(el, current.placement, s));
      }
      requestAnimationFrame(() => setIsReady(true));
    });
  }, [current]);

  useEffect(() => {
    if (!visible) return;
    retryRef.current = 0;
    setIsReady(false);

    const mobile = window.innerWidth < 768;

    if (mobile && current.requiresMobileSheet) {
      const hamburger = document.querySelector<HTMLButtonElement>("[data-tour='hamburger']");
      const sheetOpen = document.body.dataset.mobileSheetOpen === "true";
      if (hamburger && !sheetOpen) {
        hamburger.click();
        setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(calculate)), 250);
        return;
      }
    } else if (mobile && !current.requiresMobileSheet) {
      const sheetOpen = document.body.dataset.mobileSheetOpen === "true";
      if (sheetOpen) {
        document.body.dataset.mobileSheetOpen = "false";
        const closeBtn = document.querySelector<HTMLButtonElement>("[data-tour='sheet-close']");
        if (closeBtn) closeBtn.click();
        setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(calculate)), 300);
        return;
      }
    }

    requestAnimationFrame(() => requestAnimationFrame(calculate));
  }, [step, visible, calculate, current.requiresMobileSheet]);

  // Resize / scroll → recalculate (debounced)
  useEffect(() => {
    if (!visible) return;
    const handler = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setIsReady(false);
        requestAnimationFrame(() => requestAnimationFrame(calculate));
      }, 100);
    };
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [visible, calculate]);

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "1");
    setVisible(false);
  }, []);

  const next = useCallback(() => step < STEPS.length - 1 ? setStep(s => s + 1) : finish(), [step, finish]);
  const back = useCallback(() => step > 0 && setStep(s => s - 1), [step]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') finish();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') back();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible, finish, next, back]);

  if (!visible) return null;

  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;
  const total   = STEPS.length;

  const spotCx = spot.x + spot.w / 2;
  const spotCy = spot.y + spot.h / 2;
  const radius  = Math.max(spot.w, spot.h) / 2 + 4;

  const tooltipContent = (
    <>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-[#2c2a26]/50 mb-2">
        Step {step + 1} of {total}
      </p>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-serif text-lg font-semibold text-[#2c2a26] leading-snug mb-0">{current.title}</h3>
        <button type="button" onClick={finish} aria-label="Skip tour" className="shrink-0 flex items-center justify-center w-11 h-11 -mr-2 -mt-1 text-[#2c2a26]/40 hover:text-[#2c2a26]/70 text-xl transition-colors rounded-lg">✕</button>
      </div>
      <p className="text-base text-[#2c2a26]/65 leading-relaxed mt-2">{current.description}</p>
      <div className="flex items-center justify-between mt-4 gap-3">
        <div className="flex gap-1 items-center">
          {STEPS.map((_, i) => (
            <span key={i} className="inline-block rounded-full transition-all duration-200"
              style={{ width: i === step ? 18 : 6, height: 6, background: i === step ? "#8b6914" : "#e5e7eb" }} />
          ))}
        </div>
        <div className="flex gap-3">
          {isFirst ? (
            <button type="button" onClick={finish} className="h-11 px-3 text-sm font-medium text-[#2c2a26]/50 hover:text-[#2c2a26]/80 rounded-lg transition-colors">Skip tour</button>
          ) : (
            <button type="button" onClick={back} className="h-11 px-3 text-sm font-medium border border-gray-200 text-[#2c2a26]/70 hover:bg-gray-50 rounded-lg transition-colors">Back</button>
          )}
          <button type="button" onClick={next} className="h-11 px-5 text-sm font-medium bg-[#8b6914] text-white rounded-lg hover:opacity-90 transition-opacity">
            {isLast ? "Got it!" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Spotlight overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9998,
          background: "rgba(0,0,0,0.6)",
          WebkitMaskImage: spot.has
            ? `radial-gradient(circle at ${spotCx}px ${spotCy}px, transparent ${radius + 8}px, black ${radius + 12}px)`
            : "none",
          maskImage: spot.has
            ? `radial-gradient(circle at ${spotCx}px ${spotCy}px, transparent ${radius + 8}px, black ${radius + 12}px)`
            : "none",
        }}
      />

      {/* Desktop tooltip — positioned near spotlight */}
      {!isMobile && (
        <div
          className="fixed bg-white rounded-2xl border border-gray-100 p-6"
          style={{
            zIndex: 10000,
            top: 0,
            left: 0,
            minWidth: 320,
            maxWidth: 400,
            width: "min(400px, calc(100vw - 32px))",
            willChange: "transform, opacity",
            transform: `translate3d(${deskPos.x}px, ${deskPos.y}px, 0)`,
            opacity: isReady ? 1 : 0,
            transition: `opacity 200ms ease-out, transform 200ms ease-out`,
            boxShadow: "0 25px 60px -12px rgba(139,105,20,0.18), 0 8px 24px -4px rgba(0,0,0,0.12)",
            color: "#2c2a26",
          }}
        >
          {tooltipContent}
        </div>
      )}

      {/* Mobile bottom sheet — fixed, never moves */}
      {isMobile && (
        <div
          className="fixed bottom-0 left-0 right-0 bg-white rounded-t-2xl p-6"
          style={{
            zIndex: 10000,
            opacity: isReady ? 1 : 0,
            transition: 'opacity 200ms ease-out',
            boxShadow: "0 -8px 40px -4px rgba(0,0,0,0.18)",
            color: "#2c2a26",
          }}
        >
          {tooltipContent}
        </div>
      )}
    </>
  );
}
