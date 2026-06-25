-- ============================================================
-- VoltJo — Vehicle document knowledge base (the RAG-lite bridge)
-- Migration: 012_vehicle_knowledge
-- Date: 2026-06-25
-- ============================================================
--
-- Goal: create the table that turns the orphaned, already-cited Markdown corpus
-- in `public/cars/**` into a grounded, full-text-searchable knowledge base. One
-- row per `##` section of each `04 - AI Data` / `05 - Trims` file. Populated by
-- the build script `scripts/ingest-vehicle-knowledge.mjs` (NOT by this SQL).
--
-- Design (roadmap §B.2):
--   * Additive only — no touch to existing tables/data.
--   * RLS: authenticated users may READ; writes are service-role only
--     (service_role bypasses RLS, so no write policy is granted to anyone else).
--   * Full-text search via a trigger-maintained `tsvector` + GIN index.
--     'simple' config avoids English stemming pitfalls on Arabic/English-mixed text.
--   * `content_hash` (sha256 of content) drives idempotent upsert + change detection.
--   * `confidence` holds the conservative (Jordan-facing) enum; `confidence_raw`
--     preserves the full original grade chain (e.g. 'official (export) → needs_review').
--
-- Idempotent: create-if-not-exists + pg_constraint guards + drop-then-create
-- for policies/triggers. Safe to re-run.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. Table
-- ------------------------------------------------------------
create table if not exists public.vehicle_knowledge (
  id              uuid primary key default gen_random_uuid(),
  vehicle_id      uuid not null references public.supported_vehicles(id) on delete cascade,
  category        text not null,        -- 'battery_charging'|'maintenance'|'safety'|'engine_fuel'|'trims'|'profile'|'market'
  section         text not null,        -- the '##' heading, e.g. 'Engine oil & oil filter'
  content         text not null,        -- the chunk body (Arabic/English mix as authored)
  source_ref      text,                 -- e.g. 'S5' or 'S1, S13, S2'
  source_file     text,                 -- e.g. 'BYD-Seal-U-DMi-Owner-Manual-EU-source-alias.pdf'
  page_ref        text,                 -- e.g. '209' or '208,210'
  market          text not null default 'jordan',
  confidence      text not null default 'unknown',
  confidence_raw  text,                 -- full original grade chain, verbatim (nullable)
  content_hash    text not null,        -- sha256(content) → idempotent upsert + change detection
  tsv             tsvector,             -- maintained by trigger (see §4)
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (vehicle_id, category, section)
);

-- ------------------------------------------------------------
-- 2. Constraints (enum-like text columns, guarded for re-run)
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'vehicle_knowledge_category_check'
  ) then
    alter table public.vehicle_knowledge
      add constraint vehicle_knowledge_category_check
      check (category in (
        'battery_charging', 'engine_fuel', 'maintenance', 'safety',
        'trims', 'profile', 'market'
      ));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'vehicle_knowledge_confidence_check'
  ) then
    alter table public.vehicle_knowledge
      add constraint vehicle_knowledge_confidence_check
      check (confidence in (
        'official', 'dealer', 'owner_reported', 'estimate', 'needs_review', 'unknown'
      ));
  end if;
end
$$;

-- ------------------------------------------------------------
-- 3. Indexes
-- ------------------------------------------------------------
-- GIN full-text index — the core retrieval index (websearch_to_tsquery('simple', …)).
create index if not exists vehicle_knowledge_tsv_idx
  on public.vehicle_knowledge using gin (tsv);

create index if not exists vehicle_knowledge_vehicle_idx
  on public.vehicle_knowledge (vehicle_id);

create index if not exists vehicle_knowledge_category_idx
  on public.vehicle_knowledge (category);

-- Composite for the common "this vehicle, narrowed by intent" retrieval path.
create index if not exists vehicle_knowledge_vehicle_category_idx
  on public.vehicle_knowledge (vehicle_id, category);

-- ------------------------------------------------------------
-- 4. tsvector maintenance trigger
-- ------------------------------------------------------------
-- 'simple' config = no stemming/stop-words. Best for Arabic + mixed English,
-- where Postgres has no Arabic dictionary and English stemming would corrupt
-- Arabic tokens. Section heading is weighted 'A', body 'B'.
create or replace function public.vehicle_knowledge_tsv_update()
returns trigger
language plpgsql
as $$
begin
  new.tsv :=
    setweight(to_tsvector('simple', coalesce(new.section, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(new.content, '')), 'B');
  return new;
end;
$$;

drop trigger if exists vehicle_knowledge_tsv_trg on public.vehicle_knowledge;
create trigger vehicle_knowledge_tsv_trg
before insert or update of section, content on public.vehicle_knowledge
for each row
execute function public.vehicle_knowledge_tsv_update();

-- updated_at maintenance (reuses the project-wide helper from migration 005).
drop trigger if exists set_vehicle_knowledge_updated_at on public.vehicle_knowledge;
create trigger set_vehicle_knowledge_updated_at
before update on public.vehicle_knowledge
for each row
execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5. Row Level Security
-- ------------------------------------------------------------
-- Read: authenticated users only (the knowledge base is a logged-in feature).
-- Write: service-role only — service_role bypasses RLS, and NO insert/update/
-- delete policy is granted to anon/authenticated, so they cannot write.
alter table public.vehicle_knowledge enable row level security;

drop policy if exists "Authenticated can read vehicle knowledge" on public.vehicle_knowledge;
create policy "Authenticated can read vehicle knowledge"
on public.vehicle_knowledge
for select
to authenticated
using (
  exists (
    select 1
    from public.supported_vehicles sv
    where sv.id = vehicle_knowledge.vehicle_id
      and sv.is_active = true
      and sv.market = 'jordan'
  )
);
