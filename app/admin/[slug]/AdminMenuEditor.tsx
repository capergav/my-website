"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseClient } from "@/app/lib/supabase";
import { CATEGORY_ORDER } from "@/app/lib/constants";
import type { MenuItemRow } from "@/app/lib/constants";
import type { Restaurant } from "@/app/lib/supabase";
import { OnboardingTour } from "./OnboardingTour";
import { ImageUploader } from "./ImageUploader";

type Grouped = Record<string, MenuItemRow[]>;

type MenuItemWithSort = MenuItemRow & { sort_order?: number | null };

const DEFAULT_ACCENT    = "#8b6914";
const DEFAULT_BG        = "#faf8f5";
const DEFAULT_FONT_COLOR = "#2c2a26";
const DEFAULT_CARD      = "#ffffff";

const FONT_OPTIONS: { value: string; label: string; fontClass: string }[] = [
  { value: "sans",     label: "Geist Sans (default)",  fontClass: "font-geist-sans" },
  { value: "serif",    label: "Cormorant Garamond",     fontClass: "font-cormorant"  },
  { value: "mono",     label: "Geist Mono",             fontClass: "font-geist-mono" },
  { value: "poppins",  label: "Poppins",                fontClass: "font-poppins"    },
  { value: "playfair", label: "Playfair Display",       fontClass: "font-playfair"   },
  { value: "bebas",    label: "Bebas Neue",             fontClass: "font-bebas"      },
  { value: "pacifico", label: "Pacifico",               fontClass: "font-pacifico"   },
  { value: "orbitron", label: "Orbitron",               fontClass: "font-orbitron"   },
  { value: "cinzel",   label: "Cinzel",                 fontClass: "font-cinzel"     },
];

