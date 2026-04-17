"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { createSupabaseClient } from "@/app/lib/supabase";
import { CATEGORY_ORDER } from "@/app/lib/constants";
import type { MenuItemRow } from "@/app/lib/constants";
import type { Restaurant } from "@/app/lib/supabase";
import { ImageUploader } from "./ImageUploader";
import { OnboardingTour } from "./OnboardingTour";

type Grouped = Record<string, MenuItemRow[]>;

const D_ACCENT = "#8b6914";
const D_BG     = "#faf8f5";
const D_TEXT   = "#2c2a26";
const D_CARD   = "#ffffff";

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

type Props = {
  restaurantId: string;
  restaurantSlug: string;
  initialGrouped: Grouped;
  initialSortedCategories: string[];
  initialRestaurant: Restaurant | null;
  initialCategoryNotes: Record<string, string>;
};

export function AdminMenuEditor({
  restaurantId,
  restaurantSlug,
  initialGrouped,
  initialSortedCategories,
  initialRestaurant,
  initialCategoryNotes,
}: Props) {
  const router = useRouter();
  const supabase = createSupabaseClient();

  const deleteStorageImage = async (url: string) => {
    if (!url || !url.includes('supabase.co/storage')) return;
    const path = url.split('/menu-images/')[1];
    if (path) await supabase.storage.from('menu-images').remove([path]);
  };

  const [grouped, setGrouped]                   = useState<Grouped>(initialGrouped);
  const [sortedCategories, setSortedCategories] = useState(initialSortedCategories);
  const [activeCategory, setActiveCategory]     = useState(initialSortedCategories[0] ?? "");
  const [editingItem, setEditingItem]           = useState<MenuItemRow | null>(null);
  const [addingNew, setAddingNew]               = useState(false);
  const [restaurant, setRestaurant]             = useState<Restaurant | null>(initialRestaurant);
  const [categoryNotes, setCategoryNotes]       = useState(initialCategoryNotes);
  const [saving, setSaving]                     = useState(false);
  const [savingNote, setSavingNote]             = useState(false);
  const [message, setMessage]                   = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [mobileOpen, setMobileOpen]             = useState(false);
  const [tourKey, setTourKey]                   = useState(0);
  const [showQR, setShowQR] = useState(false);

  // ── Live theme — no reload needed ────────────────────────────────────────
  useEffect(() => {
    if (!restaurant) return;
    const fc  = restaurant.font_color        ?? D_TEXT;
    const acc = restaurant.accent_color      ?? D_ACCENT;
    const bg  = restaurant.background_color  ?? D_BG;
    const cd  = restaurant.main_color        ?? D_CARD;
    const ff  = fontFamily(restaurant.font_family);
    let el = document.getElementById("dinelinks-theme") as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = "dinelinks-theme";
      document.head.appendChild(el);
    }
    el.textContent = `:root{--foreground:${fc};--accent:${acc};--background:${bg};--card:${cd};--card-border:${fc}22;--muted:${fc}99;}body{font-family:${ff};}`;
  }, [restaurant]);

  const showMsg = useCallback((type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  }, []);

  const refreshMenu = useCallback(async () => {
    const { data, error } = await supabase
      .from("menu_items").select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true })
      .order("name",       { ascending: true });
    if (error) { showMsg("err", error.message); return; }
    const g: Grouped = {};
    (data ?? []).forEach((row) => {
      const cat = (row as MenuItemRow).category || "Other";
      if (!g[cat]) g[cat] = [];
      g[cat].push(row as MenuItemRow);
    });
    const sorted = [
      ...CATEGORY_ORDER.filter((c) => g[c]),
      ...Object.keys(g).filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c)),
    ];
    setGrouped(g);
    setSortedCategories(sorted);
    setActiveCategory((prev) => sorted.includes(prev) ? prev : sorted[0] ?? "");
  }, [restaurantId, showMsg, supabase]);

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
      const catItems = grouped[payload.category ?? "Other"] ?? [];
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
    const restaurantAny = restaurant as any;
    const updatesAny = updates as any;
    if (restaurantAny?.hero_image_url && 'hero_image_url' in updates &&
        restaurantAny.hero_image_url !== updatesAny.hero_image_url) {
      await deleteStorageImage(restaurantAny.hero_image_url);
    }
    if (restaurantAny?.logo_url && 'logo_url' in updatesAny &&
        restaurantAny.logo_url !== updatesAny.logo_url) {
      await deleteStorageImage(restaurantAny.logo_url);
    }
    const { error } = await supabase.from("restaurants").update(updates).eq("id", restaurantId);
    if (error) { showMsg("err", error.message); }
    else { setRestaurant(p => p ? { ...p, ...updates } : null); showMsg("ok", "Theme saved — changes applied instantly."); }
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

  const items   = grouped[activeCategory] ?? [];
  const isEmpty = sortedCategories.length === 0;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">

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
          <button
            type="button"
            onClick={() => { localStorage.removeItem("dinelinks_tour_v2_done"); setTourKey((k) => k + 1); }}
            title="Reopen tour"
            className="min-h-[40px] w-10 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/20 flex items-center justify-center transition-colors"
          >
            ?
          </button>
          <ThemeModal restaurant={restaurant} onSave={handleSaveTheme} saving={saving} tourTarget="theme-btn-desktop" />
          <button
            type="button"
            onClick={() => setShowQR(true)}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium border border-white/25 flex items-center gap-1.5 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="3" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
              <rect x="14" y="3" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
              <rect x="3" y="14" width="7" height="7" rx="1" strokeWidth={2} strokeLinecap="round"/>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 14h3v3m4-3v3m-4 4h7"/>
            </svg>
            QR Code
          </button>
          <a
            data-tour="view-menu-desktop"
            href={`/menu/${restaurantSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[40px] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium border border-white/25 inline-flex items-center gap-1.5 transition-colors"
          >
            View menu
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button
            type="button" onClick={handleSignOut}
            className="min-h-[40px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/20 transition-colors"
          >
            Sign out
          </button>
        </div>

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
          <h1 className="font-serif text-3xl font-semibold text-white drop-shadow-md">
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
            <a data-tour="view-menu-mobile" href={`/menu/${restaurantSlug}`} target="_blank" rel="noopener noreferrer"
              onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-medium">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              View public menu
            </a>
            <button type="button" onClick={() => { setMobileOpen(false); handleSignOut(); }}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 text-sm font-medium">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign out
            </button>
            <button type="button" onClick={() => { setMobileOpen(false); document.body.dataset.mobileSheetOpen = "false"; }}
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

      {/* Empty state */}
      {isEmpty && (
        <div className="max-w-2xl mx-auto px-6 py-20 flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[var(--accent)]/10 flex items-center justify-center text-4xl">🍽️</div>
          <div>
            <h2 className="font-serif text-2xl font-semibold mb-2">Your menu is empty</h2>
            <p className="text-[var(--muted)] text-sm max-w-xs mx-auto leading-relaxed">
              Add your first dish and it will appear here, organised into categories automatically.
            </p>
          </div>
          <button type="button" onClick={() => { setAddingNew(true); setEditingItem(null); }}
            className="px-8 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity">
            + Add your first item
          </button>
        </div>
      )}

      {!isEmpty && (
        <>
          {/* Category tabs — px-1 prevents ring clip */}
          <div className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--card-border)] shadow-sm">
            <div className="max-w-4xl mx-auto px-3 sm:px-6">
              <div className="tabs-scroll flex gap-2 overflow-x-auto py-3 scrollbar-none px-1">
                {sortedCategories.map((cat) => (
                  <button key={cat} type="button" onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-[var(--accent)] text-white shadow-sm"
                        : "bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}>
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold">{activeCategory}</h2>
              <button data-tour="tour-add-item" type="button"
                onClick={() => { setAddingNew(true); setEditingItem(null); }}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-sm">
                + Add item
              </button>
            </div>

            <CategoryNoteEditor
              category={activeCategory}
              initialNote={categoryNotes[activeCategory] ?? ""}
              onSave={handleSaveCategoryNote}
              saving={savingNote}
            />

            <div className="space-y-3 mt-6">
              {items.map((item, idx) => (
                <div key={item.id}
                  className={`bg-[var(--card)] rounded-2xl border border-[var(--card-border)] overflow-hidden shadow-sm ${
                    item.available === false ? "opacity-50" : ""
                  }`}>
                  <div className="flex items-stretch">
                    {/* Sort arrows — left strip */}
                    <div className="flex flex-col items-center justify-center border-r border-[var(--card-border)] px-2 gap-1 py-3 flex-shrink-0">
                      <button type="button" title="Move up"
                        disabled={saving || idx === 0}
                        onClick={() => moveItem(idx, idx - 1)}
                        className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)] disabled:opacity-25 transition-colors touch-manipulation">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                      <span className="text-[10px] text-[var(--muted)] font-mono tabular-nums">{idx + 1}</span>
                      <button type="button" title="Move down"
                        disabled={saving || idx === items.length - 1}
                        onClick={() => moveItem(idx, idx + 1)}
                        className="p-1 rounded-lg text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)] disabled:opacity-25 transition-colors touch-manipulation">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    </div>

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
                        <span className="font-semibold text-[var(--accent)] tabular-nums text-sm flex-shrink-0">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[var(--muted)] text-xs sm:text-sm mt-1 line-clamp-2 text-wrap-force">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-1.5 mt-2 items-center">
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
                        <button type="button"
                          onClick={() => { setEditingItem(item); setAddingNew(false); }}
                          className="px-3 py-1 rounded-lg bg-[var(--card-border)] text-xs font-medium hover:bg-[var(--accent)]/15 text-[var(--accent)] transition-colors">
                          Edit
                        </button>
                        <button type="button"
                          onClick={() => handleDelete(item.id, item.image_url)}
                          disabled={saving}
                          className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 disabled:opacity-50 transition-colors">
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {(editingItem || addingNew) && (
        <ItemForm
          item={editingItem ?? undefined}
          categories={sortedCategories.length > 0 ? sortedCategories : CATEGORY_ORDER.slice()}
          restaurantSlug={restaurantSlug}
          onSave={handleSaveItem}
          onCancel={() => { setEditingItem(null); setAddingNew(false); }}
          saving={saving}
          existingImageUrl={editingItem?.image_url ?? undefined}
        />
      )}

      <OnboardingTour tourKey={tourKey} />

      {/* QR Code Modal */}
      {showQR && (
        <QRModal
          slug={restaurantSlug}
          restaurant={restaurant}
          onClose={() => setShowQR(false)}
        />
      )}
    </main>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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
      <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
        Note for &ldquo;{category}&rdquo;
      </label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. All pizzas are 12 inches." rows={2}
        className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
      <button type="button" onClick={() => onSave(category, note)} disabled={saving}
        className="mt-2 px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity">
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
};

function ThemeModal({ restaurant, onSave, saving, sheetMode, onClose, tourTarget }: ThemeModalProps) {
  const [open, setOpen]           = useState(false);
  const [card, setCard]           = useState(D_CARD);
  const [accent, setAccent]       = useState(D_ACCENT);
  const [bg, setBg]               = useState(D_BG);
  const [fontColor, setFontColor] = useState(D_TEXT);
  const [font, setFont]           = useState("sans");
  const [name, setName]           = useState("");
  const [heroUrl, setHeroUrl]     = useState("");
  const [logoUrl, setLogoUrl]     = useState("");
  const [fontOpen, setFontOpen]   = useState(false);

  useEffect(() => {
    if (open && restaurant) {
      setCard(restaurant.main_color ?? D_CARD);
      setAccent(restaurant.accent_color ?? D_ACCENT);
      setBg(restaurant.background_color ?? D_BG);
      setFontColor(restaurant.font_color ?? D_TEXT);
      setFont(restaurant.font_family ?? "sans");
      setName(restaurant.name ?? "");
      setHeroUrl(restaurant.hero_image_url ?? "");
      setLogoUrl((restaurant as Restaurant & { logo_url?: string | null }).logo_url ?? "");
      setFontOpen(false);
    }
  }, [open, restaurant]);

  const save = () => {
    onSave({
      main_color:       card,
      accent_color:     accent,
      background_color: bg || null,
      font_color:       fontColor || null,
      font_family:      font,
      name:             name.trim() || null,
      hero_image_url:   heroUrl.trim() || null,
      logo_url:         logoUrl.trim() || null,
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
      className="flex items-center gap-3 w-full px-4 py-3 rounded-xl bg-[var(--background)] text-[var(--foreground)] text-sm font-medium">
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
      {trigger}
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

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-7">
              {/* Details */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">Restaurant details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Restaurant name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. La Piazza"
                      className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914]" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Logo</label>
                    <p className="text-xs text-[var(--muted)] mb-2">PNG with a transparent background works best.</p>
                    <ImageUploader
                      currentUrl={logoUrl}
                      onUploaded={(url) => setLogoUrl(url)}
                      folder="logos"
                      aspectRatio="square"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--foreground)] mb-1.5">Hero / banner image</label>
                    <p className="text-xs text-[var(--muted)] mb-2">Shown across the top of your public menu.</p>
                    <ImageUploader
                      currentUrl={heroUrl}
                      onUploaded={(url) => setHeroUrl(url)}
                      folder="hero"
                      aspectRatio="video"
                    />
                  </div>
                </div>
              </section>

              {/* Colours — each in its own card */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">Colours</h3>
                <div className="grid grid-cols-2 gap-4">
                  {colors.map(({ label, value, set }) => (
                    <div key={label} className="rounded-2xl border border-[var(--card-border)] bg-[var(--background)] p-4 flex flex-col gap-3">
                      <label className="block text-xs font-semibold text-[var(--muted)]">{label}</label>
                      <div className="flex items-center gap-3">
                        <div className="relative flex-shrink-0">
                          <input type="color" value={value}
                            onChange={(e) => set(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                          <div className="w-12 h-12 rounded-xl border-2 border-white shadow-md"
                            style={{ background: value }} />
                        </div>
                        <span className="text-xs font-mono text-[var(--muted)] uppercase tracking-wide">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Font */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-4">Font</h3>
                <div className="relative">
                  <button type="button" onClick={() => setFontOpen((o) => !o)}
                    className="w-full px-4 py-3 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#8b6914]">
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
                          className={`w-full px-4 py-2.5 text-left text-sm hover:bg-[var(--card-border)]/40 transition-colors ${opt.cls} ${font === opt.value ? "text-[#8b6914] font-medium" : "text-[var(--foreground)]"}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

            </div>
            <div className="flex-shrink-0 border-t border-[var(--card-border)] px-6 py-4 bg-[var(--card)]">
              <button type="button" onClick={save} disabled={saving}
                className="w-full py-3.5 rounded-xl bg-[#8b6914] text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity shadow-sm">
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

function ItemForm({
  item, categories, restaurantSlug, onSave, onCancel, saving, existingImageUrl,
}: {
  item?: MenuItemRow; categories: readonly string[]; restaurantSlug: string;
  onSave: (p: Partial<MenuItemRow>) => void; onCancel: () => void; saving: boolean;
  existingImageUrl?: string;
}) {
  const [name, setName]           = useState(item?.name ?? "");
  const [desc, setDesc]           = useState(item?.description ?? "");
  const [price, setPrice]         = useState(item != null ? String(Number(item.price)) : "");
  const [imgUrl, setImgUrl]       = useState(item?.image_url ?? "");
  const [category, setCategory]   = useState(item?.category ?? "Other");
  const [available, setAvailable] = useState<boolean>(item?.available ?? true);
  const [chefs, setChefs]         = useState<boolean>(item?.chefs_favorite ?? false);
  const [gluten, setGluten]       = useState<boolean>(item?.gluten_free ?? false);
  const [nut, setNut]             = useState<boolean>(item?.nut_free ?? false);
  const [vegan, setVegan]         = useState<boolean>(item?.vegan ?? false);
  const [veg, setVeg]             = useState<boolean>(item?.vegetarian ?? false);
  const [dairy, setDairy]         = useState<boolean>(item?.dairy_free ?? false);
  const [spicy, setSpicy]         = useState<boolean>(item?.spicy ?? false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number.parseFloat(price);
    if (!name.trim() || Number.isNaN(p) || p < 0) return;
    onSave({
      name: name.trim(), description: desc.trim() || null, price: p,
      image_url: imgUrl.trim() || null, category: category || "Other",
      available, chefs_favorite: chefs, gluten_free: gluten, nut_free: nut,
      vegan, vegetarian: veg, dairy_free: dairy, spicy,
    });
  };

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm text-[var(--foreground)]">{label}</span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#8b6914] focus:ring-offset-2 ${checked ? "bg-[#8b6914]" : "bg-gray-200"}`}>
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ml-0.5 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );

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
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Name *</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914]" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Description</label>
              <textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#8b6914]" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Price *</label>
                <input type="number" step="0.01" min="0" value={price}
                  onChange={(e) => setPrice(e.target.value)} required
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914]" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-1.5">Category</label>
                <input
                  type="text"
                  list="cat-suggestions"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Mains"
                  className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
                />
                <datalist id="cat-suggestions">
                  {categories.map((c) => <option key={c} value={c} />)}
                </datalist>
                {(() => {
                  const matched = categories.find(c => c.toLowerCase() === category.toLowerCase());
                  if (matched) {
                    return (
                      <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                        Adding to existing &ldquo;{matched}&rdquo;
                      </p>
                    );
                  }
                  const suggestions = categories.filter(c => category.trim() && c.toLowerCase().includes(category.toLowerCase())).slice(0, 3);
                  if (category.trim() && !matched && suggestions.length > 0) {
                    return (
                      <div className="mt-1 flex gap-1 flex-wrap">
                        {suggestions.map(c => (
                          <button key={c} type="button" onClick={() => setCategory(c)}
                            className="text-xs bg-[#8b6914]/10 text-[#8b6914] rounded-lg px-2 py-1 hover:bg-[#8b6914]/20">
                            Use &ldquo;{c}&rdquo;
                          </button>
                        ))}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>
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
              <label className="block text-xs font-medium text-[var(--muted)] mt-3 mb-1">Or paste image URL</label>
              <input type="url" value={imgUrl} onChange={(e) => setImgUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-4 py-2.5 rounded-xl border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914]" />
            </div>
            <div className="flex items-center gap-3">
              <input id="avail" type="checkbox" checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--card-border)] text-[#8b6914] focus:ring-[#8b6914]" />
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
            className="flex-1 py-2.5 rounded-xl border border-[var(--card-border)] text-[var(--foreground)] font-medium text-sm hover:bg-[var(--background)] transition-colors">
            Cancel
          </button>
          <button type="submit" form="item-form" disabled={saving}
            className="flex-1 py-2.5 rounded-xl bg-[#8b6914] text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity">
            {saving ? "Saving…" : item ? "Update item" : "Add item"}
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
  style: QRStyleKey;
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
}) {
  const { slug, style, template, size, includeLogo, logoBg, logoBgShape, logoBgColor, tagline, header, logoUrl, canvas } = opts;
  const px = SIZES_MAP[size];
  const st = QR_STYLES_MAP[style];
  const url = window.location.origin + "/menu/" + slug;

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: px, margin: 2,
    color: { dark: st.fg, light: st.bg },
    errorCorrectionLevel: "H",
  });

  const ctx = canvas.getContext("2d")!;
  const padding = px * 0.06;
  const headerH = template === "table" ? px * 0.12 : 0;
  const taglineH = (template === "tagline" || template === "table") ? px * 0.08 : 0;
  const watermarkH = px * 0.06;

  canvas.width = px + padding * 2;
  canvas.height = headerH + px + taglineH + watermarkH + padding * (headerH ? 3 : 2);

  ctx.fillStyle = st.bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  let y = padding;

  if (template === "table") {
    ctx.fillStyle = st.fg;
    ctx.font = `bold ${px * 0.07}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.fillText(header, canvas.width / 2, y + px * 0.08);
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
    ctx.fillStyle = st.fg;
    ctx.font = `${px * 0.04}px Georgia, serif`;
    ctx.textAlign = "center";
    ctx.fillText(tagline, canvas.width / 2, y + px * 0.04);
    y += taglineH;
  }

  // Watermark
  ctx.globalAlpha = 0.55;
  ctx.fillStyle = st.fg;
  ctx.font = `${px * 0.022}px system-ui, -apple-system, sans-serif`;
  ctx.textAlign = "right";
  const wmY = canvas.height - padding * 0.5;
  ctx.fillText("dinelinks.com", canvas.width - padding, wmY);
  const dlX = canvas.width - padding - ctx.measureText("dinelinks.com").width - px * 0.025;
  ctx.font = `bold ${px * 0.025 * 1.4}px Georgia, serif`;
  ctx.fillText("DL", dlX, wmY);
  ctx.globalAlpha = 1;
}

function QRModal({ slug, restaurant, onClose }: { slug: string; restaurant: Restaurant | null; onClose: () => void }) {
  const logoUrl = (restaurant as Restaurant & { logo_url?: string | null })?.logo_url ?? null;
  const restaurantName = restaurant?.name ?? "Your Restaurant";

  const [qrStyle, setQrStyle]           = useState<QRStyleKey>("classic");
  const [qrTemplate, setQrTemplate]     = useState<"simple" | "tagline" | "table">("simple");
  const [qrSize, setQrSize]             = useState<QRSizeKey>("medium");
  const [qrIncludeLogo, setQrIncludeLogo] = useState(true);
  const [qrLogoBg, setQrLogoBg]         = useState(false);
  const [qrLogoBgShape, setQrLogoBgShape] = useState<"circle" | "square" | "rounded">("circle");
  const [qrLogoBgColor, setQrLogoBgColor] = useState("#ffffff");
  const [qrTagline, setQrTagline]       = useState("Scan to view our menu");
  const [qrHeader, setQrHeader]         = useState(restaurantName);
  const [isDownloading, setIsDownloading] = useState(false);

  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const downloadCanvasRef = useRef<HTMLCanvasElement>(null);

  const commonOpts = useCallback(() => ({
    slug,
    style: qrStyle,
    template: qrTemplate,
    size: qrSize,
    includeLogo: qrIncludeLogo,
    logoBg: qrLogoBg,
    logoBgShape: qrLogoBgShape,
    logoBgColor: qrLogoBgColor,
    tagline: qrTagline,
    header: qrHeader,
    logoUrl,
  }), [slug, qrStyle, qrTemplate, qrSize, qrIncludeLogo, qrLogoBg, qrLogoBgShape, qrLogoBgColor, qrTagline, qrHeader, logoUrl]);

  // Live preview at ~400px wide
  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;
    const previewCanvas = document.createElement("canvas");
    composeQR({ ...commonOpts(), size: "small", canvas: previewCanvas }).then(() => {
      const ctx = canvas.getContext("2d")!;
      canvas.width = previewCanvas.width;
      canvas.height = previewCanvas.height;
      ctx.drawImage(previewCanvas, 0, 0);
    }).catch(() => {});
  }, [commonOpts]);

  const downloadQR = async () => {
    setIsDownloading(true);
    try {
      const canvas = downloadCanvasRef.current ?? document.createElement("canvas");
      await composeQR({ ...commonOpts(), canvas });
      canvas.toBlob(blob => {
        if (!blob) return;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `dinelinks-qr-${qrTemplate}-${qrStyle}-${qrSize}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 1000);
      }, "image/png");
    } finally {
      setIsDownloading(false);
    }
  };

  const Toggle = ({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) => (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#8b6914] focus:ring-offset-2 ${checked ? "bg-[#8b6914]" : "bg-gray-200"}`}>
      <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ml-0.5 ${checked ? "translate-x-5" : "translate-x-0"}`} />
    </button>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4"
      style={{ animation: "fadeIn 0.15s ease-out" }}>
      <div className="flex flex-col w-full max-w-lg max-h-[90vh] overflow-hidden rounded-2xl bg-[var(--card)] shadow-2xl"
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

          {/* Live preview */}
          <div className="flex justify-center">
            <canvas
              ref={previewCanvasRef}
              className="max-w-[220px] w-full rounded-xl border border-[var(--card-border)] shadow-sm"
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          {/* Style */}
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Style</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.entries(QR_STYLES_MAP) as [QRStyleKey, { fg: string; bg: string }][]).map(([key, s]) => (
                <button key={key} type="button" onClick={() => setQrStyle(key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${qrStyle === key ? "border-[#8b6914] bg-[#8b6914]/10 text-[#8b6914]" : "border-[var(--card-border)] text-[var(--foreground)] hover:border-[#8b6914]/50"}`}>
                  <span className="flex gap-1">
                    <span className="inline-block w-3 h-3 rounded-full border border-gray-200" style={{ background: s.fg }} />
                    <span className="inline-block w-3 h-3 rounded-full border border-gray-200" style={{ background: s.bg }} />
                  </span>
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Template */}
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--muted)] mb-3">Template</p>
            <div className="grid grid-cols-3 gap-3">
              {([
                { id: "simple" as const, label: "QR only" },
                { id: "tagline" as const, label: "With tagline" },
                { id: "table" as const, label: "Table card" },
              ]).map(t => (
                <div key={t.id} onClick={() => setQrTemplate(t.id)}
                  className={`cursor-pointer rounded-xl border-2 p-3 text-center transition-all ${qrTemplate === t.id ? "border-[#8b6914]" : "border-[var(--card-border)] hover:border-[#8b6914]/40"}`}>
                  <div className="bg-white rounded-lg p-2 mb-2 flex flex-col items-center gap-1 min-h-[80px] justify-center border border-gray-100">
                    {t.id === "table" && (
                      <input type="text" value={qrHeader} onChange={e => setQrHeader(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-full text-center text-[9px] border border-gray-200 rounded px-1 py-0.5 mb-1 font-bold" />
                    )}
                    <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center text-[8px] text-gray-400">QR</div>
                    {(t.id === "tagline" || t.id === "table") && (
                      <input type="text" value={qrTagline} onChange={e => setQrTagline(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-full text-center text-[9px] border border-gray-200 rounded px-1 py-0.5 mt-1" />
                    )}
                  </div>
                  <span className="text-xs text-[var(--muted)]">{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Size */}
          <div>
            <p className="text-xs uppercase tracking-widest text-[var(--muted)] mb-2">Output size</p>
            <div className="flex gap-2">
              {(["small", "medium", "large"] as QRSizeKey[]).map(s => (
                <button key={s} type="button" onClick={() => setQrSize(s)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${qrSize === s ? "border-[#8b6914] bg-[#8b6914]/10 text-[#8b6914]" : "border-[var(--card-border)] text-[var(--foreground)] hover:border-[#8b6914]/50"}`}>
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
                <div className="space-y-3 pt-2 border-t border-[var(--card-border)]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--foreground)]">Add background behind logo</span>
                    <Toggle checked={qrLogoBg} onChange={setQrLogoBg} />
                  </div>
                  {qrLogoBg && (
                    <div className="flex gap-3 items-center flex-wrap">
                      {(["circle", "square", "rounded"] as const).map(shape => (
                        <button key={shape} type="button" onClick={() => setQrLogoBgShape(shape)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${qrLogoBgShape === shape ? "border-[#8b6914] bg-[#8b6914]/10 text-[#8b6914]" : "border-[var(--card-border)] text-[var(--foreground)]"}`}>
                          {shape}
                        </button>
                      ))}
                      <div className="flex items-center gap-2 ml-auto">
                        <span className="text-xs text-[var(--muted)]">Color</span>
                        <div className="relative w-8 h-8">
                          <input type="color" value={qrLogoBgColor} onChange={e => setQrLogoBgColor(e.target.value)}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" />
                          <div className="w-8 h-8 rounded-lg border-2 border-[var(--card-border)] shadow-sm" style={{ background: qrLogoBgColor }} />
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
          <button type="button" onClick={downloadQR} disabled={isDownloading}
            className="w-full py-2.5 rounded-xl bg-[#8b6914] text-white font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
            {isDownloading ? "Generating…" : "Download PNG"}
          </button>
        </div>
        <canvas ref={downloadCanvasRef} className="hidden" />
      </div>
    </div>
  );
}
