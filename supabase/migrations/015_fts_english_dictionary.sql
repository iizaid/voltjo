-- ============================================================
-- VoltJo — FTS dictionary upgrade: 'simple' → 'english'
-- Migration: 015_fts_english_dictionary
-- Date: 2026-06-25
-- ============================================================
--
-- Why this migration:
--   The original 'simple' FTS config was chosen to avoid English-stemming
--   corrupting Arabic tokens that were being sent raw to the query.
--
--   Now that lib/ai/query-translator.ts pre-translates all Arabic queries
--   to English keywords BEFORE the FTS call, the reason for 'simple' no
--   longer applies. All queries reaching the RPC are now English text.
--
--   'english' FTS config provides:
--     1. Stop-word removal — 'the', 'how', 'many', 'is', 'a' are stripped.
--        These words must currently match verbatim in chunk content (they don't),
--        causing 0 rows for natural-language queries.
--     2. Stemming — 'charge' = 'charging', 'hour' = 'hours', 'battery' =
--        'batteries'. Without stemming, FTS is brittle to morphological variation.
--
--   Technical abbreviations (AC, DC, kWh, EV, PHEV, DM-i, 05) pass through
--   the 'english' dictionary unchanged since they are not in the stop-word list
--   and are already lowercase-normalised.
--
-- What this migration does:
--   1. Replaces the tsvector trigger to use to_tsvector('english', ...)
--   2. Replaces the search RPC to use websearch_to_tsquery('english', ...)
--   3. Rebuilds all existing tsvectors with a bulk UPDATE (one-time backfill).
--
-- Idempotent: create-or-replace + explicit UPDATE. Safe to re-run.
-- Rollback: run 014_search_vehicle_knowledge.sql again + trigger recreate.

-- ------------------------------------------------------------
-- 1. Rebuild tsvector trigger with 'english' config
-- ------------------------------------------------------------
create or replace function public.vehicle_knowledge_tsv_update()
returns trigger
language plpgsql
as $$
begin
  new.tsv :=
    setweight(to_tsvector('english', coalesce(new.section, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(new.content, '')), 'B');
  return new;
end;
$$;

-- Re-create trigger (already exists; drop+create is idempotent).
drop trigger if exists vehicle_knowledge_tsv_trg on public.vehicle_knowledge;
create trigger vehicle_knowledge_tsv_trg
before insert or update of section, content on public.vehicle_knowledge
for each row
execute function public.vehicle_knowledge_tsv_update();

-- ------------------------------------------------------------
-- 2. Backfill: rebuild ALL existing tsvectors with 'english'
-- This is a one-time bulk UPDATE — safe on 274 rows.
-- ------------------------------------------------------------
update public.vehicle_knowledge
set tsv =
  setweight(to_tsvector('english', coalesce(section, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(content, '')), 'B');

-- ------------------------------------------------------------
-- 3. Replace search RPC with 'english' dictionary
-- ------------------------------------------------------------
create or replace function public.search_vehicle_knowledge(
  p_vehicle_ids uuid[],
  p_query       text,
  p_category    text default null,
  p_limit       int  default 6
)
returns table (
  id             uuid,
  vehicle_id     uuid,
  category       text,
  section        text,
  content        text,
  source_ref     text,
  source_file    text,
  page_ref       text,
  confidence     text,
  confidence_raw text,
  rank           real
)
language sql
stable
security definer
set search_path = public
as $$
  select
    k.id, k.vehicle_id, k.category, k.section, k.content,
    k.source_ref, k.source_file, k.page_ref,
    k.confidence, k.confidence_raw,
    ts_rank(k.tsv, websearch_to_tsquery('english', p_query)) as rank
  from public.vehicle_knowledge k
  where k.vehicle_id = any(p_vehicle_ids)
    and (p_category is null or k.category = p_category)
    and k.tsv @@ websearch_to_tsquery('english', p_query)
  order by rank desc
  limit greatest(1, least(coalesce(p_limit, 6), 24));
$$;

-- Preserve grants from migration 014.
revoke all on function public.search_vehicle_knowledge(uuid[], text, text, int) from public;
grant execute on function public.search_vehicle_knowledge(uuid[], text, text, int) to service_role;
