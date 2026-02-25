export const dynamic = "force-dynamic";

import { createSupabaseClient, type SiteSettings } from "@/app/lib/supabase";
import { CATEGORY_ORDER } from "@/app/lib/constants";
import type { MenuItemRow } from "@/app/lib/constants";
import type { SiteSettings } from "@/app/lib/supabase";
import { AdminMenuEditor } from "./AdminMenuEditor";

export default async function AdminPage() {
  const supabase = createSupabaseClient();

  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("*")
    .order("name", { ascending: true });

  if (menuError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-red-600">Error loading menu: {menuError.message}</p>
      </div>
    );
  }

  const grouped = (menuItems ?? []).reduce<Record<string, MenuItemRow[]>>(
    (acc, item: MenuItemRow) => {
      const category = item.category || "Other";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    },
    {}
  );

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter(
      (c) => !(CATEGORY_ORDER as readonly string[]).includes(c)
    ),
  ];

  let siteSettings: SiteSettings | null = null;
  try {
    const { data } = await supabase
      .from("site_settings")
      .select(
        "id, main_color, accent_color, font_family, restaurant_name, hero_image_url"
      )
      .limit(1)
      .maybeSingle<SiteSettings>();
    if (data) {
      siteSettings = data as SiteSettings;
    }
  } catch {
    // Table may not exist yet
  }

  return (
    <AdminMenuEditor
      initialGrouped={grouped}
      initialSortedCategories={sortedCategories}
      initialSettings={siteSettings}
    />
  );
}
