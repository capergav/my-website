"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createSupabaseClient } from "@/app/lib/supabase";
import { CATEGORY_ORDER } from "@/app/lib/constants";
import type { MenuItemRow } from "@/app/lib/constants";
import { MAIN_COLOR_OPTIONS, ACCENT_COLOR_OPTIONS } from "@/app/lib/themePresets";
import type { Restaurant } from "@/app/lib/supabase";

type Grouped = Record<string, MenuItemRow[]>;

type AdminMenuEditorProps = {
  restaurantId: string;
  initialGrouped: Grouped;
  initialSortedCategories: string[];
  initialRestaurant: Restaurant | null;
};

export function AdminMenuEditor({
  restaurantId,
  initialGrouped,
  initialSortedCategories,
  initialRestaurant,
}: AdminMenuEditorProps) {
  const [grouped, setGrouped] = useState<Grouped>(initialGrouped);
  const [sortedCategories, setSortedCategories] = useState<string[]>(
    initialSortedCategories
  );
  const [activeCategory, setActiveCategory] = useState(
    initialSortedCategories[0] ?? ""
  );
  const [editingItem, setEditingItem] = useState<MenuItemRow | null>(null);
  const [addingNew, setAddingNew] = useState(false);
  const [restaurant, setRestaurant] = useState<Restaurant | null>(initialRestaurant);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  const supabase = createSupabaseClient();

  const refreshMenu = useCallback(async () => {
    const { data, error } = await supabase
      .from("menu_items")
      .select("*")
      .order("name", { ascending: true });
    if (error) {
      setMessage({ type: "err", text: error.message });
      return;
    }
    const g: Grouped = {};
    (data ?? []).forEach((item: MenuItemRow) => {
      const cat = item.category || "Other";
      if (!g[cat]) g[cat] = [];
      g[cat].push(item);
    });
    const sorted = [
      ...CATEGORY_ORDER.filter((c) => g[c]),
      ...Object.keys(g).filter(
        (c) => !(CATEGORY_ORDER as readonly string[]).includes(c)
      ),
    ];
    setGrouped(g);
    setSortedCategories(sorted);
    if (sorted.length && !sorted.includes(activeCategory)) {
      setActiveCategory(sorted[0]);
    }
  }, [activeCategory, supabase]);

  const showMessage = (type: "ok" | "err", text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSaveItem = async (payload: Partial<MenuItemRow>) => {
    setSaving(true);
    if (editingItem?.id) {
      const { error } = await supabase
        .from("menu_items")
        .update(payload)
        .eq("id", editingItem.id);
      if (error) {
        showMessage("err", error.message);
      } else {
        showMessage("ok", "Item updated.");
        setEditingItem(null);
        await refreshMenu();
      }
    } else {
      const { error } = await supabase.from("menu_items").insert(payload);
      if (error) {
        showMessage("err", error.message);
      } else {
        showMessage("ok", "Item added.");
        setAddingNew(false);
        await refreshMenu();
      }
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    setSaving(true);
    const { error } = await supabase.from("menu_items").delete().eq("id", id);
    if (error) {
      showMessage("err", error.message);
    } else {
      showMessage("ok", "Item deleted.");
      setEditingItem(null);
      await refreshMenu();
    }
    setSaving(false);
  };

  const handleSaveTheme = async (updates: {
    main_color: string;
    accent_color: string;
    font_family?: string | null;
    font_color?: string | null;
    name?: string | null;
    hero_image_url?: string | null;
  }) => {
    setSaving(true);
    const { error } = await supabase
      .from("restaurants")
      .update(updates)
      .eq("id", restaurantId);
    if (error) {
      showMessage("err", error.message);
    } else {
      setRestaurant((prev) => (prev ? { ...prev, ...updates } : null));
      showMessage("ok", "Theme saved. Refresh the menu page to see changes.");
    }
    setSaving(false);
  };

  const items = grouped[activeCategory] ?? [];

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero-style header */}
      <div className="relative h-40 sm:h-48 overflow-hidden bg-[var(--foreground)]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/50 to-transparent pointer-events-none" />
        <div className="absolute top-4 end-4 flex flex-wrap items-center gap-3 z-20">
          <ThemeDropdowns
            restaurant={restaurant}
            onSave={handleSaveTheme}
            saving={saving}
          />
          <a
            href="https://menusnap-lac.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="min-h-[44px] px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-sm border border-white/40 inline-flex items-center justify-center"
          >
            View menu
          </a>
        </div>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-white drop-shadow-lg">
            Admin – Edit menu
          </h1>
        </div>
      </div>

      {message && (
        <div
          className={`sticky top-0 z-30 py-2 px-4 text-center text-sm font-medium ${
            message.type === "ok"
              ? "bg-green-600/90 text-white"
              : "bg-red-600/90 text-white"
          }`}
        >
          {message.text}
        </div>
      )}

      {sortedCategories.length === 0 ? (
        <div className="max-w-2xl mx-auto px-4 py-10 text-center text-[var(--muted)]">
          No categories yet. Add an item below.
        </div>
      ) : (
        <>
          {/* Category tabs */}
          <div className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--card-border)] shadow-sm">
            <div className="max-w-4xl mx-auto px-3 sm:px-6">
              <div className="tabs-scroll flex gap-2 overflow-x-auto py-3 scrollbar-none">
                {sortedCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`flex-shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      activeCategory === cat
                        ? "bg-[var(--accent)] text-white"
                        : "bg-[var(--card-border)]/50 text-[var(--muted)] hover:text-[var(--foreground)]"
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
              <h2 className="font-serif text-xl sm:text-3xl font-semibold">
                {activeCategory}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAddingNew(true);
                  setEditingItem(null);
                }}
                className="px-4 py-2 rounded-xl bg-[var(--accent)] text-white font-medium text-sm hover:opacity-90"
              >
                + Add item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`bg-[var(--card)] rounded-2xl border border-[var(--card-border)] overflow-hidden shadow-sm ${
                    item.available === false ? "opacity-60 grayscale" : ""
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-stretch">
                    {item.image_url && (
                      <div className="sm:w-40 aspect-video sm:aspect-square overflow-hidden bg-[var(--card-border)]">
                        <img
                          src={item.image_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-4 flex-1 min-w-0">
                      <div className="flex justify-between gap-2 flex-wrap items-baseline">
                        <div className="flex items-center gap-2">
                          <h3 className="font-serif text-lg font-semibold text-wrap-balance">
                            {item.name}
                          </h3>
                          {item.available === false && (
                            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              Unavailable
                            </span>
                          )}
                        </div>
                        <span className="font-medium text-[var(--accent)]">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-[var(--muted)] text-sm mt-1 line-clamp-2 text-wrap-force">
                          {item.description}
                        </p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3 items-center">
                        <AvailabilityToggle
                          available={item.available !== false}
                          onChange={async (next) => {
                            setSaving(true);
                            const { error } = await supabase
                              .from("menu_items")
                              .update({ available: next })
                              .eq("id", item.id);
                            if (error) {
                              showMessage("err", error.message);
                            } else {
                              showMessage(
                                "ok",
                                next ? "Item marked as available." : "Item marked as unavailable."
                              );
                              await refreshMenu();
                            }
                            setSaving(false);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setEditingItem(item);
                            setAddingNew(false);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[var(--card-border)] text-sm font-medium hover:bg-[var(--accent)]/20 text-[var(--accent)]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={saving}
                          className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 text-sm font-medium hover:bg-red-200 disabled:opacity-50"
                        >
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

      {/* Add / Edit form modal */}
      {(editingItem || addingNew) && (
        <ItemForm
          item={editingItem ?? undefined}
          categories={CATEGORY_ORDER.slice()}
          onSave={handleSaveItem}
          onCancel={() => {
            setEditingItem(null);
            setAddingNew(false);
          }}
          saving={saving}
        />
      )}
    </main>
  );
}

function AvailabilityToggle({
  available,
  onChange,
}: {
  available: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!available)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
        available
          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
          : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"
      }`}
    >
      <span
        className={`inline-block w-2 h-2 rounded-full ${
          available ? "bg-emerald-500" : "bg-gray-400"
        }`}
      />
      {available ? "Available" : "Unavailable"}
    </button>
  );
}

function ThemeDropdowns({
  restaurant,
  onSave,
  saving,
}: {
  restaurant: Restaurant | null;
  onSave: (updates: {
    main_color: string;
    accent_color: string;
    font_family?: string | null;
    font_color?: string | null;
    name?: string | null;
    hero_image_url?: string | null;
  }) => void;
  saving: boolean;
}) {
  const [main, setMain] = useState(restaurant?.main_color ?? MAIN_COLOR_OPTIONS[0].value);
  const [accent, setAccent] = useState(restaurant?.accent_color ?? ACCENT_COLOR_OPTIONS[0].value);
  const [fontFamily, setFontFamily] = useState<string>(restaurant?.font_family ?? "sans");
  const [fontColor, setFontColor] = useState<string>(restaurant?.font_color ?? "#2c2a26");
  const [restaurantName, setRestaurantName] = useState<string>(
    restaurant?.name ?? ""
  );
  const [heroImageUrl, setHeroImageUrl] = useState<string>(
    restaurant?.hero_image_url ?? ""
  );
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  useEffect(() => {
    if (restaurant) {
      if (restaurant.main_color) setMain(restaurant.main_color);
      if (restaurant.accent_color) setAccent(restaurant.accent_color);
      if (restaurant.font_family) setFontFamily(restaurant.font_family);
      if (restaurant.font_color) setFontColor(restaurant.font_color);
      if (restaurant.name != null) setRestaurantName(restaurant.name);
      if (restaurant.hero_image_url != null) setHeroImageUrl(restaurant.hero_image_url);
    }
  }, [restaurant]);

  const handleSaveClick = () => {
    console.log("saving theme");
    onSave({
      main_color: main,
      accent_color: accent,
      font_family: fontFamily,
      font_color: fontColor.trim() || null,
      name: restaurantName.trim() || null,
      hero_image_url: heroImageUrl.trim() || null,
    });
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className="min-h-[44px] px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white font-medium text-sm border border-white/40 flex items-center gap-2 cursor-pointer"
      >
        Theme & branding
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="w-full max-w-md rounded-2xl bg-[var(--card)] border border-[var(--card-border)] shadow-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">
                Theme & branding
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                  Primary color
                </p>
                <select
                  value={main}
                  onChange={(e) => setMain(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)]"
                >
                  {MAIN_COLOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                  Secondary color
                </p>
                <select
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)]"
                >
                  {ACCENT_COLOR_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                  Font family
                </p>
                <select
                  value={fontFamily}
                  onChange={(e) => setFontFamily(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)]"
                >
                  <option value="sans">Modern Sans (default)</option>
                  <option value="serif">Elegant Serif</option>
                  <option value="mono">Mono</option>
                </select>
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                  Font color (menu text)
                </p>
                <input
                  type="color"
                  value={fontColor}
                  onChange={(e) => setFontColor(e.target.value)}
                  className="w-full h-10 rounded-lg border border-[var(--card-border)] bg-[var(--background)] cursor-pointer"
                />
                <p className="text-xs text-[var(--muted)] mt-1">
                  Applied to text on the public menu
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                  Restaurant name
                </p>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                  placeholder="e.g. La Piazza"
                  className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)]"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-[var(--foreground)] mb-2">
                  Hero image URL
                </p>
                <input
                  type="url"
                  value={heroImageUrl}
                  onChange={(e) => setHeroImageUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-[var(--foreground)]"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveClick}
                disabled={saving}
                className="w-full py-2 rounded-lg bg-[var(--accent)] text-white font-medium disabled:opacity-50 cursor-pointer"
              >
                Save theme
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemForm({
  item,
  categories,
  onSave,
  onCancel,
  saving,
}: {
  item?: MenuItemRow;
  categories: readonly string[];
  onSave: (p: Partial<MenuItemRow>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [price, setPrice] = useState(
    item != null ? String(Number(item.price)) : ""
  );
  const [image_url, setImageUrl] = useState(item?.image_url ?? "");
  const [category, setCategory] = useState(item?.category ?? "Other");
  const [available, setAvailable] = useState<boolean>(item?.available ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = Number.parseFloat(price);
    if (!name.trim() || Number.isNaN(p) || p < 0) return;
    onSave({
      name: name.trim(),
      description: description.trim() || null,
      price: p,
      image_url: image_url.trim() || null,
      category: category || "Other",
      available,
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div
        className="bg-[var(--card)] rounded-2xl border border-[var(--card-border)] shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h3 className="font-serif text-xl font-semibold mb-4">
            {item ? "Edit item" : "Add item"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-wrap-force"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)] text-wrap-force resize-y"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Image URL
              </label>
              <input
                type="url"
                value={image_url}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--foreground)] mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[var(--card-border)] bg-[var(--background)]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                id="available"
                type="checkbox"
                checked={available}
                onChange={(e) => setAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--card-border)] text-[var(--accent)]"
              />
              <label
                htmlFor="available"
                className="text-sm font-medium text-[var(--foreground)]"
              >
                Available
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 py-2 rounded-lg border border-[var(--card-border)] font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2 rounded-lg bg-[var(--accent)] text-white font-medium disabled:opacity-50"
              >
                {saving ? "Saving…" : item ? "Update" : "Add"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
