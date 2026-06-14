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
    body: "", // Dynamic — set in render
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

export function OnboardingTour({
  tourKey,
  hasCompletedTour,
  userId,
  slug,
  openMenu,
  closeMenu,
  isMenuOpen,
}: {
  tourKey: number;
  hasCompletedTour?: boolean;
  userId?: string;
  slug: string;
  openMenu: () => void;
  closeMenu: () => void;
  isMenuOpen: boolean;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [spotlightRect, setSpotlightRect] = useState<SpotlightRect | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  const currentHighlightedElRef = useRef<HTMLElement | null>(null);

  // Show tour when hasCompletedTour is explicitly false (new user)
  useEffect(() => {
    if (hasCompletedTour === false) setVisible(true);
  }, [hasCompletedTour]);

  // Replay tour when tourKey increments
  useEffect(() => {
    if (tourKey > 0) {
      setCurrentStep(0);
      setVisible(true);
    }
  }, [tourKey]);

  const clearSpotlight = useCallback(() => {
    setOverlayVisible(false);
    setSpotlightRect(null);
    if (currentHighlightedElRef.current) {
      currentHighlightedElRef.current.style.position = "";
      currentHighlightedElRef.current.style.zIndex = "";
      currentHighlightedElRef.current = null;
    }
  }, []);

  const applySpotlight = useCallback((el: Element) => {
    // Don't spotlight elements hidden by CSS (e.g. sm:hidden on desktop)
    const initialRect = el.getBoundingClientRect();
    if (initialRect.width === 0 && initialRect.height === 0) return;

    el.scrollIntoView({ behavior: "smooth", block: "center" });

    // Wait for scroll to settle before measuring position
    setTimeout(() => {
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      const padding = 12;
      setSpotlightRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        borderRadius: 10,
      });
      setOverlayVisible(true);
      // Lift element above overlay so it appears bright through the hole
      (el as HTMLElement).style.position = "relative";
      (el as HTMLElement).style.zIndex = "51";
      currentHighlightedElRef.current = el as HTMLElement;
    }, 450);
  }, []);

  // Effect 1: control menu open/close based on step
  useEffect(() => {
    if (!visible) return;
    if (currentStep === 7 || currentStep === 8) {
      openMenu();
    } else {
      closeMenu();
    }
  }, [currentStep, visible, openMenu, closeMenu]);

  // Effect 2: spotlight for non-menu steps (elements already in DOM)
  useEffect(() => {
    if (!visible) return;
    const step = STEPS[currentStep];
    if (!step || step.menuOpen) {
      // Menu steps handled by Effect 3 — just clear any previous spotlight here
      clearSpotlight();
      return;
    }
    clearSpotlight();
    if (!step.targetSelector) return;

    const timer = setTimeout(() => {
      const el = document.querySelector(step.targetSelector!);
      if (el) applySpotlight(el);
    }, 150);

    return () => clearTimeout(timer);
  }, [currentStep, visible, clearSpotlight, applySpotlight]);

  // Effect 3: once menu IS open, spotlight the drawer element
  // This is reactive — fires after React renders the drawer into the DOM
  useEffect(() => {
    if (!visible || !isMenuOpen) return;
    if (currentStep === 7) {
      const el = document.querySelector('[data-tour="theme-branding-option"]');
      if (el) applySpotlight(el);
    }
    if (currentStep === 8) {
      const el = document.querySelector('[data-tour="qr-option"]');
      if (el) applySpotlight(el);
    }
  }, [isMenuOpen, currentStep, visible, applySpotlight]);

  // Recalculate spotlight position on resize / orientation change
  useEffect(() => {
    const handleResize = () => {
      if (!currentHighlightedElRef.current) return;
      const rect = currentHighlightedElRef.current.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) return;
      const padding = 12;
      setSpotlightRect({
        top: rect.top - padding,
        left: rect.left - padding,
        width: rect.width + padding * 2,
        height: rect.height + padding * 2,
        borderRadius: 10,
      });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const finish = useCallback(() => {
    clearSpotlight();
    closeMenu();
    setVisible(false);
    if (userId) {
      createSupabaseClient().auth.updateUser({ data: { has_completed_tour: true } });
    }
  }, [userId, clearSpotlight, closeMenu]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" && currentStep < TOTAL_STEPS - 1)
        setCurrentStep((s) => s + 1);
      else if (e.key === "ArrowLeft" && currentStep > 0)
        setCurrentStep((s) => s - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, currentStep, finish]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearSpotlight();
  }, [clearSpotlight]);

  if (!visible) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === TOTAL_STEPS - 1;

  const stepBody = isLast
    ? `Your menu is live at dinelinks.com/menu/${slug}. Add your real dishes, set your theme, and you're ready for your first customer.`
    : STEPS[currentStep].body;

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <>
      {/* SVG spotlight overlay — dark everywhere, bright hole at target */}
      {overlayVisible && spotlightRect && (
        <svg
          className="fixed inset-0 w-full h-full pointer-events-none"
          style={{ zIndex: 40 }}
        >
          <defs>
            <mask id="spotlight-mask">
              {/* White = show dark overlay everywhere */}
              <rect width="100%" height="100%" fill="white" />
              {/* Black = cut out the hole — this area becomes transparent */}
              <rect
                x={spotlightRect.left}
                y={spotlightRect.top}
                width={spotlightRect.width}
                height={spotlightRect.height}
                rx={spotlightRect.borderRadius}
                fill="black"
              />
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0,0,0,0.6)"
            mask="url(#spotlight-mask)"
          />
        </svg>
      )}

      {/* Tour card — z-index 60, above overlay (40) and lifted element (51) */}
      <AnimatePresence>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
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
            {/* Header: title + step counter */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="text-base font-semibold text-gray-900 leading-snug">
                {STEPS[currentStep].title}
              </h3>
              <span className="text-xs text-gray-400 flex-shrink-0 pt-0.5">
                {currentStep + 1} of {TOTAL_STEPS}
              </span>
            </div>

            {/* Body */}
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              {stepBody}
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="order-2 sm:order-1">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((s) => s - 1)}
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
                  else setCurrentStep((s) => s + 1);
                }}
                className="order-1 sm:order-2 w-full sm:w-auto px-5 py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity hover:opacity-90"
                style={{ backgroundColor: "var(--accent, #8b6914)" }}
              >
                {isLast ? "Finish" : "Next"}
              </button>
            </div>

            {/* Skip tour — only on first step */}
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
      </AnimatePresence>
    </>
  );
}
