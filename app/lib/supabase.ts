import { createBrowserClient, createServerClient } from "@supabase/ssr";

export function createSupabaseClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export async function createSupabaseServerClient() {
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component — middleware handles session refresh
          }
        },
      },
    }
  );
}

export type Restaurant = {
  id: string;
  slug: string;
  name?: string | null;
  owner_id?: string | null;
  main_color?: string | null;
  accent_color?: string | null;
  background_color?: string | null;
  font_family?: string | null;
  font_color?: string | null;
  hero_image_url?: string | null;
  logo_url?: string | null;
  // Brand color slots
  brand_primary_1?: string | null;
  brand_secondary_1?: string | null;
  brand_bg_1?: string | null;
  brand_font_1?: string | null;
  brand_primary_2?: string | null;
  brand_secondary_2?: string | null;
  brand_bg_2?: string | null;
  brand_font_2?: string | null;
  muted_color?: string | null;
  title_color?: string | null;
  show_currency_symbol?: boolean | null;
  use_nested_categories?: boolean | null;
};

/** A row from restaurant_categories. parent_id null = top level. */
export type CategoryRow = {
  id: string;
  name: string;
  parent_id: string | null;
  sort_order: number | null;
};

/** A top-level category plus the names of its child categories (empty = flat leaf). */
export type MenuGroup = { id: string | null; name: string; children: string[] };

/**
 * Builds the two-level structure from flat category rows.
 * A top-level row WITH children is a menu (container); WITHOUT children it
 * behaves as an ordinary category that holds its own items.
 */
export function buildMenuGroups(rows: CategoryRow[], extraTopLevel: string[] = []): MenuGroup[] {
  const bySort = (a: CategoryRow, b: CategoryRow) => (a.sort_order ?? 0) - (b.sort_order ?? 0);
  const tops = rows.filter((r) => !r.parent_id).sort(bySort);
  const groups: MenuGroup[] = tops.map((top) => ({
    id: top.id,
    name: top.name,
    children: rows.filter((r) => r.parent_id === top.id).sort(bySort).map((r) => r.name),
  }));
  const known = new Set(rows.map((r) => r.name));
  for (const name of extraTopLevel) {
    if (!known.has(name)) groups.push({ id: null, name, children: [] });
  }
  return groups;
}

export type CategoryNote = {
  id: string;
  restaurant_id: string;
  category: string;
  note: string | null;
};
