"use client";

import { useState, useEffect, useCallback, useMemo, useRef, type ReactNode } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import jsQR from "jsqr";
import { createSupabaseClient } from "@/app/lib/supabase";
import { CATEGORY_ORDER, SAMPLE_ITEM_NAME } from "@/app/lib/constants";
import type { MenuItemRow } from "@/app/lib/constants";
import { buildMenuGroups, categoryNameMap } from "@/app/lib/supabase";
import type { Restaurant, CategoryRow, MenuGroup } from "@/app/lib/supabase";
import { ImageUploader } from "./ImageUploader";
import { OnboardingTour } from "./OnboardingTour";
import { useSubscription, type SubStatus } from "@/lib/useSubscription";
import { friendlyErrorMessage } from "@/app/lib/errors";
import { locales } from "@/app/lib/translations";
import {
  getSignLanguages, ensureScriptFonts, fontStackFor,
  type SignLanguage, type ScriptKey,
} from "@/app/lib/qrScriptFonts";
import { AlertTriangle, AlertCircle, Plus, GripVertical, UtensilsCrossed, ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";
import { AccountDangerZone } from "./AccountDangerZone";
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove, SortableContext, sortableKeyboardCoordinates,
  horizontalListSortingStrategy, verticalListSortingStrategy, useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type Grouped = Record<string, MenuItemRow[]>;

const D_ACCENT = "#8b6914";
const D_BG     = "#faf8f5";
const D_TEXT   = "#2c2a26";
const D_CARD   = "#ffffff";

function getFontStack(family: string) {
  switch (family) {
    case "serif":    return "'Cormorant Garamond', Georgia, serif";
    case "playfair": return "'Playfair Display', Georgia, serif";
    case "cinzel":   return "'Cinzel', Georgia, serif";
    case "pacifico": return "'Pacifico', cursive";
    case "mono":     return "'Geist Mono', monospace";
    case "poppins":  return "'Poppins', sans-serif";
    case "bebas":    return "'Bebas Neue', sans-serif";
    case "orbitron": return "'Orbitron', sans-serif";
    default:         return "'Geist Sans', system-ui, sans-serif";
  }
}

const PRESETS = [
  {
    name: "Linen",
    description: "Warm minimalist café",
    background: "#faf5ec",
    main: "#ffffff",
    accent: "#8b1a1a",
    fontColor: "#2c2520",
    titleColor: "#2c2520",
    mutedColor: "#6b5e54",
    fontFamily: "serif",
  },
  {
    name: "Bistro",
    description: "Classic French bistro",
    background: "#f4ede0",
    main: "#fffbf3",
    accent: "#1a3a2e",
    fontColor: "#1f1d18",
    titleColor: "#1f1d18",
    mutedColor: "#6b6258",
    fontFamily: "playfair",
  },
  {
    name: "Modern",
    description: "Clean contemporary",
    background: "#ffffff",
    main: "#f8f8f5",
    accent: "#1f1d1a",
    fontColor: "#1f1d1a",
    titleColor: "#1f1d1a",
    mutedColor: "#7a7670",
    fontFamily: "sans",
  },
  {
    name: "Coastal",
    description: "Seaside dining",
    background: "#f4f7fa",
    main: "#ffffff",
    accent: "#1d4470",
    fontColor: "#1a2535",
    titleColor: "#1a2535",
    mutedColor: "#6b7785",
    fontFamily: "sans",
  },
  {
    name: "Trattoria",
    description: "Italian warmth",
    background: "#f7f3e8",
    main: "#fffbf0",
    accent: "#4a5d23",
    fontColor: "#2b3514",
    titleColor: "#2b3514",
    mutedColor: "#7a7560",
    fontFamily: "cinzel",
  },
  {
    name: "Tokyo",
    description: "Japanese minimal",
    background: "#ffffff",
    main: "#fafafa",
    accent: "#c8553d",
    fontColor: "#1f1f1f",
    titleColor: "#1f1f1f",
    mutedColor: "#6b6b6b",
    fontFamily: "sans",
  },
  {
    name: "Wine Cellar",
    description: "Sommelier picks",
    background: "#1f1015",
    main: "#2c1820",
    accent: "#c9a55a",
    fontColor: "#f4e8d8",
    titleColor: "#ffffff",
    mutedColor: "#b8a89c",
    fontFamily: "cinzel",
  },
  {
    name: "Scandi",
    description: "Nordic café",
    background: "#f8f8f5",
    main: "#ffffff",
    accent: "#6b8270",
    fontColor: "#2a2a28",
    titleColor: "#2a2a28",
    mutedColor: "#7a7872",
    fontFamily: "sans",
  },
  {
    name: "Brunch",
    description: "Sunday morning",
    background: "#fbf6ed",
    main: "#fffaf0",
    accent: "#b85a3e",
    fontColor: "#2e2520",
    titleColor: "#2e2520",
    mutedColor: "#7a6f65",
    fontFamily: "pacifico",
  },
  {
    name: "Brasserie",
    description: "European bistro with teal",
    background: "#f4f7f5",
    main: "#ffffff",
    accent: "#0f766e",
    fontColor: "#1a2e2b",
    titleColor: "#1a2e2b",
    mutedColor: "#4a6b66",
    fontFamily: "sans",
  },
  {
    name: "Ember",
    description: "Warm with a bold orange glow",
    background: "#fdf6f0",
    main: "#ffffff",
    accent: "#c2410c",
    fontColor: "#1c1109",
    titleColor: "#1c1109",
    mutedColor: "#7c4a2a",
    fontFamily: "serif",
  },
  {
    name: "Indigo",
    description: "Clean with a rich purple accent",
    background: "#f8f7ff",
    main: "#ffffff",
    accent: "#4338ca",
    fontColor: "#1e1b4b",
    titleColor: "#1e1b4b",
    mutedColor: "#6366f1",
    fontFamily: "sans",
  },
];

function getContrast(hex1: string, hex2: string): number {
  const lum = (hex: string) => {
    const clean = hex.replace("#", "");
    if (clean.length !== 6) return 0;
    const rgb = clean.match(/.{2}/g)!.map((h) => parseInt(h, 16) / 255);
    const [r, g, b] = rgb.map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const l1 = lum(hex1), l2 = lum(hex2);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

const FONT_OPTIONS = [
  { value: "sans",     label: "Geist Sans (default)",  cls: "font-geist-sans" },
  { value: "serif",    label: "Cormorant Garamond",     cls: "font-cormorant"  },
  { value: "mono",     label: "Geist Mono",             cls: "font-geist-mono" },
  { value: "poppins",  label: "Poppins",                cls: "font-poppins"    },
  { value: "playfair", label: "Playfair Display",       cls: "font-playfair"   },
  { value: "bebas",    label: "Bebas Neue",             cls: "font-bebas"      },
  { value: "pacifico", label: "Pacifico",               cls: "font-pacifico"   },
  { value: "orbitron", label: "Orbitron",               cls: "font-orbitron"   },
  { value: "cinzel",   label: "Cinzel",                 cls: "font-cinzel"     },
] as const;

function fontFamily(font?: string | null) {
  switch (font) {
    case "serif":    return "var(--font-cormorant), Georgia, serif";
    case "mono":     return "var(--font-geist-mono), monospace";
    case "poppins":  return "var(--font-poppins), sans-serif";
    case "playfair": return "var(--font-playfair), serif";
    case "bebas":    return "var(--font-bebas), sans-serif";
    case "pacifico": return "var(--font-pacifico), cursive";
    case "orbitron": return "var(--font-orbitron), sans-serif";
    case "cinzel":   return "var(--font-cinzel), serif";
    default:         return "var(--font-geist-sans), system-ui, sans-serif";
  }
}


function SortableMenuItem({ item, children, isFirst }: { item: MenuItemRow; children: React.ReactNode; isFirst?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
    boxShadow: isDragging ? '0 10px 25px -5px rgba(139, 105, 20, 0.35)' : undefined,
    position: 'relative',
    userSelect: 'none',
    WebkitUserSelect: 'none',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-stretch gap-0 w-full" data-tour={isFirst ? "first-item-card" : undefined}>
      {/* Drag handle — outside the card border */}
      <div
        {...listeners}
        className="flex items-center justify-center flex-shrink-0 bg-[var(--card-border)]/40 cursor-grab touch-manipulation"
        style={{ width: 36, borderRadius: "12px 0 0 12px", touchAction: "none", userSelect: "none", WebkitUserSelect: "none" }}
        title="Drag to reorder"
      >
        <GripVertical size={18} className="text-[var(--muted)] transition-colors" />
      </div>
      {/* Card — border wraps image + content only */}
      <div
        className="flex flex-1 min-w-0 border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-sm hover:shadow-md transition-shadow"
        style={{ borderRadius: "0 12px 12px 0" }}
      >
        {children}
      </div>
    </div>
  );
}

function SortableCategoryTab({ name, children }: { name: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: name });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      {...attributes}
      {...listeners}
      className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0 flex"
    >
      {children}
    </div>
  );
}

type Props = {
  restaurantId: string;
  restaurantSlug: string;
  initialGrouped: Grouped;
  initialSortedCategories: string[];
  initialRestaurant: Restaurant | null;
  initialCategoryRows: CategoryRow[];
  initialCategoryNotes: Record<string, string>;
};

export function AdminMenuEditor({
  restaurantId,
  restaurantSlug,
  initialGrouped,
  initialSortedCategories,
  initialRestaurant,
  initialCategoryRows,
  initialCategoryNotes,
}: Props) {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const deleteStorageImage = async (url: string) => {
    if (!url || !url.includes('supabase.co/storage')) return;
    const path = url.split('/menu-images/')[1];
    if (path) await supabase.storage.from('menu-images').remove([path]);
  };

  const [grouped, setGrouped]                   = useState<Grouped>(initialGrouped);
  // Drives the tour's item-card copy: once the seeded placeholder has been
  // renamed or deleted, a replay must stop calling it "the sample dish".
  const hasSampleItem = useMemo(
    () => Object.values(grouped).some((items) =>
      items.some((i) => i.name.trim().toLowerCase() === SAMPLE_ITEM_NAME.toLowerCase())
    ),
    [grouped]
  );
  const [sortedCategories, setSortedCategories] = useState(initialSortedCategories);
  const [categoryRows, setCategoryRows]         = useState<CategoryRow[]>(initialCategoryRows);
  const [activeCategory, setActiveCategory]     = useState(initialSortedCategories[0] ?? "");
  const [activeMenu, setActiveMenu]             = useState("");
  const [editingItem, setEditingItem]           = useState<MenuItemRow | null>(null);
  const [addingNew, setAddingNew]               = useState(false);
  const [restaurant, setRestaurant]             = useState<Restaurant | null>(initialRestaurant);
  const [categoryNotes, setCategoryNotes]       = useState(initialCategoryNotes);
  const [saving, setSaving]                     = useState(false);
  const [savingNote, setSavingNote]             = useState(false);
  const [message, setMessage]                   = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [mobileOpen, setMobileOpen]             = useState(false);
  const [settingsOpen, setSettingsOpen]         = useState(false);
  const [tourKey, setTourKey]                   = useState(0);
  const [showQR, setShowQR] = useState(false);
  // null = closed. Otherwise the parent the new category goes under —
  // { id: null } means top level (a menu, when layered).
  const [categoryModalParent, setCategoryModalParent] = useState<{ id: string | null; name: string } | null>(null);
  const [showManageModal, setShowManageModal]     = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [hasCompletedTour, setHasCompletedTour] = useState(true); // default true: don't flash tour before we know
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [adminCanScrollLeft, setAdminCanScrollLeft] = useState(false);
  const [adminCanScrollRight, setAdminCanScrollRight] = useState(false);
  const adminTabDragRef = useRef({ active: false, startX: 0, scrollLeft: 0, didDrag: false });
  const menuRowScrollRef = useRef<HTMLDivElement>(null);
  const menuRowDragRef = useRef({ active: false, startX: 0, scrollLeft: 0, didDrag: false });
  const [menuRowCanScrollLeft, setMenuRowCanScrollLeft] = useState(false);
  const [menuRowCanScrollRight, setMenuRowCanScrollRight] = useState(false);

  const refreshMenuRef = useRef<(() => Promise<void>) | null>(null);

  // ── Two-level category structure ──────────────────────────────────────────
  // Categories with children act as menus; everything else behaves exactly as
  // it did before. When the toggle is off we ignore parent_id entirely (but
  // never clear it) so turning it back on restores the structure.
  // Every category key below is a restaurant_categories.id, never a name —
  // names are only unique within one menu now. `categoryNames` resolves labels.
  const menuGroups = useMemo(() => buildMenuGroups(categoryRows), [categoryRows]);
  const categoryNames = useMemo(() => categoryNameMap(categoryRows), [categoryRows]);
  const catLabel = useCallback((id: string) => categoryNames[id] ?? "", [categoryNames]);
  const layered = restaurant?.use_nested_categories === true && menuGroups.some((g) => g.children.length > 0);
  const activeGroup = layered ? menuGroups.find((g) => g.id === activeMenu) : undefined;
  const childTabs = activeGroup?.children ?? [];
  // Items only ever live on the deepest category, so menus are not selectable
  // targets when adding an item.
  const leafCategories = layered
    ? menuGroups.flatMap((g) => (g.children.length > 0 ? g.children : [g.id]))
    : sortedCategories;
  // Row 2 lists the active menu's children. A top-level category with no
  // children holds its own items, so row 2 is hidden while it is selected.
  const visibleTabs = layered ? childTabs : sortedCategories;

  // Names the destination outright. A menu gains a category; a category that
  // holds its own items gains a sub-category — two different outcomes that the
  // bare word "category" hid.
  const addCategoryLabel = !layered || !activeGroup
    ? "Add category"
    : childTabs.length > 0
      ? `Add category to ${activeGroup.name}`
      : `Add sub-category to ${activeGroup.name}`;

  // Keep the selected menu in sync with the selected category.
  useEffect(() => {
    if (!layered) return;
    const owner = menuGroups.find((g) => g.id === activeCategory || g.children.includes(activeCategory));
    if (owner) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (owner.id !== activeMenu) setActiveMenu(owner.id);
      // A menu is a container — drop down to its first category.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (owner.id === activeCategory && owner.children.length > 0) setActiveCategory(owner.children[0]);
      return;
    }
    const first = menuGroups[0];
    if (!first) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveMenu(first.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveCategory(first.children[0] ?? first.id);
  }, [layered, menuGroups, activeCategory, activeMenu]);

  // Sync CSS variables immediately when restaurant state changes (e.g. after theme save)
  useEffect(() => {
    if (!restaurant || typeof document === "undefined") return;
    const root = document.documentElement;
    if (restaurant.font_color)        root.style.setProperty("--foreground", restaurant.font_color);
    if (restaurant.accent_color)      root.style.setProperty("--accent",     restaurant.accent_color);
    if (restaurant.background_color)  root.style.setProperty("--background", restaurant.background_color);
    if (restaurant.main_color)        root.style.setProperty("--card",       restaurant.main_color);
    if (restaurant.muted_color)       root.style.setProperty("--muted",      restaurant.muted_color);
    if (restaurant.title_color)       root.style.setProperty("--title",      restaurant.title_color);
    let fontFamily = "var(--font-geist-sans), system-ui, sans-serif";
    switch (restaurant.font_family) {
      case "serif":    fontFamily = "var(--font-cormorant), Georgia, serif"; break;
      case "mono":     fontFamily = "var(--font-geist-mono), monospace"; break;
      case "poppins":  fontFamily = "var(--font-poppins), sans-serif"; break;
      case "playfair": fontFamily = "var(--font-playfair), serif"; break;
      case "bebas":    fontFamily = "var(--font-bebas), sans-serif"; break;
      case "pacifico": fontFamily = "var(--font-pacifico), cursive"; break;
      case "orbitron": fontFamily = "var(--font-orbitron), sans-serif"; break;
      case "cinzel":   fontFamily = "var(--font-cinzel), serif"; break;
    }
    document.body.style.fontFamily = fontFamily;
  }, [restaurant]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const u = data.user;
      setUser({ id: u.id, email: u.email ?? '' });
      setHasCompletedTour(u.user_metadata?.has_completed_tour === true);

      // Seed a sample menu item for brand-new accounts with empty menus
      const isEmpty = Object.keys(initialGrouped).length === 0;
      const ageMs = Date.now() - new Date(u.created_at).getTime();
      const isNew = ageMs < 5 * 60 * 1000; // account < 5 minutes old
      if (isEmpty && isNew) {
        (async () => {
          // Brand-new empty account, so a plain insert is safe — there is
          // nothing to conflict with, and we need the id back for the item.
          const { data: seedCat } = await supabase.from('restaurant_categories')
            .insert({ restaurant_id: restaurantId, name: 'Mains', sort_order: 0 })
            .select('id')
            .single();
          if (seedCat) {
            await supabase.from('menu_items').insert({
              restaurant_id: restaurantId,
              name: SAMPLE_ITEM_NAME,
              description: 'Feel free to edit or delete this item and add your real menu.',
              price: 0,
              category_id: seedCat.id,
              available: true,
              sort_order: 0,
            });
          }
          // refreshMenu is assigned after this effect runs; call via ref
          refreshMenuRef.current?.();
        })();
      }
    });
  }, [supabase, restaurantId, initialGrouped]);

  const { status: subStatus, isActive, daysLeftInTrial, isTrialExpired, cancelAtPeriodEnd, periodEnd, hasStripeSubscription } = useSubscription(user?.id);

  const startCheckout = async () => {
    if (!user) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantSlug }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally { setCheckoutLoading(false); }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribe") === "1") {
      window.history.replaceState({}, "", window.location.pathname);
      startCheckout();
    }
  }, []);

  const openPortal = async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantSlug }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.error === 'No subscription found') startCheckout();
    } finally {
      setPortalLoading(false);
    }
  };

  // ── Live font update (colors stay as DineLinks brand) ────────────────────
  useEffect(() => {
    if (!restaurant) return;
    const ff = fontFamily(restaurant.font_family);
    let el = document.getElementById("dinelinks-theme") as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = "dinelinks-theme";
      document.head.appendChild(el);
    }
    el.textContent = `body{font-family:${ff};}`;
  }, [restaurant]);

  const showMsg = useCallback((type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  // Show success toast when Stripe redirects back after a completed checkout
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('subscription') === 'success' || params.get('subscribed') === 'true') {
      setMessage({ type: 'ok', text: "You're subscribed! Welcome to DineLinks Monthly." });
      setTimeout(() => setMessage(null), 5000);
      // Clean URL so refreshing doesn't re-show the toast
      const clean = new URL(window.location.href);
      clean.searchParams.delete('subscription');
      clean.searchParams.delete('subscribed');
      window.history.replaceState({}, '', clean.toString());
    }
  }, []);

  const refreshMenu = useCallback(async () => {
    const [itemsResult, catsResult] = await Promise.all([
      supabase
        .from("menu_items").select("*")
        .eq("restaurant_id", restaurantId)
        .order("sort_order", { ascending: true })
        .order("name",       { ascending: true }),
      supabase
        .from("restaurant_categories").select("id, name, parent_id, sort_order")
        .eq("restaurant_id", restaurantId)
        .order("sort_order", { ascending: true }),
    ]);
    if (itemsResult.error) { showMsg("err", friendlyErrorMessage(itemsResult.error)); return; }
    const g: Grouped = {};
    (itemsResult.data ?? []).forEach((row) => {
      const item = row as MenuItemRow;
      if (!item.category_id) return;
      if (!g[item.category_id]) g[item.category_id] = [];
      g[item.category_id].push(item);
    });
    const rows = (catsResult.data ?? []) as CategoryRow[];
    const sorted = rows.map((r) => r.id);
    setGrouped(g);
    setCategoryRows(rows);
    setSortedCategories(sorted);
    setActiveCategory((prev) => sorted.includes(prev) ? prev : sorted[0] ?? "");
  }, [restaurantId, showMsg, supabase]);

  // Keep ref in sync so the user-fetch effect can call refreshMenu after seeding
  useEffect(() => { refreshMenuRef.current = refreshMenu; }, [refreshMenu]);

  const updateAdminScrollState = useCallback(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    setAdminCanScrollLeft(el.scrollLeft > 4);
    setAdminCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = tabScrollRef.current;
    if (!el) return;
    updateAdminScrollState();
    const ro = new ResizeObserver(updateAdminScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateAdminScrollState, visibleTabs]);

  const adminScrollLeft = () => tabScrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const adminScrollRight = () => tabScrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });

  const updateMenuRowScrollState = useCallback(() => {
    const el = menuRowScrollRef.current;
    if (!el) return;
    setMenuRowCanScrollLeft(el.scrollLeft > 4);
    setMenuRowCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = menuRowScrollRef.current;
    if (!el) return;
    updateMenuRowScrollState();
    const ro = new ResizeObserver(updateMenuRowScrollState);
    ro.observe(el);
    return () => ro.disconnect();
  }, [updateMenuRowScrollState, menuGroups]);

  const menuRowScrollLeft = () => menuRowScrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const menuRowScrollRight = () => menuRowScrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });

  // Global Escape key — close innermost open modal first
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (editingItem) { setEditingItem(null); return; }
      if (addingNew) { setAddingNew(false); return; }
      if (themeOpen) { setThemeOpen(false); return; }
      if (categoryModalParent) { setCategoryModalParent(null); return; }
      if (showManageModal) { setShowManageModal(false); return; }
      if (settingsOpen) { setSettingsOpen(false); return; }
      if (showQR) { setShowQR(false); return; }
      if (mobileOpen) { setMobileOpen(false); return; }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [editingItem, addingNew, themeOpen, categoryModalParent, showManageModal, settingsOpen, showQR, mobileOpen]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login"); router.refresh();
  };

  const handleSaveItem = async (payload: Partial<MenuItemRow>) => {
    setSaving(true);
    if (editingItem?.id) {
      if (editingItem.image_url && editingItem.image_url !== payload.image_url) {
        await deleteStorageImage(editingItem.image_url);
      }
      const { error } = await supabase.from("menu_items").update(payload).eq("id", editingItem.id);
      if (error) showMsg("err", friendlyErrorMessage(error));
      else { showMsg("ok", "Item updated."); setEditingItem(null); await refreshMenu(); }
    } else {
      const catItems = (payload.category_id && grouped[payload.category_id]) ? grouped[payload.category_id] : [];
      const { error } = await supabase.from("menu_items").insert({
        ...payload, restaurant_id: restaurantId, sort_order: catItems.length,
      });
      if (error) showMsg("err", friendlyErrorMessage(error));
      else { showMsg("ok", "Item added."); setAddingNew(false); await refreshMenu(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, imageUrl?: string | null) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    if (imageUrl) await deleteStorageImage(imageUrl);
    setSaving(true);
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) showMsg("err", friendlyErrorMessage(error));
    else { showMsg("ok", "Deleted."); setEditingItem(null); await refreshMenu(); }
    setSaving(false);
  };

  const handleSaveTheme = async (updates: Partial<Restaurant>) => {
    setSaving(true);
    type RestaurantExt = Restaurant & { hero_image_url?: string | null; logo_url?: string | null };
    const r = restaurant as RestaurantExt | null;
    const u = updates as RestaurantExt;
    if (r?.hero_image_url && 'hero_image_url' in updates && r.hero_image_url !== u.hero_image_url) {
      await deleteStorageImage(r.hero_image_url);
    }
    if (r?.logo_url && 'logo_url' in updates && r.logo_url !== u.logo_url) {
      await deleteStorageImage(r.logo_url);
    }
    const { error } = await supabase.from("restaurants").update(updates).eq("id", restaurantId);
    if (error) { showMsg("err", friendlyErrorMessage(error)); }
    else { setRestaurant(p => p ? { ...p, ...updates } : null); showMsg("ok", "Theme saved."); }
    setSaving(false);
  };

  const handleSaveCategoryNote = async (categoryId: string, note: string) => {
    setSavingNote(true);
    // Keyed on category_id: two menus may each have a "Desserts", and they must
    // not share a note. `category` is still written as a readable label.
    const { error } = await supabase.from("category_notes").upsert(
      { restaurant_id: restaurantId, category_id: categoryId, category: categoryNames[categoryId] ?? "", note: note.trim() || null },
      { onConflict: "category_id" }
    );
    if (error) showMsg("err", friendlyErrorMessage(error));
    else { setCategoryNotes((p) => ({ ...p, [categoryId]: note.trim() })); showMsg("ok", "Note saved."); }
    setSavingNote(false);
  };

  // Reliable sort: assigns clean 0,1,2… indices to every item in the category
  const moveItem = useCallback(async (fromIdx: number, toIdx: number) => {
    const list = [...(grouped[activeCategory] ?? [])];
    if (toIdx < 0 || toIdx >= list.length) return;
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    // Optimistic UI
    setGrouped((prev) => ({ ...prev, [activeCategory]: list }));
    setSaving(true);
    await Promise.all(
      list.map((item, idx) =>
        supabase.from("menu_items").update({ sort_order: idx }).eq("id", item.id)
      )
    );
    setSaving(false);
    // Refresh to make sure DB and UI are in sync
    await refreshMenu();
  }, [grouped, activeCategory, supabase, refreshMenu]);

  const handleItemDragEnd = useCallback(async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const list = [...(grouped[activeCategory] ?? [])];
    const oldIndex = list.findIndex(i => i.id === active.id);
    const newIndex = list.findIndex(i => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(list, oldIndex, newIndex);
    // Optimistic update
    setGrouped(prev => ({ ...prev, [activeCategory]: reordered }));
    setSaving(true);
    await Promise.all(
      reordered.map((item, idx) =>
        supabase.from('menu_items').update({ sort_order: idx }).eq('id', item.id)
      )
    );
    setSaving(false);
  }, [grouped, activeCategory, supabase]);

  // sort_order is scoped per level: siblings order among themselves. parentId is
  // only written when explicitly given — flat reorders must leave parent_id alone.
  // sort_order is scoped per level: siblings order among themselves. parentId is
  // only written when explicitly given — flat reorders must leave parent_id alone.
  // Updates by primary key: every category is guaranteed to have a row now, and
  // (restaurant_id, name) is no longer unique so it can't be an upsert target.
  const persistOrder = useCallback(async (ids: string[], parentId?: string | null) => {
    for (let i = 0; i < ids.length; i++) {
      const row: Record<string, unknown> = { sort_order: i };
      if (parentId !== undefined) row.parent_id = parentId;
      await supabase.from('restaurant_categories').update(row).eq('id', ids[i]);
    }
  }, [supabase]);

  // Optimistic reorder of sibling rows so tabs move instantly, no reload.
  const reorderRowsInState = useCallback((ids: string[]) => {
    setCategoryRows((prev) => prev.map((r) => {
      const idx = ids.indexOf(r.id);
      return idx === -1 ? r : { ...r, sort_order: idx };
    }));
  }, []);

  const handleCategoryDragEnd = useCallback(async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const cats = [...sortedCategories];
    const oldIndex = cats.indexOf(active.id as string);
    const newIndex = cats.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(cats, oldIndex, newIndex);
    setSortedCategories(reordered);
    reorderRowsInState(reordered);
    await persistOrder(reordered);
  }, [sortedCategories, persistOrder, reorderRowsInState]);

  const handleMenuDragEnd = useCallback(async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = menuGroups.map((g) => g.id);
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(ids, oldIndex, newIndex);
    reorderRowsInState(reordered);
    await persistOrder(reordered, null);
  }, [menuGroups, persistOrder, reorderRowsInState]);

  const handleChildDragEnd = useCallback(async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id || !activeGroup?.id) return;
    const oldIndex = childTabs.indexOf(active.id as string);
    const newIndex = childTabs.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove([...childTabs], oldIndex, newIndex);
    reorderRowsInState(reordered);
    await persistOrder(reordered, activeGroup.id);
  }, [activeGroup, childTabs, persistOrder, reorderRowsInState]);

  const items   = grouped[activeCategory] ?? [];
  const isEmpty = sortedCategories.length === 0;

  // Show "start trial" blocker ONLY when the trial has fully expired (daysLeftInTrial === 0).
  // Never show during an active trial, loading, or on navigation (avoids flash when userId
  // is briefly undefined and subStatus transiently reads 'none').
  // A user who subscribed mid-trial stays status='trialing' with a stripe_subscription_id
  // until Stripe's webhook flips them to 'active' at trial end — never lock them out.
  const trialFullyExpired = daysLeftInTrial !== null && daysLeftInTrial <= 0 && !hasStripeSubscription;
  if (user !== null && subStatus !== 'loading' && trialFullyExpired && hasCompletedTour !== false) {
    return (
      <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-md flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
          <div className="flex justify-center mb-4">
            <svg width="48" height="44" viewBox="0 0 44 40" fill="none">
              <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="#8b6914" strokeWidth="2.6" strokeLinejoin="round"/>
              <line x1="26" y1="3" x2="26" y2="37" stroke="#2c2a26" strokeWidth="2.6" strokeLinecap="round"/>
              <line x1="26" y1="37" x2="42" y2="37" stroke="#2c2a26" strokeWidth="2.6" strokeLinecap="round"/>
            </svg>
          </div>
          <h2 className="text-2xl font-serif font-semibold text-[#2c2a26] mb-2">Start your free trial</h2>
          <p className="text-sm text-[#6b6560] mb-6">
            Get full access to DineLinks for 60 days free, then $25 CAD/month. Cancel anytime.
          </p>
          <button onClick={startCheckout} disabled={checkoutLoading}
            className="w-full bg-[var(--main-color,#8b6914)] text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {checkoutLoading ? 'Loading...' : 'Start 60-day free trial'}
          </button>
          <p className="text-xs text-[#6b6560] mt-4">No credit card required</p>
          <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
            className="text-xs text-[#6b6560] mt-6 hover:underline block mx-auto">
            Sign out
          </button>
        </div>
      </div>
    );
  }

  // Subscribed mid-trial users (trialing + stripe_subscription_id) must never see the
  // "trial has ended" wall during the pre-webhook window — they're already paying.
  const showTrialExpiredOverlay = subStatus !== 'loading' && ((isTrialExpired && !hasStripeSubscription) || subStatus === 'canceled');

  return (
    <main dir="ltr" className={`min-h-screen bg-[var(--background)] text-[var(--foreground)] ${showTrialExpiredOverlay ? 'pointer-events-none grayscale opacity-60' : ''}`}>

      {/* ── Subscription banners ─────────────────────────────────────────────── */}
      {subStatus === 'past_due' && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-center justify-between gap-3">
          <span className="text-sm text-red-900 flex items-center gap-2">
            <AlertCircle size={16} className="text-red-600 flex-shrink-0" />
            Payment failed. Update your payment method to keep your menu live.
          </span>
          <button onClick={openPortal} className="text-xs bg-red-600 text-white px-4 py-1.5 rounded-lg font-semibold hover:bg-red-700 flex-shrink-0">
            Update payment
          </button>
        </div>
      )}

      {/* Trial expired / canceled overlay */}
      {showTrialExpiredOverlay && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 text-center">
            <div className="flex justify-center mb-4">
              <svg width="48" height="44" viewBox="0 0 44 40" fill="none">
                <path d="M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z" fill="none" stroke="#8b6914" strokeWidth="2.6" strokeLinejoin="round"/>
                <line x1="26" y1="3" x2="26" y2="37" stroke="#2c2a26" strokeWidth="2.6" strokeLinecap="round"/>
                <line x1="26" y1="37" x2="42" y2="37" stroke="#2c2a26" strokeWidth="2.6" strokeLinecap="round"/>
              </svg>
            </div>
            <div className="flex justify-center mb-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <AlertCircle size={24} className="text-red-600" />
              </div>
            </div>
            <h2 className="text-2xl font-serif font-semibold text-[#2c2a26] mb-2">
              Your free trial has ended
            </h2>
            <p className="text-sm text-[#6b6560] mb-6">
              Your menu is paused and visitors see an &ldquo;unavailable&rdquo; message. Subscribe now to keep your menu live and get full access to DineLinks.
            </p>
            <button onClick={startCheckout} disabled={checkoutLoading}
              className="w-full bg-[var(--main-color,#8b6914)] text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
              {checkoutLoading ? 'Loading...' : 'Subscribe now — $25/month'}
            </button>
            <p className="text-xs text-[#6b6560] mt-4">Reactivates your menu immediately. Cancel anytime.</p>
            <button onClick={() => supabase.auth.signOut().then(() => router.push('/'))}
              className="text-xs text-[#6b6560] mt-6 hover:underline block mx-auto">
              Sign out
            </button>
          </div>
        </div>
      )}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-[#1a1816]" style={{ minHeight: "13rem" }}>
        {restaurant?.hero_image_url && (
          <img
            src={restaurant.hero_image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover z-0"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20 z-[1]" />

        {/* Mobile: trial pill + hamburger button */}
        <div className="sm:hidden absolute top-3 end-3 z-20 flex items-center gap-2">
          <TrialPill
            subStatus={subStatus}
            daysLeft={daysLeftInTrial}
            hasStripeSubscription={hasStripeSubscription}
            loading={checkoutLoading}
            onSubscribe={startCheckout}
          />
          <button
            data-tour="menu-button"
            type="button"
            onClick={() => { setMobileOpen(true); document.body.dataset.mobileSheetOpen = "true"; }}
            className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 text-white flex items-center justify-center"
            aria-label="Menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {/* Desktop action row */}
        <div className="hidden sm:flex absolute top-4 end-4 items-center gap-2 z-20">
          <TrialPill
            subStatus={subStatus}
            daysLeft={daysLeftInTrial}
            hasStripeSubscription={hasStripeSubscription}
            loading={checkoutLoading}
            onSubscribe={startCheckout}
          />
          <AdminMenuPanel
            onOpenTheme={() => setThemeOpen(true)}
            onReplayTour={() => setTourKey((k) => k + 1)}
            onSignOut={handleSignOut}
            onOpenQR={() => setShowQR(true)}
            onOpenSettings={() => setSettingsOpen(true)}
            onOpenFeedback={() => setFeedbackOpen(true)}
            restaurantSlug={restaurantSlug}
          />
        </div>
        <ThemeModal
          restaurant={restaurant}
          onSave={handleSaveTheme}
          saving={saving}
          noTrigger
          externalOpen={themeOpen}
          onExternalClose={() => setThemeOpen(false)}
          tourTarget="tour-theme"
        />

        {/* Mobile: centred branding */}
        <div className="sm:hidden absolute inset-x-0 bottom-0 flex flex-col items-center text-center px-4 pb-4 z-10">
          {restaurant?.logo_url && (
            <img src={restaurant.logo_url} alt="Logo"
              className="h-12 w-12 object-contain rounded-lg drop-shadow-md mb-1.5"
              style={{ background: "transparent" }} />
          )}
          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">Admin Panel</p>
          <h1 className="font-serif text-xl font-semibold drop-shadow-md" style={{ color: "var(--title, #ffffff)" }}>
            {restaurant?.name ?? "Your Restaurant"}
          </h1>
        </div>

        {/* Desktop: left-aligned, logo above name */}
        <div className="hidden sm:flex absolute bottom-0 left-0 right-0 flex-col items-start px-6 pb-5 z-10">
          {restaurant?.logo_url && (
            <img src={restaurant.logo_url} alt="Logo"
              className="h-14 w-14 object-contain drop-shadow-lg mb-2"
              style={{ background: "transparent" }} />
          )}
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-0.5">Admin Panel</p>
          <h1 data-tour="tour-restaurant-name" className="font-serif text-3xl font-semibold drop-shadow-md" style={{ color: "var(--title, #ffffff)" }}>
            {restaurant?.name ?? "Your Restaurant"}
          </h1>
        </div>
      </div>

      {/* Mobile action sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-start sm:hidden bg-black/40"
          onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; }}
          style={{ animation: 'fadeIn 0.15s ease-out' }}>
          <div className="bg-white rounded-b-2xl shadow-2xl p-5 space-y-2 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'slideDown 0.2s ease-out', transition: 'transform 200ms ease-out' }}>
            <SheetThemeButton restaurant={restaurant} onSave={handleSaveTheme} saving={saving}
              onClose={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; }}
              tourTarget="theme-branding-option" />
            <a href={`/admin/${restaurantSlug}/analytics`}
              onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-medium">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </a>
            <button data-tour="qr-option" type="button" onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; setShowQR(true); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-medium">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
                <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
                <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14h3v3m4-3v3m-4 4h7"/>
              </svg>
              QR Code
            </button>
            <a data-tour="view-menu-mobile" href={`/menu/${restaurantSlug}`} target="_blank" rel="noopener noreferrer"
              onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-medium">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View public menu
            </a>
            <button data-tour="settings-btn-mobile" type="button" onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; setTourKey((k) => k + 1); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-medium">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Replay tour
            </button>
            <button type="button" onClick={() => { setMobileOpen(false); handleSignOut(); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-medium">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
            <button type="button"
              onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; setSettingsOpen(true); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-medium">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Account settings
            </button>
            <button type="button"
              onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; setFeedbackOpen(true); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-medium">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Send feedback
            </button>
            <button type="button" data-tour="sheet-close" onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; }}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-500 text-sm font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {message && (
        <div className={`sticky top-0 z-30 py-2.5 px-4 text-center text-sm font-medium ${
          message.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {message.text}
        </div>
      )}

      {/* Empty state — no categories at all */}
      {isEmpty && (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <h3 className="text-xl font-semibold text-[var(--foreground)] font-serif">No categories yet</h3>
          <p className="text-sm text-[var(--muted)] mt-2 max-w-xs">Start by creating a category (e.g. &ldquo;Mains&rdquo;), then add items to it.</p>
          <button type="button" onClick={() => setCategoryModalParent({ id: null, name: "" })}
            className="mt-6 bg-[var(--accent)] text-white font-semibold rounded-xl px-6 py-3 hover:opacity-90 transition-opacity flex items-center gap-2">
            <Plus size={16} /> Add first category
          </button>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* Category tabs — draggable + clickable. Both rows share one sticky
              container so row 2 always pins directly below row 1. */}
          <div data-tour="tour-categories" className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--card-border)] shadow-sm">

            {/* Row 1 — menus. Primary level: larger, bolder, accent-marked. */}
            {layered && (
              <div className={childTabs.length > 0 ? "border-b border-[var(--card-border)]/70" : ""}>
                <div className="relative max-w-4xl mx-auto px-3 sm:px-6">
                  {menuRowCanScrollLeft && (
                    <button type="button" onClick={menuRowScrollLeft} aria-label="Scroll menus left"
                      className="flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-7 md:h-7 items-center justify-center rounded-full bg-[var(--card)] border border-[var(--card-border)] shadow-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                      <ChevronLeft size={16} />
                    </button>
                  )}
                  {menuRowCanScrollRight && (
                    <button type="button" onClick={menuRowScrollRight} aria-label="Scroll menus right"
                      className="flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-7 md:h-7 items-center justify-center rounded-full bg-[var(--card)] border border-[var(--card-border)] shadow-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  )}
                  <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleMenuDragEnd}>
                    <SortableContext items={menuGroups.map((g) => g.id)} strategy={horizontalListSortingStrategy}>
                      <div
                        ref={menuRowScrollRef}
                        onScroll={updateMenuRowScrollState}
                        className="tabs-scroll flex gap-1 sm:gap-2 overflow-x-auto scrollbar-none px-1 items-stretch select-none"
                        style={{ WebkitUserSelect: "none" }}
                        onPointerDown={(e) => {
                          const el = menuRowScrollRef.current;
                          if (!el || (e.target as HTMLElement).closest('button')) return;
                          menuRowDragRef.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, didDrag: false };
                        }}
                        onPointerMove={(e) => {
                          const drag = menuRowDragRef.current;
                          const el = menuRowScrollRef.current;
                          if (!drag.active || !el || e.buttons === 0) return;
                          const dx = e.clientX - drag.startX;
                          if (Math.abs(dx) > 5) { drag.didDrag = true; el.scrollLeft = drag.scrollLeft - dx; }
                        }}
                        onPointerUp={() => { menuRowDragRef.current.active = false; }}
                        onPointerLeave={() => { menuRowDragRef.current.active = false; }}
                      >
                        {menuGroups.map((group) => {
                          const isActive = activeMenu === group.id;
                          return (
                            <SortableCategoryTab key={group.id} name={group.id}>
                              <button
                                type="button"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={() => {
                                  if (menuRowDragRef.current.didDrag) { menuRowDragRef.current.didDrag = false; return; }
                                  setActiveMenu(group.id);
                                  setActiveCategory(group.children[0] ?? group.id);
                                }}
                                className="relative flex-shrink-0 px-3 sm:px-4 pt-3 pb-2.5 min-h-[44px] min-w-[3.5rem] max-w-[9rem] sm:max-w-[11rem] touch-manipulation transition-colors duration-200"
                              >
                                <span className={`tab-label w-full text-sm sm:text-base font-bold uppercase tracking-wide font-sans transition-colors duration-200 ${
                                  isActive ? "text-[var(--accent)]" : "text-[var(--muted)]"
                                }`}>
                                  {group.name}
                                </span>
                                {isActive && (
                                  <motion.span
                                    layoutId="admin-menu-underline"
                                    className="absolute left-3 right-3 sm:left-4 sm:right-4 bottom-0 h-[3px] rounded-full bg-[var(--accent)]"
                                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                                  />
                                )}
                              </button>
                            </SortableCategoryTab>
                          );
                        })}
                      </div>
                    </SortableContext>
                  </DndContext>
                </div>
              </div>
            )}

            {/* Row 2 — categories inside the active menu (unchanged styling). */}
            <div className="relative max-w-4xl mx-auto px-3 sm:px-6">
              {adminCanScrollLeft && (
                <button type="button" onClick={adminScrollLeft} aria-label="Scroll categories left"
                  className="flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-7 md:h-7 items-center justify-center rounded-full bg-[var(--card)] border border-[var(--card-border)] shadow-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  <ChevronLeft size={16} />
                </button>
              )}
              {adminCanScrollRight && (
                <button type="button" onClick={adminScrollRight} aria-label="Scroll categories right"
                  className="flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 md:w-7 md:h-7 items-center justify-center rounded-full bg-[var(--card)] border border-[var(--card-border)] shadow-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  <ChevronRight size={16} />
                </button>
              )}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={layered ? handleChildDragEnd : handleCategoryDragEnd}>
                <SortableContext items={visibleTabs} strategy={horizontalListSortingStrategy}>
                  <div
                    ref={tabScrollRef}
                    onScroll={updateAdminScrollState}
                    className="tabs-scroll flex gap-2 overflow-x-auto py-3 scrollbar-none px-1 items-stretch"
                    onPointerDown={(e) => {
                      const el = tabScrollRef.current;
                      if (!el || (e.target as HTMLElement).closest('button')) return;
                      adminTabDragRef.current = { active: true, startX: e.clientX, scrollLeft: el.scrollLeft, didDrag: false };
                    }}
                    onPointerMove={(e) => {
                      const drag = adminTabDragRef.current;
                      const el = tabScrollRef.current;
                      if (!drag.active || !el || e.buttons === 0) return;
                      const dx = e.clientX - drag.startX;
                      if (Math.abs(dx) > 5) {
                        drag.didDrag = true;
                        el.scrollLeft = drag.scrollLeft - dx;
                      }
                    }}
                    onPointerUp={() => { adminTabDragRef.current.active = false; }}
                    onPointerLeave={() => { adminTabDragRef.current.active = false; }}
                  >
                    {visibleTabs.map((cat) => (
                      <SortableCategoryTab key={cat} name={cat}>
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => {
                            if (adminTabDragRef.current.didDrag) { adminTabDragRef.current.didDrag = false; return; }
                            setActiveCategory(cat);
                          }}
                          className={`flex-shrink-0 inline-flex items-center justify-center px-4 py-2 min-h-[44px] min-w-[3.75rem] max-w-[11rem] rounded-xl text-sm font-medium transition-all select-none font-sans ${
                            activeCategory === cat
                              ? "bg-[var(--accent)] text-white shadow-sm"
                              : "bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                          }`}>
                          <span className="tab-label min-w-0">{catLabel(cat)}</span>
                        </button>
                      </SortableCategoryTab>
                    ))}
                    {layered && childTabs.length === 0 && (
                      <span className="flex-shrink-0 self-center text-xs text-[var(--muted)] px-1">
                        {catLabel(activeMenu)} contains menu items, not sub-categories
                      </span>
                    )}
                    {/* The label always names the row it will land in, because in
                        layered mode "Add category" alone gives no clue whether
                        the new row joins the menu or nests inside the category
                        currently open. */}
                    <button
                      data-tour="add-category"
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => setCategoryModalParent(
                        layered && activeGroup?.id ? { id: activeGroup.id, name: activeGroup.name } : { id: null, name: "" }
                      )}
                      title={addCategoryLabel}
                      className="flex-shrink-0 self-center flex items-center gap-1 whitespace-nowrap text-xs font-semibold font-sans text-[var(--accent)] border-2 border-dashed border-[var(--accent)]/30 rounded-xl px-3 py-1.5 hover:bg-[var(--accent)]/5 transition-colors">
                      <Plus size={14} />
                      <span className="max-w-[14rem] truncate">{addCategoryLabel}</span>
                    </button>
                    <button
                      data-tour="manage-categories"
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => setShowManageModal(true)}
                      className="flex-shrink-0 self-center flex items-center gap-1 whitespace-nowrap text-xs font-semibold font-sans text-[var(--muted)] border border-[var(--card-border)] rounded-xl px-3 py-1.5 hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30 transition-colors"
                      title={layered ? "Create menus, and move or reorder categories" : "Add, rename, reorder or delete categories"}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {layered ? "Manage menus" : "Manage"}
                    </button>
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

          <div data-tour="menu-area" className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex justify-between items-start gap-3 mb-5">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold min-w-0 flex-1 break-words hyphens-auto text-wrap-balance">{catLabel(activeCategory)}</h2>
              {/* The category is already named in the heading beside this, so the
                  button stays short rather than truncating it mid-word again. */}
              <motion.button data-tour="tour-add-item" type="button"
                onClick={() => { setAddingNew(true); setEditingItem(null); }}
                title={`Add item to ${catLabel(activeCategory)}`}
                className="flex-shrink-0 whitespace-nowrap px-4 py-2 min-h-[44px] rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.1 }}
              >
                + Add item
              </motion.button>
            </div>

            <CategoryNoteEditor
              category={activeCategory}
              label={catLabel(activeCategory)}
              initialNote={categoryNotes[activeCategory] ?? ""}
              onSave={handleSaveCategoryNote}
              saving={savingNote}
            />

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleItemDragEnd}>
              <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-3 mt-6">
                  {items.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center rounded-2xl border-2 border-dashed border-[var(--card-border)]">
                      <p className="text-sm text-[var(--muted)]">
                        Add your first item to{" "}
                        <span className="font-semibold" style={{ color: "var(--main-color)" }}>
                          &ldquo;{catLabel(activeCategory)}&rdquo;
                        </span>
                        {" "}— click &ldquo;+ Add item&rdquo; to get started.
                      </p>
                    </div>
                  )}
                  {items.map((item, idx) => {
                    // Dim greyed-out cards, but let the RELEVANT reversal control
                    // punch through at full opacity so it stays obvious/clickable.
                    // CSS opacity can't be overridden on a child of a dimmed
                    // parent, so the dim is applied per-element — never on the
                    // whole card container. availDim clears when the item is
                    // unavailable (its toggle is the fix); visDim clears when the
                    // item is hidden.
                    const cardDim = item.hidden === true ? "opacity-40" : item.available === false ? "opacity-50" : "";
                    const availDim = item.available === false ? "" : cardDim;
                    const visDim = item.hidden === true ? "" : cardDim;
                    return (
                    <SortableMenuItem key={item.id} item={item} isFirst={idx === 0}>
                      {/* Item image — card overflow-hidden clips corners */}
                      {item.image_url && (
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="object-cover flex-shrink-0"
                          style={{ width: 90, alignSelf: "stretch" }}
                        />
                      )}
                      {/* Details */}
                      <div className="p-3 sm:p-4 flex-1 min-w-0">
                        <div className={`flex justify-between gap-2 items-start flex-wrap ${cardDim}`}>
                          <div className="min-w-0">
                            <h3 className="font-serif text-base font-semibold leading-snug text-wrap-balance">{item.name}</h3>
                            {(item.hidden === true || item.available === false) && (
                              <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                {item.hidden === true && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700">
                                    <EyeOff size={11} /> Hidden
                                  </span>
                                )}
                                {item.available === false && (
                                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                                    Unavailable
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          <span className="font-semibold text-[var(--accent)] tabular-nums text-base flex-shrink-0">
                            {`$${Number(item.price).toFixed(2)}`}
                          </span>
                        </div>
                        {item.description && (
                          <p className={`text-[var(--muted)] text-xs sm:text-sm mt-1 line-clamp-2 text-wrap-force ${cardDim}`}>
                            {item.description}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                          <span data-tour={idx === 0 ? "first-item-available" : undefined} className={availDim}>
                          <AvailabilityToggle
                            available={item.available !== false}
                            onChange={async (next) => {
                              setSaving(true);
                              const { error } = await supabase.from("menu_items")
                                .update({ available: next }).eq("id", item.id);
                              if (error) showMsg("err", friendlyErrorMessage(error));
                              else { showMsg("ok", next ? "Marked available." : "Marked unavailable."); await refreshMenu(); }
                              setSaving(false);
                            }}
                          />
                          </span>
                          <span aria-hidden className={`text-[var(--card-border)] select-none px-0.5 ${cardDim}`}>|</span>
                          <span data-tour={idx === 0 ? "first-item-visibility" : undefined} className={visDim}>
                          <VisibilityToggle
                            hidden={item.hidden === true}
                            onChange={async (next) => {
                              setSaving(true);
                              const { error } = await supabase.from("menu_items")
                                .update({ hidden: next }).eq("id", item.id);
                              if (error) showMsg("err", friendlyErrorMessage(error));
                              else { showMsg("ok", next ? "Hidden from menu." : "Shown on menu."); await refreshMenu(); }
                              setSaving(false);
                            }}
                          />
                          </span>
                          <motion.button type="button"
                            data-tour={idx === 0 ? "first-item-edit" : undefined}
                            onClick={() => { setEditingItem(item); setAddingNew(false); }}
                            className={`px-3 py-1.5 rounded-lg border border-[var(--accent)] text-[var(--accent)] text-xs font-semibold font-sans hover:bg-[var(--accent)] hover:text-white transition-all ${cardDim}`}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.08 }}
                          >
                            Edit
                          </motion.button>
                          <motion.button type="button"
                            onClick={() => handleDelete(item.id, item.image_url)}
                            disabled={saving}
                            className={`px-2 py-1.5 text-[var(--muted)] hover:text-red-600 text-xs font-sans disabled:opacity-50 transition-colors ${cardDim}`}
                            whileTap={{ scale: 0.95 }}
                            transition={{ duration: 0.08 }}
                          >
                            Delete
                          </motion.button>
                        </div>
                      </div>
                    </SortableMenuItem>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </>
      )}

      {(editingItem || addingNew) && (
        <ItemForm
          item={editingItem ?? undefined}
          categories={leafCategories}
          catLabel={catLabel}
          restaurantSlug={restaurantSlug}
          onSave={handleSaveItem}
          onCancel={() => { setEditingItem(null); setAddingNew(false); }}
          saving={saving}
          existingImageUrl={editingItem?.image_url ?? undefined}
          initialCategory={addingNew ? activeCategory : undefined}
        />
      )}

      <OnboardingTour
        tourKey={tourKey}
        hasCompletedTour={hasCompletedTour}
        hasSampleItem={hasSampleItem}
        userId={user?.id}
        slug={restaurantSlug}
      />

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        slug={restaurantSlug}
        userEmail={user?.email ?? ""}
        subStatus={subStatus}
        trialDaysLeft={daysLeftInTrial}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        periodEnd={periodEnd}
        hasStripeSubscription={hasStripeSubscription}
        restaurantId={restaurantId}
      />

      {/* QR Code Modal */}
      {showQR && (
        <QRModal
          slug={restaurantSlug}
          restaurant={restaurant}
          onClose={() => setShowQR(false)}
        />
      )}

      {/* Owner → DineLinks Feedback Modal */}
      {feedbackOpen && (
        <FeedbackModal onClose={() => setFeedbackOpen(false)} />
      )}

      {/* Add Category Modal */}
      {categoryModalParent && (
        <AddCategoryModal
          restaurantId={restaurantId}
          parentId={categoryModalParent.id}
          parentName={categoryModalParent.name}
          isSubCategory={layered && categoryModalParent.id !== null && childTabs.length === 0}
          onCreated={async (categoryId) => {
            setCategoryModalParent(null);
            await refreshMenu();
            setActiveCategory(categoryId);
          }}
          onClose={() => setCategoryModalParent(null)}
        />
      )}

      {/* Manage Categories Modal */}
      {showManageModal && (
        <ManageCategoriesModal
          restaurantId={restaurantId}
          categories={sortedCategories}
          categoryRows={categoryRows}
          nestingOn={restaurant?.use_nested_categories === true}
          grouped={grouped}
          onToggleNesting={async (value) => {
            const { error } = await supabase.from("restaurants")
              .update({ use_nested_categories: value }).eq("id", restaurantId);
            if (error) { showMsg("err", friendlyErrorMessage(error)); return false; }
            setRestaurant((p) => p ? { ...p, use_nested_categories: value } : p);
            return true;
          }}
          onClose={() => setShowManageModal(false)}
          onUpdated={async (newCats) => {
            setSortedCategories(newCats);
            setActiveCategory((prev) => newCats.includes(prev) ? prev : newCats[0] ?? "");
            await refreshMenu();
          }}
        />
      )}

    </main>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function useBodyScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [isOpen]);
}

function AvailabilityToggle({ available, onChange }: { available: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!available)}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        available
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-red-100 text-red-700 border-red-300 hover:bg-red-200"
      }`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${available ? "bg-emerald-500" : "bg-red-500"}`} />
      {available ? "Available" : "Unavailable"}
    </button>
  );
}

