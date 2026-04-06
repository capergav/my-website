export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabase";
import { CATEGORY_ORDER } from "@/app/lib/constants";
import type { MenuItemRow } from "@/app/lib/constants";
import { MenuTabs } from "@/app/components/MenuTabs";
import { HeroWithLang } from "@/app/components/HeroWithLang";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicMenuPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, hero_image_url, main_color, accent_color, background_color, font_family, font_color")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant) notFound();

  const [{ data: menuItems }, { data: categoryNotesRows }] = await Promise.all([
    supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).eq("available", true).order("name", { ascending: true }),
    supabase.from("category_notes").select("category, note").eq("restaurant_id", restaurant.id),
  ]);

  const categoryNotes: Record<string, string> = {};
  for (const row of (categoryNotesRows ?? []) as { category: string; note: string | null }[]) {
    if (row.note?.trim()) categoryNotes[row.category] = row.note.trim();
  }

  const grouped = (menuItems ?? []).reduce<Record<string, MenuItemRow[]>>((acc, item) => {
    const cat = (item as MenuItemRow).category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item as MenuItemRow);
    return acc;
  }, {});

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c)),
  ];

  const fontColor = restaurant.font_color ?? "#2c2a26";
  const accent    = restaurant.accent_color ?? "#8b6914";
  const bg        = restaurant.background_color ?? "#faf8f5";
  const card      = restaurant.main_color ?? "#ffffff";

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

  const themeStyle = `:root{--foreground:${fontColor};--accent:${accent};--background:${bg};--card:${card};}body{color:var(--foreground);font-family:${fontFamily};}`;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <HeroWithLang restaurantName={restaurant.name ?? undefined} heroImageUrl={restaurant.hero_image_url ?? undefined} />
        <MenuTabs grouped={grouped} sortedCategories={sortedCategories} categoryNotes={categoryNotes} />
      </main>
    </>
  );
}
