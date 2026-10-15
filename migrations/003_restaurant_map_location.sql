-- ============================================================================
-- Restaurant discovery map — location + approval columns.
--
-- Adds the fields the hidden "Find a menu" map needs:
--   * location (address / city / province / country / lat / lng)
--   * approved_for_map gate (default false — nothing shows until approved)
--   * map_name override + map_notes description (shown on the pin)
--   * map_approval_nonce — single-use nonce backing the signed "Approve for
--     map" link in the signup email (nulled once the link is used)
--
-- Safe to run on the live DB: every column is additive and nullable (or has a
-- default), so existing rows and queries are unaffected. Existing restaurants
-- simply have no coordinates and approved_for_map = false until backfilled
-- from /map/admin.
--
-- Project: zqhyeyrbqygisephzvoo
-- ============================================================================

begin;

alter table public.restaurants
  add column if not exists address             text,
  add column if not exists city                text,
  add column if not exists province            text,
  add column if not exists country             text,
  add column if not exists latitude            double precision,
  add column if not exists longitude           double precision,
  add column if not exists approved_for_map    boolean not null default false,
  add column if not exists map_name            text,
  add column if not exists map_notes           text,
  add column if not exists map_approval_nonce  text;

-- Speeds up the map query: approved restaurants that have coordinates.
create index if not exists restaurants_map_idx
  on public.restaurants (approved_for_map)
  where latitude is not null and longitude is not null;

commit;
