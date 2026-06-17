"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { createSupabaseClient } from "@/app/lib/supabase";

type StepConfig = {
  title: string;
  body: string;
  targetSelector: string | null;
  menuOpen: boolean;
};

const STEPS: StepConfig[] = [
  {
    title: "Welcome to DineLinks",
    body: "This quick tour shows you everything you need to know. Your menu is already live — let's walk through how to manage it.",
    targetSelector: null,
    menuOpen: false,
  },
  {
    title: "We added a sample item for you",
    body: "We created a sample dish so you can see how items look. Edit or delete it anytime — or use it as a starting point.",
    targetSelector: "[data-tour='first-item-card']",
    menuOpen: false,
  },
  {
    title: "Categories keep your menu organised",
    body: "Each tab is a category — Starters, Mains, Desserts, Drinks. Click to switch between them, drag to reorder.",
    targetSelector: "[data-tour='tour-categories']",
    menuOpen: false,
  },
  {
    title: "Adding a new category",
    body: "Click '+ Add category' to create a new section. Rename or delete categories anytime from the Manage button.",
    targetSelector: "[data-tour='add-category']",
    menuOpen: false,
  },
  {
    title: "Your menu items",
    body: "Each card shows the dish name, price, photo, and dietary tags. The handle on the left lets you drag items into any order.",
    targetSelector: "[data-tour='first-item-card']",
    menuOpen: false,
  },
  {
    title: "The Available button",
    body: "Green dot means the item is live on your menu. Click it to mark something as unavailable mid-service — it stays on the menu but shows as 'Currently unavailable' to customers.",
    targetSelector: "[data-tour='first-item-available']",
    menuOpen: false,
  },
  {
    title: "The Edit button",
    body: "Click Edit to update a name, price, description, photo, or dietary tags. Changes go live the moment you save.",
    targetSelector: "[data-tour='first-item-edit']",
    menuOpen: false,
  },
  {
    title: "Make it look like yours",
    body: "Theme & Branding lets you change your colours, fonts, and upload your logo. 12 presets to start or build a fully custom look.",
    targetSelector: "[data-tour='theme-branding-option']",
    menuOpen: true,
  },
  {
    title: "Your QR code is ready",
    body: "Download QR Code gives you your table sticker. Customers scan it and land on your menu — translated into their language automatically.",
    targetSelector: "[data-tour='qr-option']",
    menuOpen: true,
  },
  {
    title: "You're all set",
    body: "",
    targetSelector: null,
    menuOpen: false,
  },
];

const TOTAL_STEPS = STEPS.length;

type SpotlightRect = {
  top: number;
  left: number;
  width: number;
  height: number;
  borderRadius: number;
};

// Build a SpotlightRect from a DOMRect with padding
const fromRect = (rect: DOMRect, padding: number): SpotlightRect => ({
  top: rect.top - padding,
  left: rect.left - padding,
  width: rect.width + padding * 2,
  height: rect.height + padding * 2,
  borderRadius: 10,
});

// CSS transition for SVG geometry properties (morph animation)
const SVG_TRANSITION =
  "x 350ms cubic-bezier(0.34,1.56,0.64,1), y 350ms cubic-bezier(0.34,1.56,0.64,1), width 350ms cubic-bezier(0.34,1.56,0.64,1), height 350ms cubic-bezier(0.34,1.56,0.64,1)";

const SPOTLIGHT_CSS = `
  @keyframes spotlightPulse {
    0%, 100% { opacity: 0.7; stroke-width: 2; }
    50%       { opacity: 1;   stroke-width: 3; }
  }
  .tour-pulse-ring {
    animation: spotlightPulse 2s ease-in-out infinite;
  }
`;

