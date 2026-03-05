export type Locale = "en" | "fr" | "zh" | "ar" | "es";

export const locales: { value: Locale; label: string }[] = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "zh", label: "中文" },
  { value: "ar", label: "العربية" },
  { value: "es", label: "Español" },
];

const categoryKeys = [
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

type CategoryKey = (typeof categoryKeys)[number];

const categoryTranslations: Record<CategoryKey, Record<Locale, string>> = {
  Breakfast: { en: "Breakfast", fr: "Petit-déjeuner", zh: "早餐", ar: "الإفطار", es: "Desayuno" },
  Appetizers: { en: "Appetizers", fr: "Entrées", zh: "开胃菜", ar: "المقبلات", es: "Entrantes" },
  Salads: { en: "Salads", fr: "Salades", zh: "沙拉", ar: "السلطات", es: "Ensaladas" },
  Soups: { en: "Soups", fr: "Soupes", zh: "汤", ar: "الشوربات", es: "Sopas" },
  Sandwiches: { en: "Sandwiches", fr: "Sandwichs", zh: "三明治", ar: "السندويشات", es: "Bocadillos" },
  Burgers: { en: "Burgers", fr: "Burgers", zh: "汉堡", ar: "البرغر", es: "Hamburguesas" },
  Pastas: { en: "Pastas", fr: "Pâtes", zh: "意面", ar: "المعكرونة", es: "Pastas" },
  Mains: { en: "Mains", fr: "Plats principaux", zh: "主菜", ar: "الأطباق الرئيسية", es: "Platos principales" },
  Sides: { en: "Sides", fr: "Accompagnements", zh: "配菜", ar: "الأطباق الجانبية", es: "Guarniciones" },
  Desserts: { en: "Desserts", fr: "Desserts", zh: "甜点", ar: "الحلويات", es: "Postres" },
  Drinks: { en: "Drinks", fr: "Boissons", zh: "饮品", ar: "المشروبات", es: "Bebidas" },
  Other: { en: "Other", fr: "Autre", zh: "其他", ar: "أخرى", es: "Otros" },
};

export function getCategoryLabel(category: string, locale: Locale): string {
  const key = category as CategoryKey;
  return categoryTranslations[key]?.[locale] ?? category;
}

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    "hero.title": "Restaurant Menu",
    "ui.backToMenu": "Back to menu",
    "ui.tapToReadMore": "Tap to read more",
    "ui.noMenuItems": "No menu items yet.",
    "ui.noImage": "No image",
    "filter.all": "All Items",
    "filter.nutFree": "Nut Free",
    "filter.vegetarian": "Vegetarian",
    "filter.vegan": "Vegan",
    "filter.glutenFree": "Gluten Free",
    "filter.dairyFree": "Dairy Free",
    "filter.chefsFavorite": "Chef's Favorite",
    "filter.spicy": "Spicy",
  },
  fr: {
    "hero.title": "Menu du restaurant",
    "ui.backToMenu": "Retour au menu",
    "ui.tapToReadMore": "Appuyez pour en savoir plus",
    "ui.noMenuItems": "Aucun article au menu.",
    "ui.noImage": "Pas d'image",
    "filter.all": "Tous les articles",
    "filter.nutFree": "Sans noix",
    "filter.vegetarian": "Végétarien",
    "filter.vegan": "Végan",
    "filter.glutenFree": "Sans gluten",
    "filter.dairyFree": "Sans lactose",
    "filter.chefsFavorite": "Favori du chef",
    "filter.spicy": "Épicé",
  },
  zh: {
    "hero.title": "餐厅菜单",
    "ui.backToMenu": "返回菜单",
    "ui.tapToReadMore": "点击阅读更多",
    "ui.noMenuItems": "暂无菜单项目。",
    "ui.noImage": "无图片",
    "filter.all": "全部",
    "filter.nutFree": "无坚果",
    "filter.vegetarian": "素食",
    "filter.vegan": "纯素",
    "filter.glutenFree": "无麸质",
    "filter.dairyFree": "无乳制品",
    "filter.chefsFavorite": "主厨推荐",
    "filter.spicy": "辣",
  },
  ar: {
    "hero.title": "قائمة المطعم",
    "ui.backToMenu": "العودة إلى القائمة",
    "ui.tapToReadMore": "اضغط لقراءة المزيد",
    "ui.noMenuItems": "لا توجد عناصر في القائمة بعد.",
    "ui.noImage": "لا توجد صورة",
    "filter.all": "جميع الأصناف",
    "filter.nutFree": "خالٍ من المكسرات",
    "filter.vegetarian": "نباتي",
    "filter.vegan": "نباتي صرف",
    "filter.glutenFree": "خالٍ من الغلوتين",
    "filter.dairyFree": "خالٍ من الألبان",
    "filter.chefsFavorite": "مفضل الشيف",
    "filter.spicy": "حار",
  },
  es: {
    "hero.title": "Menú del restaurante",
    "ui.backToMenu": "Volver al menú",
    "ui.tapToReadMore": "Toca para leer más",
    "ui.noMenuItems": "Aún no hay platos en el menú.",
    "ui.noImage": "Sin imagen",
    "filter.all": "Todos",
    "filter.nutFree": "Sin frutos secos",
    "filter.vegetarian": "Vegetariano",
    "filter.vegan": "Vegano",
    "filter.glutenFree": "Sin gluten",
    "filter.dairyFree": "Sin lactosa",
    "filter.chefsFavorite": "Favorito del chef",
    "filter.spicy": "Picante",
  },
};

export function t(key: string, locale: Locale): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}
