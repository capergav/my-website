-- ============================================================================
-- PHASE 3 — Category names unique per MENU instead of per account.
--
-- *** DO NOT RUN THIS UNTIL 001 + 001b HAVE RUN AND THE CODE IS DEPLOYED. ***
--
-- The moment this lands, two categories in the same restaurant may share a
-- name. Any deployed code that still resolves a category by name alone will
-- silently read/write the wrong row. In particular the old
-- `onConflict: 'restaurant_id,name'` upserts will start erroring, because the
-- unique index they name no longer exists.
--
-- Project: zqhyeyrbqygisephzvoo
-- ============================================================================

begin;

-- The old rule: one "Desserts" per account.
alter table public.restaurant_categories
  drop constraint restaurant_categories_restaurant_id_name_key;

-- ── The NULL gotcha ─────────────────────────────────────────────────────────
-- A single index on (restaurant_id, parent_id, name) would NOT enforce
-- anything for top-level rows, because parent_id is NULL there and NULL <> NULL
-- in a unique index. Flat-mode restaurants would silently lose all duplicate
-- protection. Two partial indexes instead, so both levels stay covered.

-- Sub-categories: unique within their parent menu.
-- "Desserts" under Lunch AND "Desserts" under Dinner is now legal.
create unique index restaurant_categories_uniq_child
  on public.restaurant_categories (restaurant_id, parent_id, lower(name))
  where parent_id is not null;

-- Top-level rows (menus, and every flat-mode category): still unique per
-- restaurant, exactly as before. This is the branch that keeps flat-mode users
-- protected now that the table-level constraint is gone.
create unique index restaurant_categories_uniq_top
  on public.restaurant_categories (restaurant_id, lower(name))
  where parent_id is null;

-- ── category_notes carries the same stale assumption ────────────────────────
-- unique_category_note is on (restaurant_id, category), where `category` is now
-- only a readable label. Once two menus may each hold a "Desserts", their two
-- notes both write category='Desserts' and collide. Notes are keyed on
-- category_id by the deployed code (see 001b), so this index is now both wrong
-- and redundant.
drop index if exists public.unique_category_note;

commit;

-- lower(name) is deliberate: the admin's duplicate check has always been
-- case-insensitive (`c.toLowerCase() === trimmed.toLowerCase()`), while the old
-- constraint was case-sensitive. Verified 0 case-variant collisions in the
-- current data, so this tightens the DB to match the UI without breaking rows.
