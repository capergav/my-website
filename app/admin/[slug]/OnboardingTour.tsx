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
    title: "Available vs. Unavailable",
    body: "A green dot means the item is live. Tap to mark it Unavailable when you run out mid-service — it stays on the menu but shows as 'Currently unavailable', greyed out for customers.",
    targetSelector: "[data-tour='first-item-available']",
    menuOpen: false,
  },
  {
    title: "Shown vs. Hidden",
    body: "This is different from Unavailable. Hiding an item removes it from the customer menu completely — perfect for seasonal dishes or drafts. Unavailable = still shown, marked out of stock. Hidden = gone from view, but kept here in your admin.",
    targetSelector: "[data-tour='first-item-visibility']",
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
    body: "Download QR Code gives you a code you can print for tables, walls, counters and more. Customers scan it and land on your menu — translated into their language automatically.",
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

// ── Async pipeline primitives ────────────────────────────────────────────────
// Each accepts an `isStale` predicate so a newer step change can abort mid-flight
// (see the generation token in OnboardingTour). They never touch React state —
// the caller decides whether to commit based on the same staleness check.

const nextFrame = (): Promise<void> =>
  new Promise((resolve) => requestAnimationFrame(() => resolve()));

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Poll (every 50ms, up to 2.5s) until the selector resolves to an element with a
// non-zero box. Used for menu steps where the target only mounts after the drawer
// opens, and for ordinary steps where the target is already present (returns on
// the first poll). Resolves null on timeout or if the run goes stale.
const waitForElement = async (
  sel: string,
  isStale: () => boolean
): Promise<HTMLElement | null> => {
  const deadline = performance.now() + 2500;
  while (performance.now() < deadline) {
    if (isStale()) return null;
    const el = document.querySelector(sel) as HTMLElement | null;
    if (el) {
      const r = el.getBoundingClientRect();
      if (r.width || r.height) return el;
    }
    await sleep(50);
  }
  return null;
};

// Resolve once the element's rect (top, left, width AND height) has held steady
// within 1px for 5 consecutive animation frames. Watching all four values catches
// scroll on ANY axis (window, ancestor container, the drawer's own scroller) AND
// mid-expansion layout — a still-growing element never passes, so it can never be
// measured undersized. Returns false only if the run goes stale; a ~4s safety cap
// resolves true so the tour can never stall.
const waitForStable = async (
  el: HTMLElement,
  isStale: () => boolean
): Promise<boolean> => {
  let lastTop = Infinity;
  let lastLeft = Infinity;
  let lastWidth = Infinity;
  let lastHeight = Infinity;
  let stable = 0;
  let frames = 0;
  while (frames < 240) {
    frames++;
    await nextFrame();
    if (isStale()) return false;
    const r = el.getBoundingClientRect();
    const settled =
      Math.abs(r.top - lastTop) < 1 &&
      Math.abs(r.left - lastLeft) < 1 &&
      Math.abs(r.width - lastWidth) < 1 &&
      Math.abs(r.height - lastHeight) < 1;
    if (settled) {
      stable++;
      if (stable >= 5) return true;
    } else {
      stable = 0;
    }
    lastTop = r.top;
    lastLeft = r.left;
    lastWidth = r.width;
    lastHeight = r.height;
  }
  return true;
};

// The spotlight is a SINGLE bright cutout in the dark overlay — no border, no
// ring. One race-proof pipeline drives every step (menu or not): the hole stays
// hidden while the drawer opens and the target scrolls + settles to its FINAL
// size, then the hole is measured ONCE and fades in (opacity only) at that size.
// A generation token invalidates any in-flight run the instant the step changes,
// so a stale callback can never set state or flash a wrong/undersized hole.

export function OnboardingTour({
  tourKey,
  hasCompletedTour,
  userId,
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
  // with no hole (false — welcome / final steps, and during every scroll/settle).
  const [holeOpen, setHoleOpen] = useState(false);

  // Refs that don't need to trigger re-renders
  const currentHighlightedElRef = useRef<HTMLElement | null>(null);
  const overlayActiveRef = useRef(false); // true while overlay is shown
  const goToStepRef = useRef<((step: number) => void) | null>(null);
  const prevTourKeyRef = useRef(tourKey); // Track previous tourKey to detect actual changes
  const menuOpenedByTourRef = useRef(false); // Track if we opened the menu
  const desktopMenuRef = useRef(false); // Track whether we opened the desktop dropdown (vs mobile sheet)
  const holeOpenRef = useRef(false); // Mirrors holeOpen for use inside stable callbacks
  // Monotonic generation token. Bumped on every step change / replay / finish.
  // Each pipeline run captures its gen and bails at every checkpoint once a newer
  // run has started, so exactly one run per step can ever commit state.
  const stepGenRef = useRef(0);

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
    // Idempotent for both viewports: if the drawer's options are already in the
    // DOM it's open, so we don't re-click (which on mobile would toggle it shut
    // when advancing between the two menu steps).
    const alreadyOpen = document.querySelector(
      '[data-tour="theme-branding-option"], [data-tour="qr-option"]'
    );
    if (isDesktop()) {
      // Mark the tour as driving the dropdown so its outside-click handler
      // won't close it when the user presses "Next" on the tour card.
      document.body.dataset.tourActive = "true";
      if (!alreadyOpen) {
        const btn = document.querySelector('[data-tour="tour-menu"]') as HTMLElement | null;
        btn?.click();
      }
      menuOpenedByTourRef.current = true;
      desktopMenuRef.current = true;
    } else {
      if (!alreadyOpen) {
        const btn = document.querySelector('[data-tour="menu-button"]') as HTMLElement | null;
        btn?.click();
      }
      menuOpenedByTourRef.current = true;
      desktopMenuRef.current = false;
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

  // Detach the currently raised element, restoring its inline styles.
  const detachHighlight = useCallback(() => {
    if (currentHighlightedElRef.current) {
      currentHighlightedElRef.current.style.position = "";
      currentHighlightedElRef.current.style.zIndex = "";
      currentHighlightedElRef.current = null;
    }
  }, []);

  // ── The single spotlight pipeline ───────────────────────────────────────────
  // One async sequence per step. Every await is followed by an isStale() bail so
  // a newer step change (which bumped stepGenRef) aborts this run before it can
  // touch state. There is no MutationObserver, no dual immediate/observer path,
  // no dedupe flag and no reveal debounce — this replaces all of them.

  const runStep = useCallback(
    async (stepIndex: number, gen: number) => {
      const step = STEPS[stepIndex];
      if (!step) return;
      const isStale = () => gen !== stepGenRef.current;

      // 1. Hide the hole for the whole pipeline — the screen is uniformly dark
      //    (no cutout) while the drawer opens and the target scrolls + settles.
      setHoleOpen(false);
      holeOpenRef.current = false;

      // 2. Drop any element the previous step raised, so it can't sit bright
      //    above the overlay while we scroll toward the next target.
      detachHighlight();

      // 3. Keep the screen dimmed throughout.
      overlayActiveRef.current = true;
      setOverlayOpacity(1);

      // 4. Close the drawer if the tour opened it and this step doesn't need it.
      if (!step.menuOpen && menuOpenedByTourRef.current) closeMenu();

      // 5. Target-less steps (welcome / final): plain dim, no hole. Done.
      if (!step.targetSelector) return;

      // 6. Menu steps: open the drawer (idempotent).
      if (step.menuOpen) clickMenuButton();

      // 7. Wait for the target to exist and be measurable.
      const el = await waitForElement(step.targetSelector, isStale);
      if (isStale() || !el) return;

      // 8. Bring it into view. scrollIntoView also scrolls the drawer's OWN
      //    scroll container, so an option below the fold inside the drawer is
      //    scrolled into view within the drawer.
      el.scrollIntoView({ behavior: "smooth", block: "center" });

      // 9. Await FULL stability — position AND size steady for 5 frames.
      const stable = await waitForStable(el, isStale);
      if (isStale() || !stable) return;

      // 10. Two more frames so the settled layout has actually painted.
      await nextFrame();
      if (isStale()) return;
      await nextFrame();
      if (isStale()) return;

      // 11. Measure the final geometry exactly once.
      const rect = el.getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      if (isStale()) return;

      // 12. Raise the target and reveal the hole at its final size. The box's
      //     top/left/width/height are static — only its background opacity fades
      //     (~200ms), so the hole appears once, fully formed, never resizing.
      el.style.position = "relative";
      el.style.zIndex = "51";
      currentHighlightedElRef.current = el;
      setSpotlightRect(fromRect(rect, 12));
      setHoleOpen(true);
      holeOpenRef.current = true;
    },
    [clickMenuButton, closeMenu, detachHighlight]
  );

  // ── Show / replay ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (hasCompletedTour === false) setVisible(true);
  }, [hasCompletedTour]);

  // Replay (replay button bumps tourKey): invalidate any in-flight pipeline,
  // clear all spotlight state, and restart at step 0.
  useEffect(() => {
    if (tourKey > prevTourKeyRef.current) {
      prevTourKeyRef.current = tourKey;
      stepGenRef.current++; // any running pipeline is now stale and will bail
      overlayActiveRef.current = false;
      setOverlayOpacity(0);
      setHoleOpen(false);
      holeOpenRef.current = false;
      setSpotlightRect(null);
      detachHighlight();
      closeMenu();
      setCurrentStep(0);
      setVisible(true);
    }
  }, [tourKey, closeMenu, detachHighlight]);

  // ── Drive the pipeline on every step change / show / replay ─────────────────
  // The generation bump here invalidates the previous run; the fresh gen is
  // handed to this step's run. tourKey is a dep so a replay that lands back on
  // step 0 still re-runs the pipeline.
  useEffect(() => {
    if (!visible) return;
    const gen = ++stepGenRef.current;
    runStep(currentStep, gen);
  }, [visible, currentStep, tourKey, runStep]);

  // ── Step navigation ────────────────────────────────────────────────────────

  const goToStep = useCallback((newStep: number) => {
    if (!STEPS[newStep]) return;
    // Hide the hole synchronously (batched with the step change) so the previous
    // step's cutout can never flash for a frame at its old position.
    setHoleOpen(false);
    holeOpenRef.current = false;
    setCurrentStep(newStep);
  }, []);

  // Keep ref current so keyboard handler never captures a stale closure
  useEffect(() => {
    goToStepRef.current = goToStep;
  });

  // ── Finish / skip ──────────────────────────────────────────────────────────

  const finish = useCallback(() => {
    stepGenRef.current++; // invalidate any in-flight pipeline
    overlayActiveRef.current = false;
    setOverlayOpacity(0);
    setHoleOpen(false);
    holeOpenRef.current = false;
    setSpotlightRect(null);
    detachHighlight();
    closeMenu();
    setVisible(false);
    if (userId) {
      createSupabaseClient().auth.updateUser({ data: { has_completed_tour: true } });
    }
  }, [userId, closeMenu, detachHighlight]);

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
      stepGenRef.current++; // stop any in-flight pipeline from committing
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
    ? "Your menu is live. Add your real dishes and set your theme whenever you're ready."
    : STEPS[currentStep].body;

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;

  // On menu steps the action menu creates its own stacking context — the
  // mobile sheet is z-50 and the desktop AdminMenuPanel dropdown is z-[100].
  // A z-40 overlay would render *behind* them and the spotlight would be
  // invisible, so lift the overlay above both for those steps (the desktop
  // dropdown at z-100 is the higher of the two).
  const isMenuStep = STEPS[currentStep].menuOpen;
  const overlayZ = isMenuStep ? 101 : 40;

  const dimAlpha = 0.6 * overlayOpacity;
  // The highlight box is rendered ONLY once a real target rect has been measured
  // (after scroll + size settled). Until then — and during every scroll to a new
  // target — the plain dark overlay is shown instead, so the highlight never
  // appears at a stale position and there's no flash of the old spot.
  const showHighlight = holeOpen && spotlightRect !== null;

  return (
    <>
      {/* Transparent full-viewport click-blocker. Sits ABOVE everything the tour
          touches — the dark overlay (z-40 / z-101), the raised spotlit element
          (z-51), and the open ☰ drawer (z-100) — but BELOW the tour card
          (z-120). During the tour NOTHING on the page is interactive, including
          the highlighted element itself: the spotlight is illustrative only, not
          a call to action. Only the tour card's own buttons sit above this and
          stay clickable. The tour still opens/closes the drawer via programmatic
          .click(), which pointer blocking never affects. */}
      <div
        className="fixed inset-0"
        style={{ zIndex: 110, pointerEvents: "auto" }}
        onClickCapture={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        aria-hidden="true"
      />

      {/* Base dark overlay — plain full-screen dim with NO hole. Rendered
          whenever the highlight box is NOT (target-less welcome/final steps and
          during every scroll to a new target). Because it's exactly as dark as
          the highlight box's box-shadow, swapping between the two is seamless:
          the surrounding dark never disappears for a frame — only the bright
          hole fades in or out. It is plain — no animation, no transition. */}
      {!showHighlight && (
        <div
          aria-hidden="true"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: overlayZ,
            backgroundColor: `rgba(0,0,0,${dimAlpha})`,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Spotlight highlight — a single bright cutout in the dark overlay, with
          NO border/ring of any kind. Rendered ONLY after the target's final rect
          has been measured (scroll + size fully settled), so it never appears at
          a stale position and never drags during scroll. ONE element: the huge
          box-shadow is the surrounding dark and is held CONSTANT (0.6) so it
          never flickers; the element's own background fades from that same dark
          → transparent to "open" the hole. The box always renders at its full,
          correct size (top/left/width/height are static style props, never
          animated) so it can never appear at a smaller intermediate size — only
          the opacity of the hole fades in. It re-mounts each step (unmounted
          during the scroll), so the fade-in replays cleanly every time. Rounded
          corners keep the cutout looking intentional. */}
      {showHighlight && spotlightRect && (
        <motion.div
          aria-hidden="true"
          initial={{ backgroundColor: `rgba(0,0,0,${dimAlpha})` }}
          animate={{ backgroundColor: "rgba(0,0,0,0)" }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: "fixed",
            top: spotlightRect.top,
            left: spotlightRect.left,
            width: spotlightRect.width,
            height: spotlightRect.height,
            borderRadius: spotlightRect.borderRadius,
            zIndex: overlayZ,
            boxShadow: `0 0 0 9999px rgba(0,0,0,${dimAlpha})`,
            pointerEvents: "none",
          }}
        />
      )}

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
