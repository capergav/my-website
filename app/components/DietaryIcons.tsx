"use client";

import { Star, WheatOff, ShieldCheck, Leaf, Sprout, MilkOff, Flame } from "lucide-react";
import { useLanguage } from "@/app/context/LanguageContext";

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
  labelKey: string;
  label: string;
  color: string;
  bg: string;
}[] = [
  { key: "chefs_favorite", Icon: Star,        labelKey: "dietary.chefsFavorite", label: "Chef's Favourite", color: "text-amber-500",  bg: "bg-amber-50"  },
  { key: "gluten_free",    Icon: WheatOff,    labelKey: "dietary.glutenFree",    label: "Gluten Free",      color: "text-stone-600",  bg: "bg-stone-100" },
  { key: "nut_free",       Icon: ShieldCheck, labelKey: "dietary.nutFree",       label: "Nut Free",         color: "text-orange-600", bg: "bg-orange-50" },
  { key: "vegan",          Icon: Leaf,        labelKey: "dietary.vegan",         label: "Vegan",            color: "text-green-600",  bg: "bg-green-50"  },
  { key: "vegetarian",     Icon: Sprout,      labelKey: "dietary.vegetarian",    label: "Vegetarian",       color: "text-green-500",  bg: "bg-green-50"  },
  { key: "dairy_free",     Icon: MilkOff,     labelKey: "dietary.dairyFree",     label: "Dairy Free",       color: "text-blue-500",   bg: "bg-blue-50"   },
  { key: "spicy",          Icon: Flame,       labelKey: "dietary.spicy",         label: "Spicy",            color: "text-red-500",    bg: "bg-red-50"    },
];

export function DietaryIcons({ item }: { item: DietaryFlags }) {
  const active = DIETARY_META.filter(({ key }) => item[key]);
  if (active.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 mt-1.5 flex-wrap" role="group" aria-label="Dietary information">
      {active.map(({ key, Icon, label, color, bg }) => (
        <span
          key={key}
          aria-label={label}
          title={label}
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full ${bg} flex-shrink-0`}
        >
          <Icon size={16} className={color} aria-hidden />
        </span>
      ))}
    </div>
  );
}

export function DietaryLegend({ items }: { items: DietaryFlags[] }) {
  const { t } = useLanguage();
  const usedKeys = new Set<keyof DietaryFlags>();
  for (const item of items) {
    for (const { key } of DIETARY_META) {
      if (item[key]) usedKeys.add(key);
    }
  }
  const visible = DIETARY_META.filter(({ key }) => usedKeys.has(key));
  if (visible.length === 0) return null;
  return (
    <div className="rounded-xl border border-[var(--card-border)] bg-[var(--card)] px-4 py-3 mb-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)] mb-2">{t("dietary.key")}</p>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        {visible.map(({ key, Icon, labelKey, label, color, bg }) => (
          <div key={key} className="flex items-center gap-1.5">
            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${bg} flex-shrink-0`}>
              <Icon size={14} className={color} aria-hidden />
            </span>
            <span className="text-xs text-[var(--muted)]">{t(labelKey) || label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
