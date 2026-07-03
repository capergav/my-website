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

// Wait for scroll to fully settle AND the target to be within the viewport
// before calling callback. The viewport check is critical for horizontally
// scrolling containers (e.g. the category tab bar): scrollIntoView may scroll
// sideways while getBoundingClientRect still reports off-screen coords until
// the element actually lands inside the visible area.
const waitForScrollEnd = (el: HTMLElement, callback: () => void) => {
  let last = window.scrollY;
  let stable = 0;
  let attempts = 0;
  const check = setInterval(() => {
    attempts++;
    const rect = el.getBoundingClientRect();
    const inView = rect.top > 0 && rect.top < window.innerHeight;
    if (window.scrollY === last && inView) {
      stable++;
      if (stable >= 3) {
        clearInterval(check);
        callback();
      }
    } else {
      stable = 0;
      last = window.scrollY;
    }
    // Safety: give up after ~2s and measure anyway so the tour never stalls
    if (attempts >= 40) {
      clearInterval(check);
      callback();
    }
  }, 50);
};

// Bouncy spring curve shared by the spotlight morph (geometry) so every
// step-to-step move keeps the same overshoot feel.
const SPOTLIGHT_EASE = [0.34, 1.56, 0.64, 1] as const;

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
  // Whether the cutout hole is open (true) or the screen is plainly dimmed
  // with no hole (false — welcome / final steps, and while a cutout fades in).
  const [holeOpen, setHoleOpen] = useState(false);
  // Whether to CSS-transition the cutout geometry on this render. False on the
  // very first open (jump straight to the target so it doesn't sweep in from
  // the corner); true once a hole is already open so later steps morph.
  const [geoAnimate, setGeoAnimate] = useState(false);

  // Refs that don't need to trigger re-renders
  const currentHighlightedElRef = useRef<HTMLElement | null>(null);
  const overlayActiveRef = useRef(false); // true while overlay is shown/fading-in
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const goToStepRef = useRef<((step: number) => void) | null>(null);
  const prevTourKeyRef = useRef(tourKey); // Track previous tourKey to detect actual changes
  const menuOpenedByTourRef = useRef(false); // Track if we opened the menu
  const desktopMenuRef = useRef(false); // Track whether we opened the desktop dropdown (vs mobile sheet)
  const holeOpenRef = useRef(false); // Mirrors holeOpen for use inside stable callbacks
  // True once the FIRST spotlight has been shown in this tour run. Drives
  // geoAnimate: false only for the very first appearance-from-nothing (jump
  // straight to the target, no corner sweep), true for every step-to-step
  // move thereafter so the geometry always morphs. Unlike holeOpenRef this is
  // never toggled by the async scroll callback or target-less steps, so it can't
  // race — it resets only on replay/finish.
  const firstSpotlightShownRef = useRef(false);

  // ── Click simulation helpers ───────────────────────────────────────────────

  // The action menu is two different components depending on viewport:
  //  • Mobile (<640px): a full-screen sheet, opened by [data-tour="menu-button"]
  //    and closed by [data-tour="sheet-close"].
  //  • Desktop (≥640px): the AdminMenuPanel dropdown, toggled by
  //    [data-tour="tour-menu"]. Both Theme & QR options live inside it.
  // On desktop the mobile sheet is sm:hidden (0×0), so clicking the mobile
  // button there would never reveal a measurable target — we must drive the
  // desktop dropdown instead.
  const isDesktop = () =>
    typeof window !== "undefined" && window.matchMedia("(min-width: 640px)").matches;

  const clickMenuButton = useCallback(() => {
    if (isDesktop()) {
      // Mark the tour as driving the dropdown so its outside-click handler
      // won't close it when the user presses "Next" on the tour card.
      document.body.dataset.tourActive = "true";
      // Idempotent: only click to open if the dropdown isn't already open.
      const alreadyOpen = document.querySelector(
        '[data-tour="theme-branding-option"], [data-tour="qr-option"]'
      );
      if (!alreadyOpen) {
        const btn = document.querySelector('[data-tour="tour-menu"]') as HTMLElement | null;
        btn?.click();
      }
      menuOpenedByTourRef.current = true;
      desktopMenuRef.current = true;
    } else {
      const btn = document.querySelector('[data-tour="menu-button"]') as HTMLElement | null;
      if (btn) {
        btn.click();
        menuOpenedByTourRef.current = true;
        desktopMenuRef.current = false;
      }
    }
  }, []);

  const closeMenu = useCallback(() => {
    if (!menuOpenedByTourRef.current) return;
    if (desktopMenuRef.current) {
      delete document.body.dataset.tourActive;
      // Toggle the dropdown shut via its trigger button (only if still open).
      const stillOpen = document.querySelector(
        '[data-tour="theme-branding-option"], [data-tour="qr-option"]'
      );
      if (stillOpen) {
        const btn = document.querySelector('[data-tour="tour-menu"]') as HTMLElement | null;
        btn?.click();
      }
    } else {
      const closeBtn = document.querySelector('[data-tour="sheet-close"]') as HTMLElement | null;
      if (closeBtn) {
        closeBtn.click();
      }
    }
    menuOpenedByTourRef.current = false;
    desktopMenuRef.current = false;
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
      setHoleOpen(false);
      holeOpenRef.current = false;
      setGeoAnimate(false);
      firstSpotlightShownRef.current = false;
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

  // ── Dim the screen on target-less steps (welcome / final) ──────────────────
  // These steps never run applySpotlight, so activate the plain dark overlay
  // here. Runs on first mount (step 0) and after the replay reset.
  useEffect(() => {
    if (!visible) return;
    const step = STEPS[currentStep];
    if (!step.menuOpen && !step.targetSelector) {
      // Plain dimmed screen: close the hole (fades the cutout out) but keep
      // the dark overlay. spotlightRect is left mounted so the cutout can
      // fade out gracefully; it's re-driven the moment a target step runs.
      overlayActiveRef.current = true;
      setHoleOpen(false);
      holeOpenRef.current = false;
      setOverlayOpacity(1);
    }
  }, [visible, currentStep]);

  // ── Spotlight helpers ──────────────────────────────────────────────────────

  const removeSpotlight = useCallback(() => {
    // Detach any highlighted element but KEEP the dark overlay visible as a
    // plain dimmed screen (no cutout). This keeps the dimming consistent on
    // steps with no specific target (welcome + final step).
    if (currentHighlightedElRef.current) {
      currentHighlightedElRef.current.style.position = "";
      currentHighlightedElRef.current.style.zIndex = "";
      currentHighlightedElRef.current = null;
    }
    overlayActiveRef.current = true;
    setHoleOpen(false);
    holeOpenRef.current = false;
    setOverlayOpacity(1);
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

    // Wait for scroll to fully settle AND the element to be in view before measuring
    waitForScrollEnd(el, () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width && !rect.height) return;

      const finalRect = fromRect(rect, 12);

      // Single geometry source. If a hole is already open, CSS-transition the
      // box to the new geometry (bouncy spring). If this is the first cutout,
      // jump straight to the target (no transition) so it doesn't sweep in from
      // the corner — the hole then opens by fading its fill/border.
      overlayActiveRef.current = true;
      // Animate the morph on every step-to-step move; jump only the very first
      // time a spotlight appears (from the plain dimmed welcome screen).
      setGeoAnimate(firstSpotlightShownRef.current);
      firstSpotlightShownRef.current = true;
      setSpotlightRect(finalRect);
      setHoleOpen(true);
      holeOpenRef.current = true;
      setOverlayOpacity(1);
    });
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
              // Wait one frame so the mobile drawer finishes painting before we
              // measure the target — otherwise the spotlight rect is computed
              // against a not-yet-rendered element and never appears.
              requestAnimationFrame(() => applySpotlight(found));
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
              requestAnimationFrame(() => applySpotlight(existing));
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
    setHoleOpen(false);
    holeOpenRef.current = false;
    setGeoAnimate(false);
    firstSpotlightShownRef.current = false;
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

  // On menu steps the action menu creates its own stacking context — the
  // mobile sheet is z-50 and the desktop AdminMenuPanel dropdown is z-[100].
  // A z-40 overlay would render *behind* them and the spotlight would be
  // invisible, so lift the overlay above both for those steps (the desktop
  // dropdown at z-100 is the higher of the two).
  const isMenuStep = STEPS[currentStep].menuOpen;
  const overlayZ = isMenuStep ? 101 : 40;

  // Geometry for the one cutout div. Falls back to a zero box (fully covered by
  // the dark fill) on target-less steps before the first real measurement.
  const rect = spotlightRect ?? { top: 0, left: 0, width: 0, height: 0, borderRadius: 0 };
  const dimAlpha = 0.6 * overlayOpacity;

  return (
    <>
      {/* Transparent click-blocker — z-39, beneath the overlay. Swallows every
          tap/click on the dimmed page so the tour can't be interacted around.
          The spotlit element (z-51), the open menu, and the tour card (z-60)
          all sit above it and stay interactive. */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 39, pointerEvents: "auto" }}
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-hidden="true"
      />

      {/* Continuous dark dim + spotlight cutout as ONE always-mounted div. The
          dark surround is this div's huge box-shadow spread, the bright hole is
          the div's own rectangle, and the accent ring is this SAME div's border
          — one element, so the hole, the dark, and the border are physically
          unified and can NEVER lead, lag, or desync. The geometry
          (top/left/width/height) is animated by `motion` — JS-interpolated
          every frame — instead of a CSS transition. That matters: a CSS
          transition does NOT start when its duration is enabled in the same
          style commit as the value change (which is exactly what happened when
          the first morph flipped the geometry transition 0ms→380ms), so the box
          teleported. `motion` reads the new target + new transition together
          each render, so every step slides. The div is never unmounted or
          re-keyed, so the dark never vanishes for a frame → no menu-step flash.
          The first open uses duration 0 (jump to the target, no corner sweep);
          every later step uses the bouncy spring, carrying the hole and border
          in perfect unison. */}
      <motion.div
        aria-hidden="true"
        initial={false}
        animate={{
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height,
          borderRadius: rect.borderRadius,
        }}
        transition={
          geoAnimate ? { duration: 0.42, ease: SPOTLIGHT_EASE } : { duration: 0 }
        }
        style={{
          position: "fixed",
          zIndex: overlayZ,
          border: `2.5px solid ${holeOpen ? "var(--accent, #8b6914)" : "transparent"}`,
          backgroundColor: holeOpen ? "transparent" : `rgba(0,0,0,${dimAlpha})`,
          boxShadow: `0 0 0 9999px rgba(0,0,0,${dimAlpha})`,
          pointerEvents: "none",
          transition:
            "background-color 300ms ease, box-shadow 300ms ease, border-color 300ms ease",
        }}
      />

      {/* Tour card — must sit above the menu-step overlay (z-101) so the
          "Next" button stays visible and clickable on steps 8/9. */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[400px] bg-white border border-[#e8e4dd] rounded-2xl shadow-xl overflow-hidden"
        style={{ zIndex: 120 }}
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