export function OnboardingTour({
  tourKey,
  hasCompletedTour,
  userId,
  slug,
}: {
  tourKey: number;
  hasCompletedTour?: boolean;
  userId?: string;
  slug: string;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [overlayOpacity, setOverlayOpacity] = useState(0);
  const [windowSize, setWindowSize] = useState({ w: 0, h: 0 });

  // Refs that don't need to trigger re-renders
  const currentHighlightedElRef = useRef<HTMLElement | null>(null);
  const overlayActiveRef = useRef(false); // true while overlay is shown/fading-in
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const goToStepRef = useRef<((step: number) => void) | null>(null);
  const prevTourKeyRef = useRef(tourKey); // Track previous tourKey to detect actual changes
  const menuOpenedByTourRef = useRef(false); // Track if we opened the menu

  // ── Click simulation helpers ───────────────────────────────────────────────

  const clickMenuButton = useCallback(() => {
    const btn = document.querySelector('[data-tour="menu-button"]') as HTMLElement | null;
    if (btn) {
      btn.click();
      menuOpenedByTourRef.current = true;
    }
  }, []);

  const closeMenu = useCallback(() => {
    if (!menuOpenedByTourRef.current) return;
    const closeBtn = document.querySelector('[data-tour="sheet-close"]') as HTMLElement | null;
    if (closeBtn) {
      closeBtn.click();
    }
    menuOpenedByTourRef.current = false;
  }, []);

  // ── Window size tracking for overlay rects ─────────────────────────────────

  useEffect(() => {
    const update = () => setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // ── Show / replay ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (hasCompletedTour === false) setVisible(true);
  }, [hasCompletedTour]);

  useEffect(() => {
    // Only reset when tourKey actually increases (replay button clicked)
    if (tourKey > prevTourKeyRef.current) {
      prevTourKeyRef.current = tourKey;
      // Kill any pending observer
      mutationObserverRef.current?.disconnect();
      mutationObserverRef.current = null;
      // Instantly clear spotlight
      overlayActiveRef.current = false;
      setOverlayOpacity(0);
      setSpotlightRect(null);
      if (currentHighlightedElRef.current) {
        currentHighlightedElRef.current.style.position = "";
        currentHighlightedElRef.current.style.zIndex = "";
        currentHighlightedElRef.current = null;
      }
      closeMenu();
      setCurrentStep(0);
      setVisible(true);
    }
  }, [tourKey, closeMenu]);

  // ── Spotlight helpers ──────────────────────────────────────────────────────

  const removeSpotlight = useCallback(() => {
    overlayActiveRef.current = false;
    if (currentHighlightedElRef.current) {
      currentHighlightedElRef.current.style.position = "";
      currentHighlightedElRef.current.style.zIndex = "";
      currentHighlightedElRef.current = null;
    }
    setOverlayOpacity(0);
    // After fade-out, remove the rect so the SVG renders nothing
    setTimeout(() => setSpotlightRect(null), 300);
  }, []);

  const applySpotlight = useCallback((el: HTMLElement) => {
    // Ignore elements hidden by CSS (e.g. sm:hidden on desktop)
    const check = el.getBoundingClientRect();
    if (!check.width && !check.height) return;

    // Clean up the previous highlighted element (before scroll)
    if (currentHighlightedElRef.current && currentHighlightedElRef.current !== el) {
      currentHighlightedElRef.current.style.position = "";
      currentHighlightedElRef.current.style.zIndex = "";
    }
    currentHighlightedElRef.current = el;
    el.style.position = "relative";
    el.style.zIndex = "51";
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Wait for scroll to settle on iOS (500ms)
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      if (!rect.width && !rect.height) return;

      if (overlayActiveRef.current) {
        // Already visible — morph the hole to the new element (CSS transition handles it)
        setSpotlightRect(fromRect(rect, 12));
      } else {
        // First appearance — spring open: start small, animate to full size
        overlayActiveRef.current = true;
        setSpotlightRect(fromRect(rect, 4));
        setOverlayOpacity(1);
        requestAnimationFrame(() => {
          setTimeout(() => setSpotlightRect(fromRect(rect, 12)), 20);
        });
      }
    }, 500);
  }, []);

  // ── Step navigation ────────────────────────────────────────────────────────

  const goToStep = useCallback(
    (newStep: number) => {
      const step = STEPS[newStep];
      if (!step) return;

      const prevStep = STEPS[currentStep];

      // Kill any pending MutationObserver
      mutationObserverRef.current?.disconnect();
      mutationObserverRef.current = null;

      setCurrentStep(newStep);

      // Close menu if leaving a menu step for a non-menu step
      if (prevStep?.menuOpen && !step.menuOpen) {
        closeMenu();
      }

      if (step.menuOpen) {
        // Click the menu button to open the drawer
        clickMenuButton();

        if (step.targetSelector) {
          const sel = step.targetSelector;

          // Use MutationObserver to wait for the target element to appear in DOM
          const observer = new MutationObserver(() => {
            const found = document.querySelector(sel) as HTMLElement | null;
            if (found) {
              observer.disconnect();
              mutationObserverRef.current = null;
              applySpotlight(found);
            }
          });
          observer.observe(document.body, { childList: true, subtree: true });
          mutationObserverRef.current = observer;

          // Also check immediately in case the menu is already open
          setTimeout(() => {
            const existing = document.querySelector(sel) as HTMLElement | null;
            if (existing) {
              observer.disconnect();
              mutationObserverRef.current = null;
              applySpotlight(existing);
            }
          }, 50);

          // Safety timeout — give up after 2s
          setTimeout(() => {
            observer.disconnect();
            if (mutationObserverRef.current === observer) mutationObserverRef.current = null;
          }, 2000);
        }
      } else {
        if (step.targetSelector) {
          const sel = step.targetSelector;
          // Short delay so any close-menu animation settles
          setTimeout(() => {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (el) applySpotlight(el);
          }, 150);
        } else {
          removeSpotlight();
        }
      }
    },
    [currentStep, clickMenuButton, closeMenu, applySpotlight, removeSpotlight]
  );

  // Keep ref current so keyboard handler never captures a stale closure
  useEffect(() => {
    goToStepRef.current = goToStep;
  });

  // ── Finish / skip ──────────────────────────────────────────────────────────

  const finish = useCallback(() => {
    mutationObserverRef.current?.disconnect();
    mutationObserverRef.current = null;
    overlayActiveRef.current = false;
    setOverlayOpacity(0);
    setSpotlightRect(null);
    if (currentHighlightedElRef.current) {
      currentHighlightedElRef.current.style.position = "";
      currentHighlightedElRef.current.style.zIndex = "";
      currentHighlightedElRef.current = null;
    }
    closeMenu();
    setVisible(false);
    if (userId) {
      createSupabaseClient().auth.updateUser({ data: { has_completed_tour: true } });
    }
  }, [userId, closeMenu]);

  // ── Keyboard navigation ────────────────────────────────────────────────────

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" && currentStep < TOTAL_STEPS - 1)
        goToStepRef.current?.(currentStep + 1);
      else if (e.key === "ArrowLeft" && currentStep > 0)
        goToStepRef.current?.(currentStep - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, currentStep, finish]);

  // ── Resize / orientation — recalculate spotlight position ─────────────────

  useEffect(() => {
    const onResize = () => {
      if (!currentHighlightedElRef.current) return;
      const rect = currentHighlightedElRef.current.getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      setSpotlightRect(fromRect(rect, 12));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      mutationObserverRef.current?.disconnect();
      if (currentHighlightedElRef.current) {
        currentHighlightedElRef.current.style.position = "";
        currentHighlightedElRef.current.style.zIndex = "";
      }
    };
  }, []);

  if (!visible) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === TOTAL_STEPS - 1;

  const stepBody = isLast
    ? `Your menu is live at dinelinks.com/menu/${slug}. Add your real dishes, set your theme, and you're ready for your first customer.`
    : STEPS[currentStep].body;

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SPOTLIGHT_CSS }} />

      {/* SVG spotlight overlay — z-40, dark with bright hole using 4 rects (not mask) for smooth animation */}
      <svg
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 40, opacity: overlayOpacity, transition: "opacity 300ms ease" }}
        aria-hidden="true"
      >
        {spotlightRect && windowSize.w > 0 && (
          <>
            {/* 4 dark rects around the spotlight hole — all animate together */}
            {/* Top rect */}
            <rect
              x="0"
              y="0"
              width={windowSize.w}
              height={Math.max(0, spotlightRect.top)}
              fill="rgba(0,0,0,0.6)"
              style={{ transition: SVG_TRANSITION }}
            />
            {/* Bottom rect */}
            <rect
              x="0"
              y={spotlightRect.top + spotlightRect.height}
              width={windowSize.w}
              height={Math.max(0, windowSize.h - spotlightRect.top - spotlightRect.height)}
              fill="rgba(0,0,0,0.6)"
              style={{ transition: SVG_TRANSITION }}
            />
            {/* Left rect */}
            <rect
              x="0"
              y={spotlightRect.top}
              width={Math.max(0, spotlightRect.left)}
              height={spotlightRect.height}
              fill="rgba(0,0,0,0.6)"
              style={{ transition: SVG_TRANSITION }}
            />
            {/* Right rect */}
            <rect
              x={spotlightRect.left + spotlightRect.width}
              y={spotlightRect.top}
              width={Math.max(0, windowSize.w - spotlightRect.left - spotlightRect.width)}
              height={spotlightRect.height}
              fill="rgba(0,0,0,0.6)"
              style={{ transition: SVG_TRANSITION }}
            />

            {/* Pulsing accent ring around the hole */}
            <rect
              x={spotlightRect.left}
              y={spotlightRect.top}
              width={spotlightRect.width}
              height={spotlightRect.height}
              rx={spotlightRect.borderRadius}
              fill="none"
              stroke="var(--accent, #8b6914)"
              strokeWidth="2"
              className="tour-pulse-ring"
              style={{ transition: SVG_TRANSITION }}
            />
          </>
        )}
      </svg>

      {/* Tour card — z-60, slides up on mount */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[400px] bg-white border border-[#e8e4dd] rounded-2xl shadow-xl overflow-hidden"
        style={{ zIndex: 60 }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-100 w-full">
          <div
            className="h-full transition-all duration-300 ease-out"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: "var(--accent, #8b6914)",
            }}
          />
        </div>

        {/* Content */}
        <div
          className="p-5 sm:p-6"
          style={{ paddingBottom: "max(20px, env(safe-area-inset-bottom, 20px))" }}
        >
          {/* Title + body fade on step change */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <h3 className="text-base font-semibold text-gray-900 leading-snug">
                  {STEPS[currentStep].title}
                </h3>
                <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5">
                  {currentStep + 1} of {TOTAL_STEPS}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed mb-5">{stepBody}</p>
            </motion.div>
          </AnimatePresence>

          {/* Buttons (stable — no per-step animation) */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="order-2 sm:order-1">
              {!isFirst && (
                <button
                  type="button"
                  onClick={() => goToStepRef.current?.(currentStep - 1)}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (isLast) finish();
                else goToStepRef.current?.(currentStep + 1);
              }}
              className="order-1 sm:order-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: "var(--accent, #8b6914)" }}
            >
              {isLast ? "Finish" : "Next"}
            </button>
          </div>

          {isFirst && (
            <button
              type="button"
              onClick={finish}
              className="w-full mt-3 py-2 text-gray-400 text-sm underline underline-offset-2 hover:text-gray-600 transition-colors"
            >
              Skip tour
            </button>
          )}
        </div>
      </motion.div>
    </>
  );
}
