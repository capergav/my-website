"use client";

import { useState, useEffect, useCallback } from "react";
import { createSupabaseClient } from "@/app/lib/supabase";

type Step = {
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    title: "Welcome to DineLinks",
    body: "This quick tour shows you everything you need to know. Your menu is already live — let's walk through how to manage it.",
  },
  {
    title: "We added a sample item for you",
    body: "We created a sample dish so you can see how items look. You can edit or delete it anytime — or leave it as a starting point.",
  },
  {
    title: "Categories keep your menu organised",
    body: "Each tab is a category — Starters, Mains, Desserts, Drinks, whatever fits your restaurant. Click a tab to switch between them. Drag to reorder.",
  },
  {
    title: "Adding a new category",
    body: "Click '+ Add category' in the tab bar to create a new section. You can rename or delete categories anytime from the Manage button.",
  },
  {
    title: "Your menu items",
    body: "Each card shows the dish name, price, photo, and dietary tags. The drag handle on the left lets you drag items into any order you want.",
  },
  {
    title: "The Available button",
    body: "Green dot means the item is live on your menu. Click it to mark an item as unavailable — it stays on your menu but shows as 'Currently unavailable' to customers. Perfect for 86ing something mid-service.",
  },
  {
    title: "The Edit button",
    body: "Click Edit to change an item's name, price, description, photo, or dietary tags. Changes go live the moment you save — no reprinting, no waiting.",
  },
  {
    title: "Make it look like yours",
    body: "Open the Menu button → Theme & Branding to change your colours, fonts, and upload your logo. There are 12 presets to get you started, or build a fully custom look.",
  },
  {
    title: "Your QR code is ready",
    body: "Open the Menu button → Download QR Code to get your table sticker. Customers scan it and land directly on your menu — translated into their language automatically.",
  },
  {
    title: "You're all set",
    body: "", // Will be set dynamically with slug
  },
];

const TOTAL_STEPS = STEPS.length;

export function OnboardingTour({
  tourKey,
  hasCompletedTour,
  userId,
  restaurantSlug,
}: {
  tourKey: number;
  hasCompletedTour?: boolean;
  userId?: string;
  restaurantSlug: string;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [visible, setVisible] = useState(false);

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

  const finish = useCallback(() => {
    setVisible(false);
    if (userId) {
      createSupabaseClient().auth.updateUser({ data: { has_completed_tour: true } });
    }
  }, [userId]);

  // Keyboard navigation
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") finish();
      else if (e.key === "ArrowRight" && currentStep < TOTAL_STEPS - 1) setCurrentStep((s) => s + 1);
      else if (e.key === "ArrowLeft" && currentStep > 0) setCurrentStep((s) => s - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, currentStep, finish]);

  if (!visible) return null;

  const isFirst = currentStep === 0;
  const isLast = currentStep === TOTAL_STEPS - 1;

  // Dynamic body for the final step
  const stepBody = isLast
    ? `Your menu is live at dinelinks.com/menu/${restaurantSlug}. Add your real dishes, set your theme, and you're ready for your first customer.`
    : STEPS[currentStep].body;

  const handleNext = () => {
    if (isLast) finish();
    else setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    if (!isFirst) setCurrentStep((s) => s - 1);
  };

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;

  return (
    <>
      {/* Semi-transparent backdrop — click-through disabled to focus attention */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.3)",
          zIndex: 9998,
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {/* Tooltip card — fixed bottom center */}
      <div
        style={{
          position: "fixed",
          bottom: 20,
          left: "50%",
          transform: "translateX(-50%)",
          width: "calc(100% - 32px)",
          maxWidth: 380,
          background: "#ffffff",
          border: "1px solid #e8e4dd",
          borderRadius: 14,
          boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08)",
          zIndex: 9999,
          overflow: "hidden",
        }}
      >
        {/* Progress bar */}
        <div style={{ height: 3, background: "#f0f0f0", width: "100%" }}>
          <div
            style={{
              height: "100%",
              width: `${progressPercent}%`,
              background: "var(--accent, #8b6914)",
              transition: "width 300ms ease",
            }}
          />
        </div>

        {/* Content */}
        <div style={{ padding: "20px 22px 22px" }}>
          {/* Header: title + step counter */}
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
              marginBottom: 10,
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 600,
                color: "#1a1a1a",
                lineHeight: 1.3,
              }}
            >
              {STEPS[currentStep].title}
            </h3>
            <span
              style={{
                fontSize: 11,
                color: "#888",
                flexShrink: 0,
                paddingTop: 4,
                whiteSpace: "nowrap",
              }}
            >
              {currentStep + 1} of {TOTAL_STEPS}
            </span>
          </div>

          {/* Body */}
          <p
            style={{
              margin: "0 0 20px 0",
              fontSize: 14,
              lineHeight: 1.6,
              color: "#555",
            }}
          >
            {stepBody}
          </p>

          {/* Buttons */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
            className="tour-buttons"
          >
            {/* Main navigation row */}
            <div
              style={{
                display: "flex",
                gap: 10,
                width: "100%",
              }}
            >
              {!isFirst && (
                <button
                  type="button"
                  onClick={handleBack}
                  style={{
                    flex: 1,
                    minHeight: 44,
                    padding: "0 16px",
                    borderRadius: 10,
                    border: "1px solid #ddd",
                    background: "#fff",
                    color: "#333",
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  Back
                </button>
              )}
              <button
                type="button"
                onClick={handleNext}
                style={{
                  flex: isFirst ? 1 : 1,
                  minHeight: 44,
                  padding: "0 16px",
                  borderRadius: 10,
                  border: "none",
                  background: "#1a1a1a",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                {isLast ? "Finish" : "Next"}
              </button>
            </div>

            {/* Skip tour — only on first step */}
            {isFirst && (
              <button
                type="button"
                onClick={finish}
                style={{
                  width: "100%",
                  minHeight: 36,
                  padding: "0 16px",
                  background: "transparent",
                  border: "none",
                  color: "#888",
                  fontSize: 13,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Skip tour
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
