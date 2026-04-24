"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useLanguage } from "@/app/context/LanguageContext";
import { DietaryIcons, DietaryLegend } from "./DietaryIcons";
import { TranslatedText } from "./TranslatedText";
import {
  Sandwich, UtensilsCrossed, Coffee, IceCream, Fish, Wine, Beer,
  Soup, Pizza, Beef, Croissant, GlassWater, Flame, Salad,
} from "lucide-react";

export type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  image_url?: string | null;
  category?: string | null;
  available?: boolean | null;
  chefs_favorite?: boolean | null;
  gluten_free?: boolean | null;
  nut_free?: boolean | null;
  vegan?: boolean | null;
  vegetarian?: boolean | null;
  dairy_free?: boolean | null;
  spicy?: boolean | null;
};

export const DIET_FILTER_OPTIONS = [
  { value: "all",            labelKey: "filter.all"           },
  { value: "nut_free",       labelKey: "filter.nutFree"       },
  { value: "vegetarian",     labelKey: "filter.vegetarian"    },
  { value: "vegan",          labelKey: "filter.vegan"         },
  { value: "gluten_free",    labelKey: "filter.glutenFree"    },
  { value: "dairy_free",     labelKey: "filter.dairyFree"     },
  { value: "chefs_favorite", labelKey: "filter.chefsFavorite" },
  { value: "spicy",          labelKey: "filter.spicy"         },
] as const;

export type MenuTabsProps = {
  grouped: Record<string, MenuItem[]>;
  sortedCategories: string[];
  categoryNotes?: Record<string, string>;
};

// Lucide icon map for category thumbnails
type LucideIcon = React.ComponentType<{ size?: number; className?: string; strokeWidth?: number }>;

const CATEGORY_ICON: Record<string, LucideIcon> = {
  Breakfast:   Croissant,
  Brunch:      Croissant,
  Appetizers:  Salad,
  Starters:    Salad,
  Salads:      Salad,
  Soups:       Soup,
  Sandwiches:  Sandwich,
  Burgers:     Sandwich,
  Pizza:       Pizza,
  Pasta:       UtensilsCrossed,
  Pastas:      UtensilsCrossed,
  Mains:       UtensilsCrossed,
  Seafood:     Fish,
  Fish:        Fish,
  Steaks:      Beef,
  Meat:        Beef,
  Sides:       UtensilsCrossed,
  Desserts:    IceCream,
  Drinks:      Coffee,
  Beverages:   Coffee,
  Coffee:      Coffee,
  Cocktails:   GlassWater,
  Wine:        Wine,
  Beer:        Beer,
  Spicy:       Flame,
};

