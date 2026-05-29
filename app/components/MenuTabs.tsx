"use client";

import { useState, useMemo, useCallback, useRef, useEffect, type ReactNode } from "react";
import { motion, AnimatePresence } from "motion/react";
import { trackEvent, detectDevice } from "@/lib/analytics";
import { useLanguage } from "@/app/context/LanguageContext";
import { DietaryIcons, DietaryLegend } from "./DietaryIcons";
import { TranslatedText } from "./TranslatedText";
import {
  Sandwich, UtensilsCrossed, Coffee, IceCream, Fish, Wine, Beer,
  Soup, Pizza, Beef, Croissant, GlassWater, Flame, Salad,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import type { Locale } from "@/app/lib/translations";

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
  price_suffix?: string | null;
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
  categoryImageMap?: Record<string, { show: boolean; url: string | null; useBanner?: boolean; bannerUrl?: string | null; imageMode?: string | null }>;
  restaurantId?: string;
  language?: string;
  allowAutoTranslate?: boolean;
  showCurrencySymbol?: boolean;
};

// Renders a category name: uses static translation table for known categories,
// falls back to <TranslatedText> for custom/unknown category names.
function CategoryName({ name }: { name: string }): ReactNode {
  const { getCategoryLabel } = useLanguage();
  const staticLabel = getCategoryLabel(name);
  if (staticLabel !== name) return staticLabel;
  return <TranslatedText text={name} />;
}

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

