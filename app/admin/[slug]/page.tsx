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
    .select("id, slug, name, main_color, accent_color, background_color, font_family, font_color, hero_image_url, logo_url, owner_id, brand_primary_1, brand_secondary_1, brand_bg_1, brand_font_1, brand_primary_2, brand_secondary_2, brand_bg_2, brand_font_2, muted_color, title_color")
    .eq("slug", slug)
    .eq("owner_id", user.id)
    .maybeSingle<Restaurant>();

  if (!restaurant) notFound();

  const [{ data: menuItems, error: menuError }, { data: categoryNotesRows }, { data: dbCategories }] = await Promise.all([
    supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("category_notes").select("category, note").eq("restaurant_id", restaurant.id),
    supabase.from("restaurant_categories").select("name").eq("restaurant_id", restaurant.id).order("sort_order", { ascending: true }),
  ]);

  if (menuError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-red-600">Error loading menu: {menuError.message}</p>
      </div>
    );
  }

  const grouped = (menuItems ?? []).reduce<Record<string, MenuItemRow[]>>((acc, item) => {
    const cat = (item as MenuItemRow).category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item as MenuItemRow);
    return acc;
  }, {});

  // DB categories are source of truth for order; include orphaned item categories too
  const dbCategoryNames = (dbCategories ?? []).map((r: { name: string }) => r.name);
  const orphanCats = Object.keys(grouped).filter((c) => !dbCategoryNames.includes(c));
  const allCategories = [...dbCategoryNames, ...orphanCats];

  const sortedCategories = allCategories;

  const initialCategoryNotes: Record<string, string> = {};
  for (const row of (categoryNotesRows ?? []) as Pick<CategoryNote, "category" | "note">[]) {
    initialCategoryNotes[row.category] = row.note ?? "";
  }

  const fontColor  = restaurant.font_color ?? "#2c2a26";
  const accent     = restaurant.accent_color ?? "#2c2a26";
  const bg         = restaurant.background_color ?? "#faf8f5";
  const card       = restaurant.main_color ?? "#ffffff";
  const muted      = restaurant.muted_color ?? "#6b6560";
  const titleColor = restaurant.title_color ?? restaurant.font_color ?? "#ffffff";

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

  const themeStyle = `
    :root {
      --foreground: ${fontColor};
      --accent: ${accent};
      --background: ${bg};
      --card: ${card};
      --card-border: #e8e4dd;
      --muted: ${muted};
      --title: ${titleColor};
    }
    body { font-family: ${fontFamily}; color: ${fontColor}; }
  `;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      <AdminMenuEditor
        restaurantId={restaurant.id}
        restaurantSlug={slug}
        initialGrouped={grouped}
        initialSortedCategories={sortedCategories}
        initialAllCategories={allCategories}
        initialRestaurant={restaurant}
        initialCategoryNotes={initialCategoryNotes}
      />
    </>
  );
}
