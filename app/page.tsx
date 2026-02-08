export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const CATEGORY_ORDER = [
  "Appetizers",
  "Mains",
  "Sides",
  "Desserts",
  "Drinks",
];

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
      (c) => !CATEGORY_ORDER.includes(c)
    ),
  ];

  return (
    <main className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="relative mb-10">
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
          className="w-full h-48 object-cover rounded-xl"
        />
        <h1 className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold bg-black/40 rounded-xl">
          Restaurant Menu
        </h1>
      </div>

      {/* Menu */}
      <div className="max-w-2xl mx-auto space-y-12">
        {sortedCategories.map((category) => (
          <section key={category}>
            <h2 className="text-2xl font-bold mb-5 border-b pb-2">
              {category}
            </h2>

            <div className="space-y-6">
              {grouped[category].map((item: any) => (
                <div
                  key={item.id}
                  className="border rounded-lg overflow-hidden"
                >
                  {/* IMAGE */}
                  {item.image_url && (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-48 object-cover"
                    />
                  )}

                  {/* CONTENT */}
                  <div className="p-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        {item.name}
                      </h3>
                      <span className="font-medium">
                        ${Number(item.price).toFixed(2)}
                      </span>
                    </div>

                    {item.description && (
                      <p className="text-gray-600 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