function formatPrice(price: number, showSymbol = true): string {
  if (!showSymbol) {
    return new Intl.NumberFormat('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
  }
  return new Intl.NumberFormat('en-CA', { style: 'currency', currency: 'CAD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(price);
}

function hasDetails(item: MenuItem): boolean {
  const hasDesc = (item.description?.trim().length ?? 0) > 10;
  const hasImg = Boolean(item.image_url);
  const hasDiet = Boolean(item.chefs_favorite || item.gluten_free || item.nut_free || item.vegan || item.vegetarian || item.dairy_free || item.spicy);
  return hasDesc || hasImg || hasDiet;
}

export function MenuTabs({ grouped, sortedCategories, categoryNotes = {}, categoryImageMap = {}, restaurantId, language, allowAutoTranslate, showCurrencySymbol = true }: MenuTabsProps) {
  const { t, getCategoryLabel, setLocale, locale } = useLanguage();
  const [activeCategory, setActiveCategory] = useState(sortedCategories[0] ?? "");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [dietFilter, setDietFilter] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  // Drag-to-scroll state for category tab strip
  const tabDragRef = useRef({ active: false, startX: 0, scrollLeft: 0, didDrag: false });
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const getSession = useCallback(() => {
    if (typeof window === "undefined") return "";
    let s = sessionStorage.getItem("dl_session");
    if (!s) { s = crypto.randomUUID(); sessionStorage.setItem("dl_session", s); }
    return s;
  }, []);

  const fireTrack = useCallback((type: "item_click" | "category_view" | "language_change", extra?: { item_id?: string; category?: string; language?: string }) => {
    if (!restaurantId) return;
    const sessionId = getSession();
    trackEvent({
      restaurant_id: restaurantId,
      event_type: type,
      session_id: sessionId,
      device_type: detectDevice(),
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      ...extra,
    });
  }, [restaurantId, getSession]);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener('scroll', updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => { el.removeEventListener('scroll', updateScrollState); ro.disconnect(); };
  }, [updateScrollState]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!allowAutoTranslate) return;
    const stored = typeof window !== 'undefined' ? localStorage.getItem('menusnap-locale') : null;
    if (stored) return;
    const browserLang = navigator.language.split('-')[0];
    const supported: Locale[] = ["en", "fr", "zh", "ar", "es", "ko", "pa", "yue", "tl", "hi"];
    const match = supported.find(l => l === browserLang);
    if (match) setLocale(match);
  }, [allowAutoTranslate, setLocale]);

  const scrollLeft = () => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const scrollRight = () => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });

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
              <h1 className="text-3xl sm:text-4xl font-semibold text-[var(--foreground)] min-w-0 text-wrap-balance">
                <TranslatedText text={selectedItem.name} />
              </h1>
              <span className="font-semibold text-[var(--accent)] text-2xl flex-shrink-0 tabular-nums">
                {formatPrice(Number(selectedItem.price), showCurrencySymbol)}
                {selectedItem.price_suffix && <span className="text-lg font-normal opacity-70 ml-1">{selectedItem.price_suffix}</span>}
              </span>
            </div>
            <DietaryIcons item={selectedItem} />
            {selectedItem.description && (
              <p className="text-[var(--muted)] mt-4 text-base sm:text-lg leading-relaxed text-wrap-force whitespace-pre-line break-words [overflow-wrap:anywhere]">
                <TranslatedText text={selectedItem.description} as="span" />
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Category listing ──────────────────────────────────────────────────────
  // If no category has show_image enabled, render simple pill tabs instead of image cards
  const anyCategoryUsesImages = sortedCategories.some(cat => categoryImageMap[cat]?.show === true);

  return (
    <>
      {/* Category tab strip — hidden when only one category */}
      {sortedCategories.length > 1 && (
        <div className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--card-border)] shadow-sm">
          <div className="relative max-w-4xl mx-auto px-3 sm:px-6">
            {/* Left/right fade edges */}
            <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-r from-[var(--background)] to-transparent" />
            <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 z-10 bg-gradient-to-l from-[var(--background)] to-transparent" />
            {canScrollLeft && (
              <button type="button" onClick={scrollLeft}
                className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-[var(--card)] border border-[var(--card-border)] shadow-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Scroll categories left">
                <ChevronLeft size={16} />
              </button>
            )}
            {canScrollRight && (
              <button type="button" onClick={scrollRight}
                className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-9 h-9 items-center justify-center rounded-full bg-[var(--card)] border border-[var(--card-border)] shadow-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                aria-label="Scroll categories right">
                <ChevronRight size={16} />
              </button>
            )}
            <div
              ref={scrollRef}
              className="tabs-scroll flex gap-2 overflow-x-auto py-3 scrollbar-none px-1 snap-x snap-mandatory"
              onPointerDown={(e) => {
                const el = scrollRef.current;
                if (!el) return;
                tabDragRef.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, didDrag: false };
              }}
              onPointerMove={(e) => {
                const drag = tabDragRef.current;
                const el = scrollRef.current;
                if (!drag.active || !el || e.buttons === 0) return;
                const dx = e.clientX - drag.startX;
                if (Math.abs(dx) > 5) {
                  drag.didDrag = true;
                  el.scrollLeft = drag.scrollLeft - dx;
                }
              }}
              onPointerUp={() => { tabDragRef.current.active = false; }}
              onPointerLeave={() => { tabDragRef.current.active = false; }}
            >
              {sortedCategories.map((category, idx) => {
                const isActive = activeCategory === category;
                const handleClick = () => {
                  if (tabDragRef.current.didDrag) { tabDragRef.current.didDrag = false; return; }
                  setActiveCategory(category); setDietFilter("all"); fireTrack("category_view", { category, language: locale });
                };

                if (!anyCategoryUsesImages) {
                  // Simple pill tabs
                  return (
                    <motion.button
                      key={category}
                      type="button"
                      onClick={handleClick}
                      className={`flex-shrink-0 snap-start px-3 py-2 rounded-full text-[10px] font-semibold transition-all duration-200 touch-manipulation whitespace-normal line-clamp-2 text-center max-w-[90px] leading-tight ${
                        isActive
                          ? "bg-[var(--accent)]/10 text-[var(--foreground)] border-2 border-[var(--accent)] shadow-sm"
                          : "bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] hover:border-[var(--accent)]/40"
                      }`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.28, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <CategoryName name={category} />
                    </motion.button>
                  );
                }

                // Image card tabs (or pill for categories with show_image=false)
                const catEntry = categoryImageMap[category];
                const catShow = catEntry?.show === true;
                const catImageMode = catEntry?.imageMode;
                const catBannerUrl = catEntry?.bannerUrl ?? null;

                if (!catShow) {
                  return (
                    <motion.button
                      key={category}
                      type="button"
                      onClick={handleClick}
                      className={`flex-shrink-0 snap-start px-3 py-2 rounded-full text-[10px] font-semibold transition-all duration-200 touch-manipulation whitespace-normal line-clamp-2 text-center max-w-[90px] leading-tight ${
                        isActive
                          ? "bg-[var(--accent)]/10 text-[var(--foreground)] border-2 border-[var(--accent)] shadow-sm"
                          : "bg-[var(--card)] text-[var(--foreground)] border border-[var(--card-border)] hover:border-[var(--accent)]/40"
                      }`}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.28, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
                      whileTap={{ scale: 0.96 }}
                    >
                      <CategoryName name={category} />
                    </motion.button>
                  );
                }

                return (
                  <motion.button
                    key={category}
                    type="button"
                    onClick={handleClick}
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
                      {catImageMode === 'item' && catBannerUrl ? (
                        <img src={catBannerUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <CategoryIcon name={category} isActive={isActive} />
                      )}
                    </div>
                    {/* Label */}
                    <span
                      className={`text-[10px] sm:text-xs font-semibold text-center leading-tight px-1 w-full line-clamp-2 uppercase tracking-wide ${
                        isActive ? "text-[var(--foreground)]" : "text-[var(--muted)]"
                      }`}
                    >
                      <CategoryName name={category} />
                    </span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Category content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10 pb-[env(safe-area-inset-bottom)]">
        {/* Header + filter */}
        <div className="flex flex-row items-center justify-between gap-2 mb-4">
          <div className="min-w-0">
            {/* Category heading with optional inline thumbnail */}
            {(() => {
              const mapEntry = categoryImageMap[activeCategory];
              const showImg = mapEntry?.show === true;
              const headingImageMode = mapEntry?.imageMode;
              const thumbUrl = (mapEntry?.bannerUrl ?? mapEntry?.url) ?? null;
              return (
                <div className="flex items-center gap-3">
                  {showImg && headingImageMode === 'item' && thumbUrl && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--card-border)] shadow-sm">
                      <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                    </div>
                  )}
                  {showImg && headingImageMode === 'icon' && (
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-[var(--card-border)] shadow-sm">
                      <CategoryIcon name={activeCategory} isActive={false} />
                    </div>
                  )}
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--foreground)]">
                    <CategoryName name={activeCategory} />
                  </h2>
                </div>
              );
            })()}
            {categoryNotes[activeCategory] && (
              <p className="text-sm text-[var(--muted)] mt-1 leading-relaxed">
                <TranslatedText text={categoryNotes[activeCategory]} as="span" />
              </p>
            )}
          </div>
          <div className="relative flex-shrink-0" ref={filterRef}>
            <button
              type="button"
              onClick={() => setFilterOpen(o => !o)}
              className="flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-xl bg-[var(--card)] text-[var(--foreground)] font-medium text-sm border border-[var(--card-border)] shadow-sm hover:shadow-md transition-shadow touch-manipulation"
              aria-expanded={filterOpen}
            >
              <span>
                {t(DIET_FILTER_OPTIONS.find(o => o.value === dietFilter)?.labelKey ?? "filter.all")}
              </span>
              <svg
                className={`w-4 h-4 transition-transform duration-200 ${filterOpen ? "rotate-180" : ""}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {filterOpen && (
              <ul
                role="listbox"
                className="absolute top-full end-0 mt-2 min-w-[160px] py-1 rounded-xl bg-[var(--card)] border border-[var(--card-border)] shadow-lg z-50"
              >
                {DIET_FILTER_OPTIONS.map((opt) => (
                  <li key={opt.value} role="option" aria-selected={dietFilter === opt.value}>
                    <button
                      type="button"
                      onClick={() => { setDietFilter(opt.value); setFilterOpen(false); }}
                      className={`w-full text-left px-4 py-3 text-sm font-medium transition-colors touch-manipulation ${
                        dietFilter === opt.value
                          ? "bg-[var(--accent)]/15 text-[var(--accent)]"
                          : "text-[var(--foreground)] hover:bg-[var(--card-border)]/50"
                      }`}
                    >
                      {t(opt.labelKey)}
                    </button>
                  </li>
                ))}
              </ul>
            )}
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
          {items.map((item, idx) => {
            const clickable = hasDetails(item);
            return (
            <motion.article
              key={item.id}
              role={clickable ? "button" : undefined}
              tabIndex={clickable ? 0 : undefined}
              onClick={clickable ? () => { setSelectedItem(item); fireTrack("item_click", { item_id: item.id, category: item.category ?? activeCategory, language: locale }); } : undefined}
              onKeyDown={clickable ? (e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedItem(item);
                  fireTrack("item_click", { item_id: item.id, category: item.category ?? activeCategory, language: locale });
                }
              } : undefined}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.38, delay: idx * 0.05, ease: [0.22, 1, 0.36, 1] }}
              whileHover={clickable ? { y: -2, boxShadow: '0 8px 24px -6px rgba(0,0,0,0.12)' } : {}}
              whileTap={clickable ? { scale: 0.99 } : {}}
              className={`bg-[var(--card)] rounded-2xl overflow-hidden border border-[var(--card-border)] shadow-sm transition-colors duration-300 touch-manipulation flex flex-row ${item.available === false ? 'opacity-50' : ''} ${clickable ? 'cursor-pointer hover:border-[var(--accent)]/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2' : ''}`}
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
              <div className="p-3 sm:p-5 min-w-0 flex-1 flex flex-col justify-center">
                <div className="flex justify-between items-baseline gap-3">
                  <h3 className="text-lg sm:text-xl font-semibold text-[var(--foreground)] min-w-0 text-wrap-balance">
                    <TranslatedText text={item.name} />
                  </h3>
                  {item.chefs_favorite ? (
                    <motion.span
                      className="font-semibold text-[var(--accent)] whitespace-nowrap flex-shrink-0 tabular-nums"
                      animate={{ scale: [1, 1.06, 1] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1 }}
                    >
                      {formatPrice(Number(item.price), showCurrencySymbol)}
                      {item.price_suffix && <span className="text-sm font-normal opacity-70 ml-0.5">{item.price_suffix}</span>}
                    </motion.span>
                  ) : (
                    <span className="font-semibold text-[var(--accent)] whitespace-nowrap flex-shrink-0 tabular-nums">
                      {formatPrice(Number(item.price), showCurrencySymbol)}
                      {item.price_suffix && <span className="text-sm font-normal opacity-70 ml-0.5">{item.price_suffix}</span>}
                    </span>
                  )}
                </div>
                {item.available === false && (
                  <span className="inline-flex items-center mt-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    Currently unavailable
                  </span>
                )}
                <DietaryIcons item={item} />
                {item.description && (
                  <p className="text-[var(--muted)] mt-2 text-sm sm:text-base leading-relaxed line-clamp-2 text-wrap-force whitespace-pre-line break-words [overflow-wrap:anywhere]">
                    <TranslatedText text={item.description} as="span" />
                  </p>
                )}
                {clickable && (
                  <p className="text-[var(--accent)]/70 text-xs mt-3 font-medium tracking-wide">
                    {t("ui.tapToReadMore")} →
                  </p>
                )}
              </div>
            </motion.article>
            );
          })}
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
