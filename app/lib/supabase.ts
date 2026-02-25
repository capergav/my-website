import { createClient } from "@supabase/supabase-js";

export function createSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

export type SiteSettings = {
  id?: string;
  main_color: string;
  accent_color: string;
  font_family?: string | null;
  restaurant_name?: string | null;
  hero_image_url?: string | null;
};

/**
 * To enable theme colors in admin, create this table in Supabase (SQL Editor):
 *
 * create table if not exists site_settings (
 *   id uuid primary key default gen_random_uuid(),
 *   main_color text not null default '#2c2a26',
 *   accent_color text not null default '#8b6914',
 *   font_family text,
 *   restaurant_name text,
 *   hero_image_url text
 * );
 * insert into site_settings (main_color, accent_color) values ('#2c2a26', '#8b6914')
 * on conflict do nothing;
 *
 * Or with a single row by id: use id = 1 and upsert in admin.
 */
