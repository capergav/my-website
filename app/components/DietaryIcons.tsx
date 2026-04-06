"use client";

import { Star, WheatOff, ShieldCheck, Leaf, Sprout, MilkOff, Flame } from "lucide-react";

export type DietaryFlags = {
  chefs_favorite?: boolean | null;
  gluten_free?: boolean | null;
  nut_free?: boolean | null;
  vegan?: boolean | null;
  vegetarian?: boolean | null;
  dairy_free?: boolean | null;
  spicy?: boolean | null;
};

export const DIETARY_META: {
  key: keyof DietaryFlags;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}[] = [
  { key: "chefs_favorite", Icon: Star,        label: "Chef's Favourite" },
  { key: "gluten_free",    Icon: WheatOff,    label: "Gluten Free"      },
  { key: "nut_free",       Icon: ShieldCheck, label: "Nut Free"         },
  { key: "vegan",          Icon: Leaf,        label: "Vegan"            },
  { key: "vegetarian",     Icon: Sprout,      label: "Vegetarian"       },
  { key: "dairy_free",     Icon: MilkOff,     label: "Dairy Free"       },
  { key: "spicy",          Icon: Flame,       label: "Spicy"            },
];

export function DietaryIcons({ item }: { item: DietaryFlags }) {
  const active = DIETARY_META.filter(({ key }) => item[key]);
  if (active.length === 0) return null;
  return (
    <div className="flex items-center gap-2 mt-1.5 flex-wrap" role="group" aria-label="Dietary information">
      {active.map(({ key, Icon }) => (
        <Icon key={key} size={16} className="shrink-0 text-[var(--muted)]" aria-hidden />
      ))}
    </div>
  );
}

export function DietaryLegend({ items }: { items: DietaryFlags[] }) {
  const usedKeys = new Set<keyof DietaryFlags>();
  for (const item of items) {
    for (const { key } of DIETARY_META) {
      if (item[key]) usedKeys.add(key);
    }
  }
  const visible = DIETARY_META.filter(({ key }) => usedKeys.has(key));
  if (visible.length === 0) return null;
  return (
    <div className="mt-10 pt-6 border-t border-[var(--card-border)]">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-3">Key</p>
      <div className="flex flex-wrap gap-x-5 gap-y-2">
        {visible.map(({ key, Icon, label }) => (
          <div key={key} className="flex items-center gap-1.5">
            <Icon size={13} className="text-[var(--muted)] shrink-0" aria-hidden />
            <span className="text-xs text-[var(--muted)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
