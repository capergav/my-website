"use client";

import { useState, useEffect, useCallback } from "react";

const TOUR_KEY = "menusnap_tour_v1_done";

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
    body: "Let's take a quick 30-second tour so you can get your restaurant's digital menu live as fast as possible. You can skip at any time.",
  },
  {
    id: "theme",
    title: "Theme & Branding",
    body: "Tap here to customise your restaurant's colors, fonts, name, and hero photo. Every change is reflected instantly on your public menu page.",
    target: "tour-theme",
    placement: "bottom-left",
  },
  {
    id: "view-menu",
    title: "View Your Public Menu",
    body: "This opens the live menu your customers see. Copy the link and share it via your website, Instagram bio, or a printed QR code.",
    target: "tour-view-menu",
    placement: "bottom-left",
  },
  {
    id: "signout",
    title: "Sign Out",
    body: "When you're done managing your menu, sign out here to keep your account secure.",
    target: "tour-signout",
    placement: "bottom-left",
  },
  {
    id: "add-item",
    title: "Add Your First Item",
    body: "Tap this button to add a dish. Set the name, price, description, photo URL, dietary flags (gluten-free, vegan, spicy…), and whether it's currently available.",
    target: "tour-add-item",
    placement: "left",
  },
  {
    id: "done",
    title: "You're all set! 🎉",
    body: "Start by clicking '+ Add item' to add your first dish. Categories appear automatically as you add items. You can reopen this tour anytime with the '?' button.",
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

function tipPosition(rect: Rect | null, placement?: Step["placement"]): React.CSSProperties {
  if (!rect || !placement) return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  const W = window.innerWidth;
  switch (placement) {
    case "bottom-left":
      return { top: rect.top + rect.height + GAP, left: Math.min(rect.left, W - 336), transform: "none" };
    case "bottom-right":
      return { top: rect.top + rect.height + GAP, right: W - rect.left - rect.width, transform: "none" };
    case "left":
      return { top: Math.max(16, rect.top), right: W - rect.left + GAP, transform: "none" };
    case "below-center":
      return { top: rect.top + rect.height + GAP, left: Math.max(16, rect.left + rect.width / 2 - 160), transform: "none" };
    default:
      return { top: "50%", left: "50%", transform: "translate(-50%,-50%)" };
  }
}

export function OnboardingTour({ tourKey }: { tourKey: number }) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    if (!localStorage.getItem(TOUR_KEY)) setVisible(true);
  }, [tourKey]);

  // Re-show when tourKey increments (restart)
  useEffect(() => {
    if (tourKey > 0) {
      setStep(0);
      setVisible(true);
    }
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
  const isFirst = step === 0;
  const isLast = step === STEPS.length - 1;

  return (
    <>
      {/* Scrim */}
      <div className="fixed inset-0 z-[100] pointer-events-none bg-black/50" />

      {/* Spotlight ring */}
      {rect && (
        <div
          className="fixed z-[101] pointer-events-none transition-all duration-200"
          style={{
            top: rect.top - 5,
            left: rect.left - 5,
            width: rect.width + 10,
            height: rect.height + 10,
            borderRadius: 14,
            boxShadow: "0 0 0 4px #8b6914, 0 0 0 9999px rgba(0,0,0,0.55)",
          }}
        />
      )}

      {/* Tooltip */}
      <div
        className="fixed z-[102] w-80 max-w-[calc(100vw-32px)] bg-white rounded-2xl shadow-2xl border border-gray-100 p-5"
        style={isCentered ? { top: "50%", left: "50%", transform: "translate(-50%,-50%)" } : tipPosition(rect, current.placement)}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-serif text-[17px] font-semibold text-[#2c2a26] leading-snug">{current.title}</h3>
          <button type="button" onClick={finish} aria-label="Skip tour"
            className="shrink-0 text-gray-400 hover:text-gray-600 text-lg leading-none mt-0.5">✕</button>
        </div>

        {/* Body */}
        <p className="text-sm text-[#6b6560] leading-relaxed mb-4">{current.body}</p>

        {/* Footer */}
        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex gap-1.5 items-center">
            {STEPS.map((_, i) => (
              <span key={i} className="inline-block rounded-full transition-all duration-200"
                style={{ width: i === step ? 18 : 6, height: 6, background: i === step ? "#8b6914" : "#ebe6df" }} />
            ))}
          </div>
          {/* Buttons */}
          <div className="flex gap-2">
            {isFirst ? (
              <button type="button" onClick={finish}
                className="px-3 py-1.5 text-sm font-medium text-[#6b6560] hover:text-[#2c2a26] rounded-lg">
                Skip
              </button>
            ) : (
              <button type="button" onClick={back}
                className="px-3 py-1.5 text-sm font-medium border border-[#ebe6df] text-[#6b6560] hover:bg-gray-50 rounded-lg">
                Back
              </button>
            )}
            <button type="button" onClick={next}
              className="px-4 py-1.5 text-sm font-medium bg-[#8b6914] text-white rounded-lg hover:opacity-90">
              {isLast ? "Done" : "Next →"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
