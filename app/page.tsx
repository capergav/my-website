export const dynamic = "force-dynamic";

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function Home() {
  const { data: menuItems, error } = await supabase
    .from("menu_items")
    .select("*")
    .order("id", { ascending: true });

  if (error) {
    return (
      <div className="p-10 text-red-600">
        Error loading menu: {error.message}
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white p-6">
      {/* Top Image */}
      <div className="relative mb-8">
        <img
          src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5"
          alt="Restaurant"
          className="w-full h-48 object-cover rounded-xl"
        />
        <h1 className="absolute inset-0 flex items-center justify-center text-white text-4xl font-bold bg-black/40 rounded-xl">
          Restaurant Menu
        </h1>
      </div>

      {/* Menu Items */}
      <div className="space-y-6 max-w-2xl mx-auto">
        {menuItems?.map((item) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg p-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">
                {item.name}
              </h2>
              <span className="text-gray-900 font-medium">
                ${item.price}
              </span>
            </div>
            {item.description && (
              <p className="text-gray-600 mt-1">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
