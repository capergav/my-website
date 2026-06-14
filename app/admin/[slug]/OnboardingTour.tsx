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

// CSS for the pulsing highlight ring
const HIGHLIGHT_STYLE = `
  @keyframes tour-pulse {
    0%, 100% { box-shadow: 0 0 0 3px var(--accent, #8b6914), 0 0 12px var(--accent, #8b6914); }
    50% { box-shadow: 0 0 0 4px var(--accent, #8b6914), 0 0 20px var(--accent, #8b6914); }
  }
  [data-tour-highlight="true"] {
    animation: tour-pulse 1.5s ease-in-out infinite;
    position: relative;
    z-index: 100;
    border-radius: 12px;
  }
`;

export function OnboardingTour({
  tourKey,
  hasCompletedTour,
  userId,
  slug,
  openMenu,
  closeMenu,
}: {
  tourKey: number;
  hasCompletedTour?: boolean;
  userId?: string;
  slug: string;
  openMenu: () => void;
  closeMenu: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const highlightedRef = useRef<Element | null>(null);

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

  // Clear highlight from previous element
  const clearHighlight = useCallback(() => {
    if (highlightedRef.current) {
      highlightedRef.current.removeAttribute("data-tour-highlight");
      highlightedRef.current = null;
    }
  }, []);

  // Apply highlight to current step's target
  const applyHighlight = useCallback((selector: string | null) => {
    clearHighlight();
    if (!selector) return;

    // Small delay to let menu animations complete
    setTimeout(() => {
      const el = document.querySelector(selector);
      if (el) {
        el.setAttribute("data-tour-highlight", "true");
        highlightedRef.current = el;
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  }, [clearHighlight]);

  // Handle step changes — manage menu state and highlights
  const goToStep = useCallback((newStep: number) => {
    const stepConfig = STEPS[newStep];
    if (!stepConfig) return;

    // Handle menu state
    if (stepConfig.menuOpen) {
      openMenu();
      // Apply highlight after menu opens
      setTimeout(() => applyHighlight(stepConfig.targetSelector), 250);
    } else {
      closeMenu();
      applyHighlight(stepConfig.targetSelector);
    }

    setCurrentStep(newStep);
  }, [openMenu, closeMenu, applyHighlight]);

  // Initial highlight when tour becomes visible
  useEffect(() => {
    if (visible && currentStep === 0) {
      applyHighlight(STEPS[0].targetSelector);
    }
  }, [visible, currentStep, applyHighlight]);

  const finish = useCallback(() => {
    clearHighlight();
    closeMenu();
    setVisible(false);
    if (userId) {
      createSupabaseClient().auth.updateUser({ data: { has_completed_tour: true } });
    }
  }, [userId, clearHighlight, closeMenu]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" && currentStep < TOTAL_STEPS - 1) goToStep(currentStep + 1);
      else if (e.key === "ArrowLeft" && currentStep > 0) goToStep(currentStep - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, currentStep, finish, goToStep]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearHighlight();
  }, [clearHighlight]);

  if (!visible) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === TOTAL_STEPS - 1;

  // Dynamic body for the final step
  const stepBody = isLast
    ? `Your menu is live at dinelinks.com/menu/${slug}. Add your real dishes, set your theme, and you're ready for your first customer.`
    : STEPS[currentStep].body;

  const handleNext = () => {
    if (isLast) {
      finish();
    } else {
      goToStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      goToStep(currentStep - 1);
    }
  };

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <>
      {/* Inject highlight animation styles */}
      <style dangerouslySetInnerHTML={{ __html: HIGHLIGHT_STYLE }} />

      {/* Semi-transparent backdrop */}
      <div
        className="fixed inset-0 bg-black/25 z-[9998]"
        onClick={(e) => e.stopPropagation()}
      />

      {/* Tooltip card — fixed bottom center */}
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="fixed bottom-5 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-[400px] bg-white border border-[#e8e4dd] rounded-2xl shadow-xl z-[9999] overflow-hidden"
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
          <div className="p-5 sm:p-6">
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
              {/* Back button or spacer */}
              <div className="order-2 sm:order-1">
                {!isFirst && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
                  >
                    Back
                  </button>
                )}
              </div>

              {/* Next/Finish button */}
              <button
                type="button"
                onClick={handleNext}
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
