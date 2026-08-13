-- ============================================================================
-- PHASE 1 — Normalise menu_items onto a real category_id.
--
-- SAFE TO RUN BEFORE THE CODE DEPLOY. Purely additive: nothing here changes
-- behaviour of the currently-deployed app. It adds the columns/triggers that
-- the new code needs, and backfills them from the existing name match (which
-- is still unambiguous, because 002 has not relaxed the unique constraint yet).
--
-- Run order:  001  ->  deploy code  ->  002
-- Project: zqhyeyrbqygisephzvoo
-- ============================================================================

begin;

-- ── 0. Materialise orphan categories ────────────────────────────────────────
-- Some items carry a category name that has no restaurant_categories row. The
-- app calls these "orphans" and has a whole parallel code path for them. Give
-- them real rows so every item can resolve to a real id, which lets that code
-- path be deleted rather than carried forward with synthetic keys.
-- Affects 6 items across demo/glenn-gallant/glenngallant only.
insert into public.restaurant_categories (restaurant_id, name, parent_id, sort_order)
select o.restaurant_id,
       o.category,
       null,
       coalesce(m.max_order, -1)
         + row_number() over (partition by o.restaurant_id order by o.category)
  from (select distinct mi.restaurant_id, mi.category
          from public.menu_items mi
         where mi.category is not null
           and not exists (select 1
                             from public.restaurant_categories rc
                            where rc.restaurant_id = mi.restaurant_id
                              and rc.name          = mi.category)) o
  left join (select restaurant_id, max(sort_order) as max_order
               from public.restaurant_categories
              group by restaurant_id) m
    on m.restaurant_id = o.restaurant_id;


-- ── 1. menu_items.category_id ───────────────────────────────────────────────
alter table public.menu_items
  add column if not exists category_id uuid
    references public.restaurant_categories(id) on delete set null;

-- Backfill from the existing text name. Unambiguous right now because
-- (restaurant_id, name) is still unique, and step 0 guaranteed a row exists
-- for every non-null category name.
update public.menu_items mi
   set category_id = rc.id
  from public.restaurant_categories rc
 where rc.restaurant_id = mi.restaurant_id
   and rc.name          = mi.category
   and mi.category_id is null;

create index if not exists idx_menu_items_category_id
  on public.menu_items (category_id);

-- The category-delete flow sets items back to "no category". That is currently
-- a NOT NULL violation, and ON DELETE SET NULL above would hit the same wall.
alter table public.menu_items
  alter column category drop not null;


-- ── 2. Keep the legacy text column as a derived mirror ──────────────────────
-- menu_items.category stays, but becomes a denormalised display/analytics
-- label maintained by the database rather than a second source of truth.
-- This is what lets the analytics read path keep working untouched, and it
-- replaces the app-level rename cascade entirely.

-- NOTE on the branch below: this trigger goes live BEFORE the new code does,
-- so it must not disturb the currently-deployed app, which still inserts rows
-- carrying only the text category and no category_id (e.g. the new-account
-- sample-item seed). Hence: sync only when category_id is actually set, and
-- clear the text only on an UPDATE that explicitly unsets category_id. A plain
-- legacy INSERT with category_id NULL is left exactly as it was.
create or replace function public.sync_menu_item_category_name()
returns trigger language plpgsql as $$
begin
  if new.category_id is not null then
    select name into new.category
      from public.restaurant_categories
     where id = new.category_id;
  elsif tg_op = 'UPDATE' then
    new.category := null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_menu_item_category_name on public.menu_items;
create trigger trg_sync_menu_item_category_name
  before insert or update of category_id on public.menu_items
  for each row execute function public.sync_menu_item_category_name();

create or replace function public.sync_menu_items_on_category_rename()
returns trigger language plpgsql as $$
begin
  if new.name is distinct from old.name then
    update public.menu_items
       set category = new.name
     where category_id = new.id;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_sync_menu_items_on_category_rename on public.restaurant_categories;
create trigger trg_sync_menu_items_on_category_rename
  after update of name on public.restaurant_categories
  for each row execute function public.sync_menu_items_on_category_rename();


-- ── 3. category_notes.category_id ───────────────────────────────────────────
-- Notes are keyed by category NAME today, so two same-named categories in
-- different menus would share one note. Move them onto the id as well.
alter table public.category_notes
  add column if not exists category_id uuid
    references public.restaurant_categories(id) on delete cascade;

update public.category_notes cn
   set category_id = rc.id
  from public.restaurant_categories rc
 where rc.restaurant_id = cn.restaurant_id
   and rc.name          = cn.category
   and cn.category_id is null;

-- 10 existing notes reference a category that no longer exists; they stay NULL
-- and are simply never read. Partial index so those NULLs don't collide.
create unique index if not exists category_notes_category_id_key
  on public.category_notes (category_id)
  where category_id is not null;

commit;
