"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "@/app/context/LanguageContext";
import { t } from "@/app/lib/translations";
import { MessageSquare, X, Star } from "lucide-react";

const CATEGORIES = [
  { key: "food", translationKey: "feedback.category.food" },
  { key: "service", translationKey: "feedback.category.service" },
  { key: "atmosphere", translationKey: "feedback.category.atmosphere" },
  { key: "menuClarity", translationKey: "feedback.category.menuClarity" },
] as const;

export function FeedbackForm({ restaurantId }: { restaurantId: string }) {
  const { locale } = useLanguage();
  const isRtl = locale === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [visitType, setVisitType] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showThanks, setShowThanks] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [pageLoadTime] = useState(() => Date.now());

  // Anti-bot: only allow submit after 10 seconds on page
  useEffect(() => {
    const timer = setTimeout(() => setCanSubmit(true), 10000);
    return () => clearTimeout(timer);
  }, []);

  const toggleCategory = (key: string) => {
    setSelectedCategories((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const handleSubmit = async () => {
    if (!rating || isSubmitting || !canSubmit) return;

    // Additional anti-bot check
    if (Date.now() - pageLoadTime < 10000) return;

    setIsSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurantId,
          rating,
          categories: selectedCategories.length > 0 ? selectedCategories : null,
          comment: comment.trim() || null,
          visitType,
          language: locale,
          website: "", // Honeypot — must be empty
        }),
      });

      if (res.ok) {
        setShowThanks(true);
        setTimeout(() => {
          setIsOpen(false);
          // Reset form
          setRating(0);
          setSelectedCategories([]);
          setComment("");
          setVisitType(null);
          setShowThanks(false);
        }, 2000);
      }
    } catch {
      // Silently fail
    } finally {
      setIsSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <>
      {/* Floating feedback button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed z-50 flex items-center gap-2 px-4 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
        style={{
          position: "fixed",
          bottom: "calc(env(safe-area-inset-bottom, 0px) + 24px)",
          right: "16px",
          backgroundColor: "var(--accent)",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <MessageSquare size={18} />
        <span className="text-sm font-medium">{t("feedback.button", locale)}</span>
      </button>

      {/* Modal backdrop + sheet */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            dir={isRtl ? "rtl" : "ltr"}
            className="w-full max-w-lg rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto"
            style={{ animation: "slideUp 0.2s ease-out", backgroundColor: "var(--card)", color: "var(--foreground)" }}
          >
            {/* Header */}
            <div className="sticky top-0 px-5 py-4 flex items-center justify-between border-b" style={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)" }}>
              <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
                {t("feedback.title", locale)}
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full transition-colors"
                style={{ color: "var(--foreground)", opacity: 0.5 }}
              >
                <X size={20} />
              </button>
            </div>

            {showThanks ? (
              <div className="px-5 py-12 text-center">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: "var(--accent)" }}>
                  <Star size={32} className="text-white fill-white" />
                </div>
                <p className="text-lg font-medium" style={{ color: "var(--foreground)" }}>
                  {t("feedback.thanks", locale)}
                </p>
              </div>
            ) : (
              <div className="px-5 py-5 space-y-6">
                {/* Star rating */}
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={36}
                        className="transition-colors"
                        style={
                          star <= displayRating
                            ? { color: "var(--accent)", fill: "var(--accent)" }
                            : { color: "var(--muted)", opacity: 0.4 }
                        }
                      />
                    </button>
                  ))}
                </div>

                {/* Category chips */}
                <div>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {CATEGORIES.map(({ key, translationKey }) => {
                      const selected = selectedCategories.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => toggleCategory(key)}
                          className="px-3.5 py-1.5 rounded-full text-sm font-medium border transition-all"
                          style={selected
                            ? { backgroundColor: "var(--accent)", borderColor: "transparent", color: "#fff" }
                            : { backgroundColor: "var(--card)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                        >
                          {t(translationKey, locale)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Visit type */}
                <div>
                  <p className="text-sm mb-2 text-center" style={{ color: "var(--muted)" }}>
                    {t("feedback.visitType", locale)}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {(["dineIn", "takeaway"] as const).map((type) => {
                      const selected = visitType === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setVisitType(visitType === type ? null : type)}
                          className="px-4 py-1.5 rounded-lg text-sm font-medium border transition-all"
                          style={selected
                            ? { backgroundColor: "var(--accent)", borderColor: "transparent", color: "#fff" }
                            : { backgroundColor: "var(--card)", borderColor: "var(--card-border)", color: "var(--foreground)" }}
                        >
                          {t(`feedback.${type}`, locale)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Comment */}
                <div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value.slice(0, 300))}
                    placeholder={t("feedback.comment", locale)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border resize-none focus:outline-none focus:ring-2 focus:ring-offset-0"
                    style={{
                      backgroundColor: "var(--card)",
                      color: "var(--foreground)",
                      borderColor: "color-mix(in srgb, var(--accent) 30%, transparent)",
                      "--tw-ring-color": "var(--accent)",
                    } as React.CSSProperties}
                  />
                  <p className="text-xs text-right mt-1" style={{ color: "var(--muted)" }}>
                    {comment.length}/300
                  </p>
                </div>

                {/* Honeypot — hidden from users */}
                <input
                  type="text"
                  name="website"
                  autoComplete="off"
                  tabIndex={-1}
                  style={{ position: "absolute", left: "-9999px", opacity: 0 }}
                />

                {/* Submit */}
                <button
                  onClick={handleSubmit}
                  disabled={!rating || isSubmitting || !canSubmit}
                  className="w-full py-3 rounded-xl text-white font-medium text-base transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: "var(--accent)" }}
                >
                  {isSubmitting ? "..." : t("feedback.submit", locale)}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
