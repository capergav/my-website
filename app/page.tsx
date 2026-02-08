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
    <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      {/* Hero */}
      <div className="relative h-56 sm:h-64 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
          alt=""
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-white tracking-wide drop-shadow-lg">
            Restaurant Menu
          </h1>
        </div>
      </div>

      {/* Menu */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="space-y-14">
          {sortedCategories.map((category) => (
            <section key={category}>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--foreground)] mb-6 pb-2 border-b border-[var(--card-border)]">
                {category}
              </h2>

              <div className="space-y-5">
                {grouped[category].map((item: any) => (
                  <article
                    key={item.id}
                    className="bg-[var(--card)] rounded-2xl overflow-hidden border border-[var(--card-border)] shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    {item.image_url && (
                      <div className="aspect-[3/2] overflow-hidden bg-[var(--card-border)]">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="p-5 sm:p-6">
                      <div className="flex justify-between items-baseline gap-4">
                        <h3 className="font-serif text-xl font-semibold text-[var(--foreground)]">
                          {item.name}
                        </h3>
                        <span className="font-medium text-[var(--accent)] whitespace-nowrap">
                          ${Number(item.price).toFixed(2)}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-[var(--muted)] mt-2 text-sm sm:text-base leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
