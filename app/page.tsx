export const dynamic = "force-dynamic";

import { createSupabaseClient, type SiteSettings } from "./lib/supabase";
import { CATEGORY_ORDER } from "./lib/constants";
import { MenuTabs } from "./components/MenuTabs";
import { HeroWithLang } from "./components/HeroWithLang";

export default async function Home() {
  const supabase = createSupabaseClient();

  const [{ data: menuItems, error }, { data: siteSettings }] = await Promise.all([
    supabase
      .from("menu_items")
      .select("*")
      .order("name", { ascending: true }),
    supabase
      .from("site_settings")
      .select("restaurant_name, hero_image_url")
      .limit(1)
      .maybeSingle<SiteSettings>(),
  ]);

  if (error) {
    return (
      <div className="p-10 text-red-600">
        Error loading menu: {error.message}
      </div>
    );
  }

  // Only show items that are available (treat null/undefined as available)
  const visibleItems =
    (menuItems ?? []).filter((item: any) => item.available !== false) ?? [];

  const grouped =
    visibleItems.reduce((acc: any, item: any) => {
      const category = item.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {}) ?? {};

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter(
      (c) => !(CATEGORY_ORDER as readonly string[]).includes(c)
    ),
  ];

  return (
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <HeroWithLang
        restaurantName={siteSettings?.restaurant_name ?? undefined}
        heroImageUrl={siteSettings?.hero_image_url ?? undefined}
      />

      {/* Tabs + menu content */}
      <MenuTabs grouped={grouped} sortedCategories={sortedCategories} />
    </main>
  );
}
