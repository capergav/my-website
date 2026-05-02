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
    body: "This 60-second tour shows you how to manage your menu. You can replay it anytime by clicking the ? button in the header.",
  },
  {
    id: "restaurant-name",
    selector: "[data-tour='tour-restaurant-name']",
    title: "Your restaurant name",
    body: "This is what customers see at the top of your menu. Update it in Settings if you need to change it.",
  },
  {
    id: "theme",
    selector: "[data-tour='tour-theme']",
    title: "Customize your look",
    body: "Pick a color theme and font that match your restaurant. Changes show up instantly on your live menu.",
  },
  {
    id: "view-menu",
    selector: "[data-tour='tour-view-menu']",
    title: "See your live menu",
    body: "Opens your public menu in a new tab — exactly what customers see when they scan your QR code.",
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
    id: "settings",
    selector: "[data-tour='tour-settings']",
    title: "Account settings",
    body: "Manage your account, restaurant info, and billing here. Account deletion lives here too.",
  },
  {
    id: "signout",
    selector: "[data-tour='tour-signout']",
    title: "Sign out safely",
    body: "Your menu stays live even when you're signed out. Customers can scan and view it 24/7.",
  },
  {
    id: "done",
    selector: null,
    title: "You're ready",
    body: "Add your real menu items whenever you're ready. Your 60-day free trial is active — no credit card needed to start.",
  },
];

const PAD = 6;       // spotlight padding around target (px)
const TIP_W = 360;   // tooltip width (px)
const TIP_GAP = 12;  // gap between spotlight and tooltip (px)
const VM = 16;       // viewport margin (px)

type SpotRect = { top: number; left: number; width: number; height: number };
type TipPos = { top: number; left: number };

