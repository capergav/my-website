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
};

export type CategoryNote = {
  id: string;
  restaurant_id: string;
  category: string;
  note: string | null;
};
