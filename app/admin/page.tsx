export const dynamic = "force-dynamic";

import { createSupabaseClient, type Restaurant } from "@/app/lib/supabase";
import { CATEGORY_ORDER } from "@/app/lib/constants";
import type { MenuItemRow } from "@/app/lib/constants";
import { AdminMenuEditor } from "./AdminMenuEditor";

export default async function AdminPage() {
  const supabase = createSupabaseClient();
  const restaurantId = process.env.NEXT_PUBLIC_RESTAURANT_ID;

  if (!restaurantId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-red-600">
          Set NEXT_PUBLIC_RESTAURANT_ID in your environment to use the admin.
        </p>
      </div>
    );
  }

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

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, main_color, accent_color, font_family, font_color, hero_image_url")
    .eq("id", restaurantId)
    .maybeSingle<Restaurant>();

  return (
    <AdminMenuEditor
      restaurantId={restaurantId}
      initialGrouped={grouped}
      initialSortedCategories={sortedCategories}
      initialRestaurant={restaurant ?? null}
    />
  );
}
