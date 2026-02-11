"use client";

import { useState } from "react";

export type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  image_url?: string | null;
  category?: string | null;
};

type MenuTabsProps = {
  grouped: Record<string, MenuItem[]>;
  sortedCategories: string[];
};

export function MenuTabs({ grouped, sortedCategories }: MenuTabsProps) {
  const [activeCategory, setActiveCategory] = useState(sortedCategories[0] ?? "");

  if (sortedCategories.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 text-[var(--muted)] text-center">
        No menu items yet.
      </div>
    );
  }

  const items = grouped[activeCategory] ?? [];

  return (
    <>
      {/* Tab bar - sticky below hero */}
      <div className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--card-border)] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="tabs-scroll flex gap-2 overflow-x-auto py-3">
            {sortedCategories.map((category) => {
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`
                    flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
                    ${isActive
                      ? "bg-[var(--accent)] text-white shadow-md"
                      : "text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--card-border)]/50"
                    }
                  `}
                >
                  {category}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content for selected category */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--foreground)] mb-6">
          {activeCategory}
        </h2>

        <div className="space-y-5">
          {items.map((item) => (
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
      </div>
    </>
  );
}
