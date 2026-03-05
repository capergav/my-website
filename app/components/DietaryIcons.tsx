"use client";

import {
  Star,
  WheatOff,
  ShieldCheck,
  Leaf,
  Sprout,
  MilkOff,
  Flame,
} from "lucide-react";

const ICON_SIZE = 17;
const ICON_CLASS = "shrink-0 text-[var(--muted)]";

const MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  chefs_favorite: Star,
  gluten_free: WheatOff,
  nut_free: ShieldCheck,
  vegan: Leaf,
  vegetarian: Sprout,
  dairy_free: MilkOff,
  spicy: Flame,
};

export type DietaryFlags = {
  chefs_favorite?: boolean | null;
  gluten_free?: boolean | null;
  nut_free?: boolean | null;
  vegan?: boolean | null;
  vegetarian?: boolean | null;
  dairy_free?: boolean | null;
  spicy?: boolean | null;
};

const KEYS: (keyof DietaryFlags)[] = [
  "chefs_favorite",
  "gluten_free",
  "nut_free",
  "vegan",
  "vegetarian",
  "dairy_free",
  "spicy",
];

export function DietaryIcons({ item }: { item: DietaryFlags }) {
  const icons: React.ReactNode[] = [];
  for (const key of KEYS) {
    if (item[key]) {
      const Icon = MAP[key];
      if (Icon) {
        icons.push(
          <Icon
            key={key}
            size={ICON_SIZE}
            className={ICON_CLASS}
            aria-hidden
          />
        );
      }
    }
  }
  if (icons.length === 0) return null;
  return (
    <div className="flex items-center gap-2 mt-1.5 flex-wrap" role="group" aria-label="Dietary and options">
      {icons}
    </div>
  );
}
