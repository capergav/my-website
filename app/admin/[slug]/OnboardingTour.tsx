"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createSupabaseClient } from "@/app/lib/supabase";

type Step = {
  id: string;
  selector: string | null;
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    id: "welcome",
    selector: null,
    title: "Welcome to DineLinks",
    body: "This 60-second tour shows you how to manage your menu. You can replay it anytime from the Menu button in the header.",
  },
  {
    id: "restaurant-name",
    selector: "[data-tour='tour-restaurant-name']",
    title: "Your restaurant name",
    body: "This is what customers see at the top of your menu. Update it in Settings if you need to change it.",
  },
  {
    id: "menu",
    selector: "[data-tour='tour-menu']",
    title: "Admin menu",
    body: "Tap here to open theme settings, view your live menu, manage your account, replay this tour, or sign out.",
  },
  {
    id: "categories",
    selector: "[data-tour='tour-categories']",
    title: "Menu categories",
    body: "Tap a category to view its items. Categories group your menu — like Starters, Mains, or Drinks.",
  },
  {
    id: "add-item",
    selector: "[data-tour='tour-add-item']",
    title: "Add menu items",
    body: "Click '+ Add item' to add a dish to the active category. Include a name, price, description, photo, and dietary tags.",
  },
  {
    id: "done",
    selector: null,
    title: "You're ready",
    body: "Add your real menu items whenever you're ready. Your 60-day free trial is active — no credit card needed to start.",
  },
];

const PAD = 6; // spotlight padding around target (px)

type SpotRect = { top: number; left: number; width: number; height: number };

