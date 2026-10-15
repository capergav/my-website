import { createSupabaseServerClient } from "@/app/lib/supabase";
import { locales, type Locale } from "@/app/lib/translations";

// The single founder account allowed to see the (still-hidden) discovery map
// and the map admin tools. Gating is ALWAYS done server-side off the
// authenticated Supabase session — never a client cookie or client-side email
// check — so a non-owner visitor never receives the gated markup at all.
export const MAP_OWNER_EMAIL = "gavinrgallant@gmail.com";

/**
 * Returns the authenticated user ONLY if their verified session email is the
 * founder account, otherwise null. Server-only.
 */
export async function getMapOwner(): Promise<{ id: string; email: string } | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) return null;
  if (user.email.toLowerCase() !== MAP_OWNER_EMAIL.toLowerCase()) return null;
  return { id: user.id, email: user.email };
}

/**
 * The languages a restaurant's menu *actually* supports.
 *
 * Every DineLinks menu offers the full UI in all 13 languages, but item names
 * and descriptions are only machine-translated when the owner has turned on
 * auto-translate. So a menu "actually" supports the whole set only in that
 * case; otherwise the real content exists solely in its default language.
 */
export function menuLanguages(args: {
  allow_auto_translate?: boolean | null;
  default_language?: string | null;
}): { value: Locale; label: string; flag: string }[] {
  if (args.allow_auto_translate) return locales;
  const def = (args.default_language ?? "en") as Locale;
  const match = locales.find((l) => l.value === def) ?? locales[0];
  return [match];
}
