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
}[] = [
  { key: "chefs_favorite", Icon: Star,       labelKey: "dietary.chefsFavorite", label: "Chef's Favourite" },
  { key: "gluten_free",    Icon: WheatOff,   labelKey: "dietary.glutenFree",    label: "Gluten Free"      },
  { key: "nut_free",       Icon: ShieldCheck,labelKey: "dietary.nutFree",       label: "Nut Free"         },
  { key: "vegan",          Icon: Leaf,       labelKey: "dietary.vegan",         label: "Vegan"            },
  { key: "vegetarian",     Icon: Sprout,     labelKey: "dietary.vegetarian",    label: "Vegetarian"       },
  { key: "dairy_free",     Icon: MilkOff,    labelKey: "dietary.dairyFree",     label: "Dairy Free"       },
  { key: "spicy",          Icon: Flame,      labelKey: "dietary.spicy",         label: "Spicy"            },
];

/** Inline dietary icons on a menu item card — no circles, inherit text color */
export function DietaryIcons({ item }: { item: DietaryFlags }) {
  const active = DIETARY_META.filter(({ key }) => item[key]);
  if (active.length === 0) return null;
  return (
    <div className="flex items-center gap-2 mt-1.5 flex-wrap" role="group" aria-label="Dietary information">
      {active.map(({ key, Icon, label }) => (
        <span
          key={key}
          aria-label={label}
          title={label}
          className="inline-flex items-center justify-center flex-shrink-0 opacity-60 text-current"
        >
          <Icon size={14} aria-hidden />
        </span>
      ))}
    </div>
  );
}

/** Legend shown above the item list — icon + full label, no circles */
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
    <div className="py-1 mb-2">
      <div className="flex flex-wrap gap-x-3 gap-y-1 items-center">
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">{t("dietary.key")}</span>
        {visible.map(({ key, Icon, labelKey, label }) => (
          <div key={key} className="flex items-center gap-1">
            <Icon size={11} className="text-[var(--muted)] flex-shrink-0" aria-hidden />
            <span className="text-[10px] text-[var(--muted)]">{t(labelKey) || label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
