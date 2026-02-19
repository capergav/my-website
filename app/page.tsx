export const dynamic = "force-dynamic";

import { createSupabaseClient } from "./lib/supabase";
import { CATEGORY_ORDER } from "./lib/constants";
import { MenuTabs } from "./components/MenuTabs";
import { HeroWithLang } from "./components/HeroWithLang";

const supabase = createSupabaseClient();

export default async function Home() {
  const { data: menuItems, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    return (
      <div className="p-10 text-red-600">
        Error loading menu: {error.message}
      </div>
    );
  }

  const grouped = menuItems?.reduce((acc: any, item: any) => {
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
      <HeroWithLang />

      {/* Tabs + menu content */}
      <MenuTabs grouped={grouped} sortedCategories={sortedCategories} />
    </main>
  );
}
