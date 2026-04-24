export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import Link from "next/link";
import { createSupabaseServerClient } from "@/app/lib/supabase";
import { CATEGORY_ORDER } from "@/app/lib/constants";
import type { MenuItemRow } from "@/app/lib/constants";
import { MenuTabs } from "@/app/components/MenuTabs";
import { HeroWithLang } from "@/app/components/HeroWithLang";
import { Clock } from "lucide-react";

type Props = { params: Promise<{ slug: string }> };

export default async function PublicMenuPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: restaurant } = await supabase
    .from("restaurants")
    .select("id, name, hero_image_url, main_color, accent_color, background_color, font_family, font_color, logo_url, owner_id")
    .eq("slug", slug)
    .maybeSingle();

  if (!restaurant) notFound();

  // Check subscription status — pause menu if trial expired or canceled
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, trial_end")
    .eq("user_id", (restaurant as { owner_id?: string }).owner_id ?? "")
    .maybeSingle();

  const isPaused =
    !sub ||
    sub.status === "canceled" ||
    (sub.status === "trialing" && sub.trial_end && new Date(sub.trial_end) < new Date()) ||
    sub.status === "past_due";

  const pausedFontColor = restaurant.font_color ?? "#2c2a26";
  const pausedAccent    = restaurant.accent_color ?? "#8b6914";
  const pausedBg        = restaurant.background_color ?? "#faf8f5";
  const pausedCard      = restaurant.main_color ?? "#ffffff";
  const pausedThemeStyle = `:root{--foreground:${pausedFontColor};--accent:${pausedAccent};--background:${pausedBg};--card:${pausedCard};--muted:${pausedFontColor}99;--card-border:${pausedFontColor}26;--main-color:${pausedCard};--accent-color:${pausedAccent};--background-color:${pausedBg};--font-color:${pausedFontColor};}`;

  if (isPaused) {
    return (
      <>
        <style dangerouslySetInnerHTML={{ __html: pausedThemeStyle }} />
        <main className="min-h-screen bg-[var(--background)] flex items-center justify-center px-4 text-center">
          <div className="max-w-md">
            <div className="w-16 h-16 rounded-full mx-auto flex items-center justify-center mb-4" style={{ background: `${pausedCard}1a` }}>
              <Clock size={28} style={{ color: pausedCard }} />
            </div>
            <h1 className="text-2xl font-semibold text-[var(--foreground)]">
              Menu temporarily unavailable
            </h1>
            <p className="text-[var(--muted)] mt-2 text-sm">
              This restaurant&apos;s digital menu is currently paused. Please check back soon.
            </p>
          </div>
        </main>
      </>
    );
  }

  // Trial banner — only shown when actively trialing (not expired)
  const now = new Date();
  const trialEnd = sub?.trial_end ? new Date(sub.trial_end) : null;
  const daysLeft = trialEnd ? Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const showTrialBanner = sub?.status === "trialing" && trialEnd !== null && trialEnd > now;
  const trialWindingDown = showTrialBanner && daysLeft !== null && daysLeft <= 7;

  const [{ data: menuItems }, { data: categoryNotesRows }] = await Promise.all([
    supabase.from("menu_items").select("*").eq("restaurant_id", restaurant.id).eq("available", true).order("sort_order", { ascending: true }).order("name", { ascending: true }),
    supabase.from("category_notes").select("category, note").eq("restaurant_id", restaurant.id),
  ]);

  const categoryNotes: Record<string, string> = {};
  for (const row of (categoryNotesRows ?? []) as { category: string; note: string | null }[]) {
    if (row.note?.trim()) categoryNotes[row.category] = row.note.trim();
  }

  const grouped = (menuItems ?? []).reduce<Record<string, MenuItemRow[]>>((acc, item) => {
    const cat = (item as MenuItemRow).category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item as MenuItemRow);
    return acc;
  }, {});

  const sortedCategories = [
    ...CATEGORY_ORDER.filter((c) => grouped[c]),
    ...Object.keys(grouped).filter((c) => !(CATEGORY_ORDER as readonly string[]).includes(c)),
  ];

  const fontColor = restaurant.font_color ?? "#2c2a26";
  const accent    = restaurant.accent_color ?? "#8b6914";
  const bg        = restaurant.background_color ?? "#faf8f5";
  const card      = restaurant.main_color ?? "#ffffff";

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

  const themeStyle = `:root{--foreground:${fontColor};--accent:${accent};--background:${bg};--card:${card};--muted:${fontColor}99;--card-border:${fontColor}26;--main-color:${card};--accent-color:${accent};--background-color:${bg};--font-color:${fontColor};}body{color:var(--foreground);font-family:${fontFamily};}`;

  const hasItems = sortedCategories.length > 0;

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: themeStyle }} />

      {/* ── DineLinks trial banner — always hardcoded brand colors, never restaurant theme ── */}
      {showTrialBanner && (
        <div
          style={{ background: "#8b6914", fontFamily: "system-ui, -apple-system, sans-serif" }}
          className="py-2 px-4 text-center"
        >
          {trialWindingDown ? (
            <p className="text-sm text-white flex items-center justify-center gap-2 flex-wrap">
              <span>
                Free trial ends in{" "}
                <strong>{daysLeft} day{daysLeft !== 1 ? "s" : ""}</strong>
              </span>
              <Link
                href="/signup"
                style={{ background: "#2c2a26", color: "#ffffff" }}
                className="inline-block rounded-lg px-3 py-0.5 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Subscribe to keep this menu live →
              </Link>
            </p>
          ) : (
            <p className="text-sm text-white flex items-center justify-center gap-2 flex-wrap">
              <span style={{ color: "#c9a030" }}>✦</span>
              <span>Powered by DineLinks</span>
              <span style={{ color: "#c9a030" }}>·</span>
              <span>Get your own digital menu — 2 months free</span>
              <Link
                href="/signup"
                style={{ background: "#ffffff", color: "#8b6914" }}
                className="inline-block rounded-lg px-3 py-0.5 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Start free →
              </Link>
            </p>
          )}
        </div>
      )}

      <main className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <HeroWithLang
          restaurantName={restaurant.name ?? undefined}
          heroImageUrl={restaurant.hero_image_url ?? undefined}
          logoUrl={(restaurant as { logo_url?: string | null }).logo_url ?? undefined}
        />
        {hasItems ? (
          <MenuTabs grouped={grouped} sortedCategories={sortedCategories} categoryNotes={categoryNotes} />
        ) : (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <h2 className="text-2xl font-serif font-semibold text-[var(--foreground)]">No items yet</h2>
            <p className="text-sm mt-2 max-w-xs" style={{ color: `${fontColor}99` }}>This menu is still being set up. Check back soon.</p>
          </div>
        )}
      </main>
    </>
  );
}
