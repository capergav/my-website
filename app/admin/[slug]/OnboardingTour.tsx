"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const TOUR_KEY = "dinelinks_tour_v2_done";

type Step = {
  id: string;
  title: string;
  body: string;
  target?: string;
  placement?: "bottom-left" | "bottom-right" | "below-center" | "left";
};

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to DineLinks 👋",
    body: "Let's take a quick tour so you can get your restaurant's digital menu live fast. You can skip at any time.",
  },
  {
    id: "theme",
    title: "Theme & Branding",
    body: "Click here to customise your restaurant name, hero photo, colours, and font. Changes apply instantly.",
    target: "tour-theme",
    placement: "bottom-left",
  },
  {
    id: "view-menu",
    title: "View Your Public Menu",
    body: "Opens the live menu your customers see. Share the link via your website, Instagram bio, or a printed QR code.",
    target: "tour-view-menu",
    placement: "bottom-left",
  },
  {
    id: "add-item",
    title: "Add Your First Item",
    body: "Click here to add a dish. Upload a photo, set the price, dietary flags, and availability.",
    target: "tour-add-item",
    placement: "left",
  },
  {
    id: "done",
    title: "You're all set! 🎉",
    body: "Start by adding your first dish. Categories appear automatically. Reopen this tour anytime with the '?' button in the header.",
  },
];

type Rect = { top: number; left: number; width: number; height: number };
type TipPos = { x: number; y: number; centered: boolean };

function measure(id: string): Rect | null {
  if (typeof window === "undefined") return null;
  const el = document.querySelector(`[data-tour="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const GAP = 12;
const TIP_W = 320;

function calcTipPos(rect: Rect | null, placement?: Step["placement"]): TipPos {
  if (!rect || !placement) {
    const W = typeof window !== "undefined" ? window.innerWidth : 800;
    const H = typeof window !== "undefined" ? window.innerHeight : 600;
    return { x: W / 2 - TIP_W / 2, y: H / 2 - 100, centered: true };
  }
  const W = typeof window !== "undefined" ? window.innerWidth : 800;
  switch (placement) {
    case "bottom-left":
      return { x: Math.min(rect.left, W - TIP_W - 16), y: rect.top + rect.height + GAP, centered: false };
    case "bottom-right":
      return { x: Math.max(16, rect.left + rect.width - TIP_W), y: rect.top + rect.height + GAP, centered: false };
    case "left":
      return { x: Math.max(16, rect.left - TIP_W - GAP), y: Math.max(16, rect.top), centered: false };
    case "below-center":
      return { x: Math.max(16, rect.left + rect.width / 2 - TIP_W / 2), y: rect.top + rect.height + GAP, centered: false };
    default: {
      const W2 = typeof window !== "undefined" ? window.innerWidth : 800;
      const H2 = typeof window !== "undefined" ? window.innerHeight : 600;
      return { x: W2 / 2 - TIP_W / 2, y: H2 / 2 - 100, centered: true };
    }
  }
}

export function OnboardingTour({ tourKey }: { tourKey: number }) {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect]       = useState<Rect | null>(null);
  const [tipPos, setTipPos]   = useState<TipPos>({ x: 0, y: 0, centered: true });
  const rafRef                = useRef<number | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setVisible(true);
  }, []);

  useEffect(() => {
    if (tourKey > 0) { setStep(0); setVisible(true); }
  }, [tourKey]);

  const current = STEPS[step];

  const updatePosition = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const r = current.target ? measure(current.target) : null;
      setRect(r);
      setTipPos(calcTipPos(r, current.placement));
      rafRef.current = null;
    });
  }, [current.target, current.placement]);

  useEffect(() => {
    const t = setTimeout(updatePosition, 80);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [updatePosition]);

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "1");
    setVisible(false);
  }, []);

  const next = () => step < STEPS.length - 1 ? setStep((s) => s + 1) : finish();
  const back = () => step > 0 && setStep((s) => s - 1);

  if (!visible) return null;

  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;

  return (
    <>
      <div className="fixed inset-0 z-[100] pointer-events-none" />
      {rect && (
        <div
          className="fixed z-[101] pointer-events-none"
          style={{
            willChange: "transform",
            transform: `translate3d(${rect.left - 5}px, ${rect.top - 5}px, 0)`,
            width: rect.width + 10,
            height: rect.height + 10,
            borderRadius: 14,
            boxShadow: "0 0 0 4px #8b6914, 0 0 0 9999px rgba(0,0,0,0.55)",
            transition: "transform 200ms ease-out",
          }}
        />
      )}
      <div
        key={step}
        className="fixed z-[102] w-80 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5"
        style={{
          willChange: "transform, opacity",
          transform: `translate3d(${tipPos.x}px, ${tipPos.y}px, 0)`,
          top: 0,
          left: 0,
          transition: "transform 200ms ease-out, opacity 150ms ease-out",
          animation: "modalIn 0.15s ease-out",
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-serif text-[17px] font-semibold text-gray-900 leading-snug">{current.title}</h3>
          <button type="button" onClick={finish} aria-label="Skip tour" className="shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5">✕</button>
        </div>
        <p className="text-sm text-gray-500 leading-relaxed mb-4">{current.body}</p>
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
