"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const TOUR_KEY = "dinelinks_tour_v2_done";

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
    title: "Welcome to DineLinks 👋",
    description: "Let's take a quick tour so you can get your restaurant's digital menu live fast. You can skip at any time.",
    placement: "bottom",
  },
  {
    id: "theme",
    selector: "[data-tour='theme-btn-desktop']",
    mobileSelector: "[data-tour='theme-btn-mobile']",
    requiresMobileSheet: true,
    title: "Theme & Branding",
    description: "Click here to customise your restaurant name, hero photo, colours, and font. Changes apply instantly.",
    placement: "bottom",
  },
  {
    id: "view-menu",
    selector: "[data-tour='view-menu-desktop']",
    mobileSelector: "[data-tour='view-menu-mobile']",
    requiresMobileSheet: true,
    title: "View Your Public Menu",
    description: "Opens the live menu your customers see. Share the link via your website, Instagram bio, or a printed QR code.",
    placement: "bottom",
  },
  {
    id: "add-item",
    selector: "[data-tour='add-item']",
    title: "Add Your First Item",
    description: "Click here to add a dish. Upload a photo, set the price, dietary flags, and availability.",
    placement: "left",
  },
  {
    id: "done",
    selector: null,
    title: "You're all set! 🎉",
    description: "Start by adding your first dish. Categories appear automatically. Reopen this tour anytime with the '?' button in the header.",
    placement: "bottom",
  },
];

const TIP_W = 320;
const GAP = 12;

type Pos = {
  x: number;
  y: number;
  spotX: number;
  spotY: number;
  spotW: number;
  spotH: number;
  hasSpt: boolean;
};

function centered(): Pos {
  const W = window.innerWidth;
  const H = window.innerHeight;
  return { x: W / 2 - TIP_W / 2, y: H / 2 - 110, spotX: 0, spotY: 0, spotW: 0, spotH: 0, hasSpt: false };
}

function calcPos(el: Element, placement: Placement): Pos {
  const r = el.getBoundingClientRect();
  const W = window.innerWidth;
  const H = window.innerHeight;
  const spotX = r.left, spotY = r.top, spotW = r.width, spotH = r.height;
  let x = 0, y = 0;

  const tipH = 160;
  switch (placement) {
    case "bottom":
      x = Math.max(8, Math.min(r.left, W - TIP_W - 8));
      y = Math.min(r.bottom + GAP, H - tipH - 8);
      break;
    case "top":
      x = Math.max(8, Math.min(r.left, W - TIP_W - 8));
      y = Math.max(8, r.top - tipH - GAP);
      break;
    case "left":
      x = Math.max(8, r.left - TIP_W - GAP);
      y = Math.max(8, Math.min(r.top, H - tipH - 8));
      break;
    case "right":
      x = Math.min(r.right + GAP, W - TIP_W - 8);
      y = Math.max(8, Math.min(r.top, H - tipH - 8));
      break;
  }
  return { x, y, spotX, spotY, spotW, spotH, hasSpt: true };
}

export function OnboardingTour({ tourKey }: { tourKey: number }) {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [pos, setPos]         = useState<Pos>(centered);
  const retryRef              = useRef(0);
  const debounceRef           = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setVisible(true);
  }, []);

  useEffect(() => {
    if (tourKey > 0) { setStep(0); setVisible(true); }
  }, [tourKey]);

  const current = STEPS[step];

  const calculate = useCallback(() => {
    const isMobile = window.innerWidth < 768;
    const selector = isMobile && current.mobileSelector
      ? current.mobileSelector
      : current.selector;

    if (!selector) {
      setPos(centered());
      requestAnimationFrame(() => setIsReady(true));
      return;
    }

    const el = document.querySelector(selector);
    if (!el) {
      if (retryRef.current < 5) {
        retryRef.current++;
        setTimeout(calculate, 100);
      } else {
        // give up — show centered
        setPos(centered());
        requestAnimationFrame(() => setIsReady(true));
      }
      return;
    }

    setPos(calcPos(el, current.placement));
    requestAnimationFrame(() => setIsReady(true));
  }, [current]);

  useEffect(() => {
    if (!visible) return;
    retryRef.current = 0;
    setIsReady(false);

    const isMobile = window.innerWidth < 768;
    if (isMobile && current.requiresMobileSheet) {
      // Open mobile sheet if not already open
      const hamburger = document.querySelector<HTMLButtonElement>("[data-tour='hamburger']");
      const sheetOpen = document.body.dataset.mobileSheetOpen === "true";
      if (hamburger && !sheetOpen) {
        hamburger.click();
        // Wait for sheet animation
        setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(calculate)), 250);
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

  const next = () => step < STEPS.length - 1 ? setStep(s => s + 1) : finish();
  const back = () => step > 0 && setStep(s => s - 1);

  if (!visible) return null;

  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;

  const spotCx = pos.spotX + pos.spotW / 2;
  const spotCy = pos.spotY + pos.spotH / 2;
  const radius  = Math.max(pos.spotW, pos.spotH) / 2 + 4;

  return (
    <>
      {/* Spotlight overlay */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: 9999,
          background: "rgba(0,0,0,0.6)",
          WebkitMaskImage: pos.hasSpt
            ? `radial-gradient(circle at ${spotCx}px ${spotCy}px, transparent ${radius + 8}px, black ${radius + 12}px)`
            : "none",
          maskImage: pos.hasSpt
            ? `radial-gradient(circle at ${spotCx}px ${spotCy}px, transparent ${radius + 8}px, black ${radius + 12}px)`
            : "none",
        }}
      />

      {/* Tooltip */}
      <div
        className="fixed w-80 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5"
        style={{
          zIndex: 10000,
          top: 0,
          left: 0,
          willChange: "transform, opacity",
          transform: `translate3d(${pos.x}px, ${pos.y}px, 0)`,
          opacity: isReady ? 1 : 0,
          transition: `opacity 150ms ease-out, transform 250ms ease-out`,
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-serif text-[17px] font-semibold text-gray-900 leading-snug">{current.title}</h3>
          <button type="button" onClick={finish} aria-label="Skip tour" className="shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5">✕</button>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">{current.description}</p>
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5 items-center">
            {STEPS.map((_, i) => (
              <span key={i} className="inline-block rounded-full transition-all duration-200"
                style={{ width: i === step ? 18 : 6, height: 6, background: i === step ? "#8b6914" : "#e5e7eb" }} />
            ))}
          </div>
          <div className="flex gap-2">
            {isFirst ? (
              <button type="button" onClick={finish} className="px-3 py-1.5 text-sm font-medium text-gray-500 hover:text-gray-700 rounded-lg">Skip</button>
            ) : (
              <button type="button" onClick={back} className="px-3 py-1.5 text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg">Back</button>
            )}
            <button type="button" onClick={next} className="px-4 py-1.5 text-sm font-medium bg-[#8b6914] text-white rounded-lg hover:opacity-90">
              {isLast ? "Done" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
