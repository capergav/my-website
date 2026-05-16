"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "motion/react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { createSupabaseClient } from "@/app/lib/supabase";
import { CATEGORY_ORDER } from "@/app/lib/constants";
import type { MenuItemRow } from "@/app/lib/constants";
import type { Restaurant } from "@/app/lib/supabase";
import { ImageUploader } from "./ImageUploader";
import { OnboardingTour } from "./OnboardingTour";
import { useSubscription, type SubStatus } from "@/lib/useSubscription";
import { CreditCard, AlertTriangle, AlertCircle, Plus, GripVertical, UtensilsCrossed, ChevronLeft, ChevronRight } from "lucide-react";
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
    mutedColor: "#6b6b6b",
    fontFamily: "sans",
  },
  {
    name: "Old World",
    description: "Heritage steakhouse",
    background: "#1f1d1a",
    main: "#2a2723",
    accent: "#c89a4e",
    fontColor: "#f4ede0",
    mutedColor: "#a8a39c",
    fontFamily: "playfair",
  },
  {
    name: "Wine Cellar",
    description: "Sommelier picks",
    background: "#1f1015",
    main: "#2c1820",
    accent: "#c9a55a",
    fontColor: "#f4e8d8",
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
    mutedColor: "#7a6f65",
    fontFamily: "pacifico",
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


function SortableMenuItem({ item, children }: { item: MenuItemRow; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
    boxShadow: isDragging ? '0 10px 25px -5px rgba(139, 105, 20, 0.35)' : undefined,
    scale: isDragging ? '1.02' : undefined,
    position: 'relative',
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="flex items-stretch">
      <div
        {...listeners}
        className="flex-shrink-0 w-9 flex flex-col items-center justify-center gap-0.5 cursor-grab active:cursor-grabbing touch-none z-10 rounded-l-xl bg-[var(--card-border)]/30 hover:bg-[var(--main-color)]/10 group transition-colors admin-drag-handle"
        title="Drag to reorder"
      >
        <GripVertical size={18} className="text-[var(--muted)] group-hover:text-[var(--main-color)] transition-colors" />
        <span className="text-[8px] text-[var(--muted)] group-hover:text-[var(--main-color)] opacity-0 group-hover:opacity-100 transition-opacity font-medium leading-none">Drag</span>
      </div>
      <div className="flex-1 min-w-0">{children}</div>
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
      className="cursor-grab active:cursor-grabbing touch-none flex-shrink-0"
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
  initialAllCategories: string[];
  initialRestaurant: Restaurant | null;
  initialCategoryNotes: Record<string, string>;
};

export function AdminMenuEditor({
  restaurantId,
  restaurantSlug,
  initialGrouped,
  initialSortedCategories,
  initialAllCategories,
  initialRestaurant,
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
  const [sortedCategories, setSortedCategories] = useState(initialAllCategories.length > 0 ? initialAllCategories : initialSortedCategories);
  const [activeCategory, setActiveCategory]     = useState((initialAllCategories[0] ?? initialSortedCategories[0]) ?? "");
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
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showManageModal, setShowManageModal]     = useState(false);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [hasCompletedTour, setHasCompletedTour] = useState(true); // default true: don't flash tour before we know
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  const tabScrollRef = useRef<HTMLDivElement>(null);
  const [adminCanScrollLeft, setAdminCanScrollLeft] = useState(false);
  const [adminCanScrollRight, setAdminCanScrollRight] = useState(false);
  const adminTabDragRef = useRef({ active: false, startX: 0, scrollLeft: 0, didDrag: false });

  const refreshMenuRef = useRef<(() => Promise<void>) | null>(null);

  // Sync CSS variables immediately when restaurant state changes (e.g. after theme save)
  useEffect(() => {
    if (!restaurant || typeof document === "undefined") return;
    const root = document.documentElement;
    if (restaurant.font_color)        root.style.setProperty("--foreground", restaurant.font_color);
    if (restaurant.accent_color)      root.style.setProperty("--accent",     restaurant.accent_color);
    if (restaurant.background_color)  root.style.setProperty("--background", restaurant.background_color);
    if (restaurant.main_color)        root.style.setProperty("--card",       restaurant.main_color);
    if (restaurant.muted_color)       root.style.setProperty("--muted",      restaurant.muted_color);
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
          await supabase.from('restaurant_categories').upsert(
            { restaurant_id: restaurantId, name: 'Mains', sort_order: 0 },
            { onConflict: 'restaurant_id,name' }
          );
          await supabase.from('menu_items').insert({
            restaurant_id: restaurantId,
            name: 'Sample Dish',
            description: 'Feel free to edit or delete this item and add your real menu.',
            price: 0,
            category: 'Mains',
            available: true,
            sort_order: 0,
          });
          // refreshMenu is assigned after this effect runs; call via ref
          refreshMenuRef.current?.();
        })();
      }
    });
  }, [supabase, restaurantId, initialGrouped]);

  const { status: subStatus, isActive, daysLeftInTrial, isTrialExpired, cancelAtPeriodEnd, periodEnd } = useSubscription(user?.id);

  const startCheckout = async () => {
    if (!user) return;
    setCheckoutLoading(true);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, userEmail: user.email, restaurantSlug }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } finally { setCheckoutLoading(false); }
  };

  const openPortal = async () => {
    if (!user) return;
    setPortalLoading(true);
    try {
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, restaurantSlug }),
      });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
      else if (data.error === 'No subscription found') startCheckout();
    } finally {
      setPortalLoading(false);
    }
  };

  const handleBilling = () => {
    if (subStatus === 'active') {
      openPortal();
    } else {
      startCheckout();
    }
  };

  const billingLabel = subStatus === 'active'
    ? (cancelAtPeriodEnd ? 'Resubscribe' : 'Manage subscription')
    : 'Subscribe';

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
      setMessage({ type: 'ok', text: "You're subscribed! Welcome to DineLinks Pro." });
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
        .from("restaurant_categories").select("name")
        .eq("restaurant_id", restaurantId)
        .order("sort_order", { ascending: true }),
    ]);
    if (itemsResult.error) { showMsg("err", itemsResult.error.message); return; }
    const g: Grouped = {};
    (itemsResult.data ?? []).forEach((row) => {
      const cat = (row as MenuItemRow).category || "Other";
      if (!g[cat]) g[cat] = [];
      g[cat].push(row as MenuItemRow);
    });
    const dbCats = (catsResult.data ?? []).map((r: { name: string }) => r.name);
    const orphanCats = Object.keys(g).filter((c) => !dbCats.includes(c));
    const sorted = [...dbCats, ...orphanCats];
    setGrouped(g);
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
  }, [updateAdminScrollState, sortedCategories]);

  const adminScrollLeft = () => tabScrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' });
  const adminScrollRight = () => tabScrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' });

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
      if (error) showMsg("err", error.message);
      else { showMsg("ok", "Item updated."); setEditingItem(null); await refreshMenu(); }
    } else {
      const catItems = (payload.category && grouped[payload.category]) ? grouped[payload.category] : [];
      const { error } = await supabase.from("menu_items").insert({
        ...payload, restaurant_id: restaurantId, sort_order: catItems.length,
      });
      if (error) showMsg("err", error.message);
      else { showMsg("ok", "Item added."); setAddingNew(false); await refreshMenu(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, imageUrl?: string | null) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    if (imageUrl) await deleteStorageImage(imageUrl);
    setSaving(true);
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) showMsg("err", error.message);
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
    if (error) { showMsg("err", error.message); }
    else { setRestaurant(p => p ? { ...p, ...updates } : null); showMsg("ok", "Theme saved."); }
    setSaving(false);
  };

  const handleSaveCategoryNote = async (category: string, note: string) => {
    setSavingNote(true);
    const { error } = await supabase.from("category_notes").upsert(
      { restaurant_id: restaurantId, category, note: note.trim() || null },
      { onConflict: "restaurant_id,category" }
    );
    if (error) showMsg("err", error.message);
    else { setCategoryNotes((p) => ({ ...p, [category]: note.trim() })); showMsg("ok", "Note saved."); }
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

  const handleCategoryDragEnd = useCallback(async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const cats = [...sortedCategories];
    const oldIndex = cats.indexOf(active.id as string);
    const newIndex = cats.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(cats, oldIndex, newIndex);
    setSortedCategories(reordered);
    // Persist sort order — upsert so inferred categories are inserted too
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('restaurant_categories')
        .upsert({ restaurant_id: restaurantId, name: reordered[i], sort_order: i }, { onConflict: 'restaurant_id,name' });
    }
  }, [sortedCategories, restaurantId, supabase]);

  const items   = grouped[activeCategory] ?? [];
  const isEmpty = sortedCategories.length === 0;

  // Show "start trial" blocker ONLY when the trial has fully expired (daysLeftInTrial === 0).
  // Never show during an active trial, loading, or on navigation (avoids flash when userId
  // is briefly undefined and subStatus transiently reads 'none').
  const trialFullyExpired = daysLeftInTrial !== null && daysLeftInTrial <= 0;
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
            Get full access to DineLinks for 2 months free, then $25 CAD/month. Cancel anytime.
          </p>
          <button onClick={startCheckout} disabled={checkoutLoading}
            className="w-full bg-[var(--main-color,#8b6914)] text-white font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50">
            {checkoutLoading ? 'Loading...' : 'Start 2 months free'}
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

  const showTrialExpiredOverlay = subStatus !== 'loading' && (isTrialExpired || subStatus === 'canceled');

  return (
    <main className={`min-h-screen bg-[var(--background)] text-[var(--foreground)] ${showTrialExpiredOverlay ? 'pointer-events-none grayscale opacity-60' : ''}`}>

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

        {/* Mobile: single hamburger button */}
        <div className="sm:hidden absolute top-3 end-3 z-20">
          <button
            data-tour="hamburger"
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
          {(subStatus === 'trialing' || subStatus === 'active' || subStatus === 'canceled') && (
            <BillingPill
              subStatus={subStatus}
              daysLeft={daysLeftInTrial}
              cancelAtPeriodEnd={cancelAtPeriodEnd}
              periodEnd={periodEnd}
              onCheckout={startCheckout}
              onPortal={openPortal}
              loading={checkoutLoading || portalLoading}
            />
          )}
          <AdminMenuPanel
            onOpenTheme={() => setThemeOpen(true)}
            onReplayTour={() => setTourKey((k) => k + 1)}
            onSignOut={handleSignOut}
            onOpenQR={() => setShowQR(true)}
            onOpenSettings={() => setSettingsOpen(true)}
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
              className="h-10 w-10 object-contain drop-shadow-md mb-1.5"
              style={{ background: "transparent" }} />
          )}
          <p className="text-white/50 text-[10px] font-semibold uppercase tracking-widest">Admin Panel</p>
          <h1 className="font-serif text-xl font-semibold text-white drop-shadow-md">
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
          <h1 data-tour="tour-restaurant-name" className="font-serif text-3xl font-semibold text-white drop-shadow-md">
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
              tourTarget="theme-btn-mobile" />
            <button type="button" onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; handleBilling(); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-medium">
              <CreditCard size={16} className="text-gray-500" />
              {billingLabel}
            </button>
            <a href={`/admin/${restaurantSlug}/analytics`}
              onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-medium">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Analytics
            </a>
            <button data-tour="qr-btn" type="button" onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; setShowQR(true); }}
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
          <button type="button" onClick={() => setShowCategoryModal(true)}
            className="mt-6 bg-[var(--accent)] text-white font-semibold rounded-xl px-6 py-3 hover:opacity-90 transition-opacity flex items-center gap-2">
            <Plus size={16} /> Add first category
          </button>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* Category tabs — draggable + clickable */}
          <div data-tour="tour-categories" className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--card-border)] shadow-sm">
            <div className="relative max-w-4xl mx-auto px-3 sm:px-6">
              {adminCanScrollLeft && (
                <button type="button" onClick={adminScrollLeft}
                  className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 items-center justify-center rounded-full bg-[var(--card)] border border-[var(--card-border)] shadow-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  <ChevronLeft size={14} />
                </button>
              )}
              {adminCanScrollRight && (
                <button type="button" onClick={adminScrollRight}
                  className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 items-center justify-center rounded-full bg-[var(--card)] border border-[var(--card-border)] shadow-sm text-[var(--muted)] hover:text-[var(--foreground)] transition-colors">
                  <ChevronRight size={14} />
                </button>
              )}
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleCategoryDragEnd}>
                <SortableContext items={sortedCategories} strategy={horizontalListSortingStrategy}>
                  <div
                    ref={tabScrollRef}
                    onScroll={updateAdminScrollState}
                    className="tabs-scroll flex gap-2 overflow-x-auto py-3 scrollbar-none px-1 items-center"
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
                    {sortedCategories.map((cat) => (
                      <SortableCategoryTab key={cat} name={cat}>
                        <button
                          type="button"
                          onPointerDown={(e) => e.stopPropagation()}
                          onClick={() => {
                            if (adminTabDragRef.current.didDrag) { adminTabDragRef.current.didDrag = false; return; }
                            setActiveCategory(cat);
                          }}
                          className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all select-none font-sans ${
                            activeCategory === cat
                              ? "bg-[var(--accent)] text-white shadow-sm"
                              : "bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                          }`}>
                          {cat}
                        </button>
                      </SortableCategoryTab>
                    ))}
                    <button
                      data-tour="add-category"
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => setShowCategoryModal(true)}
                      className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold font-sans text-[var(--accent)] border-2 border-dashed border-[var(--accent)]/30 rounded-xl px-3 py-1.5 hover:bg-[var(--accent)]/5 transition-colors">
                      <Plus size={14} /> Add category
                    </button>
                    <button
                      type="button"
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={() => setShowManageModal(true)}
                      className="flex-shrink-0 flex items-center gap-1 text-xs font-semibold font-sans text-[var(--muted)] border border-[var(--card-border)] rounded-xl px-3 py-1.5 hover:text-[var(--foreground)] hover:border-[var(--foreground)]/30 transition-colors"
                      title="Manage categories"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Manage
                    </button>
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          </div>

          <div data-tour="menu-area" className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold">{activeCategory}</h2>
              <motion.button data-tour="tour-add-item" type="button"
                onClick={() => { setAddingNew(true); setEditingItem(null); }}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
                whileTap={{ scale: 0.96 }}
                transition={{ duration: 0.1 }}
              >
                + Add item to {activeCategory.length > 20 ? activeCategory.slice(0, 20) + "…" : activeCategory}
              </motion.button>
            </div>

            <CategoryNoteEditor
              category={activeCategory}
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
                          &ldquo;{activeCategory}&rdquo;
                        </span>
                        {" "}— click &ldquo;+ Add item&rdquo; to get started.
                      </p>
                    </div>
                  )}
                  {items.map((item, idx) => (
                    <SortableMenuItem key={item.id} item={item}>
                      <motion.div
                        className={`bg-[var(--card)] rounded-2xl border border-[var(--card-border)] overflow-visible shadow-sm ${
                          item.available === false ? "opacity-50" : ""
                        }`}
                        whileHover={{ y: -2, boxShadow: '0 6px 20px -4px rgba(0,0,0,0.12)', borderColor: 'var(--main-color)' }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-stretch">
                          {/* Item image */}
                          {item.image_url && (
                            <div className="w-24 sm:w-32 aspect-square overflow-hidden bg-[var(--card-border)] flex-shrink-0">
                              <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                            </div>
                          )}

                          {/* Details */}
                          <div className="p-3 sm:p-4 flex-1 min-w-0">
                            <div className="flex justify-between gap-2 items-start flex-wrap">
                              <div className="min-w-0">
                                <h3 className="font-serif text-base font-semibold leading-snug text-wrap-balance">{item.name}</h3>
                                {item.available === false && (
                                  <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700 mt-0.5">
                                    Unavailable
                                  </span>
                                )}
                              </div>
                              <span className="font-semibold text-[var(--accent)] tabular-nums text-base flex-shrink-0">
                                {Number.isInteger(Number(item.price)) ? `$${Number(item.price)}` : `$${Number(item.price).toFixed(2)}`}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-[var(--muted)] text-xs sm:text-sm mt-1 line-clamp-2 text-wrap-force">
                                {item.description}
                              </p>
                            )}
                            <div className="flex flex-wrap gap-1.5 mt-2 items-center">
                              <span data-tour="availability-toggle">
                              <AvailabilityToggle
                                available={item.available !== false}
                                onChange={async (next) => {
                                  setSaving(true);
                                  const { error } = await supabase.from("menu_items")
                                    .update({ available: next }).eq("id", item.id);
                                  if (error) showMsg("err", error.message);
                                  else { showMsg("ok", next ? "Marked available." : "Marked unavailable."); await refreshMenu(); }
                                  setSaving(false);
                                }}
                              />
                              </span>
                              <motion.button type="button"
                                onClick={() => { setEditingItem(item); setAddingNew(false); }}
                                className="px-3 py-1.5 rounded-lg border border-[var(--accent)] text-[var(--accent)] text-xs font-semibold font-sans hover:bg-[var(--accent)] hover:text-white transition-all"
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.08 }}
                              >
                                Edit
                              </motion.button>
                              <motion.button type="button"
                                onClick={() => handleDelete(item.id, item.image_url)}
                                disabled={saving}
                                className="px-2 py-1.5 text-[var(--muted)] hover:text-red-600 text-xs font-sans disabled:opacity-50 transition-colors"
                                whileTap={{ scale: 0.95 }}
                                transition={{ duration: 0.08 }}
                              >
                                Delete
                              </motion.button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    </SortableMenuItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </>
      )}

      {(editingItem || addingNew) && (
        <ItemForm
          item={editingItem ?? undefined}
          categories={sortedCategories}
          restaurantSlug={restaurantSlug}
          onSave={handleSaveItem}
          onCancel={() => { setEditingItem(null); setAddingNew(false); }}
          saving={saving}
          existingImageUrl={editingItem?.image_url ?? undefined}
          initialCategory={addingNew ? activeCategory : undefined}
        />
      )}

      <OnboardingTour tourKey={tourKey} hasCompletedTour={hasCompletedTour} userId={user?.id} />

      {/* Settings Modal */}
      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        slug={restaurantSlug}
        userEmail={user?.email ?? ""}
        subStatus={subStatus}
        trialDaysLeft={daysLeftInTrial}
      />

      {/* QR Code Modal */}
      {showQR && (
        <QRModal
          slug={restaurantSlug}
          restaurant={restaurant}
          onClose={() => setShowQR(false)}
        />
      )}

      {/* Add Category Modal */}
      {showCategoryModal && (
        <AddCategoryModal
          restaurantId={restaurantId}
          existingCategories={sortedCategories}
          onCreated={async (name) => {
            setShowCategoryModal(false);
            await refreshMenu();
            setActiveCategory(name);
          }}
          onClose={() => setShowCategoryModal(false)}
        />
      )}

      {/* Manage Categories Modal */}
      {showManageModal && (
        <ManageCategoriesModal
          restaurantId={restaurantId}
          categories={sortedCategories}
          grouped={grouped}
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
          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
      }`}>
      <span className={`inline-block w-1.5 h-1.5 rounded-full ${available ? "bg-emerald-500" : "bg-gray-400"}`} />
      {available ? "Available" : "Unavailable"}
    </button>
  );
}

function CategoryNoteEditor({
  category, initialNote, onSave, saving,
}: { category: string; initialNote: string; onSave: (cat: string, note: string) => void; saving: boolean }) {
  const [note, setNote] = useState(initialNote);
  useEffect(() => { setNote(initialNote); }, [initialNote]);
  return (
    <div className="mb-5 p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      <label className="block text-xs font-sans font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
        Note for &ldquo;{category}&rdquo;
      </label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)}
        placeholder={`Optional note for "${category}" — e.g. "All ${category.toLowerCase()} served hot"`}
        rows={2}
        className="font-sans w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
      <button type="button" onClick={() => onSave(category, note)} disabled={saving}
        className="font-sans mt-2 px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
        {saving ? "Saving…" : "Save note"}
      </button>
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
          <div className="flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--card)] shadow-2xl"
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
                  <span className="text-[10px] font-bold truncate" style={{ color: fontColor }}>{name || "Your Restaurant"}</span>
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
                <div className="grid grid-cols-2 gap-2">
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
                    <div className="grid grid-cols-2 gap-3">
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
              <button type="button" onClick={save} disabled={saving}
                className="font-sans w-full py-3.5 rounded-xl bg-[var(--accent)] text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity shadow-sm">
                {saving ? "Saving…" : "Save theme"}
              </button>
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
  restaurantSlug,
}: {
  onOpenTheme: () => void;
  onReplayTour: () => void;
  onSignOut: () => void;
  onOpenQR: () => void;
  onOpenSettings: () => void;
  restaurantSlug: string;
}) {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState<{ top: number; right: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
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
          style={{ position: "fixed", top: dropPos.top, right: dropPos.right }}
          className="w-64 rounded-xl bg-white border border-[#e8e4dd] shadow-2xl z-[100] max-h-[80vh] overflow-y-auto"
        >
          <button
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
            data-tour="qr-btn"
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

function BillingPill({
  subStatus, daysLeft, cancelAtPeriodEnd, periodEnd, onCheckout, onPortal, loading,
}: {
  subStatus: SubStatus;
  daysLeft: number | null;
  cancelAtPeriodEnd: boolean;
  periodEnd: Date | null;
  onCheckout: () => void;
  onPortal: () => void;
  loading: boolean;
}) {
  const isTrialingExpired = subStatus === 'trialing' && daysLeft !== null && daysLeft <= 0;
  const isUrgentTrial = subStatus === 'trialing' && daysLeft !== null && daysLeft <= 7 && !isTrialingExpired;

  let label: string;
  let onClick: () => void;
  let pillCls: string;

  if (subStatus === 'active' && !cancelAtPeriodEnd) {
    label = 'Manage subscription';
    onClick = onPortal;
    pillCls = 'bg-[var(--card)] border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--accent)]/40';
  } else if (subStatus === 'active' && cancelAtPeriodEnd) {
    const dateStr = periodEnd
      ? periodEnd.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' })
      : '';
    label = `Resubscribe${dateStr ? ` — ends ${dateStr}` : ''}`;
    onClick = onPortal;
    pillCls = 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100';
  } else if (subStatus === 'canceled' || isTrialingExpired) {
    label = 'Subscribe to continue — $25 CAD/mo';
    onClick = onCheckout;
    pillCls = 'bg-red-600 border-transparent text-white hover:opacity-90';
  } else {
    // trialing (not expired)
    label = daysLeft !== null ? `${daysLeft}d left — Subscribe $25 CAD/mo` : 'Subscribe — $25 CAD/mo';
    onClick = onCheckout;
    pillCls = 'bg-[var(--accent)] border-transparent text-white hover:opacity-90';
  }

  const ring = isUrgentTrial ? 'ring-1 ring-offset-2 ring-offset-[var(--background)] ring-[var(--accent)]' : '';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`min-h-[44px] px-3.5 py-2 rounded-xl ${pillCls} ${ring} font-medium text-sm border inline-flex items-center gap-2 disabled:opacity-60 transition-opacity`}
    >
      {subStatus === 'trialing' && !isTrialingExpired && (
        <span className="relative flex h-2 w-2 flex-shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
        </span>
      )}
      <span>{loading ? 'Redirecting…' : label}</span>
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

function ItemForm({
  item, categories, restaurantSlug, onSave, onCancel, saving, existingImageUrl, initialCategory,
}: {
  item?: MenuItemRow; categories: readonly string[]; restaurantSlug: string;
  onSave: (p: Partial<MenuItemRow>) => void; onCancel: () => void; saving: boolean;
  existingImageUrl?: string; initialCategory?: string;
}) {
  const [name, setName]               = useState(item?.name ?? "");
  const [desc, setDesc]               = useState(item?.description ?? "");
  const [price, setPrice]             = useState(item != null ? String(Number(item.price)) : "");
  const [priceSuffix, setPriceSuffix] = useState(item?.price_suffix ?? "");
  const [imgUrl, setImgUrl]           = useState(item?.image_url ?? "");
  const [category, setCategory]       = useState(item?.category ?? initialCategory ?? "");
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
      image_url: imgUrl.trim() || null, category: category || "Other",
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
                    {categories.map((c) => <option key={c} value={c}>{c}</option>)}
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
  existingCategories,
  onCreated,
  onClose,
}: {
  restaurantId: string;
  existingCategories: string[];
  onCreated: (name: string) => void;
  onClose: () => void;
}) {
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
    if (existingCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setError("That category already exists.");
      return;
    }
    setSaving(true);
    const maxOrder = existingCategories.length;
    await supabase
      .from("restaurant_categories")
      .upsert({ restaurant_id: restaurantId, name: trimmed, sort_order: maxOrder, show_image: showImage }, { onConflict: "restaurant_id,name" });
    setSaving(false);
    onCreated(trimmed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" style={{ animation: "fadeIn 0.15s ease-out" }}>
      <div className="bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-sm p-6" style={{ animation: "modalIn 0.15s ease-out" }}>
        <h3 className="font-serif text-lg font-semibold text-[var(--foreground)] mb-4">Add category</h3>
        <form onSubmit={create} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold font-sans uppercase tracking-widest text-[var(--muted)] mb-1.5">Category name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(""); }}
              placeholder="e.g. Desserts"
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
  name, itemCount, showImage, imageMode, bannerItemId, categoryItems, onDelete, onSelectImageMode, isDeleting, onRename,
}: {
  name: string;
  itemCount: number;
  showImage: boolean;
  imageMode: string | null;
  bannerItemId: string | null;
  categoryItems: MenuItemRow[];
  onDelete: () => void;
  onSelectImageMode: (mode: 'icon' | 'item', itemId: string | null) => void;
  isDeleting: boolean;
  onRename: (oldName: string, newName: string) => Promise<void>;
}) {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: name });
  const itemsWithImages = categoryItems.filter((i) => i.image_url);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }}
      className="rounded-xl border border-[var(--card-border)] bg-[var(--background)] overflow-hidden"
    >
      <div className="flex items-center gap-3 p-3">
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
                  if (e.key === 'Enter') { e.preventDefault(); const t = renameValue.trim(); if (t && t !== name) onRename(name, t); setIsRenaming(false); }
                  if (e.key === 'Escape') { setIsRenaming(false); setRenameValue(name); }
                }}
                autoFocus
                className="flex-1 min-w-0 text-sm font-medium border-b border-[var(--accent)] bg-transparent text-[var(--foreground)] focus:outline-none py-0.5"
              />
              <button type="button"
                onClick={() => { const t = renameValue.trim(); if (t && t !== name) onRename(name, t); setIsRenaming(false); }}
                className="flex-shrink-0 p-0.5 text-[var(--accent)] hover:opacity-70 transition-opacity" title="Save">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1 group/rename">
              <p className="text-sm font-medium text-[var(--foreground)] truncate">{name}</p>
              <button type="button"
                onClick={() => { setIsRenaming(true); setRenameValue(name); }}
                className="opacity-0 group-hover/rename:opacity-100 flex-shrink-0 p-0.5 text-[var(--muted)] hover:text-[var(--foreground)] transition-opacity" title="Rename">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
          )}
          <p className="text-xs text-[var(--muted)]">{itemCount} item{itemCount !== 1 ? 's' : ''}</p>
        </div>
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
            title="Delete category"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
      {/* Image mode picker — only shown when show_image is ON */}
      {showImage && (
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
  restaurantId, categories, grouped, onClose, onUpdated,
}: {
  restaurantId: string;
  categories: string[];
  grouped: Grouped;
  onClose: () => void;
  onUpdated: (newCats: string[]) => Promise<void>;
}) {
  const [cats, setCats] = useState(categories);
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
      .select('name, show_image, image_mode, banner_item_id')
      .eq('restaurant_id', restaurantId)
      .then(({ data }) => {
        if (data) {
          const showMap: Record<string, boolean> = {};
          const modeMap: Record<string, string | null> = {};
          const itemMap: Record<string, string | null> = {};
          for (const row of data as { name: string; show_image: boolean | null; image_mode: string | null; banner_item_id: string | null }[]) {
            showMap[row.name] = row.show_image ?? false;
            modeMap[row.name] = row.image_mode ?? null;
            itemMap[row.name] = row.banner_item_id ?? null;
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

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = cats.indexOf(active.id as string);
    const newIndex = cats.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(cats, oldIndex, newIndex);
    setCats(reordered);
    setBusy(true);
    for (let i = 0; i < reordered.length; i++) {
      await supabase.from('restaurant_categories')
        .upsert({ restaurant_id: restaurantId, name: reordered[i], sort_order: i }, { onConflict: 'restaurant_id,name' });
    }
    setBusy(false);
  };

  const handleDelete = async (catName: string) => {
    const itemsInCat = grouped[catName] ?? [];
    if (itemsInCat.length > 0) {
      const confirmed = confirm(
        `This will unassign ${itemsInCat.length} item${itemsInCat.length > 1 ? 's' : ''} from "${catName}". They will still exist but won't appear in any tab until reassigned. Continue?`
      );
      if (!confirmed) return;
    }
    setDeletingCats(prev => { const next = new Set(prev); next.add(catName); return next; });
    setDeleteError(null);
    if (itemsInCat.length > 0) {
      await supabase.from('menu_items').update({ category: null }).in('id', itemsInCat.map((i) => i.id));
    }
    const { error } = await supabase.from('restaurant_categories')
      .delete().eq('restaurant_id', restaurantId).eq('name', catName);
    setDeletingCats(prev => { const next = new Set(prev); next.delete(catName); return next; });
    if (error) { setDeleteError(`Failed to delete "${catName}". Please try again.`); return; }
    const newCats = cats.filter((c) => c !== catName);
    setCats(newCats);
    await onUpdated(newCats);
  };

  const handleRename = async (oldName: string, newName: string) => {
    setBusy(true);
    await supabase.from('menu_items').update({ category: newName }).eq('restaurant_id', restaurantId).eq('category', oldName);
    const { error } = await supabase.from('restaurant_categories').update({ name: newName }).eq('restaurant_id', restaurantId).eq('name', oldName);
    if (!error) {
      const newCats = cats.map(c => c === oldName ? newName : c);
      setCats(newCats);
      setShowImageMap(prev => { const n = { ...prev }; n[newName] = n[oldName]; delete n[oldName]; return n; });
      setImageModeMap(prev => { const n = { ...prev }; n[newName] = n[oldName]; delete n[oldName]; return n; });
      setBannerItemMap(prev => { const n = { ...prev }; n[newName] = n[oldName]; delete n[oldName]; return n; });
      await onUpdated(newCats);
    }
    setBusy(false);
  };

  const handleToggleMasterShowImages = async (val: boolean) => {
    setMasterShowImages(val);
    const updatedMap: Record<string, boolean> = {};
    for (const cat of cats) updatedMap[cat] = val;
    setShowImageMap(updatedMap);
    setBusy(true);
    for (const cat of cats) {
      await supabase.from('restaurant_categories')
        .update({ show_image: val })
        .eq('restaurant_id', restaurantId)
        .eq('name', cat);
    }
    setBusy(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" style={{ animation: 'fadeIn 0.15s ease-out' }}>
      <div className="bg-[var(--card)] rounded-2xl shadow-2xl w-full max-w-sm" style={{ animation: 'modalIn 0.15s ease-out' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--card-border)]">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[var(--foreground)]">Manage categories</h3>
            <p className="text-xs text-[var(--muted)] mt-0.5">Drag to reorder · tap trash to delete</p>
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

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={cats} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {cats.map((cat) => (
                  <SortableCategoryManageRow
                    key={cat}
                    name={cat}
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
                        .eq('restaurant_id', restaurantId)
                        .eq('name', cat);
                    }}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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

const QR_STYLES_MAP = {
  classic: { fg: "#000000", bg: "#ffffff" },
  brand:   { fg: "#2c2a26", bg: "#faf8f5" },
  gold:    { fg: "#8b6914", bg: "#ffffff" },
  dark:    { fg: "#faf8f5", bg: "#2c2a26" },
} as const;
type QRStyleKey = keyof typeof QR_STYLES_MAP;

const SIZES_MAP = { small: 600, medium: 900, large: 1400 } as const;
type QRSizeKey = keyof typeof SIZES_MAP;

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

async function composeQR(opts: {
  slug: string;
  fgColor: string;
  bgColor: string;
  textColor: string;
  template: "simple" | "tagline" | "table";
  size: QRSizeKey;
  includeLogo: boolean;
  logoBg: boolean;
  logoBgShape: "circle" | "square" | "rounded";
  logoBgColor: string;
  tagline: string;
  header: string;
  logoUrl: string | null;
  canvas: HTMLCanvasElement;
  skipText?: boolean;
}) {
  const { slug, fgColor, bgColor, textColor, template, size, includeLogo, logoBg, logoBgShape, logoBgColor, tagline, header, logoUrl, canvas, skipText } = opts;
  const px = SIZES_MAP[size];
  const url = window.location.origin + "/menu/" + slug;

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: px, margin: 2,
    color: { dark: fgColor, light: bgColor },
    errorCorrectionLevel: "H",
  });

  const ctx = canvas.getContext("2d")!;
  const padding = px * 0.06;
  const headerH = template === "table" ? px * 0.12 : 0;
  const taglineH = (template === "tagline" || template === "table") ? px * 0.08 : 0;
  const watermarkH = px * 0.06;

  canvas.width = px + padding * 2;
  canvas.height = headerH + px + taglineH + watermarkH + padding * (headerH ? 3 : 2);

  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let y = padding;

  if (template === "table") {
    if (!skipText) {
      ctx.fillStyle = textColor;
      ctx.font = `bold ${px * 0.07}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText(header, canvas.width / 2, y + px * 0.08);
    }
    y += headerH + padding;
  }

  const qrImg = await loadImage(qrDataUrl);
  const qrX = (canvas.width - px) / 2;
  ctx.drawImage(qrImg, qrX, y, px, px);

  if (includeLogo && logoUrl) {
    try {
      const logoImg = await loadImage(logoUrl);
      const logoSize = px * 0.22;
      const lx = (canvas.width - logoSize) / 2;
      const ly = y + (px - logoSize) / 2;
      if (logoBg) {
        const pad = logoSize * 0.18;
        ctx.fillStyle = logoBgColor;
        if (logoBgShape === "circle") {
          ctx.beginPath();
          ctx.arc(canvas.width / 2, ly + logoSize / 2, (logoSize + pad * 2) / 2, 0, Math.PI * 2);
          ctx.fill();
        } else if (logoBgShape === "rounded") {
          roundRect(ctx, lx - pad, ly - pad, logoSize + pad * 2, logoSize + pad * 2, (logoSize + pad * 2) * 0.18);
          ctx.fill();
        } else {
          ctx.fillRect(lx - pad, ly - pad, logoSize + pad * 2, logoSize + pad * 2);
        }
      }
      ctx.drawImage(logoImg, lx, ly, logoSize, logoSize);
    } catch { /* logo failed to load */ }
  }

  y += px + padding;

  if (template === "tagline" || template === "table") {
    if (!skipText) {
      ctx.fillStyle = textColor;
      ctx.font = `${px * 0.04}px Georgia, serif`;
      ctx.textAlign = "center";
      ctx.fillText(tagline, canvas.width / 2, y + px * 0.04);
    }
    y += taglineH;
  }

  // Watermark
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = textColor;
  ctx.font = `${px * 0.022}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "right";
  const wmY = canvas.height - padding * 0.5;
  ctx.fillText("dinelinks.com", canvas.width - padding, wmY);
  const domainW = ctx.measureText("dinelinks.com").width;
  const logoSize = px * 0.038;
  const logoX = canvas.width - padding - domainW - px * 0.018 - logoSize;
  const logoY = wmY - logoSize * 0.82;
  const drawLogo = (lctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
    lctx.lineWidth = size * 0.08;
    lctx.lineCap = "round";
    lctx.strokeStyle = '#8b6914';
    lctx.beginPath();
    lctx.moveTo(x + size * 0.1, y + size * 0.1);
    lctx.lineTo(x + size * 0.1, y + size * 0.9);
    lctx.quadraticCurveTo(x + size * 0.9, y + size * 0.9, x + size * 0.9, y + size * 0.5);
    lctx.quadraticCurveTo(x + size * 0.9, y + size * 0.1, x + size * 0.1, y + size * 0.1);
    lctx.stroke();
    lctx.strokeStyle = '#2c2a26';
    lctx.beginPath();
    lctx.moveTo(x + size * 0.65, y + size * 0.1);
    lctx.lineTo(x + size * 0.65, y + size * 0.9);
    lctx.lineTo(x + size * 1.05, y + size * 0.9);
    lctx.stroke();
  };
  drawLogo(ctx, logoX, logoY, logoSize);
  ctx.globalAlpha = 1;
}

function QRModal({ slug, restaurant, onClose }: { slug: string; restaurant: Restaurant | null; onClose: () => void }) {
  const logoUrl = (restaurant as Restaurant & { logo_url?: string | null })?.logo_url ?? null;
  const restaurantName = restaurant?.name ?? "Your Restaurant";

  const brandFg = restaurant?.accent_color ?? "#8b6914";
  const brandBg = restaurant?.background_color ?? "#faf8f5";

  const stylePresets: Record<QRStyleKey, { fg: string; bg: string; frame: string; label: string }> = {
    classic: { fg: "#000000", bg: "#ffffff", frame: "#000000", label: "Classic" },
    brand:   { fg: brandFg,   bg: brandBg,   frame: brandFg,   label: "Brand"   },
    gold:    { fg: "#8b6914", bg: "#faf8f5", frame: "#8b6914", label: "Gold"    },
    dark:    { fg: "#faf8f5", bg: "#1f1d1a", frame: "#faf8f5", label: "Dark"    },
  };

  const selectStyle = (key: QRStyleKey) => {
    const p = stylePresets[key];
    setQrStyle(key);
    setCustomQrColor(p.fg);
    setCustomBgColor(p.bg);
    setCustomFrameColor(p.frame);
  };

  const [qrStyle, setQrStyle]                   = useState<QRStyleKey>("classic");
  const [customQrColor, setCustomQrColor]         = useState("#000000");
  const [customBgColor, setCustomBgColor]         = useState("#ffffff");
  const [customFrameColor, setCustomFrameColor]   = useState("#000000");
  const [showCustomColors, setShowCustomColors]   = useState(false);
  const [qrTemplate, setQrTemplate]               = useState<"simple" | "tagline" | "table">("simple");
  const [qrSize, setQrSize]                       = useState<QRSizeKey>("medium");
  const [qrIncludeLogo, setQrIncludeLogo]         = useState(true);
  const [qrLogoBg, setQrLogoBg]                   = useState(false);
  const [qrLogoBgShape, setQrLogoBgShape]         = useState<"circle" | "square" | "rounded">("circle");
  const [qrLogoBgColor, setQrLogoBgColor]         = useState("#ffffff");
  const [qrTagline, setQrTagline]                 = useState("Scan to view our menu");
  const [qrHeader, setQrHeader]                   = useState(restaurantName);
  const [isDownloading, setIsDownloading]         = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);

  useBodyScrollLock(true);

  const commonOpts = useCallback(() => ({
    slug,
    fgColor: customQrColor,
    bgColor: customBgColor,
    textColor: customFrameColor,
    template: qrTemplate,
    size: qrSize,
    includeLogo: qrIncludeLogo,
    logoBg: qrLogoBg,
    logoBgShape: qrLogoBgShape,
    logoBgColor: qrLogoBgColor,
    tagline: qrTagline,
    header: qrHeader,
    logoUrl,
  }), [slug, customQrColor, customBgColor, customFrameColor, qrTemplate, qrSize, qrIncludeLogo, qrLogoBg, qrLogoBgShape, qrLogoBgColor, qrTagline, qrHeader, logoUrl]);

  // Live preview — rendered at 4× display size for crisp text, no text drawn (inputs overlay instead)
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const offscreen = document.createElement("canvas");
    composeQR({ ...commonOpts(), size: "small", canvas: offscreen, skipText: true }).then(() => {
      const ctx = canvas.getContext("2d")!;
      canvas.width = offscreen.width;
      canvas.height = offscreen.height;
      ctx.drawImage(offscreen, 0, 0);
    }).catch(() => {});
  }, [commonOpts]);

  const handleDownloadQR = async () => {
    setIsDownloading(true);
    try {
      const canvas = downloadCanvasRef.current ?? document.createElement("canvas");
      await composeQR({ ...commonOpts(), canvas });
      const filename = `${slug || "menu"}-qr.png`;

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

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:ring-offset-2 ${checked ? "bg-[var(--accent)]" : "bg-gray-300"}`}>
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-[22px] translate-y-0.5" : "translate-x-0.5 translate-y-0.5"}`} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center bg-black/60 sm:p-4"
      style={{ animation: "fadeIn 0.15s ease-out" }}>
      <div className="flex flex-col w-full sm:max-w-lg max-h-[92vh] sm:max-h-[90vh] overflow-hidden rounded-t-2xl sm:rounded-2xl bg-[var(--card)] shadow-2xl"
        style={{ animation: "modalIn 0.15s ease-out" }}>

        {/* Header */}
        <div className="flex-shrink-0 bg-[var(--card)] border-b border-[var(--card-border)] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--foreground)]">Get your QR code</h2>
            <p className="text-xs text-[var(--muted)] mt-0.5">Download and print for your tables</p>
          </div>
          <button type="button" onClick={onClose} className="text-[var(--muted)] hover:text-[var(--foreground)] p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">

          {/* Live preview with inline-editable text overlays */}
          <div className="flex justify-center">
            <div className="relative" style={{ width: 280 }}>
              <canvas
                ref={previewCanvasRef}
                className="w-full rounded-xl border border-gray-200 shadow-sm"
                style={{ display: 'block' }}
              />
              {/* Header overlay — table template only */}
              {qrTemplate === 'table' && (
                <input
                  type="text"
                  value={qrHeader}
                  onChange={e => setQrHeader(e.target.value)}
                  title="Click to edit header"
                  className="absolute left-0 w-full text-center font-serif font-bold bg-transparent border-2 border-transparent hover:border-dashed hover:border-amber-400 focus:border-solid focus:border-amber-500 focus:outline-none rounded transition-colors cursor-text"
                  style={{
                    top: '3.5%',
                    fontSize: 13,
                    color: customFrameColor,
                    padding: '2px 4px',
                  }}
                />
              )}
              {/* Tagline overlay — tagline + table templates */}
              {(qrTemplate === 'tagline' || qrTemplate === 'table') && (
                <input
                  type="text"
                  value={qrTagline}
                  onChange={e => setQrTagline(e.target.value)}
                  title="Click to edit tagline"
                  className="absolute left-0 w-full text-center bg-transparent border-2 border-transparent hover:border-dashed hover:border-amber-400 focus:border-solid focus:border-amber-500 focus:outline-none rounded transition-colors cursor-text"
                  style={{
                    bottom: qrTemplate === 'table' ? '8%' : '7%',
                    fontSize: 10,
                    color: customFrameColor,
                    padding: '2px 4px',
                    fontFamily: 'Georgia, serif',
                  }}
                />
              )}
            </div>
          </div>

          {/* Style */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Style</p>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(stylePresets) as QRStyleKey[]).map((key) => {
                const p = stylePresets[key];
                const isSelected = qrStyle === key;
                return (
                  <button key={key} type="button" onClick={() => selectStyle(key)}
                    style={{
                      background: p.bg,
                      border: isSelected ? "2.5px solid #2c2a26" : "1.5px solid #e8e4dd",
                      borderRadius: 10,
                      padding: "12px 10px",
                      cursor: "pointer",
                      textAlign: "center" as const,
                      transition: "border-color 150ms",
                      display: "flex",
                      flexDirection: "column" as const,
                      alignItems: "center",
                      gap: 6,
                    }}>
                    {/* Mini QR icon */}
                    <svg width="32" height="32" viewBox="0 0 28 28" fill={p.fg}>
                      <rect x="1" y="1" width="10" height="10" rx="1.5" fill="none" stroke={p.fg} strokeWidth="1.5"/>
                      <rect x="3.5" y="3.5" width="5" height="5" rx="0.5"/>
                      <rect x="17" y="1" width="10" height="10" rx="1.5" fill="none" stroke={p.fg} strokeWidth="1.5"/>
                      <rect x="19.5" y="3.5" width="5" height="5" rx="0.5"/>
                      <rect x="1" y="17" width="10" height="10" rx="1.5" fill="none" stroke={p.fg} strokeWidth="1.5"/>
                      <rect x="3.5" y="19.5" width="5" height="5" rx="0.5"/>
                      <rect x="14" y="14" width="3" height="3" rx="0.5"/>
                      <rect x="18" y="14" width="3" height="3" rx="0.5"/>
                      <rect x="22" y="14" width="3" height="3" rx="0.5"/>
                      <rect x="14" y="18" width="3" height="3" rx="0.5"/>
                      <rect x="22" y="18" width="3" height="3" rx="0.5"/>
                      <rect x="14" y="22" width="3" height="3" rx="0.5"/>
                      <rect x="18" y="22" width="3" height="3" rx="0.5"/>
                      <rect x="22" y="22" width="3" height="3" rx="0.5"/>
                    </svg>
                    <span style={{ fontSize: 11, fontWeight: 600, color: p.frame }}>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Customize colors collapsible */}
            <div className="mt-3">
              <button type="button" onClick={() => setShowCustomColors(v => !v)}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                <svg className={`w-3 h-3 transition-transform ${showCustomColors ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                Customize colors
              </button>
              {showCustomColors && (
                <div className="mt-3 grid grid-cols-3 gap-3">
                  {([
                    { label: "QR color",     value: customQrColor,    set: setCustomQrColor    },
                    { label: "Background",   value: customBgColor,    set: setCustomBgColor    },
                    { label: "Frame & text", value: customFrameColor, set: setCustomFrameColor },
                  ] as { label: string; value: string; set: (v: string) => void }[]).map(({ label, value, set }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5">
                      <div className="relative w-9 h-9">
                        <input type="color" value={value} onChange={e => { set(e.target.value); setQrStyle("classic" as QRStyleKey); }}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                        <div className="w-9 h-9 rounded-lg border-2 border-gray-200 shadow-sm" style={{ background: value }} />
                      </div>
                      <span className="text-[10px] text-gray-500 text-center leading-tight">{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Template */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-3">Template</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: "simple" as const, label: "QR only" },
                { id: "tagline" as const, label: "With tagline" },
                { id: "table" as const, label: "Table card" },
              ]).map(t => (
                <div key={t.id} onClick={() => setQrTemplate(t.id)}
                  className={`cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${qrTemplate === t.id ? "border-[var(--accent)]" : "border-[var(--card-border)] hover:border-[var(--accent)]/40"}`}>
                  <div className="bg-[var(--background)] rounded-lg p-2 mb-2 flex flex-col items-center gap-1 min-h-[80px] justify-center border border-[var(--card-border)]">
                    {t.id === "table" && (
                      <div className="w-full text-center text-[8px] text-[var(--muted)] font-bold truncate px-1">Header text</div>
                    )}
                    <div className="w-10 h-10 bg-[var(--card-border)]/30 rounded flex items-center justify-center text-[8px] text-[var(--muted)]">QR</div>
                    {(t.id === "tagline" || t.id === "table") && (
                      <div className="w-full text-center text-[8px] text-[var(--muted)] truncate px-1">Tagline text</div>
                    )}
                  </div>
                  <span className="text-xs text-[var(--muted)]">{t.label}</span>
                </div>
              ))}
            </div>
            {(qrTemplate === "tagline" || qrTemplate === "table") && (
              <p style={{ fontSize: 12, color: "#6b6560", marginTop: 6 }}>
                💡 Tip: you can edit the tagline text in the preview above.
              </p>
            )}
          </div>

          {/* Size */}
          <div>
            <p className="text-xs uppercase tracking-widest text-gray-500 mb-2">Output size</p>
            <div className="flex gap-2">
              {(["small", "medium", "large"] as QRSizeKey[]).map(s => (
                <button key={s} type="button" onClick={() => setQrSize(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${qrSize === s ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--card-border)] text-[var(--foreground)] hover:border-[var(--accent)]/50"}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Logo */}
          {logoUrl && (
            <div className="space-y-3 rounded-xl border border-[var(--card-border)] p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-[var(--foreground)]">Include logo in center</span>
                <Toggle checked={qrIncludeLogo} onChange={setQrIncludeLogo} />
              </div>
              {qrIncludeLogo && (
                <div className="space-y-3 pt-2 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--foreground)]">Add background behind logo</span>
                    <Toggle checked={qrLogoBg} onChange={setQrLogoBg} />
                  </div>
                  {qrLogoBg && (
                    <div className="flex gap-3 items-center flex-wrap">
                      {(["circle", "square", "rounded"] as const).map(shape => (
                        <button key={shape} type="button" onClick={() => setQrLogoBgShape(shape)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${qrLogoBgShape === shape ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]" : "border-[var(--card-border)] text-[var(--foreground)]"}`}>
                          {shape}
                        </button>
                      ))}
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-[var(--muted)]">Color</span>
                        <div className="relative w-8 h-8">
                          <input type="color" value={qrLogoBgColor} onChange={e => setQrLogoBgColor(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                          <div className="w-8 h-8 rounded-lg border-2 border-gray-200 shadow-sm" style={{ background: qrLogoBgColor }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t border-[var(--card-border)] px-6 py-4 bg-[var(--card)]">
          <button type="button" onClick={handleDownloadQR} disabled={isDownloading}
            className="w-full py-2.5 rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {isDownloading ? "Generating…" : "Download PNG"}
          </button>
          <p className="text-xs text-[var(--muted)] mt-2 sm:hidden text-center">
            Tip: tap Download then save to Photos or share via Messages.
          </p>
        </div>
        <canvas ref={downloadCanvasRef} className="hidden" />
      </div>
    </div>
  );
}

// ── Settings Modal ────────────────────────────────────────────────────────────

const SETTINGS_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "es", label: "Español" },
  { value: "zh", label: "中文" },
  { value: "ar", label: "العربية" },
  { value: "ja", label: "日本語" },
  { value: "ko", label: "한국어" },
  { value: "pt", label: "Português" },
  { value: "de", label: "Deutsch" },
  { value: "it", label: "Italiano" },
];

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
  open, onClose, slug, userEmail, subStatus, trialDaysLeft,
}: {
  open: boolean;
  onClose: () => void;
  slug: string;
  userEmail: string;
  subStatus: string | null;
  trialDaysLeft: number | null;
}) {
  const supabase = createSupabaseClient();
  const router = useRouter();
  const [loaded, setLoaded] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [notifyTrial, setNotifyTrial] = useState(true);
  const [notifyProduct, setNotifyProduct] = useState(false);
  const [defaultLang, setDefaultLang] = useState("en");

  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSent, setPwSent] = useState(false);

  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useBodyScrollLock(open);

  useEffect(() => {
    if (!open || loaded) return;
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      const meta = data.user.user_metadata ?? {};
      setDisplayName(meta.display_name ?? "");
      setNotifyTrial(meta.notify_trial_ending ?? true);
      setNotifyProduct(meta.notify_product_updates ?? false);
      setDefaultLang(meta.default_language ?? "en");
      setIsDirty(false);
      setLoaded(true);
    });
  }, [open, loaded, supabase]);

  useEffect(() => { if (!open) setLoaded(false); }, [open]);

  const showMsg = (type: "ok" | "err", text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({
      data: {
        display_name: displayName.trim() || null,
        notify_trial_ending: notifyTrial,
        notify_product_updates: notifyProduct,
        default_language: defaultLang,
      },
    });
    setSaving(false);
    if (error) showMsg("err", error.message);
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
    if (error) showMsg("err", error.message);
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
    if (data.url) window.location.href = data.url;
    else {
      const co = await fetch("/api/stripe/checkout", { method: "POST" });
      const cod = await co.json();
      if (cod.url) window.location.href = cod.url;
    }
  };

  const planLabel = (() => {
    if (!subStatus || subStatus === "none") return "No active subscription";
    if (subStatus === "trialing")
      return trialDaysLeft !== null && trialDaysLeft > 0
        ? `Free trial — ${trialDaysLeft} day${trialDaysLeft === 1 ? "" : "s"} left`
        : "Free trial — expired";
    if (subStatus === "active") return "Pro Plan — Active";
    if (subStatus === "past_due") return "Pro Plan — Payment past due";
    if (subStatus === "canceled") return "Subscription canceled";
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
      <div className="flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--card)] shadow-2xl"
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
              <div className="px-4 py-3.5">
                <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Display name</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => { setDisplayName(e.target.value); setIsDirty(true); }}
                    placeholder="e.g. Jane"
                    className="flex-1 px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-sm text-[var(--foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
                  />
                </div>
              </div>
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
                <button type="button" onClick={openPortal}
                  className="px-4 py-2 text-sm font-medium border border-[var(--card-border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--background)] transition-colors">
                  Manage subscription
                </button>
              </SettingRow>
              <SettingRow label="Invoices" sublabel="View and download past invoices">
                <button type="button" onClick={openPortal}
                  className="px-4 py-2 text-sm font-medium border border-[var(--card-border)] text-[var(--foreground)] rounded-lg hover:bg-[var(--background)] transition-colors">
                  View invoices
                </button>
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
                className="flex-1 py-2.5 rounded-xl bg-[#8b6914] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                Save & close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
