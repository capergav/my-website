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

  const main = restaurant.main_color ?? "#2c2a26";
  const accent = restaurant.accent_color ?? "#8b6914";
  const bg = restaurant.background_color ?? "#faf8f5";
  const fontColor = restaurant.font_color ?? main;
  let fontVar = "--font-body:var(--font-geist-sans);";
  switch (restaurant.font_family) {
    case "serif": fontVar = "--font-body:var(--font-cormorant);"; break;
    case "mono": fontVar = "--font-body:var(--font-geist-mono);"; break;
    case "poppins": fontVar = "--font-body:var(--font-poppins);"; break;
    case "playfair": fontVar = "--font-body:var(--font-playfair);"; break;
    case "bebas": fontVar = "--font-body:var(--font-bebas);"; break;
    case "pacifico": fontVar = "--font-body:var(--font-pacifico);"; break;
    case "orbitron": fontVar = "--font-body:var(--font-orbitron);"; break;
    case "cinzel": fontVar = "--font-body:var(--font-cinzel);"; break;
  }
  const themeStyle = `:root{--foreground:${fontColor};--accent:${accent};--background:${bg};${fontVar}}body{color:var(--foreground);font-family:var(--font-body,var(--font-geist-sans)),system-ui,sans-serif}`;

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