// Controls whether the item appears on the live customer menu at all. This is
// deliberately distinct from AvailabilityToggle (stock status): hidden items
// vanish from the menu entirely, whereas unavailable items still show, greyed
// out. Different visual language — eye icon + sky/slate — so the two toggles
// are never confused.
function VisibilityToggle({ hidden, onChange }: { hidden: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!hidden)}
      title={hidden ? "Hidden from your live menu — click to show" : "Shown on your live menu — click to hide"}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
        hidden
          ? "bg-red-50 text-red-700 border-red-300 hover:bg-red-100"
          : "bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100"
      }`}>
      {hidden ? <EyeOff size={13} /> : <Eye size={13} />}
      {hidden ? "Hidden" : "Shown"}
    </button>
  );
}

// `category` is a restaurant_categories.id — `label` is what the owner sees.
function CategoryNoteEditor({
  category, label, initialNote, onSave, saving,
}: { category: string; label: string; initialNote: string; onSave: (cat: string, note: string) => void; saving: boolean }) {
  const [note, setNote] = useState(initialNote);
  useEffect(() => { setNote(initialNote); }, [initialNote]);
  return (
    <div className="mb-5 p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      <label className="block text-xs font-sans font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
        Note for &ldquo;{label}&rdquo;
      </label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)}
        placeholder={`Optional note for "${label}" — e.g. "All ${label.toLowerCase()} served hot"`}
        rows={2}
        className="font-sans w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
      <button type="button" onClick={() => onSave(category, note)} disabled={saving}
        className="font-sans mt-2 px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
        {saving ? "Saving…" : "Save note"}
      </button>
    </div>
  );
}

// ── Owner → DineLinks feedback modal ──────────────────────────────────────────
// This is the owner talking to *us* (DineLinks) — bug reports, feature requests,
// general thoughts. Distinct from guest feedback (diner → restaurant). Styled
// per convention: white bg + dark text, var(--accent) on the primary button.

const FEEDBACK_TYPES = [
  { value: "bug", label: "Bug report" },
  { value: "feature", label: "Feature request" },
  { value: "general", label: "General feedback" },
] as const;

const MESSAGE_MAX = 2000;

function FeedbackModal({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState<"bug" | "feature" | "general">("general");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  useBodyScrollLock(true);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/owner-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setDone(true);
      setTimeout(onClose, 2200);
    } catch (err) {
      setError(friendlyErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      style={{ animation: "fadeIn 0.15s ease-out" }} onClick={onClose}>
      <div className="bg-white text-gray-900 border border-gray-200 rounded-2xl shadow-2xl w-full max-w-md p-6"
        style={{ animation: "modalIn 0.15s ease-out" }} onClick={(e) => e.stopPropagation()}>
        {done ? (
          <div className="py-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ background: "var(--accent)" }}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-serif text-lg font-semibold text-gray-900">Thank you!</h3>
            <p className="mt-1.5 text-sm text-gray-600">
              We read every message and really appreciate you taking the time.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <h3 className="font-serif text-lg font-semibold text-gray-900">Send feedback</h3>
              <p className="mt-1 text-sm text-gray-500">
                Found a bug? Want a feature? Tell us what you think — a real person reads every note.
              </p>
            </div>

            {/* Type selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
                What&apos;s this about?
              </label>
              <div className="grid grid-cols-3 gap-2">
                {FEEDBACK_TYPES.map((t) => {
                  const active = type === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => setType(t.value)}
                      className={`px-2 py-2.5 rounded-xl text-xs font-medium border transition-colors ${
                        active
                          ? "text-white border-transparent"
                          : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                      }`}
                      style={active ? { background: "var(--accent)" } : undefined}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">
                Your message
              </label>
              <textarea
                value={message}
                onChange={(e) => { setMessage(e.target.value.slice(0, MESSAGE_MAX)); setError(""); }}
                placeholder="Tell us what's on your mind…"
                rows={5}
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm resize-y focus:outline-none focus:ring-2"
                style={{ ["--tw-ring-color" as string]: "var(--accent)" }}
              />
              <div className="mt-1 flex justify-end">
                <span className="text-[11px] text-gray-400">{message.length}/{MESSAGE_MAX}</span>
              </div>
            </div>

            {error && <p className="text-xs text-red-600">{error}</p>}

            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={submitting || !message.trim()}
                className="flex-1 py-2.5 rounded-xl text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ background: "var(--accent)" }}>
                {submitting ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Theme modal (shared between desktop header button and mobile sheet) ────────

type ThemeModalProps = {
  restaurant: Restaurant | null;
  onSave: (u: Partial<Restaurant>) => void;
  saving: boolean;
  sheetMode?: boolean;
  onClose?: () => void;
  tourTarget?: string;
  noTrigger?: boolean;
  externalOpen?: boolean;
  onExternalClose?: () => void;
};

function ThemeModal({ restaurant, onSave, saving, sheetMode, onClose, tourTarget, noTrigger, externalOpen, onExternalClose }: ThemeModalProps) {
  const [internalOpen, setInternalOpen]   = useState(false);
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (val: boolean) => { setInternalOpen(val); if (!val) onExternalClose?.(); };
  const [card, setCard]                   = useState(D_CARD);
  const [accent, setAccent]               = useState(D_ACCENT);
  const [bg, setBg]                       = useState(D_BG);
  const [fontColor, setFontColor]         = useState(D_TEXT);
  const [mutedColor, setMutedColor]       = useState("#6b6560");
  const [titleColor, setTitleColor]       = useState(D_TEXT);
  const [font, setFont]                   = useState("sans");
  const [name, setName]                   = useState("");
  const [heroUrl, setHeroUrl]             = useState("");
  const [logoUrl, setLogoUrl]             = useState("");
  const [fontOpen, setFontOpen]           = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [colorCustomized, setColorCustomized] = useState(false);
  const [showCurrencySymbol, setShowCurrencySymbol] = useState(true);

  useBodyScrollLock(open);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => {
    if (open && restaurant) {
      setCard(restaurant.main_color ?? D_CARD);
      setAccent(restaurant.accent_color ?? D_ACCENT);
      setBg(restaurant.background_color ?? D_BG);
      setFontColor(restaurant.font_color ?? D_TEXT);
      setMutedColor(restaurant.muted_color ?? "#6b6560");
      setTitleColor(restaurant.title_color ?? restaurant.font_color ?? D_TEXT);
      setFont(restaurant.font_family ?? "sans");
      setName(restaurant.name ?? "");
      setHeroUrl(restaurant.hero_image_url ?? "");
      setLogoUrl(restaurant.logo_url ?? "");
      setShowCurrencySymbol(restaurant.show_currency_symbol !== false);
      setFontOpen(false);
      setSelectedPreset(null);
      setColorCustomized(false);
    }
    // initialise form fields when modal opens — setState-in-effect is intentional here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const save = () => {
    onSave({
      main_color:           card,
      accent_color:         accent,
      background_color:     bg || null,
      font_color:           fontColor || null,
      muted_color:          mutedColor.trim() || null,
      title_color:          titleColor || null,
      font_family:          font,
      name:                 name.trim() || null,
      hero_image_url:       heroUrl.trim() || null,
      logo_url:             logoUrl.trim() || null,
      show_currency_symbol: showCurrencySymbol,
    } as Partial<Restaurant>);
    setOpen(false);
    onClose?.();
  };

  const colors = [
    { label: "Card background", value: card,      set: setCard      },
    { label: "Accent colour",   value: accent,    set: setAccent    },
    { label: "Page background", value: bg,        set: setBg        },
    { label: "Text colour",     value: fontColor, set: setFontColor },
    { label: "Restaurant name colour", value: titleColor, set: setTitleColor },
  ] as const;

  const trigger = sheetMode ? (
    <button data-tour={tourTarget} type="button" onClick={() => setOpen(true)}
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-medium">
      <svg className="w-4 h-4 text-[var(--muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
      Theme & branding
    </button>
  ) : (
    <button data-tour={tourTarget} type="button" onClick={() => setOpen(true)}
      className="min-h-[40px] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium border border-white/25 flex items-center gap-2 transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
      </svg>
      Theme
    </button>
  );

  return (
    <>
      {!noTrigger && trigger}
      {open && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
          style={{ animation: 'fadeIn 0.15s ease-out' }}>
          <div className="flex flex-col w-full max-w-lg md:max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--card)] shadow-2xl"
            style={{ animation: 'modalIn 0.15s ease-out' }}>
            <div className="flex-shrink-0 bg-[var(--card)] border-b border-[var(--card-border)] px-6 py-4 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[var(--foreground)]">Theme & branding</h2>
                <p className="text-xs text-[var(--muted)] mt-0.5">Changes apply instantly after saving</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-[var(--muted)] hover:text-[var(--foreground)] p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

              {/* LIVE PREVIEW — always at top */}
              <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm" style={{ background: bg || '#faf8f5' }}>
                <div className="h-9 w-full flex items-center px-3" style={{ background: card }}>
                  <span className="text-[10px] font-bold truncate" style={{ color: titleColor }}>{name || "Your Restaurant"}</span>
                </div>
                <div className="px-3 pt-2 pb-0.5">
                  <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: fontColor, opacity: 0.5 }}>Mains</p>
                </div>
                {[{ n: "Grilled Salmon", d: "Lemon butter, fresh herbs", p: showCurrencySymbol ? "$24" : "24" }, { n: "Pasta Primavera", d: "Fresh vegetables, olive oil", p: showCurrencySymbol ? "$18" : "18" }].map(item => (
                  <div key={item.n} className="mx-3 mb-2 rounded-lg overflow-hidden flex border" style={{ borderColor: `${fontColor}18`, background: card }}>
                    <div className="w-10 h-10 flex-shrink-0 bg-gray-200" />
                    <div className="px-2 py-1.5 flex-1 min-w-0">
                      <div className="flex justify-between items-baseline gap-1">
                        <p className="text-[10px] font-semibold truncate" style={{ color: fontColor }}>{item.n}</p>
                        <p className="text-[10px] font-bold flex-shrink-0" style={{ color: accent }}>{item.p}</p>
                      </div>
                      <p className="text-[9px] truncate" style={{ color: `${fontColor}80` }}>{item.d}</p>
                    </div>
                  </div>
                ))}
                <div className="px-3 pb-2 text-center">
                  <p className="text-[8px]" style={{ color: `${fontColor}30` }}>Powered by DineLinks</p>
                </div>
              </div>

              {/* PRESETS */}
              <div className="space-y-3">
                <div className="text-xs uppercase tracking-widest text-gray-500">Choose a theme</div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {PRESETS.map((preset) => {
                    const isSelected = selectedPreset === preset.name;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => {
                          setCard(preset.main);
                          setAccent(preset.accent);
                          setBg(preset.background);
                          setFontColor(preset.fontColor);
                          setMutedColor(preset.mutedColor);
                          setTitleColor(preset.titleColor);
                          setFont(preset.fontFamily);
                          setSelectedPreset(preset.name);
                          setColorCustomized(false);
                        }}
                        style={{
                          background: "white",
                          border: isSelected ? "2px solid #2c2a26" : "1px solid #e8e4dd",
                          borderRadius: 10,
                          padding: "10px 12px",
                          cursor: "pointer",
                          textAlign: "left",
                          width: "100%",
                          transition: "border-color 150ms",
                        }}
                      >
                        <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
                          {[preset.background, preset.main, preset.accent, preset.fontColor].map((color, i) => (
                            <div key={i} style={{
                              width: 20, height: 20, borderRadius: 4,
                              background: color,
                              border: "1px solid rgba(0,0,0,0.1)",
                              flexShrink: 0,
                            }} />
                          ))}
                        </div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "#2c2a26" }}>
                          {preset.name}
                        </div>
                        <div style={{ fontSize: 11, color: "#6b6560", marginTop: 2 }}>
                          {preset.description}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>


                  {/* Colors */}
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-3">Colors</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {colors.map(({ label, value, set }) => (
                        <div key={label} className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3 flex flex-col gap-2">
                          <label className="block text-xs font-semibold text-[var(--muted)]">{label}</label>
                          <div className="flex items-center gap-2">
                            <div className="relative flex-shrink-0">
                              <input type="color" value={value}
                                onChange={(e) => { set(e.target.value); setColorCustomized(true); }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                              <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md" style={{ background: value }} />
                            </div>
                            <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-wide">{value}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    {colorCustomized && (() => {
                      const textOnCard = getContrast(fontColor, card);
                      const textOnBg = getContrast(fontColor, bg);
                      const accentOnBg = getContrast(accent, bg);
                      const lowContrast = textOnCard < 4.5 || textOnBg < 4.5;
                      if (!lowContrast && accentOnBg >= 3.0) return null;
                      return (
                        <div className="mt-3 rounded-lg border px-3 py-3 text-xs font-sans bg-amber-50 border-amber-200">
                          <div className="flex items-center gap-1.5 mb-2">
                            <AlertTriangle size={13} className="text-amber-600 flex-shrink-0" />
                            <span className="font-semibold text-amber-700">
                              {lowContrast ? 'Low contrast' : 'Accent contrast below recommended'}
                            </span>
                          </div>
                          <div className="space-y-1">
                            {[
                              { label: "Text on card", ratio: textOnCard, min: 4.5 },
                              { label: "Text on page", ratio: textOnBg, min: 4.5 },
                              { label: "Accent on page", ratio: accentOnBg, min: 3.0 },
                            ].filter(p => p.ratio < p.min).map(p => (
                              <div key={p.label} className="flex items-center justify-between gap-2">
                                <span className="text-amber-600">{p.label}</span>
                                <span className="font-mono font-semibold">
                                  {p.ratio.toFixed(1)}:1 <span className="opacity-60 font-normal">(min {p.min}:1)</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Subtitle / description text color */}
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-1.5">Subtitle / description color</p>
                    <p className="text-xs text-[var(--muted)] mb-2">Used for descriptions, subheadings, and secondary text on your menu.</p>
                    <div className="flex items-center gap-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] p-3">
                      <div className="relative flex-shrink-0">
                        <input type="color" value={mutedColor}
                          onChange={(e) => setMutedColor(e.target.value)}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                        <div className="w-10 h-10 rounded-xl border-2 border-white shadow-md" style={{ background: mutedColor }} />
                      </div>
                      <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-wide">{mutedColor}</span>
                    </div>
                  </div>

                  {/* Currency symbol toggle */}
                  <div className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] px-4 py-3">
                    <Toggle
                      label="Show $ symbol on prices"
                      checked={showCurrencySymbol}
                      onChange={setShowCurrencySymbol}
                    />
                    <p className="text-xs text-[var(--muted)] mt-1">When off, prices display as numbers only (e.g. &ldquo;18&rdquo; instead of &ldquo;$18&rdquo;).</p>
                  </div>

                  {/* Font */}
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-2">Font</p>
                    <div className="relative">
                      <button type="button" onClick={() => setFontOpen((o) => !o)}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                        <span className={FONT_OPTIONS.find((o) => o.value === font)?.cls}>
                          {FONT_OPTIONS.find((o) => o.value === font)?.label ?? "Geist Sans"}
                        </span>
                        <svg className={`w-4 h-4 text-[var(--muted)] transition-transform ${fontOpen ? "rotate-180" : ""}`}
                          fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {fontOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-xl border border-[var(--card-border)] bg-[var(--card)] shadow-xl z-10 max-h-52 overflow-y-auto">
                          {FONT_OPTIONS.map((opt) => (
                            <button key={opt.value} type="button"
                              onClick={() => { setFont(opt.value); setFontOpen(false); }}
                              className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--background)] transition-colors ${opt.cls} ${font === opt.value ? "text-[var(--accent)] font-medium" : "text-[var(--foreground)]"}`}>
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Restaurant details */}
                  <div>
                    <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-widest mb-3">Restaurant details</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-sans font-medium text-[var(--foreground)] mb-1.5">Restaurant name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                          placeholder="e.g. La Piazza"
                          className="font-sans w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium font-sans text-[var(--foreground)] mb-1.5">Logo</label>
                        <p className="text-xs font-sans text-[var(--muted)] mb-2">PNG with a transparent background works best.</p>
                        <div className="max-w-[140px]">
                          <ImageUploader currentUrl={logoUrl} onUploaded={(url) => setLogoUrl(url)} folder="logos" aspectRatio="square" />
                        </div>
                        {logoUrl && (
                          <a href={logoUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs font-sans text-gray-700 hover:text-gray-900 hover:underline inline-block">View full size ↗</a>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium font-sans text-[var(--foreground)] mb-1.5">Hero / banner image</label>
                        <p className="text-xs font-sans text-[var(--muted)] mb-2">Shown across the top of your public menu.</p>
                        <div className="max-h-[160px] overflow-hidden rounded-lg">
                          <ImageUploader currentUrl={heroUrl} onUploaded={(url) => setHeroUrl(url)} folder="hero" aspectRatio="video" />
                        </div>
                        {heroUrl && (
                          <a href={heroUrl} target="_blank" rel="noopener noreferrer" className="mt-1 text-xs font-sans text-gray-700 hover:text-gray-900 hover:underline inline-block">View full size ↗</a>
                        )}
                      </div>
                    </div>
                  </div>

            </div>
            <div className="flex-shrink-0 border-t border-[var(--card-border)] px-6 py-4 bg-[var(--card)] space-y-3">
              {colorCustomized && (getContrast(fontColor, card) < 4.5 || getContrast(fontColor, bg) < 4.5) && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-[#fff8ed] border border-[#f0d89b]">
                  <svg className="w-5 h-5 text-[#b8851e] flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div className="text-sm text-[#5a564f] font-sans">
                    <strong className="text-[#2c2a26]">Low contrast.</strong> Customers may have trouble reading your menu, but you can still save these colors if you like the look.
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    if (restaurant) {
                      setCard(restaurant.main_color ?? D_CARD);
                      setAccent(restaurant.accent_color ?? D_ACCENT);
                      setBg(restaurant.background_color ?? D_BG);
                      setFontColor(restaurant.font_color ?? D_TEXT);
                      setMutedColor(restaurant.muted_color ?? "#6b6560");
                      setTitleColor(restaurant.title_color ?? restaurant.font_color ?? D_TEXT);
                      setFont(restaurant.font_family ?? "sans");
                      setName(restaurant.name ?? "");
                      setHeroUrl(restaurant.hero_image_url ?? "");
                      setLogoUrl(restaurant.logo_url ?? "");
                      setShowCurrencySymbol(restaurant.show_currency_symbol !== false);
                    }
                    setOpen(false);
                    onClose?.();
                  }}
                  className="font-sans flex-1 py-3.5 rounded-xl border border-[var(--card-border)] text-[var(--muted)] text-sm font-medium hover:bg-[var(--card-border)]/30 transition-colors"
                >
                  Cancel
                </button>
                <button type="button" onClick={save} disabled={saving}
                  className="font-sans flex-[2] py-3.5 rounded-xl bg-[var(--accent)] text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity shadow-sm">
                  {saving ? "Saving…" : "Save theme"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Alias for mobile sheet (sheetMode=true)
function SheetThemeButton(props: Omit<ThemeModalProps, "sheetMode"> & { tourTarget?: string }) {
  return <ThemeModal {...props} sheetMode />;
}

function AdminMenuPanel({
  onOpenTheme,
  onReplayTour,
  onSignOut,
  onOpenQR,
  onOpenSettings,
  onOpenFeedback,
  restaurantSlug,
}: {
  onOpenTheme: () => void;
  onReplayTour: () => void;
  onSignOut: () => void;
  onOpenQR: () => void;
  onOpenSettings: () => void;
  onOpenFeedback: () => void;
  restaurantSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      // While the onboarding tour is driving the dropdown (steps 8/9), ignore
      // outside clicks so the tour card's "Next" button doesn't close it.
      if (document.body.dataset.tourActive === "true") return;
      const target = e.target as Node;
      if (
        panelRef.current && !panelRef.current.contains(target) &&
        btnRef.current && !btnRef.current.contains(target)
      ) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setDropPos({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    setOpen((o) => !o);
  };

  return (
    <div className="relative">
      <button
        data-tour="tour-menu"
        ref={btnRef}
        type="button"
        onClick={handleToggle}
        aria-label="Open menu"
        className="min-h-[44px] px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-sm border border-white/40 inline-flex items-center gap-2 transition-colors"
      >
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" strokeLinecap="round" />
          <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="round" />
          <line x1="3" y1="18" x2="21" y2="18" strokeLinecap="round" />
        </svg>
        <span className="hidden sm:inline">Menu</span>
      </button>

      {open && dropPos && (
        <div
          ref={panelRef}
          style={{
            position: "fixed",
            top: dropPos.top,
            right: dropPos.right,
            // Never let the panel extend past the viewport bottom, no matter
            // how tall the item list is — cap it to the space below the button
            // and scroll internally so every option (Theme & Branding, QR Code,
            // …) stays reachable.
            maxHeight: `calc(100vh - ${dropPos.top}px - 16px)`,
          }}
          className="w-64 rounded-xl bg-white border border-[#e8e4dd] shadow-2xl z-[100] overflow-y-auto"
        >
          <button
            data-tour="theme-branding-option"
            type="button"
            onClick={() => { setOpen(false); onOpenTheme(); }}
            className="w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
            Theme &amp; branding
          </button>
          <a
            href={`/menu/${restaurantSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            View live menu
          </a>
          <button
            data-tour="qr-option"
            type="button"
            onClick={() => { setOpen(false); onOpenQR(); }}
            className="w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
              <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
              <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14h3v3m4-3v3m-4 4h7"/>
            </svg>
            QR Code
          </button>
          <a
            href={`/admin/${restaurantSlug}/analytics`}
            onClick={() => setOpen(false)}
            className="w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Analytics
          </a>
          <button
            type="button"
            onClick={() => { setOpen(false); onOpenSettings(); }}
            className="w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Account settings
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onOpenFeedback(); }}
            className="w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 flex items-center gap-3 border-t border-[#e8e4dd] transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Send feedback
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onReplayTour(); }}
            className="w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 flex items-center gap-3 border-t border-[#e8e4dd] transition-colors"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Replay tour
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); onSignOut(); }}
            className="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 border-t border-[#e8e4dd] transition-colors"
          >
            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function TrialBanner({
  daysLeft,
  onSubscribe,
}: {
  daysLeft: number | null;
  onSubscribe: () => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);

  if (daysLeft === null) return null;

  const isUrgent  = daysLeft <= 7;
  const isExpired = daysLeft <= 0;

  const handleClick = async () => {
    setLoading(true);
    try { await onSubscribe(); } finally { setLoading(false); }
  };

  return (
    <div className="px-4 pt-4 pb-2">
      <div className={`rounded-2xl border shadow-sm overflow-hidden ${
        isExpired
          ? 'border-[#d4b87a] bg-gradient-to-r from-[#fff8ed] to-[#fef0d6]'
          : 'border-[#e8e4dd] bg-gradient-to-r from-[#faf8f5] to-[#f5f1ea]'
      }`}>
        <div className="px-5 py-4 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

          {/* Left: dot + text */}
          <div className="flex items-start sm:items-center gap-4 flex-1 min-w-0">
            <div className="relative flex-shrink-0 mt-1 sm:mt-0">
              <span className="relative flex h-2.5 w-2.5">
                {!isExpired && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#8b6914] opacity-60" />
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isExpired ? 'bg-[#c89b3c]' : 'bg-[#8b6914]'}`} />
              </span>
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-[11px] uppercase tracking-[0.12em] font-semibold text-[#8b6914]">
                  {isExpired ? 'Trial ended' : 'Free trial'}
                </span>
                <span className="text-[#e8e4dd]" aria-hidden>•</span>
                <span className={`text-sm text-[#2c2a26] ${isUrgent ? 'font-semibold' : 'font-normal'}`}>
                  {isExpired ? 'Your menu is offline' : `${daysLeft} day${daysLeft === 1 ? '' : 's'} left`}
                </span>
              </div>
              <span className="text-sm text-[#5a564f] leading-snug">
                {isExpired
                  ? 'Subscribe to bring your menu back online.'
                  : 'Subscribe before your trial ends to keep your menu live.'
                }
              </span>
            </div>
          </div>

          {/* Right: button */}
          <div className="flex-shrink-0 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleClick}
              disabled={loading}
              className={`inline-flex items-center justify-center gap-2 w-full sm:w-auto rounded-xl px-5 h-11 text-sm font-semibold text-[#faf8f5] transition-colors shadow-sm disabled:opacity-60 disabled:cursor-wait ${
                isExpired
                  ? 'bg-[#8b6914] hover:bg-[#6f5310]'
                  : 'bg-[#2c2a26] hover:bg-[#1f1d1a]'
              }`}
            >
              {loading ? 'Redirecting…' : (
                <>
                  <span>Subscribe</span>
                  <span className="text-white/50 font-normal">·</span>
                  <span className="font-normal opacity-80">$25/mo</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact trial-countdown pill for the admin header. DineLinks gold is
// intentionally hardcoded here — the trial is a DineLinks billing concept, the
// one documented exception to the "admin uses restaurant theme colors" rule.
// Subscribed-state logic mirrors the Billing section: a 'trialing' row that
// already carries a stripe_subscription_id means the owner subscribed mid-trial,
// so we must NEVER show them a "Subscribe" prompt.
function TrialPill({
  subStatus,
  daysLeft,
  hasStripeSubscription,
  loading,
  onSubscribe,
}: {
  subStatus: string;
  daysLeft: number | null;
  hasStripeSubscription: boolean;
  loading: boolean;
  onSubscribe: () => void | Promise<void>;
}) {
  // No pill while we don't yet know, or for fully active subscribers.
  if (subStatus === "loading" || subStatus === "active") return null;

  const pillButton =
    "inline-flex items-center justify-center rounded-full bg-[#8b6914] hover:bg-[#6f5310] border border-[#a07d1a] px-3 h-9 text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-60 disabled:cursor-wait whitespace-nowrap";

  // Already subscribed mid-trial → subtle, non-button indicator. Never "Subscribe".
  if (subStatus === "trialing" && hasStripeSubscription) {
    if (daysLeft === null) return null;
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-white/15 border border-white/25 px-3 h-9 text-xs font-semibold text-white whitespace-nowrap">
        Trial · {daysLeft}d left
      </span>
    );
  }

  // Genuine free trial, not yet subscribed → "Xd left — Subscribe" → checkout.
  if (subStatus === "trialing" && !hasStripeSubscription) {
    return (
      <button type="button" onClick={onSubscribe} disabled={loading} className={pillButton}>
        {loading ? "Redirecting…" : daysLeft !== null ? `${daysLeft}d left — Subscribe` : "Subscribe"}
      </button>
    );
  }

  // canceled / past_due / none → prompt to (re)subscribe.
  return (
    <button type="button" onClick={onSubscribe} disabled={loading} className={pillButton}>
      {loading ? "Redirecting…" : "Subscribe to continue"}
    </button>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm font-sans text-[var(--foreground)]">{label}</span>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-sans transition-colors ${checked ? "text-[var(--accent)] font-semibold" : "text-[var(--muted)]"}`}>{checked ? "On" : "Off"}</span>
        <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
          className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 ${checked ? "bg-[var(--accent)]" : "bg-gray-300"}`}>
          <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${checked ? "translate-x-[22px] translate-y-0.5" : "translate-x-0.5 translate-y-0.5"}`} />
        </button>
      </div>
    </div>
  );
}

// `categories` and `initialCategory` are restaurant_categories.id values;
// `catLabel` turns one into the name shown in the dropdown.
function ItemForm({
  item, categories, catLabel, restaurantSlug, onSave, onCancel, saving, existingImageUrl, initialCategory,
}: {
  item?: MenuItemRow; categories: readonly string[]; catLabel: (id: string) => string; restaurantSlug: string;
  onSave: (p: Partial<MenuItemRow>) => void; onCancel: () => void; saving: boolean;
  existingImageUrl?: string; initialCategory?: string;
}) {
  const [name, setName]               = useState(item?.name ?? "");
  const [desc, setDesc]               = useState(item?.description ?? "");
  const [price, setPrice]             = useState(item != null ? String(Number(item.price)) : "");
  const [priceSuffix, setPriceSuffix] = useState(item?.price_suffix ?? "");
  const [imgUrl, setImgUrl]           = useState(item?.image_url ?? "");
  const [category, setCategory]       = useState(item?.category_id ?? initialCategory ?? "");
  const [available, setAvailable]     = useState<boolean>(item?.available ?? true);
  const [chefs, setChefs]         = useState<boolean>(item?.chefs_favorite ?? false);
  const [gluten, setGluten]       = useState<boolean>(item?.gluten_free ?? false);
  const [nut, setNut]             = useState<boolean>(item?.nut_free ?? false);
  const [vegan, setVegan]         = useState<boolean>(item?.vegan ?? false);
  const [veg, setVeg]             = useState<boolean>(item?.vegetarian ?? false);
  const [dairy, setDairy]         = useState<boolean>(item?.dairy_free ?? false);
  const [spicy, setSpicy]         = useState<boolean>(item?.spicy ?? false);

  useBodyScrollLock(true);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number.parseFloat(price);
    if (!name.trim() || Number.isNaN(p) || p < 0 || !category) return;
    onSave({
      name: name.trim(), description: desc.trim() || null, price: p,
      price_suffix: priceSuffix.trim() || null,
      image_url: imgUrl.trim() || null, category_id: category,
      available, chefs_favorite: chefs, gluten_free: gluten, nut_free: nut,
      vegan, vegetarian: veg, dairy_free: dairy, spicy,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      style={{ animation: 'fadeIn 0.15s ease-out' }}>
      <div className="flex flex-col bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden"
        style={{ animation: 'modalIn 0.15s ease-out' }}>
        <div className="flex-shrink-0 bg-[var(--card)] border-b border-[var(--card-border)] px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-[var(--foreground)]">{item ? "Edit item" : "Add item"}</h3>
          <button type="button" onClick={onCancel} className="text-[var(--muted)] hover:text-[var(--foreground)] p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <form id="item-form" onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-sans font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="font-sans w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs font-sans font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Description</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
                className="font-sans w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-sans font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Price *</label>
                <input type="number" step="0.01" min="0" value={price}
                  onChange={(e) => setPrice(e.target.value)} required
                  className="font-sans w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>
              <div>
                <label className="block text-xs font-sans font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Category *</label>
                {categories.length === 0 ? (
                  <select disabled
                    className="font-sans w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--muted)] text-sm cursor-not-allowed">
                    <option>Create a category first</option>
                  </select>
                ) : (
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    required
                    className="font-sans w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    <option value="" disabled>Select a category…</option>
                    {categories.map((c) => <option key={c} value={c}>{catLabel(c)}</option>)}
                  </select>
                )}
                {!category && categories.length > 0 && (
                  <p className="mt-1 text-xs text-[var(--muted)]">Category is required.</p>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-sans font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Price suffix (optional)</label>
              <input type="text" value={priceSuffix} onChange={(e) => setPriceSuffix(e.target.value)}
                placeholder="/pint, /175ml, /person"
                maxLength={20}
                className="font-sans w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">Photo</label>
              <ImageUploader
                currentUrl={imgUrl}
                onUploaded={(url) => setImgUrl(url)}
                folder={`items/${restaurantSlug}`}
                aspectRatio="video"
                existingImageUrl={existingImageUrl}
              />
              <label className="block text-xs font-sans font-medium text-[var(--muted)] mt-3 mb-1">Or paste image URL</label>
              <input type="url" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)}
                placeholder="https://..."
                className="font-sans w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>
            <div className="flex items-center gap-3">
              <input id="avail" type="checkbox" checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--card-border)] text-[var(--accent)] focus:ring-[var(--accent)]" />
              <label htmlFor="avail" className="text-sm font-medium text-[var(--foreground)]">Listed as available</label>
            </div>
            <div className="border-t border-[var(--card-border)] pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">Dietary & highlights</p>
              <div className="space-y-0.5">
                <Toggle label="Chef's favourite"  checked={chefs}  onChange={setChefs}  />
                <Toggle label="Gluten free"        checked={gluten} onChange={setGluten} />
                <Toggle label="Nut free"           checked={nut}    onChange={setNut}    />
                <Toggle label="Vegan"              checked={vegan}  onChange={setVegan}  />
                <Toggle label="Vegetarian"         checked={veg}    onChange={setVeg}    />
                <Toggle label="Dairy free"         checked={dairy}  onChange={setDairy}  />
                <Toggle label="Spicy"              checked={spicy}  onChange={setSpicy}  />
              </div>
            </div>
          </form>
        </div>
        <div className="flex-shrink-0 border-t border-[var(--card-border)] px-6 py-4 bg-[var(--card)] flex gap-3">
          <button type="button" onClick={onCancel}
            className="font-sans flex-1 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--foreground)] font-medium text-sm hover:bg-[var(--background)] transition-colors">
            Cancel
          </button>
          <button type="submit" form="item-form" disabled={saving}
            className="font-sans flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
            {saving ? "Saving…" : item ? "Update item" : "Add item"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Add Category Modal ────────────────────────────────────────────────────────

function AddCategoryModal({
  restaurantId,
  parentId = null,
  parentName = "",
  isSubCategory = false,
  onCreated,
  onClose,
}: {
  restaurantId: string;
  /** null = top level. Set = the menu this category goes under. */
  parentId?: string | null;
  parentName?: string;
  /** The parent currently holds menu items, so this new row nests below them. */
  isSubCategory?: boolean;
  onCreated: (categoryId: string) => void;
  onClose: () => void;
}) {
  const noun = isSubCategory ? "sub-category" : "category";
  const [name, setName] = useState("");
  const [showImage, setShowImage] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const supabase = createSupabaseClient();
  useBodyScrollLock(true);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);

    // Names only have to be unique among siblings — two different menus may
    // each hold a "Desserts". Siblings are read fresh rather than taken from
    // local state so a category added in another tab still collides.
    // sort_order is likewise scoped per level.
    let siblingQuery = supabase.from("restaurant_categories").select("id, name").eq("restaurant_id", restaurantId);
    siblingQuery = parentId === null ? siblingQuery.is("parent_id", null) : siblingQuery.eq("parent_id", parentId);
    const { data: siblings } = await siblingQuery;

    if ((siblings ?? []).some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) {
      setError(`That ${noun} already exists${parentName ? ` in ${parentName}` : ""}.`);
      setSaving(false);
      return;
    }

    const { data: created, error: insertError } = await supabase
      .from("restaurant_categories")
      .insert({ restaurant_id: restaurantId, name: trimmed, parent_id: parentId, sort_order: siblings?.length ?? 0, show_image: showImage })
      .select("id")
      .single();
    setSaving(false);
    if (insertError || !created) {
      setError(`Could not create that ${noun}. Please try again.`);
      return;
    }
    onCreated(created.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" style={{ animation: "fadeIn 0.15s ease-out" }}>
      <div className="bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ animation: "modalIn 0.15s ease-out" }}>
        <h3 className="font-serif text-lg font-semibold text-[var(--foreground)] mb-1">
          {parentName
            ? `Add ${noun} to ${parentName}`
            : "Add category"}
        </h3>
        <p className="text-xs text-[var(--muted)] font-sans mb-4">
          {isSubCategory
            ? `“${parentName}” currently holds menu items. Adding a sub-category turns it into a menu, and its items will need moving into a sub-category too.`
            : parentName
              ? `Customers will find this category inside the “${parentName}” menu.`
              : "A category is a group of menu items, like “Starters” or “Desserts”."}
        </p>
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold font-sans uppercase tracking-widest text-[var(--muted)] mb-1.5">{isSubCategory ? "Sub-category name" : "Category name"}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder={isSubCategory ? "e.g. Cakes" : "e.g. Desserts"}
              autoFocus
              className="font-sans w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
            {error && <p className="mt-1 text-xs text-red-600 font-sans">{error}</p>}
          </div>

          {/* Show image toggle */}
          <div className="rounded-xl border border-[var(--card-border)] p-4 bg-[var(--background)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)] font-sans">Show image on category</p>
                <p className="text-xs text-[var(--muted)] mt-0.5 font-sans">Display a banner image at the top of this category on your menu</p>
              </div>
              <button
                type="button"
                onClick={() => setShowImage((v) => !v)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${showImage ? 'bg-[var(--accent)]' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${showImage ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {showImage && (
              <p className="text-xs text-[var(--muted)] mt-3 font-sans">
                You can upload a category image after creating the category by editing it in &ldquo;Manage categories&rdquo;.
              </p>
            )}
            <p className="text-xs text-[var(--muted)] mt-2 font-sans">
              Tip: If turned on for any category, every category on your menu will display as an image card. If off for all categories, they&apos;ll show as simple text pills.
            </p>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose}
              className="font-sans flex-1 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--foreground)] font-medium text-sm hover:bg-[var(--background)] transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={saving || !name.trim()}
              className="font-sans flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
              {saving ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Manage Categories Modal ───────────────────────────────────────────────────

function SortableCategoryManageRow({
  id, name, itemCount, showImage, imageMode, bannerItemId, categoryItems, onDelete, onSelectImageMode, isDeleting, onRename,
  depth = 0, isMenu = false, childCount = 0, moveTargets, onMove, parentId = null,
  selectable = false, selected = false, onToggleSelect,
}: {
  /** restaurant_categories.id — the drag id and what every callback reports. */
  id: string;
  name: string;
  itemCount: number;
  showImage: boolean;
  imageMode: string | null;
  bannerItemId: string | null;
  categoryItems: MenuItemRow[];
  onDelete: () => void;
  onSelectImageMode: (mode: 'icon' | 'item', itemId: string | null) => void;
  isDeleting: boolean;
  onRename: (categoryId: string, newName: string) => Promise<void>;
  /** 0 = top level, 1 = nested under a menu. */
  depth?: number;
  /** A top-level row that has children — a container, not an item holder. */
  isMenu?: boolean;
  childCount?: number;
  /** null id = move to top level. Omitted entirely when not layered. */
  moveTargets?: { id: string | null; name: string }[];
  onMove?: (categoryId: string, parentId: string | null) => void;
  parentId?: string | null;
  /** Bulk-grouping checkbox — only shown for real categories while layered. */
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const itemsWithImages = categoryItems.filter((i) => i.image_url);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        marginLeft: depth * 20,
      }}
      className={`rounded-xl border bg-[var(--background)] overflow-hidden ${
        isMenu ? "border-[var(--accent)]/40 bg-[var(--accent)]/5" : "border-[var(--card-border)]"
      } ${depth > 0 ? "border-l-[3px] border-l-[var(--accent)]/50" : ""} ${
        selected ? "ring-2 ring-[var(--accent)]/50" : ""
      }`}
    >
      <div className="flex items-center gap-2.5 p-3">
        {selectable && (
          <button
            type="button"
            onClick={onToggleSelect}
            aria-pressed={selected}
            title={selected ? `Untick ${name}` : `Tick ${name} to move it with others`}
            className={`flex-shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors ${
              selected
                ? "bg-[var(--accent)] border-[var(--accent)] text-white"
                : "border-[var(--card-border)] text-transparent hover:border-[var(--accent)]"
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </button>
        )}
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing touch-none text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0"
        >
          <GripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); const t = renameValue.trim(); if (t && t !== name) onRename(id, t); setIsRenaming(false); }
                  if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(name); }
                }}
                autoFocus
                className="flex-1 min-w-0 text-sm font-medium border-b border-[var(--accent)] bg-transparent text-[var(--foreground)] focus:outline-none py-0.5"
              />
              <button type="button"
                onClick={() => { const t = renameValue.trim(); if (t && t !== name) onRename(id, t); setIsRenaming(false); }}
                className="flex-shrink-0 p-0.5 text-[var(--accent)] hover:opacity-70 transition-opacity" title="Save">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 group/rename">
              <p className={`text-sm truncate text-[var(--foreground)] ${isMenu ? "font-bold uppercase tracking-wide" : "font-medium"}`}>{name}</p>
              {isMenu && (
                <span className="flex-shrink-0 text-[9px] font-semibold font-sans uppercase tracking-wide text-[var(--accent)] border border-[var(--accent)]/40 rounded px-1 py-px">Menu</span>
              )}
              <button type="button"
                onClick={() => { setIsRenaming(true); setRenameValue(name); }}
                className="opacity-0 group-hover/rename:opacity-100 flex-shrink-0 p-0.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-opacity" title="Rename">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
          <p className="text-xs text-[var(--muted)]">
            {isMenu
              ? `Contains ${childCount} sub-categor${childCount !== 1 ? 'ies' : 'y'}`
              : `Contains ${itemCount} menu item${itemCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        {moveTargets && moveTargets.length > 0 && !isMenu && (
          <select
            value={parentId ?? ""}
            onChange={(e) => onMove?.(id, e.target.value === "" ? null : e.target.value)}
            title="Choose which menu this category sits in"
            className="flex-shrink-0 max-w-[7.5rem] text-xs font-sans rounded-lg border border-[var(--card-border)] bg-[var(--card)] text-[var(--muted)] px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          >
            {moveTargets.map((t) => (
              <option key={t.id ?? "__top"} value={t.id ?? ""}>{t.id === null ? t.name : `In ${t.name}`}</option>
            ))}
          </select>
        )}
        {isDeleting ? (
          <div className="flex-shrink-0 p-1.5">
            <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </div>
        ) : (
          <button
            type="button"
            onClick={onDelete}
            className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title={isMenu ? "Delete menu" : "Delete category"}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      {/* Image mode picker — only shown when show_image is ON. Menus are
          containers and never render a banner, so it's hidden for them. */}
      {showImage && !isMenu && (
        <div className="px-3 py-2 border-t border-[var(--card-border)] bg-[var(--card)]">
          <p className="text-[10px] font-semibold font-sans text-[var(--muted)] uppercase tracking-wide mb-2">Image type</p>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* Icon option */}
            <button
              type="button"
              onClick={() => onSelectImageMode('icon', null)}
              className={`flex-shrink-0 w-12 h-12 rounded-lg border-2 flex items-center justify-center transition-all ${
                imageMode === 'icon' || (imageMode === null && bannerItemId === null)
                  ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/30 bg-[var(--accent)]/10 text-[var(--accent)]'
                  : 'border-gray-200 text-gray-400 hover:border-gray-400'
              }`}
              title="Show food icon"
            >
              <UtensilsCrossed size={18} strokeWidth={1.5} />
            </button>
            {/* Item image options */}
            {itemsWithImages.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectImageMode('item', item.id)}
                title={item.name}
                className={`flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                  imageMode === 'item' && bannerItemId === item.id
                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/40'
                    : 'border-gray-200 hover:border-gray-400 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={item.image_url!} alt={item.name} className="w-full h-full object-cover" />
              </button>
            ))}
            {itemsWithImages.length === 0 && imageMode !== 'icon' && (
              <p className="text-[11px] text-[var(--muted)] font-sans italic self-center">Add item images to use a photo instead of the icon</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function ManageCategoriesModal({
  restaurantId, categories, categoryRows, nestingOn, grouped, onClose, onUpdated, onToggleNesting,
}: {
  restaurantId: string;
  /** restaurant_categories.id values, in display order. */
  categories: string[];
  categoryRows: CategoryRow[];
  /** The raw restaurants.use_nested_categories flag — not the derived "has children" state. */
  nestingOn: boolean;
  grouped: Grouped;
  onClose: () => void;
  onUpdated: (newCats: string[]) => Promise<void>;
  /** Persists the flag. Resolves false if the write failed. */
  onToggleNesting: (value: boolean) => Promise<boolean>;
}) {
  const [cats, setCats] = useState(categories);
  const [rows, setRows] = useState<CategoryRow[]>(categoryRows);
  const [newName, setNewName] = useState("");
  const [newParent, setNewParent] = useState("");
  // Local mirror of the flag so the list switches to layered the instant it flips.
  const [layered, setLayered] = useState(nestingOn);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuName, setMenuName] = useState("");
  const [showImageMap, setShowImageMap] = useState<Record<string, boolean>>({});
  const [imageModeMap, setImageModeMap] = useState<Record<string, string | null>>({});
  const [bannerItemMap, setBannerItemMap] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);
  const [deletingCats, setDeletingCats] = useState<Set<string>>(new Set());
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [masterShowImages, setMasterShowImages] = useState(false);
  const supabase = createSupabaseClient();
  useBodyScrollLock(true);

  // Load banner settings for existing categories
  useEffect(() => {
    supabase
      .from('restaurant_categories')
      .select('id, show_image, image_mode, banner_item_id')
      .eq('restaurant_id', restaurantId)
      .then(({ data }) => {
        if (data) {
          const showMap: Record<string, boolean> = {};
          const modeMap: Record<string, string | null> = {};
          const itemMap: Record<string, string | null> = {};
          for (const row of data as { id: string; show_image: boolean | null; image_mode: string | null; banner_item_id: string | null }[]) {
            showMap[row.id] = row.show_image ?? false;
            modeMap[row.id] = row.image_mode ?? null;
            itemMap[row.id] = row.banner_item_id ?? null;
          }
          setShowImageMap(showMap);
          setImageModeMap(modeMap);
          setBannerItemMap(itemMap);
          setMasterShowImages(Object.values(showMap).some(Boolean));
        }
      });
  }, [restaurantId, supabase]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Flattened display order: menu, then its children indented beneath it.
  // In flat mode this is just the category list, exactly as before.
  const names = useMemo(() => categoryNameMap(rows), [rows]);
  const label = useCallback((id: string) => names[id] ?? "", [names]);

  const groups = useMemo(() => buildMenuGroups(rows), [rows]);
  const flat = useMemo(() => {
    type Entry = { id: string; name: string; parentId: string | null; depth: number; isMenu: boolean; childCount: number };
    if (!layered) return cats.map((id): Entry => ({ id, name: names[id] ?? "", parentId: null, depth: 0, isMenu: false, childCount: 0 }));
    const out: Entry[] = [];
    for (const g of groups) {
      out.push({ id: g.id, name: g.name, parentId: null, depth: 0, isMenu: g.children.length > 0, childCount: g.children.length });
      for (const c of g.children) out.push({ id: c, name: names[c] ?? "", parentId: g.id, depth: 1, isMenu: false, childCount: 0 });
    }
    return out;
  }, [layered, groups, cats, names]);

  // A top-level row is a valid destination if it already holds categories, or if
  // it holds nothing at all — a menu created empty has to be fillable, otherwise
  // it's a dead end nothing can ever be moved into. A top-level row holding its
  // own items is excluded: dropping a category in would strand those items.
  const destinationGroups = useMemo(
    () => groups.filter((g) => g.children.length > 0 || (grouped[g.id]?.length ?? 0) === 0),
    [groups, grouped]
  );

  const hasMenus = destinationGroups.length > 0;

  // A category can move to top level or into any menu. Menus themselves stay put
  // so the hierarchy can never grow past two levels.
  const moveTargets = useMemo(
    () => layered && hasMenus
      ? [
          { id: null as string | null, name: "Not in a menu" },
          ...destinationGroups.map((g) => ({ id: g.id, name: g.name })),
        ]
      : undefined,
    [layered, hasMenus, destinationGroups]
  );

  // Selection follows display order so the new menu's children keep that order.
  const selectedIds = useMemo(
    () => flat.filter((f) => !f.isMenu && selected.has(f.id)).map((f) => f.id),
    [flat, selected]
  );
  // A selected row can't also be its own destination.
  const menuTargets = useMemo(
    () => destinationGroups.filter((g) => !selected.has(g.id)).map((g) => ({ id: g.id, name: g.name })),
    [destinationGroups, selected]
  );

  const toggleSelected = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const handleToggleLayered = async (value: boolean) => {
    setLayered(value);
    setDeleteError(null);
    if (!value) setSelected(new Set());
    setBusy(true);
    const ok = await onToggleNesting(value);
    setBusy(false);
    // parent_id is never cleared, so flipping back on restores the structure.
    if (!ok) { setLayered(!value); setDeleteError("Couldn't change that setting. Please try again."); }
  };

  // Reparents the whole selection — sort_order is assigned in display order.
  const reparent = async (ids: string[], parentId: string | null, startAt: number) => {
    for (let i = 0; i < ids.length; i++) {
      const { error } = await supabase.from('restaurant_categories')
        .update({ parent_id: parentId, sort_order: startAt + i })
        .eq('id', ids[i]);
      if (error) return false;
    }
    setRows((prev) => prev.map((r) => {
      const i = ids.indexOf(r.id);
      return i === -1 ? r : { ...r, parent_id: parentId, sort_order: startAt + i };
    }));
    return true;
  };

  // Creates the menu and moves everything ticked into it as one action. Ticking
  // nothing is allowed — an empty menu is a legitimate starting point that gets
  // filled from the "Add a category" block below.
  const handleGroupIntoNewMenu = async () => {
    const trimmed = menuName.trim();
    if (!trimmed) return;
    // A menu is top-level, so it only has to be unique among other top-level rows.
    if (rows.some((r) => !r.parent_id && r.name.toLowerCase() === trimmed.toLowerCase())) {
      setDeleteError("That name is already taken.");
      return;
    }
    setBusy(true);
    setDeleteError(null);
    // The menu inherits the earliest slot of the categories it absorbs, so it
    // appears exactly where they were rather than being appended off the end of
    // the tab strip where nobody finds it.
    const absorbedOrders = rows
      .filter((r) => !r.parent_id && selectedIds.includes(r.id))
      .map((r) => r.sort_order ?? 0);
    const sortOrder = absorbedOrders.length > 0
      ? Math.min(...absorbedOrders)
      : rows.filter((r) => !r.parent_id).length;
    const { data, error } = await supabase.from('restaurant_categories')
      .insert({ restaurant_id: restaurantId, name: trimmed, parent_id: null, sort_order: sortOrder, show_image: false })
      .select('id, name, parent_id, sort_order')
      .single();
    if (error || !data) {
      setBusy(false);
      setDeleteError(`Couldn't create the menu "${trimmed}". Please try again.`);
      return;
    }
    const moved = selectedIds.length === 0 || await reparent(selectedIds, (data as CategoryRow).id, 0);
    setBusy(false);
    if (!moved) { setDeleteError("Menu created, but the categories couldn't be moved. Please try again."); return; }
    const nextCats = [...cats, (data as CategoryRow).id];
    setRows((prev) => [...prev, data as CategoryRow]);
    setCats(nextCats);
    setSelected(new Set());
    setMenuName("");
    await onUpdated(nextCats);
  };

  const handleGroupIntoExisting = async (parentId: string | null) => {
    const ids = selectedIds;
    if (ids.length === 0) return;
    setBusy(true);
    setDeleteError(null);
    const startAt = rows.filter((r) => (r.parent_id ?? null) === parentId && !ids.includes(r.id)).length;
    const moved = await reparent(ids, parentId, startAt);
    setBusy(false);
    if (!moved) { setDeleteError("Couldn't move those categories. Please try again."); return; }
    setSelected(new Set());
    await onUpdated(cats);
  };

  // sort_order is scoped per level — only siblings are renumbered.
  const persistSiblingOrder = async (ids: string[]) => {
    for (let i = 0; i < ids.length; i++) {
      await supabase.from('restaurant_categories').update({ sort_order: i }).eq('id', ids[i]);
    }
  };

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const a = flat.find((f) => f.id === active.id);
    const o = flat.find((f) => f.id === over.id);
    // Reordering is sibling-scoped; use the move dropdown to change parents.
    if (!a || !o || a.parentId !== o.parentId || a.depth !== o.depth) return;
    const sibIdxs = flat.reduce<number[]>((acc, f, i) => {
      if (f.parentId === a.parentId && f.depth === a.depth) acc.push(i);
      return acc;
    }, []);
    const siblings = sibIdxs.map((i) => flat[i].id);
    const oldIndex = siblings.indexOf(a.id);
    const newIndex = siblings.indexOf(o.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(siblings, oldIndex, newIndex);
    const nextIds = flat.map((f) => f.id);
    reordered.forEach((n, k) => { nextIds[sibIdxs[k]] = n; });
    setCats(nextIds);
    setRows((prev) => prev.map((r) => {
      const i = reordered.indexOf(r.id);
      return i === -1 ? r : { ...r, sort_order: i };
    }));
    setBusy(true);
    await persistSiblingOrder(reordered);
    setBusy(false);
    await onUpdated(nextIds);
  };

  const handleMove = async (catId: string, parentId: string | null) => {
    const row = rows.find((r) => r.id === catId);
    if (!row || (row.parent_id ?? null) === parentId) return;
    const sortOrder = rows.filter((r) => (r.parent_id ?? null) === parentId && r.id !== catId).length;
    setBusy(true);
    const { error } = await supabase.from('restaurant_categories')
      .update({ parent_id: parentId, sort_order: sortOrder })
      .eq('id', catId);
    setBusy(false);
    if (error) { setDeleteError(`Couldn't move "${row.name}". Please try again.`); return; }
    setRows((prev) => prev.map((r) => r.id === catId ? { ...r, parent_id: parentId, sort_order: sortOrder } : r));
    await onUpdated(cats);
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const parentId = newParent === "" ? null : newParent;
    // Only siblings have to be distinct — "Desserts" may exist under two menus.
    const siblings = rows.filter((r) => (r.parent_id ?? null) === parentId);
    if (siblings.some((r) => r.name.toLowerCase() === trimmed.toLowerCase())) {
      setDeleteError(parentId ? `"${trimmed}" already exists in that menu.` : "That name is already taken.");
      return;
    }
    const sortOrder = siblings.length;
    setBusy(true);
    setDeleteError(null);
    const { data, error } = await supabase.from('restaurant_categories')
      .insert({ restaurant_id: restaurantId, name: trimmed, parent_id: parentId, sort_order: sortOrder, show_image: masterShowImages })
      .select('id, name, parent_id, sort_order')
      .single();
    setBusy(false);
    if (error || !data) { setDeleteError(`Couldn't add "${trimmed}". Please try again.`); return; }
    const nextCats = [...cats, (data as CategoryRow).id];
    setRows((prev) => [...prev, data as CategoryRow]);
    setCats(nextCats);
    setNewName("");
    await onUpdated(nextCats);
  };

  const handleDelete = async (catId: string) => {
    // Deleting a menu cascades to its child category rows (parent_id is
    // ON DELETE CASCADE). menu_items.category_id is ON DELETE SET NULL, but we
    // clear it up front so the confirm text matches what actually happens.
    const row = rows.find((r) => r.id === catId);
    if (!row) return;
    const children = layered ? rows.filter((r) => r.parent_id === catId) : [];
    const affected = [catId, ...children.map((r) => r.id)];
    const itemsInCat = affected.flatMap((id) => grouped[id] ?? []);
    if (children.length > 0 || itemsInCat.length > 0) {
      const parts: string[] = [];
      if (children.length > 0) {
        parts.push(`Deleting the menu "${row.name}" also deletes the ${children.length} categor${children.length > 1 ? 'ies' : 'y'} inside it (${children.map((r) => r.name).join(', ')}).`);
      }
      if (itemsInCat.length > 0) {
        parts.push(`${itemsInCat.length} menu item${itemsInCat.length > 1 ? 's' : ''} will be left without a category. They won't be deleted, but customers won't see them until you move them somewhere else.`);
      }
      if (!confirm(`${parts.join(' ')} Continue?`)) return;
    }
    setDeletingCats(prev => { const next = new Set(prev); next.add(catId); return next; });
    setDeleteError(null);
    if (itemsInCat.length > 0) {
      await supabase.from('menu_items').update({ category_id: null }).in('id', itemsInCat.map((i) => i.id));
    }
    const { error } = await supabase.from('restaurant_categories').delete().eq('id', catId);
    setDeletingCats(prev => { const next = new Set(prev); next.delete(catId); return next; });
    if (error) { setDeleteError(`Failed to delete "${row.name}". Please try again.`); return; }
    const newCats = cats.filter((c) => !affected.includes(c));
    setCats(newCats);
    setRows((prev) => prev.filter((r) => !affected.includes(r.id)));
    await onUpdated(newCats);
  };

  // menu_items.category is a denormalised mirror kept in sync by a DB trigger,
  // so a rename only has to touch the category row itself.
  const handleRename = async (catId: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    const target = rows.find((r) => r.id === catId);
    if (!target || target.name === trimmed) return;

    // Names only have to be unique among siblings, so the check is scoped to the
    // rows sharing this parent. parent_id is the menu — there is no menu_id column.
    const parentId = target.parent_id ?? null;
    const clash = rows.some(
      (r) => r.id !== catId && (r.parent_id ?? null) === parentId && r.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (clash) {
      const parentName = parentId ? rows.find((r) => r.id === parentId)?.name : null;
      setDeleteError(`"${trimmed}" already exists${parentName ? ` in ${parentName}` : ""}.`);
      return;
    }

    setBusy(true);
    setDeleteError(null);
    // Apply the new name before the round-trip. The row leaves edit mode the
    // instant Enter is pressed, so waiting for the server here would re-render
    // the read-only label with the old name until the response landed.
    const previousName = target.name;
    setRows(prev => prev.map(r => r.id === catId ? { ...r, name: trimmed } : r));
    const { error } = await supabase.from('restaurant_categories').update({ name: trimmed }).eq('id', catId);
    if (error) {
      // Until migration 002 drops the account-wide unique index, a name used by
      // any other category in the restaurant still fails here with 23505.
      setRows(prev => prev.map(r => r.id === catId ? { ...r, name: previousName } : r));
      setDeleteError(
        error.code === '23505'
          ? `"${trimmed}" is already used by another category. Names only need to be unique within a menu — if this keeps happening, migration 002 has not been applied yet.`
          : `Couldn't rename to "${trimmed}". Please try again.`,
      );
      setBusy(false);
      return;
    }
    await onUpdated(cats);
    setBusy(false);
  };

  const handleToggleMasterShowImages = async (val: boolean) => {
    setMasterShowImages(val);
    // Menus are containers — only real categories get a banner image.
    const imageCatIds = flat.filter((f) => !f.isMenu).map((f) => f.id);
    const updatedMap: Record<string, boolean> = {};
    for (const id of imageCatIds) updatedMap[id] = val;
    setShowImageMap(updatedMap);
    setBusy(true);
    for (const id of imageCatIds) {
      await supabase.from('restaurant_categories').update({ show_image: val }).eq('id', id);
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" style={{ animation: 'fadeIn 0.15s ease-out' }}>
      <div className="bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-md" style={{ animation: 'modalIn 0.15s ease-out' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[var(--foreground)]">{layered ? "Manage menus & categories" : "Manage categories"}</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              {layered
                ? "Create menus, add categories, and move things around. Everything saves as you go."
                : "Add, rename, reorder and delete your categories. Everything saves as you go."}
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
          {busy && <p className="text-xs text-[var(--muted)] mb-2 font-sans">Saving…</p>}
          {deleteError && (
            <p className="text-xs text-red-600 font-sans mb-2 px-1">{deleteError}</p>
          )}

          {/* Menu structure — the two diagrams are the control, not a preview.
              Picking one saves immediately, like everything else in this modal. */}
          <div className="mb-3 pb-3 border-b border-[var(--card-border)]">
            <p className="text-sm font-medium text-[var(--foreground)] font-sans">How your menu is organised</p>
            <p className="text-xs text-[var(--muted)] font-sans mt-1">
              Flat shows all your categories in a single row. Layered lets you put categories inside
              menus like Lunch, Dinner and Drinks, so customers pick a menu first and then a category.
              You can switch back at any time — nothing is deleted.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                type="button"
                onClick={() => { if (layered) handleToggleLayered(false); }}
                aria-pressed={!layered}
                className={`rounded-xl border-2 p-3 text-center transition-colors cursor-pointer ${
                  !layered
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--card-border)] bg-[var(--background)] hover:border-[var(--accent)]/40"
                }`}
              >
                <div className="flex gap-1 justify-center flex-wrap mb-2 min-h-[2.75rem] items-center">
                  {["Starters", "Mains", "Wine"].map((n) => (
                    <span key={n} className="px-2 py-0.5 rounded-full bg-[var(--card-border)] text-[10px] text-[var(--muted)] font-medium font-sans">{n}</span>
                  ))}
                </div>
                <p className={`text-xs font-semibold font-sans ${!layered ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>Flat</p>
                <p className="text-[10px] text-[var(--muted)] font-sans mt-0.5 leading-snug">All categories in one row</p>
              </button>
              <button
                type="button"
                onClick={() => { if (!layered) handleToggleLayered(true); }}
                aria-pressed={layered}
                className={`rounded-xl border-2 p-3 text-center transition-colors cursor-pointer ${
                  layered
                    ? "border-[var(--accent)] bg-[var(--accent)]/10"
                    : "border-[var(--card-border)] bg-[var(--background)] hover:border-[var(--accent)]/40"
                }`}
              >
                <div className="min-h-[2.75rem] mb-2">
                  <div className="flex gap-2 justify-center mb-1">
                    {["Food", "Drinks"].map((n, i) => (
                      <span key={n} className={`text-[10px] font-bold font-sans uppercase tracking-wide ${i === 0 ? "text-[var(--accent)] border-b-2 border-[var(--accent)] pb-0.5" : "text-[var(--muted)] pb-0.5"}`}>{n}</span>
                    ))}
                  </div>
                  <div className="flex gap-1 justify-center flex-wrap">
                    {["Starters", "Mains"].map((n) => (
                      <span key={n} className="px-2 py-0.5 rounded-full bg-[var(--card-border)] text-[10px] text-[var(--muted)] font-medium font-sans">{n}</span>
                    ))}
                  </div>
                </div>
                <p className={`text-xs font-semibold font-sans ${layered ? "text-[var(--accent)]" : "text-[var(--muted)]"}`}>Layered</p>
                <p className="text-[10px] text-[var(--muted)] font-sans mt-0.5 leading-snug">Categories grouped inside menus</p>
              </button>
            </div>
          </div>

          {/* Create a menu — always on show in layered mode, because a menu you
              can't find how to make is the same as a menu you can't make. It
              works with nothing ticked (an empty menu you fill later) and with
              categories ticked (create and fill in one go). */}
          {layered && (
            <div className="mb-3 rounded-xl border border-[var(--accent)]/40 bg-[var(--accent)]/5 p-3">
              <p className="text-sm font-semibold text-[var(--foreground)] font-sans">Create a new menu</p>
              <p className="text-[11px] text-[var(--muted)] font-sans mt-0.5 mb-2">
                A menu is a heading customers tap first — Lunch, Dinner, Drinks. It holds categories, not items.
              </p>
              <input
                type="text"
                value={menuName}
                onChange={(e) => { setMenuName(e.target.value); setDeleteError(null); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleGroupIntoNewMenu(); } }}
                placeholder="Menu name — e.g. Drinks"
                className="font-sans w-full px-3 py-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              />
              <button type="button" onClick={handleGroupIntoNewMenu} disabled={busy || !menuName.trim()}
                className="font-sans mt-2 w-full py-2 rounded-xl bg-[var(--accent)] text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
                {selectedIds.length === 0
                  ? "Create empty menu"
                  : `Create menu and move ${selectedIds.length} ticked categor${selectedIds.length !== 1 ? 'ies' : 'y'} into it`}
              </button>
              <p className="text-[11px] text-[var(--muted)] font-sans mt-2">
                {selectedIds.length === 0
                  ? "Create it empty and add categories to it below, or tick categories in the list first to move them straight in."
                  : `Ticked: ${selectedIds.map(label).join(', ')}.`}
              </p>
              {selectedIds.length > 0 && (
                <>
                  <div className="flex items-center justify-between gap-2 mt-3 pt-3 border-t border-[var(--accent)]/25">
                    <p className="text-[11px] font-semibold font-sans text-[var(--foreground)]">
                      Or move the {selectedIds.length} ticked categor{selectedIds.length !== 1 ? 'ies' : 'y'} somewhere else
                    </p>
                    <button type="button" onClick={() => setSelected(new Set())}
                      className="flex-shrink-0 text-[11px] font-sans text-[var(--muted)] hover:text-[var(--foreground)] underline">
                      Untick all
                    </button>
                  </div>
                  <select
                    value=""
                    onChange={(e) => { if (e.target.value) handleGroupIntoExisting(e.target.value === "__top" ? null : e.target.value); }}
                    className="font-sans mt-2 w-full px-3 py-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--muted)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  >
                    <option value="">Choose where to move them…</option>
                    {menuTargets.map((t) => (
                      <option key={t.id} value={t.id}>Move into the {t.name} menu</option>
                    ))}
                    <option value="__top">Take them out of their menu (show on their own)</option>
                  </select>
                </>
              )}
            </div>
          )}

          {/* Master show images toggle */}
          <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-[var(--card-border)]">
            <p className="text-sm font-medium text-[var(--foreground)] font-sans">Show images next to category names</p>
            <button
              type="button"
              onClick={() => handleToggleMasterShowImages(!masterShowImages)}
              className={`relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors ${masterShowImages ? 'bg-[var(--accent)]' : 'bg-gray-200'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${masterShowImages ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Illustration: text only vs with images */}
          {!masterShowImages && (
            <div className="flex gap-4 mb-3 p-3 rounded-xl bg-[var(--background)] border border-[var(--card-border)]">
              <div className="flex-1 text-center">
                <div className="flex gap-1 justify-center flex-wrap mb-1.5">
                  {["Mains", "Drinks", "Desserts"].map((n) => (
                    <span key={n} className="px-2 py-0.5 rounded-full bg-[var(--card-border)] text-[10px] text-[var(--muted)] font-medium font-sans">{n}</span>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--muted)] font-sans">Text only</p>
              </div>
              <div className="flex-1 text-center">
                <div className="flex gap-1.5 justify-center mb-1.5">
                  {["Mains", "Drinks"].map((n) => (
                    <div key={n} className="flex flex-col items-center gap-0.5">
                      <div className="w-8 h-8 rounded-lg bg-[var(--card-border)] flex items-center justify-center">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="opacity-40">
                          <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                      <span className="text-[9px] text-[var(--muted)] font-sans">{n}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--muted)] font-sans">With images</p>
              </div>
            </div>
          )}

          <div className="mb-2">
            <p className="text-sm font-semibold text-[var(--foreground)] font-sans">
              {layered ? "Your menus and categories" : "Your categories"}
            </p>
            <p className="text-[11px] text-[var(--muted)] font-sans mt-0.5">
              {layered
                ? "Indented rows sit inside the menu above them. Drag a row to reorder it among the rows at its own level, use its dropdown to move it into a different menu, or tick it to move several at once."
                : "Drag to reorder. Tap a name to rename it, or the bin to delete it."}
            </p>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={flat.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {flat.map((entry) => {
                  const cat = entry.id;
                  return (
                  <SortableCategoryManageRow
                    key={cat}
                    id={cat}
                    name={entry.name}
                    depth={entry.depth}
                    isMenu={entry.isMenu}
                    childCount={entry.childCount}
                    parentId={entry.parentId}
                    moveTargets={moveTargets}
                    onMove={handleMove}
                    selectable={layered && !entry.isMenu}
                    selected={selected.has(cat)}
                    onToggleSelect={() => toggleSelected(cat)}
                    itemCount={grouped[cat]?.length ?? 0}
                    showImage={masterShowImages}
                    imageMode={imageModeMap[cat] ?? null}
                    bannerItemId={bannerItemMap[cat] ?? null}
                    categoryItems={grouped[cat] ?? []}
                    isDeleting={deletingCats.has(cat)}
                    onDelete={() => handleDelete(cat)}
                    onRename={handleRename}
                    onSelectImageMode={async (mode, itemId) => {
                      setImageModeMap((prev) => ({ ...prev, [cat]: mode }));
                      setBannerItemMap((prev) => ({ ...prev, [cat]: itemId }));
                      await supabase.from('restaurant_categories')
                        .update({ image_mode: mode, banner_item_id: itemId, use_banner: mode === 'item' })
                        .eq('id', cat);
                    }}
                  />
                  );
                })}
              </div>
            </SortableContext>
          </DndContext>

          {/* Add a category, choosing its home up front */}
          {layered && (
            <div className="mt-4 pt-4 border-t border-[var(--card-border)]">
              <p className="text-sm font-semibold text-[var(--foreground)] font-sans">Add a category</p>
              <p className="text-[11px] text-[var(--muted)] font-sans mt-0.5 mb-2">
                A category is a group of menu items, like Starters. Choose which menu it goes in.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => { setNewName(e.target.value); setDeleteError(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                  placeholder="Category name"
                  className="font-sans flex-1 min-w-0 px-3 py-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <select
                  value={newParent}
                  onChange={(e) => setNewParent(e.target.value)}
                  className="font-sans max-w-[9rem] px-2 py-2 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--muted)] text-xs focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                >
                  <option value="">Not in a menu</option>
                  {destinationGroups.map((g) => (
                    <option key={g.id} value={g.id!}>Inside {g.name}</option>
                  ))}
                </select>
                <button type="button" onClick={handleAdd} disabled={busy || !newName.trim()}
                  className="font-sans flex-shrink-0 px-3 py-2 rounded-xl bg-[var(--accent)] text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
                  Add
                </button>
              </div>
              <p className="text-[11px] text-[var(--muted)] font-sans mt-2">
                Pick &ldquo;Not in a menu&rdquo; and the category appears on its own alongside your menus.
              </p>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t border-[var(--card-border)]">
          <button type="button" onClick={onClose}
            className="font-sans w-full py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--foreground)] font-medium text-sm hover:bg-[var(--background)] transition-colors">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ── QR Code Modal ─────────────────────────────────────────────────────────────

// Physical formats a restaurant might print. printW is the export width, chosen
// per format so every download lands at 300dpi or better at its real-world size
// — that used to be an "output quality" control owners had to guess at.
// aspect = width / height.
type FormatKey = "sticker" | "tent" | "poster" | "aframe" | "counter" | "coaster";
const FORMATS: Record<FormatKey, {
  label: string;
  desc: string;
  printW: number;
  aspect: number;
  orientation: "portrait" | "landscape";
  round?: boolean;
}> = {
  sticker: { label: "Table sticker", desc: "Tabletop square",   printW: 1800, aspect: 1,     orientation: "portrait"  },
  tent:    { label: "Table tent",    desc: "Fold-over standup", printW: 1800, aspect: 0.66,  orientation: "portrait"  },
  poster:  { label: "Wall poster",   desc: "A4 for walls",      printW: 2480, aspect: 0.707, orientation: "portrait"  },
  aframe:  { label: "A-frame sign",  desc: "Sidewalk insert",   printW: 2400, aspect: 0.5,   orientation: "portrait"  },
  counter: { label: "Counter card",  desc: "Wide, QR beside",   printW: 2400, aspect: 1.6,   orientation: "landscape" },
  coaster: { label: "Coaster",       desc: "Round drink mat",   printW: 1600, aspect: 1,     orientation: "portrait", round: true },
};

// Canvas-renderable font families. The next/font CSS variables live on <body>;
// we resolve them at draw time so the canvas matches the rest of the app.
const QR_FONT_OPTIONS = [
  { key: "sans",     label: "Sans-serif", varName: null,              fallback: "system-ui, -apple-system, sans-serif" },
  { key: "serif",    label: "Serif",      varName: "--font-cormorant",fallback: "Georgia, 'Times New Roman', serif"    },
  { key: "mono",     label: "Monospace",  varName: null,              fallback: "'Courier New', monospace"             },
  { key: "poppins",  label: "Poppins",    varName: "--font-poppins",  fallback: "sans-serif"                           },
  { key: "playfair", label: "Playfair",   varName: "--font-playfair", fallback: "serif"                                },
  { key: "bebas",    label: "Bebas Neue", varName: "--font-bebas",    fallback: "sans-serif"                           },
  { key: "pacifico", label: "Pacifico",   varName: "--font-pacifico", fallback: "cursive"                              },
  { key: "orbitron", label: "Orbitron",   varName: "--font-orbitron", fallback: "sans-serif"                           },
  { key: "cinzel",   label: "Cinzel",     varName: "--font-cinzel",   fallback: "serif"                                },
] as const;
type FontKey = typeof QR_FONT_OPTIONS[number]["key"];

function resolveFontFamily(key: FontKey): string {
  const opt = QR_FONT_OPTIONS.find(o => o.key === key) ?? QR_FONT_OPTIONS[0];
  if (!opt.varName || typeof window === "undefined") return opt.fallback;
  const v = getComputedStyle(document.body).getPropertyValue(opt.varName).trim();
  return v ? `${v}, ${opt.fallback}` : opt.fallback;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// Renders the QR matrix ourselves so we control module shape (square / dots /
// rounded). Finder "eyes" stay solid squares for reliable scanning even in
// dotty styles. Returns an offscreen canvas sized sizePx × sizePx.
// Modules are drawn as slightly-overlapping squares so neighbours merge into
// clean runs. Decorative shapes (dots, rounded) leave a gap between every
// module, and a real decoder can't read the result — see verifyScannable.
function renderQRCanvas(url: string, sizePx: number, fg: string, bg: string): HTMLCanvasElement {
  const qr = QRCode.create(url, { errorCorrectionLevel: "H" });
  const count = qr.modules.size;
  const data = qr.modules.data;
  const margin = 4; // quiet zone, in modules
  const total = count + margin * 2;
  const cell = sizePx / total;

  const c = document.createElement("canvas");
  c.width = sizePx;
  c.height = sizePx;
  const ctx = c.getContext("2d")!;
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, sizePx, sizePx);
  ctx.fillStyle = fg;

  for (let r = 0; r < count; r++) {
    for (let col = 0; col < count; col++) {
      if (!data[r * count + col]) continue;
      const x = (col + margin) * cell;
      const y = (r + margin) * cell;
      ctx.fillRect(Math.floor(x), Math.floor(y), Math.ceil(cell) + 0.6, Math.ceil(cell) + 0.6);
    }
  }
  return c;
}

// Word-wrap text to fit maxWidth, capping at maxLines (ellipsis on overflow).
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth || !cur) {
      cur = test;
    } else {
      lines.push(cur);
      cur = w;
      if (lines.length === maxLines) break;
    }
  }
  if (cur && lines.length < maxLines) lines.push(cur);
  if (lines.length === maxLines && cur && words.length) {
    // ensure final visible line isn't wider than allowed
    let last = lines[maxLines - 1];
    while (last.length && ctx.measureText(`${last}…`).width > maxWidth) last = last.slice(0, -1);
    if (ctx.measureText(lines[maxLines - 1]).width > maxWidth) lines[maxLines - 1] = `${last}…`;
  }
  return lines;
}

// Draws the DineLinks "DL" monogram (exact match of the logo in app/page.tsx)
// into ctx. Top-left anchored at (x, y), scaled to height h. Returns drawn width.
// Vector paths are stroked, so it stays crisp at any output resolution.
function drawDLLogo(ctx: CanvasRenderingContext2D, x: number, y: number, h: number, lColor: string): number {
  const s = h / 40; // logo viewBox is 0 0 44 40
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.lineWidth = 2.6;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  // "D" — gold outline (M4 3 L4 37 Q4 37 15 37 Q30 37 30 20 Q30 3 15 3 Z)
  ctx.strokeStyle = "#c9a030";
  ctx.beginPath();
  ctx.moveTo(4, 3);
  ctx.lineTo(4, 37);
  ctx.quadraticCurveTo(4, 37, 15, 37);
  ctx.quadraticCurveTo(30, 37, 30, 20);
  ctx.quadraticCurveTo(30, 3, 15, 3);
  ctx.closePath();
  ctx.stroke();
  // "L" — contrasting stroke (vertical 26,3→26,37 then horizontal 26,37→42,37)
  ctx.strokeStyle = lColor;
  ctx.beginPath();
  ctx.moveTo(26, 3);
  ctx.lineTo(26, 37);
  ctx.lineTo(42, 37);
  ctx.stroke();
  ctx.restore();
  return (44 / 40) * h;
}

// ── Multilingual signs ────────────────────────────────────────────────────────
// A class of QR layouts that advertise the menu's languages in their own
// scripts. The list is derived from app/lib/translations.ts at draw time, so a
// new locale shows up on every sign automatically.

type SignTemplateKey =
  | "sign-split" | "sign-stacked" | "sign-columns" | "sign-steps" | "sign-minimal";

const SIGN_TEMPLATES: { id: SignTemplateKey; label: string; desc: string }[] = [
  { id: "sign-split",    label: "Split",         desc: "Languages flank the code" },
  { id: "sign-stacked",  label: "Stacked",       desc: "Languages listed below"   },
  { id: "sign-columns",  label: "Two columns",   desc: "Bulleted list beside it"  },
  { id: "sign-steps",    label: "Instructional", desc: "Split + numbered steps"   },
  { id: "sign-minimal",  label: "Minimal",       desc: "Language count only"      },
];

const SIGN_STEPS: [string, string][] = [
  ["01", "OPEN YOUR CAMERA"],
  ["02", "SCAN THE CODE"],
  ["03", "CHOOSE YOUR LANGUAGE"],
];

const DEFAULT_SIGN_HEADLINE = "Scan to read our\nMENU IN YOUR LANGUAGE";

const isSignTemplate = (t: string): t is SignTemplateKey => t.startsWith("sign-");

type TemplateKey = "simple" | "tagline" | "table" | SignTemplateKey;

function relLuminance(hex: string): number {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return 0;
  const chan = [m[1], m[2], m[3]].map((h) => {
    const c = parseInt(h, 16) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * chan[0] + 0.7152 * chan[1] + 0.0722 * chan[2];
}
const isLightColor = (hex: string) => relLuminance(hex) > 0.45;

// letterSpacing is only on newer canvas contexts — set it where supported.
function setLetterSpacing(ctx: CanvasRenderingContext2D, value: string) {
  const c = ctx as unknown as { letterSpacing?: string };
  if ("letterSpacing" in c) c.letterSpacing = value;
}

type ListItem = { label: string; script: ScriptKey; rtl: boolean; dim?: boolean };

/**
 * Resolves the colour treatment for a sign. Dark signs keep the QR itself dark
 * modules on a light chip — inverted codes scan badly on older phones.
 */
function signColors(variant: "light" | "dark", fgColor: string, bgColor: string, textColor: string) {
  if (variant === "light") {
    return { cardBg: bgColor, ink: textColor, qrFg: fgColor, qrBg: bgColor, panel: false, panelBg: bgColor };
  }
  const cardBg  = isLightColor(textColor) ? "#1f1d1a" : textColor;
  const panelBg = isLightColor(bgColor) ? bgColor : "#ffffff";
  return {
    cardBg,
    ink: isLightColor(bgColor) ? bgColor : "#faf8f5",
    qrFg: isLightColor(fgColor) ? "#1f1d1a" : fgColor,
    qrBg: panelBg,
    panel: true,
    panelBg,
  };
}

async function drawLanguageSign(o: {
  ctx: CanvasRenderingContext2D;
  W: number; H: number;
  template: SignTemplateKey;
  pad: number; wmH: number;
  round: boolean; landscape: boolean;
  ink: string;
  qrFg: string; qrBg: string;
  panel: boolean; panelBg: string;
  url: string;
  fam: string;
  headline: string;
  brandMode: "logo" | "name";
  brandName: string;
  logoUrl: string | null;
  langs: SignLanguage[];
  drawCenterLogo: (cx: number, cy: number, qrPx: number) => Promise<void>;
}) {
  const {
    ctx, W, H, template, pad, wmH, round, landscape, ink, qrFg, qrBg, panel, panelBg,
    url, fam, headline, brandMode, brandName, logoUrl,
    langs, drawCenterLogo,
  } = o;

  const minPx = Math.max(6, W * 0.010);

  // ── Per-item text helpers (each language draws in its own script's font) ────
  const itemFont = (it: ListItem, px: number, weight: number) => {
    ctx.font = `${weight} ${px}px ${fontStackFor(it.script, fam)}`;
  };
  const itemWidth = (it: ListItem, px: number, weight: number) => {
    itemFont(it, px, weight);
    return ctx.measureText(it.label).width;
  };
  const drawItem = (it: ListItem, x: number, y: number, px: number, weight: number, align: CanvasTextAlign) => {
    itemFont(it, px, weight);
    ctx.textAlign = align;
    ctx.direction = it.rtl ? "rtl" : "ltr";   // Arabic shapes + orders right-to-left
    ctx.fillStyle = ink;
    ctx.globalAlpha = it.dim ? 0.6 : 1;
    ctx.fillText(it.label, x, y);
    ctx.globalAlpha = 1;
    ctx.direction = "ltr";
  };

  // ── QR (with a light chip behind it on dark signs) ─────────────────────────
  const drawQRAt = async (x: number, y: number, px: number) => {
    if (panel) {
      const m = px * 0.06;
      ctx.fillStyle = panelBg;
      roundRect(ctx, x - m, y - m, px + m * 2, px + m * 2, px * 0.05);
      ctx.fill();
    }
    ctx.drawImage(renderQRCanvas(url, Math.round(px), qrFg, qrBg), x, y, px, px);
    await drawCenterLogo(x + px / 2, y + px / 2, px);
  };

  // ── Restaurant mark — logo image or the name set in type ────────────────────
  const drawBrand = async (x: number, y: number, w: number, maxH: number, align: "left" | "center"): Promise<number> => {
    if (brandMode === "logo" && logoUrl) {
      try {
        const img = await loadImage(logoUrl);
        const nw = img.naturalWidth || img.width;
        const nh = img.naturalHeight || img.height;
        const s = Math.min((w * 0.55) / nw, maxH / nh);
        const dw = nw * s, dh = nh * s;
        ctx.drawImage(img, align === "left" ? x : x + (w - dw) / 2, y + (maxH - dh) / 2, dw, dh);
        return maxH;
      } catch { /* logo unavailable — fall back to the name */ }
    }
    const name = (brandName || "").trim();
    if (!name) return 0;
    let px = Math.min(maxH * 0.7, W * 0.05);
    setLetterSpacing(ctx, `${px * 0.08}px`);
    ctx.font = `700 ${px}px ${fam}`;
    const measured = ctx.measureText(name).width;
    if (measured > w) {
      px *= w / measured;
      setLetterSpacing(ctx, `${px * 0.08}px`);
      ctx.font = `700 ${px}px ${fam}`;
    }
    ctx.fillStyle = ink;
    ctx.textBaseline = "middle";
    ctx.textAlign = align === "left" ? "left" : "center";
    ctx.direction = "ltr";
    ctx.fillText(name, align === "left" ? x : x + w / 2, y + maxH / 2);
    setLetterSpacing(ctx, "0px");
    return maxH;
  };

  // ── Headline — line 1 is a small eyebrow, the rest is the big statement ─────
  type Headline = { eyebrow: string[]; ePx: number; main: string[]; mPx: number; height: number };
  const layoutHeadline = (w: number, maxH: number): Headline => {
    const parts = headline.replace(/\r/g, "").split("\n").map(s => s.trim()).filter(Boolean);
    const eyebrowText = parts.length > 1 ? parts[0] : "";
    const mainText = (parts.length > 1 ? parts.slice(1).join(" ") : parts[0] ?? "").trim();

    let ePx = 0;
    let eyebrow: string[] = [];
    if (eyebrowText) {
      ePx = Math.min(W * 0.026, maxH * 0.24);
      setLetterSpacing(ctx, `${ePx * 0.16}px`);
      ctx.font = `500 ${ePx}px ${fam}`;
      eyebrow = wrapLines(ctx, eyebrowText.toUpperCase(), w, 2);
      setLetterSpacing(ctx, "0px");
    }
    const eH = eyebrow.length ? eyebrow.length * ePx * 1.25 + ePx * 0.55 : 0;

    let mPx = Math.max(minPx, Math.min(W * 0.082, (maxH - eH) * 0.52));
    let main: string[] = [];
    if (mainText) {
      for (let i = 0; i < 40; i++) {
        ctx.font = `700 ${mPx}px ${fam}`;
        main = wrapLines(ctx, mainText, w, 99);
        if ((main.length <= 3 && main.length * mPx * 1.12 <= maxH - eH) || mPx <= minPx) break;
        mPx = Math.max(minPx, mPx * 0.94);
      }
    }
    return { eyebrow, ePx, main, mPx, height: eH + main.length * mPx * 1.12 };
  };

  const drawHeadline = (lay: Headline, x: number, y: number, w: number, align: "left" | "center"): number => {
    ctx.textBaseline = "top";
    ctx.textAlign = align === "left" ? "left" : "center";
    ctx.direction = "ltr";
    ctx.fillStyle = ink;
    const ax = align === "left" ? x : x + w / 2;
    let cy = y;
    if (lay.eyebrow.length) {
      ctx.globalAlpha = 0.72;
      setLetterSpacing(ctx, `${lay.ePx * 0.16}px`);
      ctx.font = `500 ${lay.ePx}px ${fam}`;
      for (const l of lay.eyebrow) { ctx.fillText(l, ax, cy); cy += lay.ePx * 1.25; }
      setLetterSpacing(ctx, "0px");
      ctx.globalAlpha = 1;
      cy += lay.ePx * 0.55;
    }
    ctx.font = `700 ${lay.mPx}px ${fam}`;
    for (const l of lay.main) { ctx.fillText(l, ax, cy); cy += lay.mPx * 1.12; }
    return cy - y;
  };

  // ── Language list, column form ──────────────────────────────────────────────
  type ListLayout = { shown: ListItem[]; rows: number; px: number; rowH: number; colW: number; bulletW: number };
  const layoutList = (items: ListItem[], colW: number, h: number, cols: number, bullets: boolean): ListLayout => {
    const bulletW = bullets ? colW * 0.1 : 0;
    const textW = Math.max(minPx, colW - bulletW);
    const minRowH = W * 0.026;
    const capacity = Math.max(cols, Math.max(1, Math.floor(h / minRowH)) * cols);
    // Overflow keeps the closing "and more…" entry — it's what makes a short
    // list honest on small formats like coasters.
    const shown = items.length <= capacity
      ? items
      : [...items.slice(0, Math.max(1, capacity - 1)), items[items.length - 1]];
    const rows = Math.ceil(shown.length / cols);
    const rowH = Math.min(h / rows, W * 0.055);
    let px = Math.min(rowH * 0.6, W * 0.04);
    for (let i = 0; i < 6; i++) {
      let widest = 0;
      for (const it of shown) widest = Math.max(widest, itemWidth(it, px, 600));
      if (widest <= textW * 0.97 || px <= minPx) break;
      px = Math.max(minPx, px * (textW * 0.97) / widest);
    }
    return { shown, rows, px, rowH, colW, bulletW };
  };

  const paintList = (
    L: ListLayout, colX: (c: number) => number, alignOf: (c: number) => "left" | "right",
    y: number, h: number, bullets: boolean,
  ) => {
    const totalH = L.rows * L.rowH;
    const startY = y + (h - totalH) / 2 + L.rowH / 2;
    ctx.textBaseline = "middle";
    L.shown.forEach((it, i) => {
      const c = Math.floor(i / L.rows);
      const r = i % L.rows;
      const cx = colX(c);
      const cy = startY + r * L.rowH;
      const align = alignOf(c);
      if (bullets) {
        ctx.fillStyle = ink;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.arc(cx + L.bulletW * 0.35, cy, Math.max(1, L.px * 0.13), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
      drawItem(it, align === "right" ? cx + L.colW : cx + L.bulletW, cy, L.px, 600, align);
    });
  };

  // ── Language list, flowed rows (ENGLISH · FRANÇAIS · 简体中文 …) ─────────────
  const drawFlowList = (items: ListItem[], x: number, y: number, w: number, h: number) => {
    const sep = "  ·  ";
    let px = Math.max(minPx, Math.min(W * 0.036, h * 0.3));
    let lines: ListItem[][] = [];
    let sepW = 0;
    for (let i = 0; i < 24; i++) {
      ctx.font = `600 ${px}px ${fam}`;
      sepW = ctx.measureText(sep).width;
      lines = [];
      let cur: ListItem[] = [];
      let curW = 0;
      let widest = 0;
      for (const it of items) {
        const iw = itemWidth(it, px, 600);
        widest = Math.max(widest, iw);
        const add = cur.length ? sepW + iw : iw;
        if (cur.length && curW + add > w) { lines.push(cur); cur = [it]; curW = iw; }
        else { cur.push(it); curW += add; }
      }
      if (cur.length) lines.push(cur);
      if ((lines.length * px * 1.7 <= h && widest <= w) || px <= minPx) break;
      px = Math.max(minPx, px * 0.92);
    }
    const lineH = px * 1.7;
    const maxLines = Math.max(1, Math.floor(h / lineH));
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      const last = lines[lines.length - 1];
      last[last.length - 1] = items[items.length - 1];   // keep the "and more…" tail
    }
    let cy = y + (h - lines.length * lineH) / 2 + lineH / 2;
    ctx.textBaseline = "middle";
    for (const line of lines) {
      let total = 0;
      line.forEach((it, i) => { total += itemWidth(it, px, 600) + (i ? sepW : 0); });
      let cx = x + (w - total) / 2;
      line.forEach((it, i) => {
        if (i) {
          ctx.font = `600 ${px}px ${fam}`;
          ctx.fillStyle = ink;
          ctx.textAlign = "left";
          ctx.direction = "ltr";
          ctx.globalAlpha = 0.4;
          ctx.fillText(sep, cx, cy);
          ctx.globalAlpha = 1;
          cx += sepW;
        }
        const iw = itemWidth(it, px, 600);
        drawItem(it, cx, cy, px, 600, "left");
        cx += iw;
      });
      cy += lineH;
    }
  };

  // ── "MENU IN 13 LANGUAGES" — count is always the real one ──────────────────
  const drawCountLine = (x: number, y: number, w: number, h: number, align: "left" | "center") => {
    const text = `MENU IN ${langs.length} LANGUAGES`;
    let px = Math.min(W * 0.048, h * 0.62);
    setLetterSpacing(ctx, `${px * 0.12}px`);
    ctx.font = `700 ${px}px ${fam}`;
    const measured = ctx.measureText(text).width;
    if (measured > w) {
      px *= w / measured;
      setLetterSpacing(ctx, `${px * 0.12}px`);
      ctx.font = `700 ${px}px ${fam}`;
    }
    ctx.fillStyle = ink;
    ctx.direction = "ltr";
    ctx.textBaseline = "middle";
    ctx.textAlign = align === "left" ? "left" : "center";
    ctx.fillText(text, align === "left" ? x : x + w / 2, y + h / 2);
    setLetterSpacing(ctx, "0px");
  };

  // ── 01 OPEN YOUR CAMERA · 02 SCAN THE CODE · 03 CHOOSE YOUR LANGUAGE ───────
  const drawSteps = (x: number, y: number, w: number, h: number) => {
    ctx.strokeStyle = ink;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = Math.max(1, W * 0.002);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.direction = "ltr";
    ctx.textBaseline = "middle";

    const cellW = w / 3;
    const need = (p: number) => {
      ctx.font = `700 ${p * 1.5}px ${fam}`;
      const nw = Math.max(...SIGN_STEPS.map(s => ctx.measureText(s[0]).width));
      ctx.font = `600 ${p}px ${fam}`;
      const lw = Math.max(...SIGN_STEPS.map(s => ctx.measureText(s[1]).width));
      return nw + p * 0.5 + lw;
    };
    let px = Math.min(h * 0.3, W * 0.024);
    const row = need(px);
    if (row > cellW * 0.92) px = Math.max(minPx, px * (cellW * 0.92) / row);

    // Too cramped for one row (very tall, narrow formats) — stack the steps.
    const stack = px < W * 0.012;
    if (stack) {
      px = Math.min(h * 0.22, W * 0.022);
      const rowFit = need(px);
      if (rowFit > w * 0.9) px = Math.max(minPx, px * (w * 0.9) / rowFit);
    }
    SIGN_STEPS.forEach(([num, label], i) => {
      ctx.font = `700 ${px * 1.5}px ${fam}`;
      const nw = ctx.measureText(num).width;
      ctx.font = `600 ${px}px ${fam}`;
      const lw = ctx.measureText(label).width;
      const total = nw + px * 0.5 + lw;
      const cy = stack ? y + h * (i + 0.5) / 3 + h * 0.06 : y + h * 0.58;
      let cx = stack ? x + (w - total) / 2 : x + cellW * i + (cellW - total) / 2;
      ctx.textAlign = "left";
      ctx.fillStyle = ink;
      ctx.globalAlpha = 0.45;
      ctx.font = `700 ${px * 1.5}px ${fam}`;
      ctx.fillText(num, cx, cy);
      ctx.globalAlpha = 1;
      cx += nw + px * 0.5;
      ctx.font = `600 ${px}px ${fam}`;
      ctx.fillText(label, cx, cy);
    });
  };

  // ── Working rect ───────────────────────────────────────────────────────────
  let rx = pad, ry = pad, rw = W - pad * 2, rh = H - pad * 2 - wmH;
  if (round) {
    const s = Math.min(W, H) * 0.7;   // largest comfortable square inside the circle
    rx = (W - s) / 2; rw = s;
    ry = (H - s) / 2; rh = s - wmH;
  }

  const items: ListItem[] = [
    ...langs.map(l => ({ label: l.label, script: l.script, rtl: l.rtl })),
    { label: "AND MORE…", script: "latin" as ScriptKey, rtl: false, dim: true },
  ];

  const paintTwoColumns = (x: number, y: number, w: number, h: number, bullets: boolean) => {
    const gap = w * 0.07;
    const colW = (w - gap) / 2;
    const L = layoutList(items, colW, h, 2, bullets);
    paintList(L, c => x + c * (colW + gap), () => "left", y, h, bullets);
  };

  // ── Content column (brand → headline → list [→ steps]) ─────────────────────
  const drawContentColumn = async (x: number, y: number, w: number, h: number, align: "left" | "center") => {
    let cy = y;
    cy += await drawBrand(x, cy, w, Math.min(h * 0.16, W * 0.055), align);
    cy += h * 0.035;
    const hl = layoutHeadline(w, h * 0.36);
    cy += drawHeadline(hl, x, cy, w, align);
    cy += h * 0.05;

    let bottom = y + h;
    if (template === "sign-steps") {
      const sh = Math.min(h * 0.2, W * 0.05);
      drawSteps(x, bottom - sh, w, sh);
      bottom -= sh + h * 0.03;
    }
    const listH = Math.max(W * 0.05, bottom - cy);
    if (template === "sign-minimal") drawCountLine(x, cy, w, listH, align);
    else if (template === "sign-stacked") drawFlowList(items, x, cy, w, listH);
    else paintTwoColumns(x, cy, w, listH, template === "sign-columns");
  };

  // ── Landscape (counter card): QR pane on the left, everything else right ───
  if (landscape) {
    const paneW = rw * 0.36;
    const qrPx = Math.max(60, Math.min(paneW * 0.92, rh * 0.92));
    await drawQRAt(rx + (paneW - qrPx) / 2, ry + (rh - qrPx) / 2, qrPx);
    const cx = rx + paneW + rw * 0.05;
    await drawContentColumn(cx, ry, rx + rw - cx, rh, "left");
    return;
  }

  // ── Portrait / square ──────────────────────────────────────────────────────
  let cy = ry;
  cy += await drawBrand(rx, cy, rw, Math.min(rh * 0.12, W * 0.095), "center");
  cy += rh * 0.03;
  const hl = layoutHeadline(rw, rh * (template === "sign-minimal" ? 0.3 : 0.26));
  cy += drawHeadline(hl, rx, cy, rw, "center");
  cy += rh * 0.045;

  let bottom = ry + rh;
  if (template === "sign-steps") {
    const sh = Math.min(rh * 0.13, W * 0.1);
    drawSteps(rx, bottom - sh, rw, sh);
    bottom -= sh + rh * 0.025;
  }
  const bandY = cy;
  const bandH = Math.max(W * 0.22, bottom - cy);

  if (template === "sign-split" || template === "sign-steps") {
    const qrPx = Math.max(60, Math.min(bandH * 0.94, rw * 0.44));
    const qrX = rx + (rw - qrPx) / 2;
    await drawQRAt(qrX, bandY + (bandH - qrPx) / 2, qrPx);
    const gap = rw * 0.045;
    const colW = Math.max(W * 0.08, (rw - qrPx) / 2 - gap);
    const listH = Math.min(bandH, qrPx * 1.3);
    const listY = bandY + (bandH - listH) / 2;
    // One layout pass over the whole list so both flanks share a type size.
    const L = layoutList(items, colW, listH, 2, false);
    paintList(L, c => (c === 0 ? rx : rx + rw - colW), c => (c === 0 ? "right" : "left"), listY, listH, false);
  } else if (template === "sign-columns") {
    // Wide enough to sit side by side (stickers, coasters); otherwise stack.
    const sideBySide = rw >= bandH * 1.05;
    if (sideBySide) {
      const qrPx = Math.max(60, Math.min(rw * 0.42, bandH * 0.94));
      await drawQRAt(rx, bandY + (bandH - qrPx) / 2, qrPx);
      const listX = rx + qrPx + rw * 0.05;
      paintTwoColumns(listX, bandY, rx + rw - listX, bandH, true);
    } else {
      const qrPx = Math.max(60, Math.min(rw * 0.55, bandH * 0.46));
      await drawQRAt(rx + (rw - qrPx) / 2, bandY, qrPx);
      const listY = bandY + qrPx + bandH * 0.06;
      paintTwoColumns(rx, listY, rw, Math.max(W * 0.08, bandY + bandH - listY), true);
    }
  } else if (template === "sign-stacked") {
    const qrPx = Math.max(60, Math.min(rw * 0.55, bandH * 0.55));
    await drawQRAt(rx + (rw - qrPx) / 2, bandY, qrPx);
    const listY = bandY + qrPx + bandH * 0.06;
    drawFlowList(items, rx, listY, rw, Math.max(W * 0.08, bandY + bandH - listY));
  } else {
    const capH = Math.min(bandH * 0.2, W * 0.1);
    const qrPx = Math.max(60, Math.min(rw * 0.74, bandH - capH * 1.3));
    const qrY = bandY + (bandH - capH - qrPx) / 2;
    await drawQRAt(rx + (rw - qrPx) / 2, qrY, qrPx);
    drawCountLine(rx, qrY + qrPx + capH * 0.15, rw, capH, "center");
  }
}

// Layout constants. These were owner-facing sliders; every one of them could
// only make a sign worse, so they're tuned once here instead. LOGO_PCT in
// particular is held at a level the H-level error correction can absorb.
const HEADER_REF_PX  = 22;    // reference px, relative to a 400px-wide card
const TAGLINE_REF_PX = 16;
const CARD_PAD_RATIO = 0.062; // print-safe margin, ~6% of width
const LOGO_PCT       = 18;    // logo width as % of the QR
const LOGO_PAD_PCT   = 18;    // knockout ring around the logo, as % of its size

export type ScanCheck = "ok" | "inverted" | "fail";

/**
 * Actually decodes the code we're about to print, rather than inferring
 * scannability from a contrast ratio. Renders the QR exactly as it will appear
 * — real colours, module shape, centred logo knockout — and runs jsQR over it.
 *
 * "inverted" means the contrast is fine but the code is light-on-dark. Modern
 * phone cameras generally cope; older scanners don't. That's a caution, not a
 * failure.
 */
async function verifyScannable(o: {
  url: string;
  fg: string; bg: string;
  logoUrl: string | null;
  includeLogo: boolean;
}): Promise<ScanCheck> {
  // Comfortably above the decoder's minimum, so a "fail" here is about the
  // colours the owner picked and never about the test resolution.
  const SIZE = 720;

  const paint = async (fg: string, bg: string) => {
    const c = renderQRCanvas(o.url, SIZE, fg, bg);
    const ctx = c.getContext("2d")!;
    if (o.includeLogo && o.logoUrl) {
      try {
        const img = await loadImage(o.logoUrl);
        const nW = img.naturalWidth || img.width;
        const nH = img.naturalHeight || img.height;
        const logoSize = SIZE * (LOGO_PCT / 100);
        const s = Math.min(logoSize / nW, logoSize / nH);
        const ring = logoSize * (1 + (LOGO_PAD_PCT / 100) * 2);
        ctx.fillStyle = bg;
        ctx.beginPath();
        ctx.arc(SIZE / 2, SIZE / 2, ring / 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.drawImage(img, SIZE / 2 - (nW * s) / 2, SIZE / 2 - (nH * s) / 2, nW * s, nH * s);
      } catch { /* logo unavailable — check the bare code */ }
    }
    return ctx.getImageData(0, 0, SIZE, SIZE).data;
  };

  // jsQR throws rather than returning null when it can't even find the finder
  // patterns — which is exactly the unscannable case we're testing for.
  const decodes = (px: Uint8ClampedArray) => {
    try { return !!jsQR(px, SIZE, SIZE, { inversionAttempts: "dontInvert" }); }
    catch { return false; }
  };

  if (decodes(await paint(o.fg, o.bg))) return "ok";
  // Don't ask jsQR to invert for us: its binariser reads a large flat dark area
  // as light, so flipping afterwards floods the quiet zone black and nothing
  // locates. Re-render the code the right way round instead — if *that* decodes,
  // the contrast is fine and the only issue is that it's light-on-dark.
  if (decodes(await paint(o.bg, o.fg))) return "inverted";
  return "fail";
}

async function composeQR(opts: {
  slug: string;
  fgColor: string;
  bgColor: string;
  textColor: string;
  format: FormatKey;
  showHeader: boolean;
  showTagline: boolean;
  header: string;
  tagline: string;
  fontKey: FontKey;
  showBorder: boolean;
  roundCrop: boolean;
  includeLogo: boolean;
  logoUrl: string | null;
  // Multilingual sign templates — null keeps the classic QR-card layouts.
  signTemplate: SignTemplateKey | null;
  signVariant: "light" | "dark";
  signBrand: "logo" | "name";
  signHeadline: string;
  restaurantName: string;
  canvas: HTMLCanvasElement;
  maxWidth?: number;       // preview cap — uniformly scales the whole card
}) {
  const {
    slug, fgColor, bgColor, textColor, format, showHeader, showTagline,
    header, tagline, fontKey, showBorder, roundCrop, includeLogo,
    logoUrl, signTemplate, signVariant, signBrand,
    signHeadline, restaurantName, canvas, maxWidth,
  } = opts;

  const url = window.location.origin + "/menu/" + slug;
  const fmt = FORMATS[format];

  // Language names must be drawable before anything is painted — an unloaded
  // CJK / Arabic / Devanagari / Gurmukhi face draws as tofu boxes, silently.
  const langs = signTemplate ? getSignLanguages() : [];
  if (signTemplate) await ensureScriptFonts(langs);

  // Ensure web fonts are ready so canvas text matches the picked family.
  if (typeof document !== "undefined" && document.fonts?.ready) {
    try { await document.fonts.ready; } catch { /* ignore */ }
  }

  // Downloads always come out at the format's print width; previews are the same
  // card scaled uniformly down, so what you see is exactly what you get.
  let W = fmt.printW;
  let H = Math.round(W / fmt.aspect);
  if (maxWidth && W > maxWidth) {
    const s = maxWidth / W;
    W = Math.round(W * s);
    H = Math.round(H * s);
  }
  canvas.width = W;
  canvas.height = H;

  const ctx = canvas.getContext("2d")!;
  // Signs support a light/dark treatment; classic cards use the picked colors.
  const sc = signTemplate
    ? signColors(signVariant, fgColor, bgColor, textColor)
    : { cardBg: bgColor, ink: textColor, qrFg: fgColor, qrBg: bgColor, panel: false, panelBg: bgColor };
  ctx.fillStyle = sc.cardBg;
  ctx.fillRect(0, 0, W, H);

  const fam = resolveFontFamily(fontKey);
  const ts = W / 400;                 // text scale vs reference card
  const pad = W * CARD_PAD_RATIO;
  const innerW = W - pad * 2;
  const wmH = W * 0.045;
  const headerPx = HEADER_REF_PX * ts;
  const taglinePx = TAGLINE_REF_PX * ts;
  const anchorX = W / 2;

  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // ── Logo helper — centered on the QR rect (shared centerX/centerY) ─────────
  const drawLogo = async (cx: number, cy: number, qrPx: number) => {
    if (!includeLogo || !logoUrl) return;
    try {
      const logoImg = await loadImage(logoUrl);
      const logoSize = qrPx * (LOGO_PCT / 100);
      const naturalW = logoImg.naturalWidth || logoImg.width;
      const naturalH = logoImg.naturalHeight || logoImg.height;
      const scale = Math.min(logoSize / naturalW, logoSize / naturalH);
      const drawW = naturalW * scale;
      const drawH = naturalH * scale;
      // Knock the modules out in the QR's own background colour so the logo
      // reads as a deliberate hole rather than something sitting on top.
      const bgSize = logoSize * (1 + (LOGO_PAD_PCT / 100) * 2);
      ctx.fillStyle = sc.qrBg;
      ctx.beginPath();
      ctx.arc(cx, cy, bgSize / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.drawImage(logoImg, cx - drawW / 2, cy - drawH / 2, drawW, drawH);
    } catch { /* logo failed to load */ }
  };

  // ── Text measurement ───────────────────────────────────────────────────────
  let headerLines: string[] = [];
  if (showHeader && header.trim()) {
    ctx.font = `600 ${headerPx}px ${fam}`;
    headerLines = wrapLines(ctx, header.trim(), innerW, 2);
  }
  const headerBlockH = headerLines.length ? headerLines.length * headerPx * 1.18 + headerPx * 0.4 : 0;

  let taglineLines: string[] = [];
  if (showTagline && tagline.trim()) {
    ctx.font = `${taglinePx}px ${fam}`;
    taglineLines = wrapLines(ctx, tagline.trim(), innerW, 2);
  }
  const taglineBlockH = taglineLines.length ? taglineLines.length * taglinePx * 1.18 + taglinePx * 0.5 : 0;

  if (signTemplate) {
    await drawLanguageSign({
      ctx, W, H,
      template: signTemplate,
      pad, wmH,
      round: roundCrop,
      landscape: fmt.orientation === "landscape",
      ink: sc.ink,
      qrFg: sc.qrFg, qrBg: sc.qrBg,
      panel: sc.panel, panelBg: sc.panelBg,
      url,
      fam,
      headline: signHeadline,
      brandMode: signBrand,
      brandName: restaurantName,
      logoUrl,
      langs,
      drawCenterLogo: drawLogo,
    });
  } else if (fmt.orientation === "landscape") {
    // ── Counter card: QR on the left, text column on the right ───────────────
    const qrAreaW = innerW * 0.46;
    const availH = H - pad * 2 - wmH;
    const qrPx = Math.max(60, Math.min(qrAreaW, availH));
    const qrX = pad + (qrAreaW - qrPx) / 2;
    const qrY = pad + (availH - qrPx) / 2;
    ctx.drawImage(renderQRCanvas(url, Math.round(qrPx), fgColor, bgColor), qrX, qrY, qrPx, qrPx);
    await drawLogo(qrX + qrPx / 2, qrY + qrPx / 2, qrPx);

    // Right-hand text column
    const colX = pad + qrAreaW + pad * 0.6;
    const colW = W - pad - colX;
    const colAnchorX = colX + colW / 2;
    ctx.textAlign = "center";
    const groupH = headerBlockH + taglineBlockH;
    let ty = pad + (availH - groupH) / 2;
    if (headerLines.length) {
      ctx.fillStyle = textColor;
      ctx.font = `600 ${headerPx}px ${fam}`;
      for (const line of headerLines) { ctx.fillText(line, colAnchorX, ty); ty += headerPx * 1.18; }
      ty += headerPx * 0.4;
    }
    if (taglineLines.length) {
      ctx.fillStyle = textColor;
      ctx.font = `${taglinePx}px ${fam}`;
      for (const line of taglineLines) { ctx.fillText(line, colAnchorX, ty); ty += taglinePx * 1.18; }
    }
  } else {
    // ── Portrait/square stack: header, QR (centered in the gap), tagline ─────
    const innerTop = pad + headerBlockH;
    const innerBottom = H - pad - wmH - taglineBlockH;
    const availH = Math.max(60, innerBottom - innerTop);
    const qrPx = Math.max(60, Math.min(innerW, availH));
    const qrX = (W - qrPx) / 2;
    // No header/tagline → center the QR (and therefore its logo) on the TRUE
    // canvas center. Otherwise the reserved bottom watermark band nudges it up.
    const noText = headerLines.length === 0 && taglineLines.length === 0;
    const qrY = noText ? (H - qrPx) / 2 : innerTop + (availH - qrPx) / 2;

    if (headerLines.length) {
      ctx.fillStyle = textColor;
      ctx.font = `600 ${headerPx}px ${fam}`;
      let hy = pad;
      for (const line of headerLines) { ctx.fillText(line, anchorX, hy); hy += headerPx * 1.18; }
    }

    ctx.drawImage(renderQRCanvas(url, Math.round(qrPx), fgColor, bgColor), qrX, qrY, qrPx, qrPx);
    await drawLogo(qrX + qrPx / 2, qrY + qrPx / 2, qrPx);

    if (taglineLines.length) {
      ctx.fillStyle = textColor;
      ctx.font = `${taglinePx}px ${fam}`;
      let ty = qrY + qrPx + taglinePx * 0.6;
      for (const line of taglineLines) { ctx.fillText(line, anchorX, ty); ty += taglinePx * 1.18; }
    }
  }

  // ── Watermark — exact DineLinks "DL" mark + domain ───────────────────────────
  ctx.direction = "ltr";
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = sc.ink;
  ctx.font = `${W * 0.022}px system-ui, -apple-system, sans-serif`;
  const logoH = W * 0.023;
  const logoW = (44 / 40) * logoH;
  const gap = W * 0.016;
  ctx.textBaseline = "alphabetic";
  if (roundCrop) {
    const cy = H - wmH * 0.5;
    const domainW = ctx.measureText("dinelinks.com").width;
    const totalW = logoW + gap + domainW;
    const startX = (W - totalW) / 2;
    drawDLLogo(ctx, startX, cy - logoH * 0.82, logoH, sc.ink);
    ctx.textAlign = "left";
    ctx.fillStyle = sc.ink;
    ctx.fillText("dinelinks.com", startX + logoW + gap, cy);
  } else {
    const wmY = H - pad * 0.55;
    ctx.textAlign = "right";
    ctx.fillText("dinelinks.com", W - pad, wmY);
    const domainW = ctx.measureText("dinelinks.com").width;
    const lx = W - pad - domainW - gap - logoW;
    drawDLLogo(ctx, lx, wmY - logoH * 0.82, logoH, sc.ink);
  }
  ctx.globalAlpha = 1;

  // ── Circular crop (coaster) ──────────────────────────────────────────────────
  if (roundCrop) {
    ctx.globalCompositeOperation = "destination-in";
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, Math.min(W, H) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = "source-over";
  }

  // ── Outer border / frame ─────────────────────────────────────────────────────
  if (showBorder) {
    ctx.strokeStyle = sc.ink;
    ctx.lineWidth = Math.max(2, W * 0.006);
    const inset = ctx.lineWidth * 1.5;
    if (roundCrop) {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, Math.min(W, H) / 2 - inset, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      roundRect(ctx, inset, inset, W - inset * 2, H - inset * 2, W * 0.03);
      ctx.stroke();
    }
  }
}

// Small proportional thumbnail illustrating each physical format.
function FormatThumb({ format, active }: { format: FormatKey; active: boolean }) {
  const dims: Record<FormatKey, { w: number; h: number; round?: boolean }> = {
    sticker: { w: 26, h: 26 },
    tent:    { w: 21, h: 31 },
    poster:  { w: 23, h: 31 },
    aframe:  { w: 17, h: 33 },
    counter: { w: 34, h: 21 },
    coaster: { w: 28, h: 28, round: true },
  };
  const d = dims[format];
  const x = (38 - d.w) / 2;
  const y = (38 - d.h) / 2;
  const stroke = active ? "var(--accent)" : "var(--muted)";
  const qr = active ? "var(--accent)" : "var(--muted)";
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
      {d.round ? (
        <circle cx="19" cy="19" r={d.w / 2} stroke={stroke} strokeWidth="1.5" />
      ) : (
        <rect x={x} y={y} width={d.w} height={d.h} rx="2.5" stroke={stroke} strokeWidth="1.5" />
      )}
      {format === "counter" ? (
        <rect x={x + 3} y={19 - 5} width="10" height="10" rx="1.5" fill={qr} opacity="0.85" />
      ) : (
        <rect x={19 - 4.5} y={19 - 4.5} width="9" height="9" rx="1.5" fill={qr} opacity="0.85" />
      )}
    </svg>
  );
}

// Template card preview — combines the SELECTED format's shape/aspect with the
// template's text layout (QR only / + tagline / name + tagline), so the owner
// sees what each template looks like on the format they picked.
function TemplatePreview({ format, template, active }: {
  format: FormatKey;
  template: "simple" | "tagline" | "table";
  active: boolean;
}) {
  const fmt = FORMATS[format];
  const round = !!fmt.round;
  const isLandscape = fmt.orientation === "landscape";
  const VB = 64, MAX = 54;
  let w = MAX, h = MAX;
  if (fmt.aspect >= 1) h = MAX / fmt.aspect; else w = MAX * fmt.aspect;
  const x = (VB - w) / 2;
  const y = (VB - h) / 2;
  const stroke = active ? "var(--accent)" : "var(--muted)";
  const ink = active ? "var(--accent)" : "var(--muted)";
  const showName = template === "table";
  const showTag = template === "tagline" || template === "table";
  const bar = (bx: number, by: number, bw: number, op: number) => (
    <rect x={bx} y={by} width={bw} height={2} rx={1} fill={ink} opacity={op} />
  );

  let content: ReactNode;
  if (isLandscape) {
    const pad = 5;
    const qrS = Math.min(h - pad * 2, w * 0.42);
    const qrX = x + pad;
    const qrY = y + (h - qrS) / 2;
    const tx = qrX + qrS + 4;
    const tw = x + w - pad - tx;
    content = (
      <>
        <rect x={qrX} y={qrY} width={qrS} height={qrS} rx={2} fill={ink} opacity={0.85} />
        {showName && bar(tx, y + h / 2 - 6, tw, 0.7)}
        <rect x={tx} y={y + h / 2 - 1} width={tw * 0.85} height={2} rx={1} fill={ink} opacity={0.45} />
        {showTag && bar(tx, y + h / 2 + 5, tw * 0.7, 0.45)}
      </>
    );
  } else if (round) {
    const qrS = w * 0.5;
    const qrX = x + (w - qrS) / 2;
    const qrY = y + (h - qrS) / 2;
    content = (
      <>
        {showName && bar(32 - 9, qrY - 5, 18, 0.7)}
        <rect x={qrX} y={qrY} width={qrS} height={qrS} rx={2} fill={ink} opacity={0.85} />
        {showTag && bar(32 - 7, qrY + qrS + 3, 14, 0.45)}
      </>
    );
  } else {
    const pad = 5;
    const innerTop = y + pad + (showName ? 8 : 0);
    const innerBot = y + h - pad - (showTag ? 8 : 0);
    const band = innerBot - innerTop;
    const qrS = Math.min(w - pad * 2, band);
    const qrX = x + (w - qrS) / 2;
    const qrY = innerTop + (band - qrS) / 2;
    content = (
      <>
        {showName && bar(x + w * 0.2, y + pad, w * 0.6, 0.7)}
        <rect x={qrX} y={qrY} width={qrS} height={qrS} rx={2} fill={ink} opacity={0.85} />
        {showTag && bar(x + w * 0.25, y + h - pad - 2, w * 0.5, 0.45)}
      </>
    );
  }

  return (
    <svg width="100%" viewBox="0 0 64 64" style={{ maxWidth: 64 }}>
      {round ? (
        <circle cx={32} cy={32} r={Math.min(w, h) / 2} stroke={stroke} strokeWidth={1.5} fill="none" />
      ) : (
        <rect x={x} y={y} width={w} height={h} rx={3} stroke={stroke} strokeWidth={1.5} fill="none" />
      )}
      {content}
    </svg>
  );
}

// Schematic thumbnail for the multilingual sign templates, drawn on the
// selected format's shape so the owner sees how it lands on what they'll print.
function SignTemplatePreview({ format, template, active }: {
  format: FormatKey;
  template: SignTemplateKey;
  active: boolean;
}) {
  const fmt = FORMATS[format];
  const round = !!fmt.round;
  const landscape = fmt.orientation === "landscape";
  const VB = 64, MAX = 54;
  let w = MAX, h = MAX;
  if (fmt.aspect >= 1) h = MAX / fmt.aspect; else w = MAX * fmt.aspect;
  const x = (VB - w) / 2, y = (VB - h) / 2;
  const stroke = active ? "var(--accent)" : "var(--muted)";
  const ink = active ? "var(--accent)" : "var(--muted)";
  const p = Math.min(w, h) * 0.11;

  const bar = (bx: number, by: number, bw: number, op = 0.5, bh = 1.6) => (
    <rect key={`${bx}-${by}-${bw}`} x={bx} y={by} width={Math.max(1, bw)} height={bh} rx={bh / 2} fill={ink} opacity={op} />
  );
  const rows = (rx: number, ry: number, rw: number, n: number, step: number, op = 0.45) =>
    Array.from({ length: n }, (_, i) => bar(rx, ry + i * step, rw, op, 1.3));

  const parts: ReactNode[] = [];
  const cx = x + w / 2;

  if (landscape) {
    const qrS = Math.min(h - p * 2, w * 0.3);
    const qx = x + p, qy = y + (h - qrS) / 2;
    const tx = qx + qrS + p * 0.8;
    const tw = x + w - p - tx;
    parts.push(<rect key="qr" x={qx} y={qy} width={qrS} height={qrS} rx={1.5} fill={ink} opacity={0.85} />);
    parts.push(bar(tx, y + p, tw * 0.45, 0.65, 1.4));
    parts.push(bar(tx, y + p + 3.4, tw * 0.85, 0.85, 2.2));
    if (template === "sign-minimal") parts.push(bar(tx, y + h - p - 4, tw * 0.6, 0.5, 1.6));
    else if (template === "sign-stacked") parts.push(...rows(tx, y + p + 9, tw * 0.9, 3, 3));
    else {
      parts.push(...rows(tx, y + p + 9, tw * 0.4, 3, 3));
      parts.push(...rows(tx + tw * 0.5, y + p + 9, tw * 0.4, 3, 3));
      if (template === "sign-steps") parts.push(bar(tx, y + h - p - 1.5, tw, 0.35, 1.2));
    }
  } else {
    parts.push(bar(cx - w * 0.16, y + p, w * 0.32, 0.6, 1.6));
    parts.push(bar(cx - w * 0.3, y + p + 4, w * 0.6, 0.85, 2.4));
    const top = y + p + 9;
    const bottomPad = template === "sign-steps" ? p + 4 : p;
    const band = (y + h - bottomPad) - top;

    if (template === "sign-split" || template === "sign-steps") {
      const qrS = Math.min(band * 0.9, w * 0.34);
      const qy = top + (band - qrS) / 2;
      parts.push(<rect key="qr" x={cx - qrS / 2} y={qy} width={qrS} height={qrS} rx={1.5} fill={ink} opacity={0.85} />);
      const colW = (w - qrS) / 2 - p * 1.2;
      parts.push(...rows(x + p, qy + 1, colW, 3, qrS / 3.4));
      parts.push(...rows(cx + qrS / 2 + p * 0.5, qy + 1, colW, 3, qrS / 3.4));
      if (template === "sign-steps") parts.push(bar(x + p, y + h - p - 1, w - p * 2, 0.35, 1.2));
    } else if (template === "sign-columns") {
      const side = w >= band * 1.05;
      if (side) {
        const qrS = Math.min(band * 0.9, w * 0.36);
        parts.push(<rect key="qr" x={x + p} y={top + (band - qrS) / 2} width={qrS} height={qrS} rx={1.5} fill={ink} opacity={0.85} />);
        const lx = x + p + qrS + p * 0.8;
        const lw = (x + w - p - lx - 2) / 2;
        parts.push(...rows(lx, top + band * 0.2, lw, 3, band * 0.22));
        parts.push(...rows(lx + lw + 2, top + band * 0.2, lw, 3, band * 0.22));
      } else {
        const qrS = Math.min(band * 0.45, w * 0.4);
        parts.push(<rect key="qr" x={cx - qrS / 2} y={top} width={qrS} height={qrS} rx={1.5} fill={ink} opacity={0.85} />);
        const lw = (w - p * 2) / 2 - 1.5;
        parts.push(...rows(x + p, top + qrS + 3, lw, 3, 3));
        parts.push(...rows(x + p + lw + 3, top + qrS + 3, lw, 3, 3));
      }
    } else if (template === "sign-stacked") {
      const qrS = Math.min(band * 0.52, w * 0.4);
      parts.push(<rect key="qr" x={cx - qrS / 2} y={top} width={qrS} height={qrS} rx={1.5} fill={ink} opacity={0.85} />);
      parts.push(...rows(x + p, top + qrS + 3, w - p * 2, 3, 3));
    } else {
      const qrS = Math.min(band * 0.62, w * 0.5);
      const qy = top + (band - qrS - 4) / 2;
      parts.push(<rect key="qr" x={cx - qrS / 2} y={qy} width={qrS} height={qrS} rx={1.5} fill={ink} opacity={0.85} />);
      parts.push(bar(cx - w * 0.22, qy + qrS + 3, w * 0.44, 0.55, 1.8));
    }
  }

  return (
    <svg width="100%" viewBox="0 0 64 64" style={{ maxWidth: 64 }}>
      {round
        ? <circle cx={32} cy={32} r={Math.min(w, h) / 2} stroke={stroke} strokeWidth={1.5} fill="none" />
        : <rect x={x} y={y} width={w} height={h} rx={3} stroke={stroke} strokeWidth={1.5} fill="none" />}
      {parts}
    </svg>
  );
}

// ── QR generator ──────────────────────────────────────────────────────────────
// Preview-first: the card the owner is about to print stays large and live,
// while a narrow rail asks the three questions they actually have, in the order
// they have them — where is this going, what should it look like, and which few
// words are theirs. Everything that could only make the result worse is either
// gone or tuned once inside composeQR.

type ColourKey = "classic" | "brand" | "dark";

function QRSection({ step, title, hint, children }: {
  step: number; title: string; hint?: string; children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2">
        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]/15 text-[10px] font-bold text-[var(--accent)]">
          {step}
        </span>
        <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--foreground)]">{title}</h3>
      </div>
      {hint && <p className="ml-7 mt-1 text-[11px] leading-snug text-[var(--muted)]">{hint}</p>}
      <div className="mt-2.5">{children}</div>
    </section>
  );
}

function Segmented<T extends string>({ options, value, onChange }: {
  options: { id: T; label: string; disabled?: boolean }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {options.map(o => (
        <button key={o.id} type="button" disabled={o.disabled} onClick={() => onChange(o.id)}
          className={`flex-1 rounded-lg border py-1.5 text-[11px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
            value === o.id
              ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
              : "border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--accent)]/50"
          }`}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function DesignCard({ label, desc, selected, onClick, children }: {
  label: string; desc: string; selected: boolean; onClick: () => void; children: ReactNode;
}) {
  return (
    <button type="button" onClick={onClick}
      className={`rounded-xl border-2 p-2 text-center transition-all ${
        selected ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--card-border)] hover:border-[var(--accent)]/40"
      }`}>
      <div className="mb-1.5 flex min-h-[58px] items-center justify-center rounded-lg border border-[var(--card-border)] bg-[var(--background)] p-1">
        {children}
      </div>
      <span className={`block text-[11px] font-semibold leading-tight ${selected ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
        {label}
      </span>
      <span className="mt-0.5 block text-[9px] leading-tight text-[var(--muted)]">{desc}</span>
    </button>
  );
}

function QRModal({ slug, restaurant, onClose }: { slug: string; restaurant: Restaurant | null; onClose: () => void }) {
  const logoUrl = (restaurant as Restaurant & { logo_url?: string | null })?.logo_url ?? null;
  const restaurantName = restaurant?.name ?? "Your Restaurant";

  const brandAccent = restaurant?.accent_color ?? "#8b6914";
  const brandFont   = restaurant?.font_color ?? "#2c2a26";
  const brandCard   = restaurant?.main_color ?? "#ffffff";

  // "Your colours" pulls the restaurant's own theme so the print matches the
  // menu it points at.
  const COLOURS: Record<ColourKey, { fg: string; bg: string; frame: string; label: string }> = useMemo(() => ({
    classic: { fg: "#000000", bg: "#ffffff", frame: "#2c2a26",  label: "Classic"      },
    brand:   { fg: brandFont, bg: brandCard, frame: brandAccent, label: "Your colours" },
    dark:    { fg: "#faf8f5", bg: "#1f1d1a", frame: "#faf8f5",  label: "Dark"         },
  }), [brandFont, brandCard, brandAccent]);

  // ── Persisted settings — restore the owner's last QR choices ─────────────────
  const STORAGE_KEY = `dinelinks-qr-settings-${slug}`;
  const savedRef = useRef<Record<string, unknown> | null>(null);
  if (savedRef.current === null) {
    savedRef.current = (() => {
      if (typeof window === "undefined") return {};
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
    })();
  }
  const saved = savedRef.current as Record<string, unknown>;
  const pick = <T,>(key: string, fallback: T): T =>
    (saved[key] === undefined || saved[key] === null ? fallback : saved[key] as T);

  const [qrFormat, setQrFormat]           = useState<FormatKey>(pick("qrFormat", "sticker"));
  const [qrTemplate, setQrTemplate]       = useState<TemplateKey>(pick("qrTemplate", "sign-split"));
  const [customQrColor, setCustomQrColor] = useState(pick("customQrColor", "#000000"));
  const [customBgColor, setCustomBgColor] = useState(pick("customBgColor", "#ffffff"));
  const [customFrameColor, setCustomFrameColor] = useState(pick("customFrameColor", "#2c2a26"));
  const [qrFont, setQrFont]               = useState<FontKey>(pick("qrFont", "serif"));
  const [showBorder, setShowBorder]       = useState(pick("showBorder", false));
  const [qrIncludeLogo, setQrIncludeLogo] = useState(pick("qrIncludeLogo", true));
  const [qrTagline, setQrTagline]         = useState(pick("qrTagline", "Scan to view our menu"));
  const [qrHeader, setQrHeader]           = useState(pick("qrHeader", restaurantName));
  const [signVariant, setSignVariant]     = useState<"light" | "dark">(pick("signVariant", "light"));
  const [signBrand, setSignBrand]         = useState<"logo" | "name">(pick("signBrand", logoUrl ? "logo" : "name"));
  const [signHeadline, setSignHeadline]   = useState<string>(pick("signHeadline", DEFAULT_SIGN_HEADLINE));

  const [isDownloading, setIsDownloading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [scan, setScan]                   = useState<ScanCheck>("ok");

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);
  const renderIdRef = useRef(0);

  useBodyScrollLock(true);

  const isSign = isSignTemplate(qrTemplate);
  const showHeader = qrTemplate === "table";
  const showTagline = qrTemplate === "tagline" || qrTemplate === "table";
  // On a sign the restaurant mark already sits at the top, so the code itself
  // stays clean — a second copy of the logo in its centre just adds noise.
  const logoInCode = qrIncludeLogo && !isSign && !!logoUrl;

  // Which colour preset the current triple corresponds to (null once the owner
  // has hand-picked something in Advanced).
  const activeColour = (Object.keys(COLOURS) as ColourKey[]).find(k =>
    COLOURS[k].fg === customQrColor && COLOURS[k].bg === customBgColor && COLOURS[k].frame === customFrameColor
  ) ?? null;

  const selectColour = (key: ColourKey) => {
    const p = COLOURS[key];
    setCustomQrColor(p.fg);
    setCustomBgColor(p.bg);
    setCustomFrameColor(p.frame);
  };

  // Signs express darkness through their own variant (dark card, light chip
  // under the code) — handing them the inverted Dark palette as well would
  // produce a light-on-dark code that scans badly.
  const selectTemplate = (t: TemplateKey) => {
    if (isSignTemplate(t) && activeColour === "dark") {
      selectColour("classic");
      setSignVariant("dark");
    }
    setQrTemplate(t);
  };

  // A dark sign forces dark modules onto a light chip, so scannability has to be
  // judged on the colours that actually get printed, not the picked pair.
  const effective = isSign
    ? signColors(signVariant, customQrColor, customBgColor, customFrameColor)
    : { qrFg: customQrColor, qrBg: customBgColor };

  const commonOpts = useCallback(() => ({
    slug,
    fgColor: customQrColor,
    bgColor: customBgColor,
    textColor: customFrameColor,
    format: qrFormat,
    showHeader: qrTemplate === "table",
    showTagline: qrTemplate === "tagline" || qrTemplate === "table",
    header: qrHeader,
    tagline: qrTagline,
    fontKey: qrFont,
    showBorder,
    roundCrop: !!FORMATS[qrFormat].round, // circular crop applies automatically for coaster only
    includeLogo: qrIncludeLogo && !isSignTemplate(qrTemplate),
    logoUrl,
    signTemplate: isSignTemplate(qrTemplate) ? qrTemplate : null,
    signVariant,
    signBrand,
    signHeadline,
    restaurantName,
  }), [slug, customQrColor, customBgColor, customFrameColor, qrFormat, qrTemplate, qrHeader,
    qrTagline, qrFont, showBorder, qrIncludeLogo, logoUrl, signVariant,
    signBrand, signHeadline, restaurantName]);

  // Live preview — render to offscreen at capped width, then blit only if still latest.
  useEffect(() => {
    const myId = ++renderIdRef.current;
    const off = document.createElement("canvas");
    // Render the preview at the device pixel ratio (2x/3x on retina) so the
    // displayed canvas — capped by CSS to a small box — stays crisp, not blurry.
    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 3) : 1;
    composeQR({ ...commonOpts(), canvas: off, maxWidth: Math.round(640 * dpr) }).then(() => {
      if (myId !== renderIdRef.current) return;
      const vis = previewCanvasRef.current;
      if (!vis) return;
      vis.width = off.width;
      vis.height = off.height;
      vis.getContext("2d")!.drawImage(off, 0, 0);
    }).catch(() => {});
  }, [commonOpts]);

  // Scannability — decode the code we're about to print rather than guessing
  // from a contrast ratio. Debounced so dragging a colour picker isn't costly.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const t = setTimeout(() => {
      verifyScannable({
        url: window.location.origin + "/menu/" + slug,
        fg: effective.qrFg,
        bg: effective.qrBg,
        logoUrl,
        includeLogo: logoInCode,
      }).then(r => { if (!cancelled) setScan(r); }).catch(() => {});
    }, 200);
    return () => { cancelled = true; clearTimeout(t); };
  }, [slug, effective.qrFg, effective.qrBg, logoUrl, logoInCode]);

  const buildSettings = useCallback(() => ({
    qrFormat, qrTemplate, customQrColor, customBgColor, customFrameColor,
    qrFont, showBorder, qrIncludeLogo, qrTagline, qrHeader,
    signVariant, signBrand, signHeadline,
  }), [qrFormat, qrTemplate, customQrColor, customBgColor, customFrameColor,
    qrFont, showBorder, qrIncludeLogo, qrTagline, qrHeader, signVariant, signBrand, signHeadline]);

  // Auto-save on every change so reopening the modal restores where they left off.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSettings())); } catch {}
  }, [buildSettings, STORAGE_KEY]);

  const handleSaveSettings = () => {
    if (typeof window !== "undefined") {
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(buildSettings())); } catch {}
    }
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 1800);
  };

  const handleDownloadQR = async () => {
    setIsDownloading(true);
    try {
      const canvas = downloadCanvasRef.current ?? document.createElement("canvas");
      await composeQR({ ...commonOpts(), canvas });
      const filename = `${slug || "menu"}-${qrFormat}-qr.png`;

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert("Couldn't generate QR code. Try again.");
          setIsDownloading(false);
          return;
        }

        // 1. Try Web Share API — best on iOS and modern mobile
        if (typeof navigator !== "undefined" && navigator.canShare) {
          const file = new File([blob], filename, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            try {
              await navigator.share({ files: [file], title: "Your DineLinks QR code" });
              setIsDownloading(false);
              return;
            } catch (err) {
              if ((err as Error).name === "AbortError") { setIsDownloading(false); return; }
              // non-abort error: fall through to standard download
            }
          }
        }

        // 2. Standard anchor download — works on desktop
        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {
          // 3. Last resort — open in new tab for manual save
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
        }

        setIsDownloading(false);
      }, "image/png");
    } catch (err) {
      console.error("QR download failed:", err);
      alert("Couldn't download QR code. Try again or take a screenshot.");
      setIsDownloading(false);
    }
  };

  const fmt = FORMATS[qrFormat];
  const printPx = `${fmt.printW} × ${Math.round(fmt.printW / fmt.aspect)} px`;
  const colourOptions = (isSign ? ["classic", "brand"] : ["classic", "brand", "dark"]) as ColourKey[];

  return (
    <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      style={{ animation: "fadeIn 0.15s ease-out" }}>
      <div className="flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-2xl bg-[var(--card)] shadow-2xl sm:max-h-[92vh] sm:max-w-lg sm:rounded-2xl md:max-w-5xl"
        style={{ animation: "modalIn 0.15s ease-out" }}>

        {/* Header */}
        <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--card-border)] bg-[var(--card)] px-5 py-3.5">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Get your QR code</h2>
            <p className="mt-0.5 text-xs text-[var(--muted)]">Pick a format and a design — it&rsquo;s print-ready as-is</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-[var(--muted)] hover:text-[var(--foreground)]">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:grid md:grid-cols-[minmax(0,1fr)_360px] md:overflow-hidden">

          {/* ── Preview: the hero ─────────────────────────────────────────────── */}
          <div className="flex flex-col border-b border-[var(--card-border)] bg-[var(--background)] md:border-b-0 md:border-r">
            <div className="flex flex-1 items-center justify-center p-4 md:p-8">
              <canvas
                ref={previewCanvasRef}
                className="max-h-[34vh] rounded-lg shadow-md md:max-h-[56vh]"
                style={{ display: "block", maxWidth: "100%", height: "auto", width: "auto" }}
              />
            </div>

            {/* Scannability — a real decode of the code being printed */}
            <div className="px-4 pb-4 md:px-8 md:pb-6">
              {scan === "fail" ? (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-snug text-red-700">
                  <span className="font-semibold">This code didn&rsquo;t scan.</span> The colours are too close together for a
                  phone to read it. Pick a different colour in Advanced before printing.
                </p>
              ) : scan === "inverted" ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-snug text-amber-700">
                  <span className="font-semibold">Light code on a dark background.</span> Newer phones handle this fine,
                  but older cameras can struggle. Test it before a big print run.
                </p>
              ) : (
                <p className="flex items-center justify-center gap-1.5 text-[11px] text-[var(--muted)]">
                  <span className="text-green-600">✓</span>
                  Scan-tested · {fmt.label} · {printPx}
                </p>
              )}
            </div>
          </div>

          {/* ── Controls ──────────────────────────────────────────────────────── */}
          <div className="space-y-6 px-5 py-5 md:overflow-y-auto">

            {/* 1 — Format */}
            <QRSection step={1} title="Where is it going?">
              <div className="grid grid-cols-3 gap-1.5">
                {(Object.keys(FORMATS) as FormatKey[]).map(key => {
                  const f = FORMATS[key];
                  const active = qrFormat === key;
                  return (
                    <button key={key} type="button" onClick={() => setQrFormat(key)}
                      className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-2 text-center transition-all ${
                        active ? "border-[var(--accent)] bg-[var(--accent)]/5" : "border-[var(--card-border)] hover:border-[var(--accent)]/40"
                      }`}>
                      <FormatThumb format={key} active={active} />
                      <span className={`text-[10px] font-semibold leading-tight ${active ? "text-[var(--accent)]" : "text-[var(--foreground)]"}`}>
                        {f.label}
                      </span>
                      <span className="text-[9px] leading-tight text-[var(--muted)]">{f.desc}</span>
                    </button>
                  );
                })}
              </div>
            </QRSection>

            {/* 2 — Design */}
            <QRSection step={2} title="Pick a design" hint="Each one is finished as-is — nothing below is required.">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Multilingual signs
              </p>
              <p className="mb-2.5 text-[11px] leading-snug text-[var(--muted)]">
                &ldquo;Read our menu in your language&rdquo; — all {locales.length} languages in their own scripts,
                pulled from your menu&rsquo;s translations so the list stays current.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SIGN_TEMPLATES.map(t => (
                  <DesignCard key={t.id} label={t.label} desc={t.desc}
                    selected={qrTemplate === t.id} onClick={() => selectTemplate(t.id)}>
                    <SignTemplatePreview format={qrFormat} template={t.id} active={qrTemplate === t.id} />
                  </DesignCard>
                ))}
              </div>

              <p className="mb-2 mt-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                Plain code
              </p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { id: "simple"  as const, label: "Code only", desc: "Nothing else"  },
                  { id: "tagline" as const, label: "Tagline",   desc: "One line under" },
                  { id: "table"   as const, label: "Name + tag", desc: "Both lines"   },
                ]).map(t => (
                  <DesignCard key={t.id} label={t.label} desc={t.desc}
                    selected={qrTemplate === t.id} onClick={() => selectTemplate(t.id)}>
                    <TemplatePreview format={qrFormat} template={t.id} active={qrTemplate === t.id} />
                  </DesignCard>
                ))}
              </div>
            </QRSection>

            {/* 3 — Quick tweaks */}
            <QRSection step={3} title="Make it yours">
              <div className="space-y-3.5 rounded-xl border border-[var(--card-border)] p-3.5">
                <div>
                  <span className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">Colour</span>
                  <Segmented
                    options={colourOptions.map(k => ({ id: k, label: COLOURS[k].label }))}
                    value={(activeColour ?? "classic") as ColourKey}
                    onChange={selectColour}
                  />
                  {!activeColour && (
                    <p className="mt-1.5 text-[10px] text-[var(--muted)]">Using your custom colours from Advanced.</p>
                  )}
                </div>

                {isSign ? (
                  <>
                    <div>
                      <span className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">Background</span>
                      <Segmented
                        options={[{ id: "light" as const, label: "Light" }, { id: "dark" as const, label: "Dark" }]}
                        value={signVariant}
                        onChange={setSignVariant}
                      />
                      {signVariant === "dark" && (
                        <p className="mt-1.5 text-[10px] text-[var(--muted)]">
                          The code sits on a light panel so it still scans on a dark sign.
                        </p>
                      )}
                    </div>

                    <div>
                      <span className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">Show at the top</span>
                      <Segmented
                        options={[
                          { id: "logo" as const, label: "Your logo", disabled: !logoUrl },
                          { id: "name" as const, label: "Your name" },
                        ]}
                        value={signBrand}
                        onChange={setSignBrand}
                      />
                      {!logoUrl && (
                        <p className="mt-1.5 text-[10px] text-[var(--muted)]">Upload a logo in Theme &amp; Branding to use it here.</p>
                      )}
                    </div>

                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">Headline</label>
                      <textarea rows={2} value={signHeadline} onChange={e => setSignHeadline(e.target.value)}
                        className="w-full resize-none rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30" />
                      <p className="mt-1 text-[10px] text-[var(--muted)]">First line prints small above the second.</p>
                    </div>
                  </>
                ) : (
                  <>
                    {showHeader && (
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">Restaurant name</label>
                        <input type="text" value={qrHeader} onChange={e => setQrHeader(e.target.value)}
                          className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30" />
                      </div>
                    )}
                    {showTagline && (
                      <div>
                        <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">Tagline</label>
                        <input type="text" value={qrTagline} onChange={e => setQrTagline(e.target.value)}
                          className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30" />
                      </div>
                    )}
                    {logoUrl && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-[var(--foreground)]">Logo in the code</span>
                        <MiniToggle checked={qrIncludeLogo} onChange={setQrIncludeLogo} />
                      </div>
                    )}
                    {!showHeader && !showTagline && !logoUrl && (
                      <p className="text-[11px] text-[var(--muted)]">
                        Nothing to change for this design — it&rsquo;s just the code.
                      </p>
                    )}
                  </>
                )}
              </div>
            </QRSection>

            {/* 4 — Advanced */}
            <details className="group rounded-xl border border-[var(--card-border)]">
              <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                Advanced
                <svg className="h-4 w-4 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </summary>

              <div className="space-y-4 border-t border-[var(--card-border)] px-3.5 py-3.5">
                <div>
                  <span className="mb-2 block text-xs font-medium text-[var(--foreground)]">Custom colours</span>
                  <div className="grid grid-cols-3 gap-3">
                    {([
                      { label: "Code",       value: customQrColor,    set: setCustomQrColor    },
                      { label: "Background", value: customBgColor,    set: setCustomBgColor    },
                      { label: "Text",       value: customFrameColor, set: setCustomFrameColor },
                    ] as { label: string; value: string; set: (v: string) => void }[]).map(({ label, value, set }) => (
                      <div key={label} className="flex flex-col items-center gap-1.5">
                        <div className="relative h-9 w-9">
                          <input type="color" value={value} onChange={e => set(e.target.value)}
                            className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                          <div className="h-9 w-9 rounded-lg border-2 border-gray-200 shadow-sm" style={{ background: value }} />
                        </div>
                        <span className="text-[10px] font-medium leading-tight text-[var(--foreground)]">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-[var(--foreground)]">Font</label>
                  <select value={qrFont} onChange={e => setQrFont(e.target.value as FontKey)}
                    className="w-full rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30">
                    {QR_FONT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                  </select>
                  {isSign && (
                    <p className="mt-1.5 text-[10px] leading-snug text-[var(--muted)]">
                      Chinese, Japanese, Korean, Arabic, Hindi and Punjabi always use a matching script font.
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[var(--foreground)]">Outer border</span>
                  <MiniToggle checked={showBorder} onChange={setShowBorder} />
                </div>

                {fmt.round && (
                  <p className="text-[10px] text-[var(--muted)]">Coasters are cropped to a circle automatically.</p>
                )}
              </div>
            </details>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-[var(--card-border)] bg-[var(--card)] px-5 py-3.5">
          <div className="flex gap-2">
            <button type="button" onClick={handleSaveSettings}
              className="flex-shrink-0 rounded-xl border border-[var(--accent)] bg-transparent px-4 py-2.5 text-sm font-medium text-[var(--accent)] transition-colors hover:bg-[var(--accent)]/10">
              {settingsSaved ? "Saved ✓" : "Save settings"}
            </button>
            <button type="button" onClick={handleDownloadQR} disabled={isDownloading}
              className="flex-1 rounded-xl bg-[var(--accent)] py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50">
              {isDownloading ? "Generating…" : "Download PNG"}
            </button>
          </div>
          <div className="mt-3 rounded-lg border border-[var(--card-border)] bg-[var(--background)] px-3 py-2 sm:hidden">
            <p className="text-center text-xs text-[var(--foreground)]">
              💡 <span className="font-medium">Tip:</span> tap Download then save to Photos or share via Messages.
            </p>
          </div>
        </div>
        <canvas ref={downloadCanvasRef} className="hidden" />
      </div>
    </div>
  );
}

// ── Settings Modal ────────────────────────────────────────────────────────────

// Derived from the canonical language list (app/lib/translations.ts) so this
// dropdown can never offer a "default language" that isn't actually
// translated — it used to be hand-maintained and had drifted: it offered
// ja/de/it/pt before they had real translations, and was missing pa/yue/tl/hi
// which did.
const SETTINGS_LANGUAGES = locales.map((l) => ({ value: l.value, label: l.label }));

// ── Settings sub-components — defined at top level to prevent focus-loss on re-render ──

function MiniToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 ${checked ? "bg-[var(--accent)]" : "bg-gray-300"}`}>
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow ring-0 transition-transform ${checked ? "translate-x-[22px] translate-y-0.5" : "translate-x-0.5 translate-y-0.5"}`} />
    </button>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] divide-y divide-[var(--card-border)] overflow-hidden">{children}</div>
  );
}

function SettingRow({ label, sublabel, children }: { label: string; sublabel?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-[var(--background)] transition-colors">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--foreground)]">{label}</p>
        {sublabel && <p className="text-xs text-[var(--muted)] mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function SettingsModal({
  open, onClose, slug, userEmail, subStatus, trialDaysLeft, cancelAtPeriodEnd, periodEnd, hasStripeSubscription, restaurantId,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  userEmail: string;
  subStatus: string | null;
  trialDaysLeft: number | null;
  cancelAtPeriodEnd: boolean;
  periodEnd: Date | null;
  hasStripeSubscription: boolean;
  restaurantId: string;
}) {
  const supabase = createSupabaseClient();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  const [notifyTrial, setNotifyTrial] = useState(true);
  const [notifyProduct, setNotifyProduct] = useState(false);
  const [defaultLang, setDefaultLang] = useState("en");
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSent, setPwSent] = useState(false);

  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open || loaded) return;
    Promise.all([
      supabase.auth.getUser(),
      supabase.from("restaurants").select("default_language, feedback_enabled").eq("id", restaurantId).maybeSingle(),
    ]).then(([{ data: userData }, { data: restData }]) => {
      if (!userData.user) return;
      const meta = userData.user.user_metadata ?? {};
      const rest = restData as { default_language?: string | null; feedback_enabled?: boolean | null } | null;
      setNotifyTrial(meta.notify_trial_ending ?? true);
      setNotifyProduct(meta.notify_product_updates ?? false);
      setDefaultLang(rest?.default_language ?? "en");
      setFeedbackEnabled(rest?.feedback_enabled ?? true);
      setIsDirty(false);
      setLoaded(true);
    });
  }, [open, loaded, supabase, restaurantId]);

  useEffect(() => { if (!open) setLoaded(false); }, [open]);

  const showMsg = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    const [{ error: authError }, { error: restError }] = await Promise.all([
      supabase.auth.updateUser({
        data: {
          notify_trial_ending: notifyTrial,
          notify_product_updates: notifyProduct,
        },
      }),
      supabase.from("restaurants").update({ default_language: defaultLang, feedback_enabled: feedbackEnabled }).eq("id", restaurantId),
    ]);
    setSaving(false);
    const error = authError ?? restError;
    if (error) showMsg("err", friendlyErrorMessage(error));
    else { showMsg("ok", "Settings saved."); setIsDirty(false); }
  };

  const handleClose = () => {
    if (isDirty) { setShowDiscardConfirm(true); } else { onClose(); }
  };

  const handleSaveAndClose = async () => {
    await handleSave();
    setShowDiscardConfirm(false);
    onClose();
  };

  const handleDiscard = () => {
    setShowDiscardConfirm(false);
    setIsDirty(false);
    onClose();
  };

  const sendPasswordReset = async () => {
    if (typeof window === "undefined") return;
    setPwLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setPwLoading(false);
    if (error) showMsg("err", friendlyErrorMessage(error));
    else { setPwSent(true); showMsg("ok", "Password reset email sent — check your inbox."); }
  };

  const signOutAll = async () => {
    await supabase.auth.signOut({ scope: "global" });
    router.push("/login");
  };

  const openPortal = async () => {
    const res = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantSlug: slug }),
    });
    const data = await res.json();
    if (data.url) {
      window.open(data.url, "_blank");
    } else if (data.redirect_to_checkout) {
      const res2 = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantSlug: slug }),
      });
      const data2 = await res2.json();
      if (data2.url) window.location.href = data2.url;
    } else {
      alert(data.error ?? "Unable to open billing. Email hello@dinelinks.com");
    }
  };

  const openCheckout = async () => {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ restaurantSlug: slug }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  const planLabel = (() => {
    if (!subStatus || subStatus === "none") return "No active plan";
    if (subStatus === "trialing") {
      const left = trialDaysLeft !== null && trialDaysLeft > 0
        ? `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
        : "Free trial — expired";
      // Subscribed mid-trial: real subscription, billing starts when the trial ends.
      return hasStripeSubscription ? `${left} · Subscribed` : left;
    }
    if (subStatus === "active" && cancelAtPeriodEnd && periodEnd)
      return `DineLinks Monthly — Cancels on ${periodEnd.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}`;
    if (subStatus === "active") return "DineLinks Monthly — Active";
    if (subStatus === "past_due") return "DineLinks Monthly — Payment past due";
    if (subStatus === "canceled") return "No active plan";
    return subStatus;
  })();

  const sectionHeader = (label: string) => (
    <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">{label}</h2>
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      style={{ animation: "fadeIn 0.15s ease-out" }}
      onClick={handleClose}>
      <div className="flex flex-col w-full max-w-lg md:max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--card)] shadow-2xl"
        style={{ animation: "modalIn 0.15s ease-out" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex-shrink-0 bg-[var(--card)] border-b border-[var(--card-border)] px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Account settings</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">These settings apply to your DineLinks account, not your menu.</p>
          </div>
          <button type="button" onClick={handleClose} className="text-[var(--muted)] hover:text-[var(--foreground)] p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Toast */}
        {msg && (
          <div className={`flex-shrink-0 px-5 py-2.5 text-center text-sm font-medium text-white ${msg.type === "ok" ? "bg-green-600" : "bg-red-600"}`}>
            {msg.text}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">

          {/* ACCOUNT */}
          <section>
            {sectionHeader("Account")}
            <SectionCard>
              <SettingRow label="Email" sublabel="Your login email address">
                <span className="text-sm text-[var(--muted)] font-mono">{userEmail}</span>
              </SettingRow>
            </SectionCard>
          </section>

          {/* SECURITY */}
          <section>
            {sectionHeader("Security")}
            <SectionCard>
              <SettingRow label="Change password" sublabel="We'll email you a reset link">
                <button type="button" onClick={sendPasswordReset} disabled={pwLoading || pwSent}
                  className="px-4 py-2 text-sm font-medium border border-[var(--card-border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--background)] transition-colors disabled:opacity-50">
                  {pwSent ? "Email sent ✓" : pwLoading ? "Sending…" : "Send reset email"}
                </button>
              </SettingRow>
              <SettingRow label="Sign out everywhere" sublabel="Ends all active sessions on all devices">
                <button type="button" onClick={signOutAll}
                  className="px-4 py-2 text-sm font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                  Sign out all
                </button>
              </SettingRow>
            </SectionCard>
          </section>

          {/* NOTIFICATIONS */}
          <section>
            {sectionHeader("Notifications")}
            <SectionCard>
              <SettingRow label="Trial ending reminders" sublabel="Emails when your trial is about to expire">
                <MiniToggle checked={notifyTrial} onChange={(v) => { setNotifyTrial(v); setIsDirty(true); }} />
              </SettingRow>
              <SettingRow label="Product updates" sublabel="New features and announcements from DineLinks (opt-in)">
                <MiniToggle checked={notifyProduct} onChange={(v) => { setNotifyProduct(v); setIsDirty(true); }} />
              </SettingRow>
            </SectionCard>
          </section>

          {/* BILLING */}
          <section>
            {sectionHeader("Billing")}
            <SectionCard>
              <SettingRow label="Current plan" sublabel={planLabel}>
                {(!subStatus || subStatus === "none" || (subStatus === "trialing" && !hasStripeSubscription)) ? (
                  <button type="button" onClick={openCheckout}
                    className="px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity">
                    DineLinks Monthly — $25 CAD/mo
                  </button>
                ) : (subStatus === "trialing" && hasStripeSubscription) ? (
                  <button type="button" onClick={openPortal}
                    className="px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity">
                    Manage subscription
                  </button>
                ) : subStatus === "active" && cancelAtPeriodEnd ? (
                  <button type="button" onClick={openPortal}
                    className="px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity">
                    Resubscribe
                  </button>
                ) : subStatus === "active" ? (
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-semibold text-green-600">DineLinks Monthly — Active ✓</span>
                    <button type="button" onClick={openPortal}
                      className="px-4 py-2 text-sm font-medium bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      Cancel subscription
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={openCheckout}
                    className="px-4 py-2 text-sm font-semibold bg-[var(--accent)] text-white rounded-lg hover:opacity-90 transition-opacity">
                    DineLinks Monthly — $25 CAD/mo
                  </button>
                )}
              </SettingRow>
              {subStatus === "active" && !cancelAtPeriodEnd && (
                <div className="px-4 py-2 text-xs text-[var(--muted)]">Your plan will remain active until the end of your current billing period. You can resubscribe anytime.</div>
              )}
              {subStatus === "active" && cancelAtPeriodEnd && periodEnd && (
                <div className="px-4 py-2 text-xs text-[var(--muted)]">Cancels on {periodEnd.toLocaleDateString("en-CA", { month: "short", day: "numeric", year: "numeric" })}.</div>
              )}
              <SettingRow label="Invoices" sublabel="View and download past invoices">
                {(!subStatus || subStatus === "none" || (subStatus === "trialing" && !hasStripeSubscription)) ? (
                  <span className="text-xs text-[var(--muted)] italic">No invoices yet — invoices appear after your first payment.</span>
                ) : (
                  <button type="button" onClick={openPortal}
                    className="px-4 py-2 text-sm font-medium border border-[var(--card-border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--background)] transition-colors">
                    View invoices
                  </button>
                )}
              </SettingRow>
            </SectionCard>
          </section>

          {/* PREFERENCES */}
          <section>
            {sectionHeader("Preferences")}
            <SectionCard>
              <div className="px-4 py-3.5">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Default menu language</label>
                <p className="text-xs text-[var(--muted)] mb-2">The language shown first when customers open your menu.</p>
                <select value={defaultLang} onChange={(e) => { setDefaultLang(e.target.value); setIsDirty(true); }}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                  {SETTINGS_LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
              </div>
              <SettingRow label="Enable guest feedback" sublabel="Let guests leave ratings and comments from your menu. View responses in Analytics.">
                <MiniToggle checked={feedbackEnabled} onChange={(v) => { setFeedbackEnabled(v); setIsDirty(true); }} />
              </SettingRow>
            </SectionCard>
          </section>

          {/* DANGER ZONE */}
          <section>
            <AccountDangerZone />
          </section>

        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-[var(--card-border)] px-6 py-4 bg-[var(--card)]">
          <div className="flex gap-3 justify-end">
            <button type="button" onClick={onClose}
              className="font-sans px-5 h-10 rounded-lg border border-[var(--card-border)] text-[var(--muted)] text-sm hover:bg-[var(--card-border)]/30">
              Cancel
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="font-sans px-5 h-10 rounded-xl bg-[var(--accent)] text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Unsaved changes confirmation */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
            <h3 className="text-base font-semibold text-[#2c2a26] mb-2">You have unsaved changes.</h3>
            <p className="text-sm text-[#6b6560] mb-5">Save before closing?</p>
            <div className="flex gap-2">
              <button type="button" onClick={handleDiscard}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                Discard
              </button>
              <button type="button" onClick={() => setShowDiscardConfirm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                Cancel
              </button>
              <button type="button" onClick={handleSaveAndClose} disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                Save & close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
