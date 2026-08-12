export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createSupabaseServerClient, buildMenuGroups, type CategoryRow, type MenuGroup } from "@/app/lib/supabase";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import type { MenuItemRow } from "@/app/lib/constants";
import { MenuTabs } from "@/app/components/MenuTabs";
import { HeroWithLang } from "@/app/components/HeroWithLang";
import { MenuTracker } from "@/app/components/MenuTracker";
import { PoweredByFooter } from "@/app/components/PoweredByFooter";
import { FeedbackForm } from "@/app/components/FeedbackForm";
import { MenuDirWrapper } from "@/app/components/MenuDirWrapper";
import { LanguageProvider } from "@/app/context/LanguageContext";
import { Clock } from "lucide-react";
import type { Metadata } from "next";

type Props = { params: Promise<{ slug: string }> };

// ── Dynamic tab title per restaurant ─────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();
  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  return {
    title: restaurant?.name ?? "Menu",
    description: restaurant?.name ? `View the menu for ${restaurant.name}` : "Digital menu",
    icons: { icon: "/favicon.svg" },
  };
}

export default async function PublicMenuPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, hero_image_url, main_color, accent_color, background_color, font_family, font_color, logo_url, owner_id, muted_color, title_color, allow_auto_translate, show_currency_symbol, default_language, feedback_enabled, use_nested_categories")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant) notFound();

  // Check subscription status using service role (bypasses RLS — anonymous visitors can't read subscriptions)
  const { data: sub } = await supabaseAdmin
    .from("subscriptions")
    .select("status, trial_end, stripe_subscription_id")
    .eq("user_id", (restaurant as { owner_id?: string }).owner_id ?? "")
    .maybeSingle();

  // A trialing row WITH a stripe_subscription_id means the user subscribed
  // mid-trial (card on file, converting to paid). Stripe keeps them status
  // 'trialing' until the webhook flips them to 'active' at trial end, so we
  // must NOT pause them during that window — otherwise a paying customer's
  // menu goes dark. Only pause genuine free trials (no subscription).
  const isPaused =
    !sub ||
    sub.status === "canceled" ||
    (sub.status === "trialing" && !sub.stripe_subscription_id &&
       sub.trial_end && new Date(sub.trial_end) < new Date()) ||
    sub.status === "past_due";

  const pausedFontColor = restaurant.font_color ?? "#2c2a26";
  const pausedAccent    = restaurant.accent_color ?? "#8b6914";
  const pausedBg        = restaurant.background_color ?? "#faf8f5";
  const pausedCard      = restaurant.main_color ?? "#ffffff";

  if (isPaused) {
    return (
      <div
        className="min-h-screen flex items-center justify-center px-4 text-center"
        style={{
          "--foreground": pausedFontColor,
          "--accent": pausedAccent,
          "--background": pausedBg,
          "--card": pausedCard,
          "--muted": `${pausedFontColor}99`,
          "--card-border": `${pausedFontColor}26`,
          backgroundColor: pausedBg,
          color: pausedFontColor,
        } as React.CSSProperties}
      >
        <div className="max-w-md">
          <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: `${pausedCard}1a` }}>
            <Clock size={28} style={{ color: pausedCard }} />
          </div>
          <h1 className="text-2xl font-semibold" style={{ color: pausedFontColor }}>
            Menu temporarily unavailable
          </h1>
          <p className="mt-2 text-sm" style={{ color: `${pausedFontColor}99` }}>
            This restaurant&apos;s digital menu is currently paused. Please check back soon.
          </p>
        </div>
      </div>
    );
  }

  const [{ data: menuItems }, { data: categoryNotesRows }, { data: categoryRows }] = await Promise.all([
    supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("category_notes").select("category, note").eq("restaurant_id", restaurant.id),
    supabase.from("restaurant_categories").select("id, parent_id, name, show_image, image_url, banner_item_id, use_banner, image_mode, sort_order").eq("restaurant_id", restaurant.id).order("sort_order", { ascending: true }),
  ]);

  // Build a lookup of item images for banner_item_id resolution
  const itemImageById: Record<string, string> = {};
  for (const item of (menuItems ?? []) as MenuItemRow[]) {
    if (item.image_url) itemImageById[item.id] = item.image_url;
  }

  const categoryImageMap: Record<string, { show: boolean; url: string | null; useBanner: boolean; bannerUrl: string | null; imageMode: string | null }> = {};
  for (const row of (categoryRows ?? []) as { name: string; show_image: boolean; image_url: string | null; banner_item_id: string | null; use_banner: boolean | null; image_mode: string | null }[]) {
    const useBanner = row.use_banner !== false;
    let bannerUrl: string | null = null;
    if (useBanner) {
      if (row.banner_item_id && itemImageById[row.banner_item_id]) {
        bannerUrl = itemImageById[row.banner_item_id];
      }
    }
    categoryImageMap[row.name] = { show: row.show_image ?? false, url: row.image_url ?? null, useBanner, bannerUrl, imageMode: row.image_mode ?? null };
  }

  const categoryNotes: Record<string, string> = {};
  for (const row of (categoryNotesRows ?? []) as { category: string; note: string | null }[]) {
    if (row.note?.trim()) categoryNotes[row.category] = row.note.trim();
  }

  // Hidden items are excluded from the customer menu entirely — they never
  // reach the browser. (Unavailable items still render, greyed out, in MenuTabs.)
  const grouped = (menuItems ?? []).reduce<Record<string, MenuItemRow[]>>((acc, item) => {
    if ((item as MenuItemRow).hidden === true) return acc;
    const cat = (item as MenuItemRow).category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item as MenuItemRow);
    return acc;
  }, {});

  // Order categories by the restaurant's saved sort_order (source of truth),
  // exactly matching the admin panel. restaurant_categories is already ordered
  // by sort_order above; only keep categories that actually have items, then
  // append any orphan categories that exist on items but not in the table.
  const dbCategoryOrder = (categoryRows ?? []).map((r) => (r as { name: string }).name);
  const sortedCategories = [
    ...dbCategoryOrder.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !dbCategoryOrder.includes(c)),
  ];

  // Two-level structure. Only built when the restaurant has opted in — when the
  // toggle is off, existing parent_id values are ignored (never deleted) so the
  // structure comes back intact if they turn it on again.
  let menuGroups: MenuGroup[] | undefined;
  if ((restaurant as { use_nested_categories?: boolean | null }).use_nested_categories === true) {
    const orphans = Object.keys(grouped).filter((c) => !dbCategoryOrder.includes(c));
    menuGroups = buildMenuGroups((categoryRows ?? []) as CategoryRow[], orphans)
      .map((g) => ({ ...g, children: g.children.filter((c) => grouped[c]) }))
      .filter((g) => g.children.length > 0 || grouped[g.name]);
  }

  // Fallback: if banner is on but no banner_item_id, use first item image in category
  for (const [catName, entry] of Object.entries(categoryImageMap)) {
    if (entry.useBanner && !entry.bannerUrl) {
      const firstWithImg = (grouped[catName] ?? []).find((i) => i.image_url);
      if (firstWithImg?.image_url) entry.bannerUrl = firstWithImg.image_url;
    }
  }

  const fontColor = restaurant.font_color ?? "#2c2a26";
  const accent    = restaurant.accent_color ?? "#8b6914";
  const bg        = restaurant.background_color ?? "#faf8f5";
  const card      = restaurant.main_color ?? "#ffffff";
  const titleColor = (restaurant as { title_color?: string | null }).title_color ?? restaurant.font_color ?? "#ffffff";

  let fontFamily = "var(--font-geist-sans), system-ui, sans-serif";
  switch (restaurant.font_family) {
    case "serif":    fontFamily = "var(--font-cormorant), Georgia, serif"; break;
    case "mono":     fontFamily = "var(--font-geist-mono), monospace"; break;
    case "poppins":  fontFamily = "var(--font-poppins), sans-serif"; break;
    case "playfair": fontFamily = "var(--font-playfair), serif"; break;
    case "bebas":    fontFamily = "var(--font-bebas), sans-serif"; break;
    case "pacifico": fontFamily = "var(--font-pacifico), cursive"; break;
    case "orbitron": fontFamily = "var(--font-orbitron), sans-serif"; break;
    case "cinzel":   fontFamily = "var(--font-cinzel), serif"; break;
  }

  const muted = (restaurant as { muted_color?: string | null }).muted_color ?? `${fontColor}99`;
  const themeStyle = `:root{--font-body:${fontFamily};--foreground:${fontColor};--accent:${accent};--background:${bg};--card:${card};--muted:${muted};--title:${titleColor};--card-border:${fontColor}26}body{color:var(--foreground);font-family:var(--font-body),system-ui,sans-serif}`;

  const hasItems = sortedCategories.length > 0;

  const defaultLanguage = (restaurant as { default_language?: string | null }).default_language ?? "en";

  return (
    <LanguageProvider initialLocale={restaurant?.default_language ?? "en"}>
    {/* CSS vars scoped to this wrapper — never bleeds into the DineLinks navbar.
        MenuDirWrapper is a client component that sets dir="rtl" for Arabic, ltr otherwise,
        scoped to this element only — never touches document.documentElement. */}
    <MenuDirWrapper
      style={{
        "--foreground": fontColor,
        "--accent": accent,
        "--background": bg,
        "--card": card,
        "--muted": (restaurant as { muted_color?: string | null }).muted_color ?? `${fontColor}99`,
        "--title": titleColor,
        "--card-border": `${fontColor}26`,
        "--main-color": card,
        "--accent-color": accent,
        "--background-color": bg,
        "--font-color": fontColor,
        fontFamily,
        color: fontColor,
        backgroundColor: bg,
        minHeight: "100vh",
      } as React.CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: themeStyle }} />
      <MenuTracker restaurantId={restaurant.id} />

      <HeroWithLang
        restaurantName={restaurant.name ?? undefined}
        heroImageUrl={restaurant.hero_image_url ?? undefined}
        logoUrl={(restaurant as { logo_url?: string | null }).logo_url ?? undefined}
        restaurantId={restaurant.id}
      />
      {hasItems ? (
        <MenuTabs grouped={grouped} sortedCategories={sortedCategories} menuGroups={menuGroups} categoryNotes={categoryNotes} categoryImageMap={categoryImageMap} restaurantId={restaurant.id} allowAutoTranslate={!!(restaurant as { allow_auto_translate?: boolean }).allow_auto_translate} showCurrencySymbol={(restaurant as { show_currency_symbol?: boolean | null }).show_currency_symbol !== false} />
      ) : (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <h2 className="text-2xl font-semibold" style={{ color: fontColor }}>No items yet</h2>
          <p className="text-sm mt-2 max-w-xs" style={{ color: `${fontColor}99` }}>This menu is still being set up. Check back soon.</p>
        </div>
      )}
      {/* Powered by DineLinks footer */}
      <PoweredByFooter fontColor={fontColor} />
      {/* Feedback form — only if enabled */}
      {(restaurant as { feedback_enabled?: boolean | null }).feedback_enabled !== false && (
        <FeedbackForm restaurantId={restaurant.id} />
      )}
    </MenuDirWrapper>
    </LanguageProvider>
  );
}
