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

// How long the measured rect must be quiet (no new setSpotlightRect) before the
// hole is revealed. Any double/undersized measurement lands within this window
// while the hole is still hidden, so the user only ever sees the final size.
const SETTLE_DELAY = 350;

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

// Wait for scroll to fully settle before measuring. We track the TARGET
// ELEMENT'S OWN rect (top AND left) rather than window.scrollY, because scroll
// can happen on any axis and in any container: scrollIntoView may scroll the
// window vertically, but the category tab bar scrolls the element *horizontally*
// inside its own container — window.scrollY never changes for that. Watching the
// element's rect stability catches all of it (window scroll, ancestor container
// scroll, horizontal or vertical), so we only measure once the element has truly
// come to rest at its FINAL position. Otherwise the spotlight springs to a
// transitional coord and lands offset.
const waitForScrollEnd = (el: HTMLElement, callback: () => void) => {
  let lastTop = Infinity;
  let lastLeft = Infinity;
  let lastWidth = Infinity;
  let lastHeight = Infinity;
  let stable = 0;
  let attempts = 0;
  const check = setInterval(() => {
    attempts++;
    const rect = el.getBoundingClientRect();
    const inView = rect.top > 0 && rect.top < window.innerHeight;
    // Rest = position (top AND left) AND size (width AND height) unchanged
    // (within 1px) since the previous frame. Size stability matters because a
    // drawer/target can finish moving while it's still EXPANDING — measuring
    // then would capture an undersized rect and the hole would resize in place.
    const settled =
      Math.abs(rect.top - lastTop) < 1 &&
      Math.abs(rect.left - lastLeft) < 1 &&
      Math.abs(rect.width - lastWidth) < 1 &&
      Math.abs(rect.height - lastHeight) < 1;
    if (settled && inView) {
      stable++;
      if (stable >= 3) {
        clearInterval(check);
        callback();
      }
    } else {
      stable = 0;
    }
    lastTop = rect.top;
    lastLeft = rect.left;
    lastWidth = rect.width;
    lastHeight = rect.height;
    // Safety: give up after ~2s and measure anyway so the tour never stalls
    if (attempts >= 40) {
      clearInterval(check);
      callback();
    }
  }, 50);
};

