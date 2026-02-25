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
  category?: string | null;
  available?: boolean | null;
};