function getVisibleRect(selector: string): SpotRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null; // hidden via CSS
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function OnboardingTour({
  tourKey,
  hasCompletedTour,
  userId,
}: {
  tourKey: number;
  hasCompletedTour?: boolean;
  userId?: string;
}) {
  const [step, setStep]           = useState(0);
  const [visible, setVisible]     = useState(false);
  const opacity = 1;
  const [spotlight, setSpotlight] = useState<SpotRect | null>(null);

  const tokenRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  useEffect(() => {
    if (hasCompletedTour === false) setVisible(true);
  }, [hasCompletedTour]);

  useEffect(() => {
    if (tourKey > 0) { setStep(0); setVisible(true); }
  }, [tourKey]);

  // Body scroll lock — desktop only; on mobile the user needs to scroll to see targets
  useEffect(() => {
    if (!visible) return;
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (isMobile) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [visible]);

  const finish = useCallback(() => {
    tokenRef.current.cancelled = true;
    setVisible(false);
    if (userId) {
      createSupabaseClient().auth.updateUser({ data: { has_completed_tour: true } });
    }
  }, [userId]);

  const positionStep = useCallback(async (stepIdx: number, token: { cancelled: boolean }) => {
    const s = STEPS[stepIdx];
    if (!s || token.cancelled) return;

    if (!s.selector) {
      // No target — full-dim overlay, tooltip centered bottom
      if (token.cancelled) return;
      setSpotlight(null);
      return;
    }

    // Check visibility before scrolling
    const initialRect = getVisibleRect(s.selector);
    if (!initialRect) {
      // Skip step silently — target hidden or missing (e.g. desktop-only element on mobile)
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[OnboardingTour] skipping step "${s.id}" — target not found or hidden: ${s.selector}`);
      }
      if (!token.cancelled) {
        const next = stepIdx + 1;
        if (next >= STEPS.length) setVisible(false);
        else setStep(next);
      }
      return;
    }

    // Scroll target into view — desktop only; mobile users scroll manually
    const el = document.querySelector(s.selector);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    if (!isMobile && el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      await new Promise<void>((r) => setTimeout(r, 400));
    }
    if (token.cancelled) return;

    // Re-measure after scroll
    const rect = getVisibleRect(s.selector);
    if (!rect || token.cancelled) return;

    setSpotlight({
      top:    rect.top    - PAD,
      left:   rect.left   - PAD,
      width:  rect.width  + PAD * 2,
      height: rect.height + PAD * 2,
    });
  }, []);

  useEffect(() => {
    if (!visible) return;
    const token = { cancelled: false };
    tokenRef.current = token;
    positionStep(step, token);
    return () => { token.cancelled = true; };
  }, [step, visible, positionStep]);

  // Recalculate spotlight on resize (scroll listener removed — it caused repeated
  // positionStep calls that fought with the smooth-scroll animation on mobile)
  useEffect(() => {
    if (!visible) return;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const handler = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        const token = { cancelled: false };
        tokenRef.current = token;
        positionStep(step, token);
      }, 150);
    };
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("resize", handler);
      if (debounce) clearTimeout(debounce);
    };
  }, [visible, step, positionStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")          finish();
      else if (e.key === "ArrowRight") setStep((s) => Math.min(s + 1, STEPS.length - 1));
      else if (e.key === "ArrowLeft")  setStep((s) => Math.max(s - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, finish]);

  if (!visible) return null;

  const current = STEPS[step];
  const isFirst = step === 0;
  const isLast  = step === STEPS.length - 1;
  const total   = STEPS.length;

  const handleNext = () => { if (isLast) finish(); else setStep((s) => s + 1); };
  const handleBack = () => { if (!isFirst) setStep((s) => s - 1); };

  return (
    <>
      {/* Spotlight — or full-page dim for steps without a target */}
      {spotlight ? (
        <div
          style={{
            position: "fixed",
            top:    spotlight.top,
            left:   spotlight.left,
            width:  spotlight.width,
            height: spotlight.height,
            borderRadius: 8,
            boxShadow: "0 0 0 4px rgba(139,105,20,0.55), 0 0 0 9999px rgba(44,42,38,0.45)",
            zIndex: 9998,
            pointerEvents: "none",
            transition: "all 350ms cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(44,42,38,0.45)", zIndex: 9998, pointerEvents: "none" }} />
      )}

      {/* Tooltip — ALWAYS fixed at the bottom, never moves */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: 480,
          background: "#ffffff",
          border: "1px solid #e8e4dd",
          borderRadius: 14,
          boxShadow: "0 20px 50px rgba(44,42,38,0.18), 0 4px 12px rgba(44,42,38,0.10)",
          opacity,
          transition: "opacity 200ms ease",
          zIndex: 10000,
          overflow: "hidden",
        }}
      >
        {/* Progress bar — full width, clipped by overflow:hidden + borderRadius */}
        <div style={{ height: 3, background: "#f5f1ea", width: "100%" }}>
          <div style={{
            height: "100%",
            width: `${((step + 1) / total) * 100}%`,
            background: "#8b6914",
            transition: "width 350ms cubic-bezier(0.4,0,0.2,1)",
          }} />
        </div>

        {/* Padded content area */}
        <div style={{ padding: 22 }}>
          {/* Header row: title + step counter */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 8 }}>
            <h3 style={{ fontFamily: "Georgia, serif", fontSize: 19, fontWeight: 600, color: "#2c2a26", margin: 0, lineHeight: 1.3 }}>
              {current.title}
            </h3>
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "#8b6914", flexShrink: 0, paddingTop: 4, whiteSpace: "nowrap" as const }}>
              Step {step + 1} of {total}
            </span>
          </div>

          {/* Body */}
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "#5a564f", margin: "0 0 18px 0" }}>
            {current.body}
          </p>

          {/* Button row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <button
              type="button"
              onClick={finish}
              style={{ fontSize: 13, color: "#8b6914", textDecoration: "underline", textUnderlineOffset: 4, minHeight: 40, padding: "0 4px", cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}
            >
              Skip tour
            </button>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                type="button"
                onClick={handleBack}
                disabled={isFirst}
                style={{
                  minHeight: 42, padding: "0 18px", borderRadius: 10,
                  border: "1px solid #e8e4dd", background: "transparent",
                  color: "#5a564f", fontSize: 14,
                  cursor: isFirst ? "default" : "pointer",
                  opacity: isFirst ? 0.4 : 1,
                  pointerEvents: isFirst ? "none" : "auto",
                  fontFamily: "inherit",
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                style={{
                  minHeight: 42, padding: "0 22px", borderRadius: 10,
                  background: "#2c2a26", color: "#faf8f5", fontSize: 14,
                  fontWeight: 600, cursor: "pointer", border: "none",
                  fontFamily: "inherit",
                }}
              >
                {isLast ? "Start using DineLinks" : "Next →"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
