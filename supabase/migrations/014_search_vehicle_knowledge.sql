-- ============================================================
-- VoltJo — Grounded chunk retrieval RPC (RAG-lite core)
-- Migration: 014_search_vehicle_knowledge
-- Date: 2026-06-25
-- ============================================================
--
-- Goal: a parameterized, injection-safe, RLS-clean entry point for full-text
-- retrieval over `vehicle_knowledge`. The chat pipeline calls this RPC with the
-- service-role client (`lib/supabase/admin.ts`) so retrieval works for BOTH
-- anonymous and authenticated chats — the table's read policy is
-- `to authenticated`, which the anon-key client cannot satisfy.
--
-- Why a function (not inline .textSearch):
--   * keeps `websearch_to_tsquery('simple', …)` + `ts_rank` server-side and
--     parameterized — no string interpolation, no injection surface.
--   * returns exactly the projected citation columns.
--   * gives a stable, typed surface for `database.types.ts`.
--   * SECURITY DEFINER → callable without re-opening table RLS; can later be
--     granted to `authenticated` for a direct-from-client path.
--
-- 'simple' config matches the migration-012 tsvector trigger (no stemming;
-- Arabic-safe). Idempotent: create-or-replace + explicit grants. Safe to re-run.

create or replace function public.search_vehicle_knowledge(
  p_vehicle_ids uuid[],
  p_query       text,
  p_category    text default null,   -- null ⇒ no category filter (soft-narrow in app)
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
    ts_rank(k.tsv, websearch_to_tsquery('simple', p_query)) as rank
  from public.vehicle_knowledge k
  where k.vehicle_id = any(p_vehicle_ids)
    and (p_category is null or k.category = p_category)
    and k.tsv @@ websearch_to_tsquery('simple', p_query)
  order by rank desc
  limit greatest(1, least(coalesce(p_limit, 6), 24));
$$;

-- Lock down execution: revoke from the world, grant only to the trusted server
-- role. (A future direct-client path would add `grant execute … to authenticated`.)
revoke all on function public.search_vehicle_knowledge(uuid[], text, text, int) from public;
grant execute on function public.search_vehicle_knowledge(uuid[], text, text, int) to service_role;
