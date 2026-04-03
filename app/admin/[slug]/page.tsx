export const dynamic = "force-dynamic";
import { redirect, notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/app/lib/supabase";
import { CATEGORY_ORDER } from "@/app/lib/constants";
import type { MenuItemRow } from "@/app/lib/constants";
import type { Restaurant, CategoryNote } from "@/app/lib/supabase";
import { AdminMenuEditor } from "./AdminMenuEditor";

type Props = { params: Promise<{ slug: string }> };

export default async function AdminSlugPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, slug, name, main_color, accent_color, background_color, font_family, font_color, hero_image_url, owner_id")
    .eq("slug", slug)
    .eq("owner_id", user.id)
    .maybeSingle<Restaurant>();

  if (!restaurant) notFound();

  const [{ data: menuItems, error: menuError }, { data: categoryNotesRows }] = await Promise.all([
    supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("name", { ascending: true }),
    supabase.from("category_notes").select("category, note").eq("restaurant_id", restaurant.id),
  ]);

  if (menuError) return <div className="min-h-screen flex items-center justify-center p-6"><p className="text-red-600">Error: {menuError.message}</p></div>;

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

  const initialCategoryNotes: Record<string, string> = {};
  for (const row of (categoryNotesRows ?? []) as Pick<CategoryNote, "category" | "note">[]) {
    initialCategoryNotes[row.category] = row.note ?? "";
  }

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
      <AdminMenuEditor
        restaurantId={restaurant.id}
        restaurantSlug={slug}
        initialGrouped={grouped}
        initialSortedCategories={sortedCategories}
        initialRestaurant={restaurant}
        initialCategoryNotes={initialCategoryNotes}
      />
    </>
  );
}
