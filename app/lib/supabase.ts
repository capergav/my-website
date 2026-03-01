import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type Restaurant = {
  id: string;
  name?: string | null;
  main_color?: string | null;
  accent_color?: string | null;
  font_family?: string | null;
  font_color?: string | null;
  hero_image_url?: string | null;
};
