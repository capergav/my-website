"use client";

import { useState } from "react";

export type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  price: number | string;
  image_url?: string | null;
  category?: string | null;
  more_info?: string | null;
};

type MenuTabsProps = {
  grouped: Record<string, MenuItem[]>;
  sortedCategories: string[];
};

export function MenuTabs({ grouped, sortedCategories }: MenuTabsProps) {
  const [activeCategory, setActiveCategory] = useState(sortedCategories[0] ?? "");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  if (sortedCategories.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10 text-[var(--muted)] text-center">
        No menu items yet.
      </div>
    );
  }

  const items = grouped[activeCategory] ?? [];

  // Detail view when a menu item is selected
  if (selectedItem) {
    return (
      <div className="min-h-screen bg-[var(--background)]">
        {/* Back button */}
        <div className="sticky top-0 z-20 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--card-border)]">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-3">
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="flex items-center gap-2 text-[var(--foreground)] hover:text-[var(--accent)] transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to menu
            </button>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 sm:px-6 pb-12">
          {/* Large image */}
          {selectedItem.image_url ? (
            <div className="aspect-[4/3] sm:aspect-[3/2] -mx-4 sm:mx-0 sm:rounded-2xl overflow-hidden bg-[var(--card-border)] mt-2">
              <img
                src={selectedItem.image_url}
                alt={selectedItem.name}
                className="w-full h-full object-cover"
              />
            </div>
          ) : (
            <div className="aspect-[4/3] sm:aspect-[3/2] -mx-4 sm:mx-0 sm:rounded-2xl bg-[var(--card-border)] mt-2 flex items-center justify-center text-[var(--muted)]">
              No image
            </div>
          )}

          <div className="mt-6 sm:mt-8">
            <div className="flex justify-between items-baseline gap-4 flex-wrap">
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[var(--foreground)]">
                {selectedItem.name}
              </h1>
              <span className="font-medium text-[var(--accent)] text-xl">
                ${Number(selectedItem.price).toFixed(2)}
              </span>
            </div>

            {selectedItem.description && (
              <p className="text-[var(--muted)] mt-3 text-base sm:text-lg leading-relaxed">
                {selectedItem.description}
              </p>
            )}

            {/* More info - ready for your new Supabase column */}
            {selectedItem.more_info && (
              <div className="mt-6 pt-6 border-t border-[var(--card-border)]">
                <h2 className="font-serif text-lg font-semibold text-[var(--foreground)] mb-2">
                  More info
                </h2>
                <p className="text-[var(--muted)] leading-relaxed whitespace-pre-wrap">
                  {selectedItem.more_info}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Tab bar with category thumbnails + title
  return (
    <>
      <div className="sticky top-0 z-10 bg-[var(--background)]/95 backdrop-blur-md border-b border-[var(--card-border)] shadow-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="tabs-scroll flex gap-3 overflow-x-auto py-4">
            {sortedCategories.map((category) => {
              const categoryItems = grouped[category] ?? [];
              const firstItem = categoryItems[0];
              const thumbUrl = firstItem?.image_url ?? null;
              const isActive = activeCategory === category;
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`
                    flex-shrink-0 w-24 sm:w-28 flex flex-col items-center gap-2 rounded-2xl overflow-hidden transition-all duration-200
                    ${isActive
                      ? "ring-2 ring-[var(--accent)] ring-offset-2 ring-offset-[var(--background)] shadow-lg"
                      : "opacity-85 hover:opacity-100 hover:ring-2 hover:ring-[var(--card-border)] hover:ring-offset-2 hover:ring-offset-[var(--background)]"
                    }
                  `}
                >
                  <div className="w-full aspect-square rounded-xl overflow-hidden bg-[var(--card-border)]">
                    {thumbUrl ? (
                      <img
                        src={thumbUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[var(--muted)] text-xs">
                        {category.slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <span
                    className={`
                      text-xs sm:text-sm font-medium text-center leading-tight px-1
                      ${isActive ? "text-[var(--accent)]" : "text-[var(--muted)]"}
                    `}
                  >
                    {category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Category content - clickable items */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[var(--foreground)] mb-6">
          {activeCategory}
        </h2>

        <div className="space-y-5">
          {items.map((item) => (
            <article
              key={item.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedItem(item)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setSelectedItem(item);
                }
              }}
              className="bg-[var(--card)] rounded-2xl overflow-hidden border border-[var(--card-border)] shadow-sm hover:shadow-md hover:border-[var(--accent)]/30 transition-all duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2"
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
                  <p className="text-[var(--muted)] mt-2 text-sm sm:text-base leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                )}
                <p className="text-[var(--accent)] text-sm mt-2 font-medium">
                  Tap for details →
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </>
  );
}
