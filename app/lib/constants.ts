export type CategoryRow = {
  id: string;
  restaurant_id: string;
  name: string;
  sort_order: number;
  show_image: boolean;
  image_url: string | null;
};

/** Name of the placeholder item seeded into brand-new empty menus. The tour
 *  looks for it to decide whether it can still talk about "the sample dish",
 *  so the seeder and that check must never drift apart. */
export const SAMPLE_ITEM_NAME = "Sample Dish";

export const CATEGORY_ORDER = [
  "Breakfast",
  "Appetizers",
  "Salads",
  "Soups",
  "Sandwiches",
  "Burgers",
  "Pastas",
  "Mains",
  "Sides",
  "Desserts",
  "Drinks",
  "Other",
] as const;

export type MenuItemRow = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  image_url?: string | null;
  /** Display label only — a denormalised mirror of the category name, kept in
   *  sync by a DB trigger. Never use it to identify a category: two menus may
   *  each contain a "Desserts". `category_id` is the source of truth. */
  category?: string | null;
  category_id?: string | null;
  available?: boolean | null;
  hidden?: boolean | null;
  chefs_favorite?: boolean | null;
  gluten_free?: boolean | null;
  nut_free?: boolean | null;
  vegan?: boolean | null;
  vegetarian?: boolean | null;
  dairy_free?: boolean | null;
  spicy?: boolean | null;
  price_suffix?: string | null;
};