function getVisibleRect(selector: string): SpotRect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 && r.height === 0) return null; // hidden
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
  const [opacity, setOpacity]     = useState(0);
  const [isMobile, setIsMobile]   = useState(false);
  const [spotlight, setSpotlight] = useState<SpotRect | null>(null);
  const [tipPos, setTipPos]       = useState<TipPos | null>(null);

  // Track cancellation tokens to prevent stale async operations
  const tokenRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (hasCompletedTour === false) setVisible(true);
  }, [hasCompletedTour]);

  useEffect(() => {
    if (tourKey > 0) { setStep(0); setVisible(true); }
  }, [tourKey]);

  // Body scroll lock
  useEffect(() => {
    if (!visible) return;
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
      // Centered modal — no spotlight
      if (token.cancelled) return;
      setSpotlight(null);
      setTipPos(null);
      setOpacity(1);
      return;
    }

    // Check if target is in the DOM and visible
    const initialRect = getVisibleRect(s.selector);
    if (!initialRect) {
      // Skip this step silently
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[OnboardingTour] skipping step "${s.id}" — target not found or hidden: ${s.selector}`);
      }
      if (!token.cancelled) {
        const next = stepIdx + 1;
        if (next >= STEPS.length) {
          setVisible(false);
        } else {
          setStep(next);
        }
      }
      return;
    }

    // Fade out before repositioning
    setOpacity(0);
    await new Promise<void>((r) => setTimeout(r, 150));
    if (token.cancelled) return;

    // Scroll target into view
    const el = document.querySelector(s.selector);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      await new Promise<void>((r) => setTimeout(r, 400));
    }
    if (token.cancelled) return;

    // Re-measure after scroll (position may have shifted)
    const rect = getVisibleRect(s.selector);
    if (!rect || token.cancelled) {
      setOpacity(1);
      return;
    }

    const sTop  = rect.top  - PAD;
    const sLeft = rect.left - PAD;
    const sW    = rect.width  + PAD * 2;
    const sH    = rect.height + PAD * 2;

    setSpotlight({ top: sTop, left: sLeft, width: sW, height: sH });

    if (window.innerWidth >= 768) {
      const W = window.innerWidth;
      const H = window.innerHeight;
      const tipH = 210; // estimated tooltip height

      // Default: anchor below spotlight
      let tTop = sTop + sH + TIP_GAP;
      // If clipped at bottom, flip above
      if (tTop + tipH > H - VM) {
        tTop = Math.max(VM, sTop - tipH - TIP_GAP);
      }
      // Horizontal: align with target, clamp to viewport
      let tLeft = rect.left;
      tLeft = Math.max(VM, Math.min(tLeft, W - TIP_W - VM));

      setTipPos({ top: tTop, left: tLeft });
    } else {
      setTipPos(null); // mobile uses fixed bottom position
    }

    if (!token.cancelled) setOpacity(1);
  }, []);

  // Run positionStep whenever step or visibility changes
  useEffect(() => {
    if (!visible) return;
    const token = { cancelled: false };
    tokenRef.current = token;
    positionStep(step, token);
    return () => { token.cancelled = true; };
  }, [step, visible, positionStep]);

  // Recalculate on resize/scroll
  useEffect(() => {
    if (!visible) return;
    let debounce: ReturnType<typeof setTimeout> | null = null;
    const handler = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(() => {
        const token = { cancelled: false };
        tokenRef.current = token;
        positionStep(step, token);
      }, 100);
    };
    window.addEventListener("resize", handler);
    window.addEventListener("scroll", handler, true);
    return () => {
      window.removeEventListener("resize", handler);
      window.removeEventListener("scroll", handler, true);
      if (debounce) clearTimeout(debounce);
    };
  }, [visible, step, positionStep]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape")      finish();
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

  const tooltipContent = (
    <>
      {/* Top row: title + step counter */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <h3 style={{ fontFamily: "Georgia, serif", fontSize: 18, fontWeight: 600, color: "#2c2a26", margin: 0, lineHeight: 1.3 }}>
          {current.title}
        </h3>
        <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#8b6914", flexShrink: 0, paddingTop: 3 }}>
          {step + 1} / {total}
        </span>
      </div>

      {/* Body */}
      <p style={{ fontSize: 14, lineHeight: 1.6, color: "#5a564f", margin: "0 0 16px 0" }}>
        {current.body}
      </p>

      {/* Button row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <button
          type="button"
          onClick={finish}
          style={{ fontSize: 12, color: "#8b6914", textDecoration: "underline", textUnderlineOffset: 4, minHeight: 40, padding: "0 4px", cursor: "pointer", background: "none", border: "none", fontFamily: "inherit" }}
        >
          Skip tour
        </button>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={handleBack}
            disabled={isFirst}
            style={{
              minHeight: 40, padding: "0 20px", borderRadius: 8,
              border: "1px solid #e8e4dd", background: "transparent", color: "#5a564f",
              fontSize: 14, cursor: isFirst ? "default" : "pointer",
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
              minHeight: 40, padding: "0 20px", borderRadius: 8,
              background: "#2c2a26", color: "#faf8f5", fontSize: 14,
              fontWeight: 500, cursor: "pointer", border: "none", fontFamily: "inherit",
            }}
          >
            {isLast ? "Start using DineLinks" : "Next →"}
          </button>
        </div>
      </div>
    </>
  );

  const tooltipShell: React.CSSProperties = {
    background: "#ffffff",
    border: "1px solid #e8e4dd",
    borderRadius: 12,
    boxShadow: "0 10px 40px rgba(44,42,38,0.12), 0 2px 8px rgba(44,42,38,0.08)",
    opacity,
    transition: "opacity 200ms ease",
    zIndex: 10000,
    pointerEvents: "auto",
  };

  return (
    <>
      {/* Spotlight using box-shadow trick, or full dim if no target */}
      {spotlight ? (
        <div
          style={{
            position: "fixed",
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
            borderRadius: 8,
            boxShadow: "0 0 0 4px rgba(139,105,20,0.5), 0 0 0 9999px rgba(44,42,38,0.55)",
            zIndex: 9998,
            pointerEvents: "none",
            transition: "top 350ms cubic-bezier(0.4,0,0.2,1), left 350ms cubic-bezier(0.4,0,0.2,1), width 350ms cubic-bezier(0.4,0,0.2,1), height 350ms cubic-bezier(0.4,0,0.2,1)",
          }}
        />
      ) : (
        <div style={{ position: "fixed", inset: 0, background: "rgba(44,42,38,0.55)", zIndex: 9998, pointerEvents: "none" }} />
      )}

      {/* Desktop: anchored near spotlight */}
      {!isMobile && (
        <div
          style={{
            position: "fixed",
            top: tipPos ? tipPos.top : "50%",
            left: tipPos ? tipPos.left : "50%",
            transform: tipPos ? undefined : "translate(-50%, -50%)",
            width: TIP_W,
            maxWidth: `calc(100vw - ${VM * 2}px)`,
            padding: 20,
            ...tooltipShell,
          }}
        >
          {tooltipContent}
        </div>
      )}

      {/* Mobile: fixed at bottom */}
      {isMobile && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: 16,
            right: 16,
            padding: 18,
            ...tooltipShell,
          }}
        >
          {tooltipContent}
        </div>
      )}
    </>
  );
}