function CategoryIcon({ name, isActive }: { name: string; isActive: boolean }) {
  const Icon = CATEGORY_ICON[name];
  return (
    <div
      className="w-full h-full flex items-center justify-center transition-colors"
      style={{ background: isActive ? "var(--main-color)" : "var(--card-border)" }}
    >
      {Icon ? (
        <Icon
          size={22}
          strokeWidth={1.5}
          className={isActive ? "text-white" : "text-[var(--muted)]"}
        />
      ) : (
        <span className={`text-sm font-bold ${isActive ? "text-white" : "text-[var(--muted)]"}`}>
          {name.slice(0, 1).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function formatPrice(price: number): string {
  if (Number.isInteger(price)) return `$${price}`;
  return `$${price.toFixed(2)}`;
}

export function MenuTabs({ grouped, sortedCategories, categoryNotes = {} }: MenuTabsProps) {
  const { t, getCategoryLabel } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(sortedCategories[0] ?? "");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [dietFilter, setDietFilter] = useState<string>("all");

  if (sortedCategories.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-[var(--muted)] text-center">
        {t("ui.noMenuItems")}
      </div>
    );
  }

  const rawItems = grouped[activeCategory] ?? [];
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const items = useMemo(() => {
    if (dietFilter === "all") return rawItems;
    return rawItems.filter((item) => Boolean((item as Record<string, unknown>)[dietFilter]));
  }, [rawItems, dietFilter]);

  // ── Detail view ───────────────────────────────────────────────────────────
  if (selectedItem) {
    return (
      <div className="min-h-screen bg-[var(--background)] pb-[env(safe-area-inset-bottom)]">
        {/* Back bar */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--card-border)] pt-[env(safe-area-inset-top)]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="flex items-center gap-2 text-[var(--foreground)] active:text-[var(--accent)] transition-colors font-medium min-h-[48px] py-3 -mx-2 px-2 touch-manipulation"
            >
              <svg className="w-5 h-5 flex-shrink-0 rtl:scale-x-[-1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">{t("ui.backToMenu")}</span>
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-16 w-full min-w-0 overflow-hidden">
          {/* Only show image if the item actually has one — no placeholder */}
          {selectedItem.image_url && (
            <div className="aspect-[4/3] sm:aspect-[3/2] -mx-4 sm:mx-0 sm:rounded-2xl overflow-hidden bg-[var(--card-border)] mt-4">
              <img
                src={selectedItem.image_url}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className={selectedItem.image_url ? "mt-6 sm:mt-8 min-w-0" : "mt-6 min-w-0"}>
            <div className="flex justify-between items-start gap-4 flex-wrap">
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[var(--foreground)] min-w-0 text-wrap-balance">
                <TranslatedText text={selectedItem.name} />
              </h1>
              <span className="font-semibold text-[var(--accent)] text-2xl flex-shrink-0 tabular-nums">
                {formatPrice(Number(selectedItem.price))}
              </span>
            </div>
            <DietaryIcons item={selectedItem} />
            {selectedItem.description && (
              <p className="text-[var(--muted)] mt-4 text-base sm:text-lg leading-relaxed text-wrap-force whitespace-pre-line">
                <TranslatedText text={selectedItem.description} as="span" />
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Category listing ──────────────────────────────────────────────────────
  return (
    <>
      {/* Category tab strip — hidden when only one category */}
      {sortedCategories.length > 1 && <div className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--card-border)] shadow-sm">
        <div className="relative max-w-4xl mx-auto px-3 sm:px-6">
          {/* Left/right fade edges */}
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-[var(--background)] to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-[var(--background)] to-transparent" />
          <div className="tabs-scroll flex gap-3 overflow-x-auto py-4 scrollbar-none px-1 snap-x snap-mandatory">
            {sortedCategories.map((category, idx) => {
              const firstImg = (grouped[category] ?? [])[0]?.image_url ?? null;
              const isActive = activeCategory === category;
              return (
                <motion.button
                  key={category}
                  type="button"
                  onClick={() => { setActiveCategory(category); setDietFilter("all"); }}
                  className={`flex-shrink-0 w-[72px] sm:w-24 flex flex-col items-center gap-1.5 rounded-2xl transition-all duration-200 touch-manipulation py-2 snap-start ${
                    isActive
                      ? "ring-2 ring-[var(--main-color)] ring-offset-2 ring-offset-[var(--background)] shadow-md"
                      : "opacity-70 hover:opacity-100"
                  }`}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: isActive ? 1 : 0.7, x: 0 }}
                  transition={{ duration: 0.35, delay: idx * 0.08, ease: [0.22, 1, 0.36, 1] }}
                  whileTap={{ scale: 0.94 }}
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden flex-shrink-0 transition-all duration-200">
                    {firstImg ? (
                      <img src={firstImg} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <CategoryIcon name={category} isActive={isActive} />
                    )}
                  </div>
                  {/* Label */}
                  <span
                    className={`text-[10px] sm:text-xs font-semibold text-center leading-tight px-1 w-full truncate uppercase tracking-wide ${
                      isActive ? "text-[var(--main-color)]" : "text-[var(--muted)]"
                    }`}
                  >
                    {getCategoryLabel(category)}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>}

      {/* Category content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-[env(safe-area-inset-bottom)]">
        {/* Header + filter */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--foreground)]">
              {getCategoryLabel(activeCategory)}
            </h2>
            {categoryNotes[activeCategory] && (
              <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">
                <TranslatedText text={categoryNotes[activeCategory]} as="span" />
              </p>
            )}
          </div>
          <div className="flex-shrink-0">
            <select
              value={dietFilter}
              onChange={(e) => setDietFilter(e.target.value)}
              className="w-full sm:w-auto min-w-[150px] px-3 py-2 rounded-xl border border-[var(--card-border)] bg-[var(--card)] text-[var(--foreground)] text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[var(--accent)] cursor-pointer"
              aria-label={t("filter.all")}
            >
              {DIET_FILTER_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Dietary legend — at the top of the item list */}
        <DietaryLegend items={rawItems} />

        {/* Items */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            className="space-y-3 sm:space-y-4 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
          {items.length === 0 && (
            <p className="text-center text-[var(--muted)] py-12 text-sm">
              No items match this filter.
            </p>
          )}
          {items.map((item, idx) => (
            <motion.article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedItem(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedItem(item);
                }
              }}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2, boxShadow: '0 8px 24px -6px rgba(0,0,0,0.12)' }}
              whileTap={{ scale: 0.99 }}
              className="bg-[var(--card)] rounded-2xl overflow-hidden border border-[var(--card-border)] shadow-sm hover:border-[var(--accent)]/20 transition-colors duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 touch-manipulation flex flex-row"
            >
              {/* Image on the left — only when present */}
              {item.image_url && (
                <div className="w-28 sm:w-36 flex-shrink-0 overflow-hidden bg-[var(--card-border)]">
                  <motion.img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.04 }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-4 sm:p-5 min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-baseline gap-3">
                  <h3 className="font-serif text-lg sm:text-xl font-semibold text-[var(--foreground)] min-w-0 text-wrap-balance">
                    <TranslatedText text={item.name} />
                  </h3>
                  {item.chefs_favorite ? (
                    <motion.span
                      className="font-semibold text-[var(--accent)] whitespace-nowrap flex-shrink-0 tabular-nums"
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                    >
                      {formatPrice(Number(item.price))}
                    </motion.span>
                  ) : (
                    <span className="font-semibold text-[var(--accent)] whitespace-nowrap flex-shrink-0 tabular-nums">
                      {formatPrice(Number(item.price))}
                    </span>
                  )}
                </div>
                <DietaryIcons item={item} />
                {item.description && (
                  <p className="text-[var(--muted)] mt-2 text-sm sm:text-base leading-relaxed line-clamp-2 text-wrap-force whitespace-pre-line">
                    <TranslatedText text={item.description} as="span" />
                  </p>
                )}
                <p className="text-[var(--accent)]/70 text-xs mt-3 font-medium tracking-wide">
                  {t("ui.tapToReadMore")} →
                </p>
              </div>
            </motion.article>
          ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
