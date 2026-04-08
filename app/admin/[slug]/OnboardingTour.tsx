"use client";

import { useState, useEffect, useCallback } from "react";

const TOUR_KEY = "menusnap_tour_v2_done";

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
    title: "Welcome to MenuSnap 👋",
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

function measure(id: string): Rect | null {
  if (typeof window === "undefined") return null;
  const el = document.querySelector(`[data-tour="${id}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

const GAP = 12;

function tipPos(rect: Rect | null, placement?: Step["placement"]): React.CSSProperties {
  if (!rect || !placement) return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  const W = typeof window !== "undefined" ? window.innerWidth : 800;
  switch (placement) {
    case "bottom-left":  return { top: rect.top + rect.height + GAP, left: Math.min(rect.left, W - 336), transform: "none" };
    case "bottom-right": return { top: rect.top + rect.height + GAP, right: W - rect.left - rect.width, transform: "none" };
    case "left":         return { top: Math.max(16, rect.top), right: W - rect.left + GAP, transform: "none" };
    case "below-center": return { top: rect.top + rect.height + GAP, left: Math.max(16, rect.left + rect.width / 2 - 160), transform: "none" };
    default:             return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  }
}

export function OnboardingTour({ tourKey }: { tourKey: number }) {
  const [step, setStep]       = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect]       = useState<Rect | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setVisible(true);
  }, []);

  useEffect(() => {
    if (tourKey > 0) { setStep(0); setVisible(true); }
  }, [tourKey]);

  const current = STEPS[step];

  const updateRect = useCallback(() => {
    setRect(current.target ? measure(current.target) : null);
  }, [current.target]);

  useEffect(() => {
    const t = setTimeout(updateRect, 80);
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [updateRect]);

  const finish = useCallback(() => {
    localStorage.setItem(TOUR_KEY, "1");
    setVisible(false);
  }, []);

  const next = () => step < STEPS.length - 1 ? setStep((s) => s + 1) : finish();
  const back = () => step > 0 && setStep((s) => s - 1);

  if (!visible) return null;

  const isCentered = !current.target;
  const isFirst    = step === 0;
  const isLast     = step === STEPS.length - 1;

  return (
    <>
      <div className="fixed inset-0 z-[100] pointer-events-none" style={{ background: "rgba(0,0,0,0.55)" }} />
      {rect && (
        <div className="fixed z-[101] pointer-events-none transition-all duration-200" style={{
          top: rect.top - 5, left: rect.left - 5,
          width: rect.width + 10, height: rect.height + 10,
          borderRadius: 14,
          boxShadow: "0 0 0 4px #8b6914, 0 0 0 9999px rgba(0,0,0,0.55)",
        }} />
      )}
      <div
        className="fixed z-[102] w-80 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5"
        style={isCentered ? { top: "50%", left: "50%", transform: "translate(-50%,-50%)" } : tipPos(rect, current.placement)}
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
