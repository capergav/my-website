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
  background_color?: string | null;
  font_family?: string | null;
  font_color?: string | null;
  hero_image_url?: string | null;
};

export type CategoryNote = {
  id: string;
  restaurant_id: string;
  category: string;
  note: string | null;
  created_at?: string;
};

/**
 * Create category_notes table in Supabase (SQL Editor):
 *
 * create table if not exists category_notes (
 *   id uuid primary key default gen_random_uuid(),
 *   restaurant_id uuid not null references restaurants(id) on delete cascade on update cascade,
 *   category text not null,
 *   note text,
 *   created_at timestamptz default now()
 * );
 * create unique index if not exists category_notes_restaurant_category_key
 *   on category_notes(restaurant_id, category);
 */