function getFontFamily(font?: string | null): string {
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

type AdminMenuEditorProps = {
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
}: AdminMenuEditorProps) {
  const router = useRouter();
  const [grouped, setGrouped]                   = useState<Grouped>(initialGrouped);
  const [sortedCategories, setSortedCategories] = useState<string[]>(initialSortedCategories);
  const [activeCategory, setActiveCategory]     = useState(initialSortedCategories[0] ?? "");
  const [editingItem, setEditingItem]           = useState<MenuItemRow | null>(null);
  const [addingNew, setAddingNew]               = useState(false);
  const [restaurant, setRestaurant]             = useState<Restaurant | null>(initialRestaurant);
  const [categoryNotes, setCategoryNotes]       = useState<Record<string, string>>(initialCategoryNotes);
  const [saving, setSaving]                     = useState(false);
  const [savingNote, setSavingNote]             = useState(false);
  const [message, setMessage]                   = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [tourKey, setTourKey]                   = useState(0);

  const supabase = createSupabaseClient();

  // ── Live theme update — applies instantly without page reload ─────────────
  useEffect(() => {
    if (!restaurant) return;
    const fontColor = restaurant.font_color ?? DEFAULT_FONT_COLOR;
    const accent    = restaurant.accent_color ?? DEFAULT_ACCENT;
    const bg        = restaurant.background_color ?? DEFAULT_BG;
    const card      = restaurant.main_color ?? DEFAULT_CARD;
    const ff        = getFontFamily(restaurant.font_family);
    let el = document.getElementById("menusnap-theme") as HTMLStyleElement | null;
    if (!el) {
      el = document.createElement("style");
      el.id = "menusnap-theme";
      document.head.appendChild(el);
    }
    el.textContent = `:root{--foreground:${fontColor};--accent:${accent};--background:${bg};--card:${card};}body{color:var(--foreground);font-family:${ff};}`;
  }, [restaurant]);

  const refreshMenu = useCallback(async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true });
    if (error) { setMessage({ type: "err", text: error.message }); return; }
    const g: Grouped = {};
    (data ?? []).forEach((item: MenuItemRow) => {
      const cat = item.category || "Other";
      if (!g[cat]) g[cat] = [];
      g[cat].push(item);
    });
    const sorted = [
      ...CATEGORY_ORDER.filter((c) => g[c]),
      ...Object.keys(g).filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c)),
    ];
    setGrouped(g);
    setSortedCategories(sorted);
    if (sorted.length && !sorted.includes(activeCategory)) setActiveCategory(sorted[0]);
  }, [activeCategory, restaurantId, supabase]);

  const showMessage = (type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleSaveItem = async (payload: Partial<MenuItemRow>) => {
    setSaving(true);
    if (editingItem?.id) {
      const { error } = await supabase.from("menu_items").update(payload).eq("id", editingItem.id);
      if (error) showMessage("err", error.message);
      else { showMessage("ok", "Item updated."); setEditingItem(null); await refreshMenu(); }
    } else {
      const { error } = await supabase.from("menu_items").insert({ ...payload, restaurant_id: restaurantId });
      if (error) showMessage("err", error.message);
      else { showMessage("ok", "Item added."); setAddingNew(false); await refreshMenu(); }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item? This cannot be undone.")) return;
    setSaving(true);
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) showMessage("err", error.message);
    else { showMessage("ok", "Item deleted."); setEditingItem(null); await refreshMenu(); }
    setSaving(false);
  };

  const handleSaveTheme = async (updates: {
    main_color: string; accent_color: string;
    background_color?: string | null; font_family?: string | null;
    font_color?: string | null; name?: string | null; hero_image_url?: string | null;
    logo_url?: string | null;
  }) => {
    setSaving(true);
    const { error } = await supabase.from("restaurants").update(updates).eq("id", restaurantId);
    if (error) showMessage("err", error.message);
    else {
      setRestaurant((prev) => (prev ? { ...prev, ...updates } : null));
      showMessage("ok", "Theme saved.");
    }
    setSaving(false);
  };

  const handleSaveCategoryNote = async (category: string, note: string) => {
    setSavingNote(true);
    const { error } = await supabase.from("category_notes").upsert(
      { restaurant_id: restaurantId, category, note: note.trim() || null },
      { onConflict: "restaurant_id,category" }
    );
    if (error) showMessage("err", error.message);
    else { setCategoryNotes((prev) => ({ ...prev, [category]: note.trim() })); showMessage("ok", "Note saved."); }
    setSavingNote(false);
  };

  const items  = grouped[activeCategory] ?? [];
  const isEmpty = sortedCategories.length === 0;

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">

      {/* ── Header — dark base, hero image fills it when set ─────────────────── */}
      <div className="relative h-48 sm:h-56 overflow-hidden bg-[#1a1816]">
        {/* Hero image — full bleed, no opacity reduction */}
        {restaurant?.hero_image_url ? (
          <img
            src={restaurant.hero_image_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : null}
        {/* Gradient always on top so buttons and title stay readable */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/20" />

        {/* Action row */}
        <div className="absolute top-4 end-4 flex items-center gap-2 z-20 flex-wrap justify-end">
          <div data-tour="tour-theme">
            <ThemeDropdowns restaurant={restaurant} onSave={handleSaveTheme} saving={saving} />
          </div>
          <a
            href={`/menu/${restaurantSlug}`}
            target="_blank"
            rel="noopener noreferrer"
            data-tour="tour-view-menu"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium border border-white/25 inline-flex items-center gap-1.5 transition-colors"
          >
            View menu
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
          <button
            type="button"
            onClick={handleSignOut}
            data-tour="tour-signout"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/20 inline-flex items-center transition-colors"
          >
            Sign out
          </button>
          <button
            type="button"
            title="Restart onboarding tour"
            onClick={() => { localStorage.removeItem("menusnap_tour_v1_done"); setTourKey((k) => k + 1); }}
            className="min-h-[44px] w-11 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-semibold border border-white/20 inline-flex items-center justify-center transition-colors"
          >
            ?
          </button>
        </div>

        {/* Logo + restaurant name — top left, mobile-friendly */}
        <div className="absolute top-4 start-4 flex items-center gap-3 z-20">
          {restaurant?.logo_url && (
            <img
              src={restaurant.logo_url}
              alt="Logo"
              className="h-10 w-10 sm:h-12 sm:w-12 object-contain drop-shadow-md flex-shrink-0"
              style={{ background: "transparent" }}
            />
          )}
          <div>
            <p className="text-white/50 text-[10px] font-medium uppercase tracking-widest leading-none mb-0.5">
              Admin Panel
            </p>
            <h1 className="font-serif text-lg sm:text-xl font-semibold text-white drop-shadow-md leading-tight">
              {restaurant?.name ?? "Your Restaurant"}
            </h1>
          </div>
        </div>
      </div>

      {/* Toast notification */}
      {message && (
        <div className={`sticky top-0 z-30 py-2.5 px-4 text-center text-sm font-medium ${
          message.type === "ok" ? "bg-green-600 text-white" : "bg-red-600 text-white"
        }`}>
          {message.text}
        </div>
      )}

      {/* ── Empty state ─────────────────────────────────────────────────────── */}
      {isEmpty && (
        <div className="max-w-2xl mx-auto px-6 py-20 flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 rounded-3xl bg-[var(--accent)]/10 flex items-center justify-center text-4xl">🍽️</div>
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[var(--foreground)] mb-2">Your menu is empty</h2>
            <p className="text-[var(--muted)] text-sm max-w-xs mx-auto leading-relaxed">
              Add your first dish and it will appear here, organised into categories automatically.
            </p>
          </div>
          <button
            type="button"
            data-tour="tour-add-item"
            onClick={() => { setAddingNew(true); setEditingItem(null); }}
            className="px-8 py-3 rounded-xl bg-[var(--accent)] text-white font-medium hover:opacity-90 transition-opacity shadow-sm"
          >
            + Add your first item
          </button>
        </div>
      )}

      {/* ── Menu content ─────────────────────────────────────────────────────── */}
      {!isEmpty && (
        <>
          {/* Category tabs */}
          <div className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--card-border)] shadow-sm">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">
              <div className="tabs-scroll flex gap-2 overflow-x-auto py-3 scrollbar-none px-1">
                {sortedCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-[var(--accent)] text-white shadow-sm"
                        : "bg-[var(--card)] border border-[var(--card-border)] text-[var(--muted)] hover:text-[var(--foreground)]"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
            <div className="flex justify-between items-center mb-5">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold">{activeCategory}</h2>
              <button
                type="button"
                data-tour="tour-add-item"
                onClick={() => { setAddingNew(true); setEditingItem(null); }}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90 transition-opacity shadow-sm"
              >
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
              {items.map((item) => {
                const row = item as MenuItemWithSort;
                return (
                <div
                  key={item.id}
                  className={`bg-[var(--card)] rounded-2xl border border-[var(--card-border)] overflow-hidden shadow-sm transition-opacity ${
                    item.available === false ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-stretch">
                    {item.image_url && (
                      <div className="sm:w-36 aspect-video sm:aspect-square overflow-hidden bg-[var(--card-border)] flex-shrink-0">
                        <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-4 flex-1 min-w-0">
                      <div className="flex justify-between gap-2 flex-wrap items-start">
                        <div className="flex items-center gap-2 min-w-0 flex-wrap">
                          <h3 className="font-serif text-base font-semibold text-wrap-balance">{item.name}</h3>
                          {item.available === false && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <span className="font-semibold text-[var(--accent)] tabular-nums flex-shrink-0">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[var(--muted)] text-sm mt-1 line-clamp-2 text-wrap-force">{item.description}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3 items-center">
                        <AvailabilityToggle
                          available={item.available !== false}
                          onChange={async (next) => {
                            setSaving(true);
                            const { error } = await supabase.from("menu_items").update({ available: next }).eq("id", item.id);
                            if (error) showMessage("err", error.message);
                            else { showMessage("ok", next ? "Marked available." : "Marked unavailable."); await refreshMenu(); }
                            setSaving(false);
                          }}
                        />
                        {/* Sort order buttons */}
                        <div className="inline-flex rounded-lg border border-[var(--card-border)] overflow-hidden">
                          <button
                            type="button"
                            title="Move up"
                            disabled={saving || items.indexOf(item) === 0}
                            onClick={async () => {
                              const idx = items.indexOf(item);
                              if (idx <= 0) return;
                              const prev = items[idx - 1] as MenuItemWithSort;
                              setSaving(true);
                              await Promise.all([
                                supabase.from("menu_items").update({ sort_order: (prev.sort_order ?? idx) }).eq("id", item.id),
                                supabase.from("menu_items").update({ sort_order: (row.sort_order ?? idx - 1) + 1 }).eq("id", prev.id),
                              ]);
                              await refreshMenu();
                              setSaving(false);
                            }}
                            className="px-2 py-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)] disabled:opacity-30 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <div className="w-px bg-[var(--card-border)]" />
                          <button
                            type="button"
                            title="Move down"
                            disabled={saving || items.indexOf(item) === items.length - 1}
                            onClick={async () => {
                              const idx = items.indexOf(item);
                              if (idx >= items.length - 1) return;
                              const nextItem = items[idx + 1] as MenuItemWithSort;
                              setSaving(true);
                              await Promise.all([
                                supabase.from("menu_items").update({ sort_order: (nextItem.sort_order ?? idx + 1) }).eq("id", item.id),
                                supabase.from("menu_items").update({ sort_order: (row.sort_order ?? idx) }).eq("id", nextItem.id),
                              ]);
                              await refreshMenu();
                              setSaving(false);
                            }}
                            className="px-2 py-1.5 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)] disabled:opacity-30 transition-colors"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setEditingItem(item); setAddingNew(false); }}
                          className="px-3 py-1.5 rounded-lg bg-[var(--card-border)] text-sm font-medium hover:bg-[var(--accent)]/15 text-[var(--accent)] transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-medium hover:bg-red-100 disabled:opacity-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Item modal */}
      {(editingItem || addingNew) && (
        <ItemForm
          item={editingItem ?? undefined}
          categories={CATEGORY_ORDER.slice()}
          restaurantSlug={restaurantSlug}
          onSave={handleSaveItem}
          onCancel={() => { setEditingItem(null); setAddingNew(false); }}
          saving={saving}
        />
      )}

      {/* Onboarding tour */}
      <OnboardingTour tourKey={tourKey} />
    </main>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AvailabilityToggle({ available, onChange }: { available: boolean; onChange: (next: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!available)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        available
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
      }`}
    >
      <span className={`inline-block w-2 h-2 rounded-full ${available ? "bg-emerald-500" : "bg-gray-400"}`} />
      {available ? "Available" : "Unavailable"}
    </button>
  );
}

function CategoryNoteEditor({
  category, initialNote, onSave, saving,
}: {
  category: string; initialNote: string;
  onSave: (category: string, note: string) => void; saving: boolean;
}) {
  const [note, setNote] = useState(initialNote);
  useEffect(() => { setNote(initialNote); }, [initialNote]);
  return (
    <div className="mb-6 p-4 rounded-xl border border-[var(--card-border)] bg-[var(--card)]">
      <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">
        Category note for &ldquo;{category}&rdquo;
      </label>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="e.g. All pizzas are 12 inches and serve 2–3 people."
        rows={2}
        className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)] text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
      />
      <button
        type="button"
        onClick={() => onSave(category, note)}
        disabled={saving}
        className="mt-2 px-4 py-1.5 rounded-lg bg-[var(--accent)] text-white text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {saving ? "Saving…" : "Save note"}
      </button>
    </div>
  );
}

function ThemeDropdowns({
  restaurant, onSave, saving,
}: {
  restaurant: Restaurant | null;
  onSave: (updates: {
    main_color: string; accent_color: string;
    background_color?: string | null; font_family?: string | null;
    font_color?: string | null; name?: string | null; hero_image_url?: string | null;
    logo_url?: string | null;
  }) => void;
  saving: boolean;
}) {
  const [card, setCard]         = useState(DEFAULT_CARD);
  const [accent, setAccent]     = useState(DEFAULT_ACCENT);
  const [bg, setBg]             = useState(DEFAULT_BG);
  const [fontColor, setFontColor] = useState(DEFAULT_FONT_COLOR);
  const [fontFamily, setFont]   = useState("sans");
  const [name, setName]         = useState("");
  const [heroUrl, setHeroUrl]   = useState("");
  const [logoUrl, setLogoUrl]   = useState("");
  const [open, setOpen]         = useState(false);
  const [fontOpen, setFontOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function outside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, [open]);

  useEffect(() => {
    if (open && restaurant) {
      setCard(restaurant.main_color ?? DEFAULT_CARD);
      setAccent(restaurant.accent_color ?? DEFAULT_ACCENT);
      setBg(restaurant.background_color ?? DEFAULT_BG);
      setFontColor(restaurant.font_color ?? DEFAULT_FONT_COLOR);
      setFont(restaurant.font_family ?? "sans");
      setName(restaurant.name ?? "");
      setHeroUrl(restaurant.hero_image_url ?? "");
      setLogoUrl(restaurant.logo_url ?? "");
      setFontOpen(false);
    }
  }, [open, restaurant]);

  const colorFields = [
    { label: "Card / box background", value: card,      set: setCard      },
    { label: "Accent / brand colour", value: accent,    set: setAccent    },
    { label: "Page background",       value: bg,        set: setBg        },
    { label: "Text colour",           value: fontColor, set: setFontColor },
  ] as const;

  return (
    <div ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="min-h-[44px] px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-sm font-medium border border-white/25 flex items-center gap-2 cursor-pointer transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        Theme
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Sticky header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-8 py-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Theme & branding</h2>
                <p className="text-xs text-gray-400 mt-0.5">Changes apply instantly after saving</p>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="px-8 py-6 space-y-8">

              {/* Restaurant details */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Restaurant details</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Restaurant name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. La Piazza"
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914] transition-shadow"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo</label>
                    <p className="text-xs text-gray-400 mb-2">Use a PNG with a transparent background for best results. Shown top-left on the admin header.</p>
                    <ImageUploader
                      currentUrl={logoUrl}
                      onUploaded={(url) => setLogoUrl(url)}
                      folder="logos"
                      aspectRatio="square"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Hero / banner image</label>
                    <ImageUploader
                      currentUrl={heroUrl}
                      onUploaded={(url) => setHeroUrl(url)}
                      folder="hero"
                      aspectRatio="video"
                    />
                  </div>
                </div>
              </section>

              {/* Colours */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Colours</h3>
                <div className="grid grid-cols-2 gap-4">
                  {colorFields.map(({ label, value, set }) => (
                    <div key={label} className="rounded-2xl border border-gray-100 bg-gray-50 p-4 flex flex-col gap-3">
                      <label className="block text-xs font-semibold text-gray-500">{label}</label>
                      <div className="flex items-center gap-3">
                        {/* Styled swatch — native picker is invisible on top */}
                        <div className="relative flex-shrink-0">
                          <input
                            type="color"
                            value={value}
                            onChange={(e) => set(e.target.value)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          />
                          <div
                            className="w-12 h-12 rounded-xl border-2 border-white shadow-md"
                            style={{ background: value }}
                          />
                        </div>
                        <span className="text-xs font-mono text-gray-400 uppercase tracking-wide">{value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* Font */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Font</h3>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setFontOpen((o) => !o)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-[#8b6914] transition-shadow"
                  >
                    <span className={FONT_OPTIONS.find((o) => o.value === fontFamily)?.fontClass ?? "font-geist-sans"}>
                      {FONT_OPTIONS.find((o) => o.value === fontFamily)?.label ?? "Geist Sans"}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${fontOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {fontOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 py-1 rounded-xl border border-gray-200 bg-white shadow-xl z-10 max-h-52 overflow-y-auto">
                      {FONT_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => { setFont(opt.value); setFontOpen(false); }}
                          className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 transition-colors ${opt.fontClass} ${fontFamily === opt.value ? "text-[#8b6914] font-medium" : "text-gray-700"}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </section>

              {/* Save */}
              <button
                type="button"
                onClick={() => {
                  onSave({
                    main_color:       card,
                    accent_color:     accent,
                    background_color: bg || null,
                    font_family:      fontFamily,
                    font_color:       fontColor || null,
                    name:             name.trim() || null,
                    hero_image_url:   heroUrl.trim() || null,
                    logo_url:         logoUrl.trim() || null,
                  });
                  setOpen(false);
                }}
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-[#8b6914] text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity shadow-sm"
              >
                {saving ? "Saving…" : "Save theme"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemForm({
  item, categories, restaurantSlug, onSave, onCancel, saving,
}: {
  item?: MenuItemRow; categories: readonly string[]; restaurantSlug: string;
  onSave: (p: Partial<MenuItemRow>) => void; onCancel: () => void; saving: boolean;
}) {
  const [name, setName]           = useState(item?.name ?? "");
  const [description, setDesc]    = useState(item?.description ?? "");
  const [price, setPrice]         = useState(item != null ? String(Number(item.price)) : "");
  const [imageUrl, setImageUrl]   = useState(item?.image_url ?? "");
  const [category, setCategory]   = useState(item?.category ?? "Other");
  const [available, setAvailable] = useState<boolean>(item?.available ?? true);
  const [chefs_favorite, setChef] = useState<boolean>(item?.chefs_favorite ?? false);
  const [gluten_free, setGluten]  = useState<boolean>(item?.gluten_free ?? false);
  const [nut_free, setNut]        = useState<boolean>(item?.nut_free ?? false);
  const [vegan, setVegan]         = useState<boolean>(item?.vegan ?? false);
  const [vegetarian, setVeg]      = useState<boolean>(item?.vegetarian ?? false);
  const [dairy_free, setDairy]    = useState<boolean>(item?.dairy_free ?? false);
  const [spicy, setSpicy]         = useState<boolean>(item?.spicy ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number.parseFloat(price);
    if (!name.trim() || Number.isNaN(p) || p < 0) return;
    onSave({
      name: name.trim(), description: description.trim() || null, price: p,
      image_url: imageUrl.trim() || null, category: category || "Other",
      available, chefs_favorite, gluten_free: gluten_free, nut_free: nut_free,
      vegan, vegetarian, dairy_free: dairy_free, spicy,
    });
  };

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) => (
    <div className="flex items-center justify-between gap-3 py-1">
      <span className="text-sm text-gray-700">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#8b6914] focus:ring-offset-2 ${checked ? "bg-[#8b6914]" : "bg-gray-200"}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transition-transform mt-0.5 ml-0.5 ${checked ? "translate-x-5" : "translate-x-0"}`} />
      </button>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <h3 className="font-serif text-lg font-semibold text-gray-900">{item ? "Edit item" : "Add item"}</h3>
          <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Image */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-2">Photo</label>
              <ImageUploader
                currentUrl={imageUrl}
                onUploaded={(url) => setImageUrl(url)}
                folder={`items/${restaurantSlug}`}
                aspectRatio="video"
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
              />
            </div>

            {/* Price + Category */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Price *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#8b6914]"
                >
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Available */}
            <div className="flex items-center gap-3">
              <input
                id="available"
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#8b6914] focus:ring-[#8b6914]"
              />
              <label htmlFor="available" className="text-sm font-medium text-gray-700">Listed as available</label>
            </div>

            {/* Dietary */}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-3">Dietary & highlights</p>
              <div className="space-y-0.5">
                <Toggle label="Chef's favourite"  checked={chefs_favorite} onChange={setChef}   />
                <Toggle label="Gluten free"        checked={gluten_free}    onChange={setGluten} />
                <Toggle label="Nut free"           checked={nut_free}       onChange={setNut}    />
                <Toggle label="Vegan"              checked={vegan}          onChange={setVegan}  />
                <Toggle label="Vegetarian"         checked={vegetarian}     onChange={setVeg}    />
                <Toggle label="Dairy free"         checked={dairy_free}     onChange={setDairy}  />
                <Toggle label="Spicy"              checked={spicy}          onChange={setSpicy}  />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-[#8b6914] text-white font-medium text-sm disabled:opacity-50 hover:opacity-90 transition-opacity"
              >
                {saving ? "Saving…" : item ? "Update item" : "Add item"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
