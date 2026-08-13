-- ============================================================================
-- PHASE 1b — Make category_notes.category_id a usable ON CONFLICT target.
--
-- RUN THIS BEFORE THE CODE DEPLOY. 001 created the index with a
-- "WHERE category_id IS NOT NULL" clause. Postgres cannot infer a *partial*
-- index from a bare "ON CONFLICT (category_id)", and PostgREST never emits the
-- matching WHERE clause, so the new note upsert fails outright:
--
--   42P10: there is no unique or exclusion constraint matching the
--          ON CONFLICT specification
--
-- The partial clause was never needed: a plain unique index already treats
-- NULLs as distinct, so the ~9 legacy notes with a NULL category_id still
-- coexist happily. Behaviour is identical; only the inferability changes.
--
-- Safe to run against the currently-deployed app: it does not touch
-- unique_category_note, which the live code still upserts against.
--
-- Run order:  001  ->  001b  ->  deploy code  ->  002
-- Project: zqhyeyrbqygisephzvoo
-- ============================================================================

begin;

drop index if exists public.category_notes_category_id_key;

create unique index category_notes_category_id_key
  on public.category_notes (category_id);

commit;