// The spotlight is a SINGLE bright cutout in the dark overlay — no border, no
// ring. It stays hidden (screen uniformly dark) during the scroll AND while the
// target's size settles: each measurement is recorded via commitRect, which
// debounces the reveal by SETTLE_DELAY. Only once no fresh rect has landed for
// that window does the hole fade in (~200ms) on opacity only, at the FINAL size.
// Any intermediate/undersized measurement therefore happens entirely off-screen,
// so the user never sees the hole resize — no scale, no size animation, no
// border. Only the hole's opacity animates.

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
  // with no hole (false — welcome / final steps, and while a cutout fades in).
  const [holeOpen, setHoleOpen] = useState(false);

  // Refs that don't need to trigger re-renders
  const currentHighlightedElRef = useRef<HTMLElement | null>(null);
  const overlayActiveRef = useRef(false); // true while overlay is shown/fading-in
  const mutationObserverRef = useRef<MutationObserver | null>(null);
  const goToStepRef = useRef<((step: number) => void) | null>(null);
  const prevTourKeyRef = useRef(tourKey); // Track previous tourKey to detect actual changes
  const menuOpenedByTourRef = useRef(false); // Track if we opened the menu
  const desktopMenuRef = useRef(false); // Track whether we opened the desktop dropdown (vs mobile sheet)
  const holeOpenRef = useRef(false); // Mirrors holeOpen for use inside stable callbacks
  // Pending fade-out → jump timer, so a rapid step change can cancel it.
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards applySpotlight to run EXACTLY ONCE per step. On menu steps both the
  // MutationObserver and the immediate setTimeout can fire — whichever wins
  // flips this, and the loser is ignored. Reset to false on every step change.
  const spotlightAppliedRef = useRef(false);
  // Pending immediate-check timer on menu steps, so we can cancel it the moment
  // the observer path wins (and vice versa).
  const menuCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Debounced reveal timer. The hole stays INVISIBLE while measurements land;
  // every new setSpotlightRect resets this timer. Only once no fresh rect has
  // arrived for SETTLE_DELAY ms do we reveal (fade in) at the final size — so
  // any intermediate/undersized measurement happens entirely off-screen.
  const revealTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = null;
      if (menuCheckTimeoutRef.current) clearTimeout(menuCheckTimeoutRef.current);
      menuCheckTimeoutRef.current = null;
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
      revealTimeoutRef.current = null;
      spotlightAppliedRef.current = false;
      // Instantly clear spotlight
      overlayActiveRef.current = false;
      setOverlayOpacity(0);
      setHoleOpen(false);
      holeOpenRef.current = false;
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

  // Record a fresh measurement WITHOUT revealing. Updates the rect (so the
  // hole, once shown, is at the latest size) and (re)arms the debounced reveal:
  // if another measurement lands before SETTLE_DELAY elapses, the timer resets
  // and the hole stays hidden until things go quiet.
  const commitRect = useCallback((rect: SpotlightRect) => {
    setSpotlightRect(rect);
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    revealTimeoutRef.current = setTimeout(() => {
      revealTimeoutRef.current = null;
      setHoleOpen(true);
      holeOpenRef.current = true;
    }, SETTLE_DELAY);
  }, []);

  const applySpotlight = useCallback((el: HTMLElement) => {
    // Run exactly once per step. On menu steps the MutationObserver and the
    // immediate setTimeout can both resolve; the first to reach here wins and
    // any later call is dropped, so the rect is never measured (and the hole
    // never resized) twice.
    if (spotlightAppliedRef.current) return;

    // Ignore elements hidden by CSS (e.g. sm:hidden on desktop)
    const check = el.getBoundingClientRect();
    if (!check.width && !check.height) return;

    spotlightAppliedRef.current = true;
    // The other menu-step path (if still pending) is now redundant — cancel it.
    if (menuCheckTimeoutRef.current) {
      clearTimeout(menuCheckTimeoutRef.current);
      menuCheckTimeoutRef.current = null;
    }
    mutationObserverRef.current?.disconnect();
    mutationObserverRef.current = null;

    // Clean up the previous highlighted element
    if (currentHighlightedElRef.current && currentHighlightedElRef.current !== el) {
      currentHighlightedElRef.current.style.position = "";
      currentHighlightedElRef.current.style.zIndex = "";
    }
    currentHighlightedElRef.current = el;
    el.style.position = "relative";
    el.style.zIndex = "51";
    overlayActiveRef.current = true;
    setOverlayOpacity(1);

    // Hide the spotlight instantly (screen goes uniformly dark, no hole/border)
    // so nothing is visible while we scroll — no border or fill can drag across
    // the page during the scroll.
    setHoleOpen(false);
    holeOpenRef.current = false;

    // Bring the target into view. scrollIntoView also scrolls the ☰ drawer's
    // OWN scroll container when the target lives inside it, so options like
    // Theme & Branding / QR Code are always scrolled into view within the
    // drawer. Wait for every axis to settle, then SNAP the spotlight on.
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    waitForScrollEnd(el, () => {
      const rect = el.getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      // Record the geometry but DON'T reveal yet — commitRect debounces the
      // reveal by SETTLE_DELAY. If a second (corrected) measurement lands, it
      // resets the timer, so the hole only ever fades in once the size is
      // quiet. All intermediate measuring happens while the hole is hidden.
      commitRect(fromRect(rect, 12));
    });
  }, [commitRect]);

  // ── Step navigation ────────────────────────────────────────────────────────

  const goToStep = useCallback(
    (newStep: number) => {
      const step = STEPS[newStep];
      if (!step) return;

      const prevStep = STEPS[currentStep];

      // Kill any pending MutationObserver + immediate-check timer
      mutationObserverRef.current?.disconnect();
      mutationObserverRef.current = null;
      if (menuCheckTimeoutRef.current) {
        clearTimeout(menuCheckTimeoutRef.current);
        menuCheckTimeoutRef.current = null;
      }
      // Cancel any pending reveal from the previous step and hide the hole
      // immediately, so nothing is visible while the new target is measured.
      if (revealTimeoutRef.current) {
        clearTimeout(revealTimeoutRef.current);
        revealTimeoutRef.current = null;
      }
      setHoleOpen(false);
      holeOpenRef.current = false;
      // New step → allow applySpotlight to run once again.
      spotlightAppliedRef.current = false;

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

          // Also check immediately in case the menu is already open. Stored in a
          // ref so the observer path (or a step change) can cancel it — and
          // applySpotlight's once-per-step guard drops it if it still fires.
          menuCheckTimeoutRef.current = setTimeout(() => {
            menuCheckTimeoutRef.current = null;
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
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    fadeTimeoutRef.current = null;
    if (menuCheckTimeoutRef.current) clearTimeout(menuCheckTimeoutRef.current);
    menuCheckTimeoutRef.current = null;
    if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
    revealTimeoutRef.current = null;
    spotlightAppliedRef.current = false;
    overlayActiveRef.current = false;
    setOverlayOpacity(0);
    setHoleOpen(false);
    holeOpenRef.current = false;
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
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      if (menuCheckTimeoutRef.current) clearTimeout(menuCheckTimeoutRef.current);
      if (revealTimeoutRef.current) clearTimeout(revealTimeoutRef.current);
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
  // The highlight box is rendered ONLY once a real target rect has been
  // measured (after scroll settled). Until then — and while scrolling to a new
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
          while scrolling to a new target). Because it's exactly as dark as the
          highlight box's box-shadow, swapping between the two is seamless: the
          surrounding dark never disappears for a frame — only the bright hole
          fades in or out. It is plain — no animation, no transition. */}
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
          has been measured (scroll fully settled), so it never appears at a
          stale position and never drags during scroll. ONE element: the huge
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
