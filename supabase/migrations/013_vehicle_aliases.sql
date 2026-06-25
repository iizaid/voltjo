-- ============================================================
-- VoltJo — Vehicle alias resolution (RAG-lite matching layer)
-- Migration: 013_vehicle_aliases
-- Date: 2026-06-25
-- ============================================================
--
-- Goal: fix the brittle substring vehicle matcher in `lib/ai/vehicle-context.ts`
-- without ML. One row per known human alias of a supported vehicle, alongside a
-- pre-normalized form (`alias_norm`) the retrieval layer can match against a
-- normalized user message.
--
-- CRITICAL INVARIANT: `alias_norm` MUST equal `normalizeArabic(alias)` from
-- `lib/ai/normalize-arabic.ts`. The seed values below were produced by that exact
-- normalizer (strip diacritics; unify ا/أ/إ/آ/ٱ→ا, ة→ه, ى→ي, ؤ→و, ئ→ي; fold
-- Arabic-Indic digits; lowercase; collapse whitespace). A unit test
-- (`lib/ai/vehicle-aliases-seed.test.ts`) re-normalizes every seeded alias and
-- asserts equality, so drift in the JS normalizer fails CI and flags this file.
--
-- Design (roadmap §B.2, migration 013):
--   * Additive only — no touch to existing tables/data.
--   * RLS: authenticated users may READ; writes are service-role only.
--   * Seed is idempotent (ON CONFLICT DO NOTHING) and keyed by slug → vehicle_id,
--     so it is safe on every deploy and skips vehicles not yet in the catalog.
--
-- Idempotent: create-if-not-exists + drop-then-create for policies. Safe to re-run.

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. Table
-- ------------------------------------------------------------
create table if not exists public.vehicle_aliases (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references public.supported_vehicles(id) on delete cascade,
  alias       text not null,            -- human form: 'atto 3', 'يوان بلس', 'seal u'
  alias_norm  text not null,            -- normalizeArabic(alias) — see CRITICAL INVARIANT
  lang        text not null default 'ar' check (lang in ('ar', 'en')),
  created_at  timestamptz not null default now(),
  unique (vehicle_id, alias_norm)
);

-- ------------------------------------------------------------
-- 2. Index — the runtime lookup loads all aliases (tiny table) and matches in
--    process, but the norm index keeps any direct `where alias_norm = …` cheap.
-- ------------------------------------------------------------
create index if not exists vehicle_aliases_norm_idx
  on public.vehicle_aliases (alias_norm);

-- ------------------------------------------------------------
-- 3. Row Level Security — read for authenticated; write service-role only.
-- ------------------------------------------------------------
alter table public.vehicle_aliases enable row level security;

drop policy if exists "Authenticated can read vehicle aliases" on public.vehicle_aliases;
create policy "Authenticated can read vehicle aliases"
  on public.vehicle_aliases
  for select
  to authenticated
  using (true);

-- ------------------------------------------------------------
-- 4. Seed — idempotent. Maps slug → vehicle_id; skips unknown slugs and any
--    (vehicle_id, alias_norm) already present. Re-run safe on every deploy.
-- ------------------------------------------------------------
insert into public.vehicle_aliases (vehicle_id, alias, alias_norm, lang)
select sv.id, a.alias, a.alias_norm, a.lang
from (
  values
    -- BYD Song Plus DM-i 2025
    ('byd-song-plus-dmi-2025', 'song plus',        'song plus',        'en'),
    ('byd-song-plus-dmi-2025', 'byd song plus',    'byd song plus',    'en'),
    ('byd-song-plus-dmi-2025', 'song plus dmi',    'song plus dmi',    'en'),
    ('byd-song-plus-dmi-2025', 'سونغ بلس',          'سونغ بلس',          'ar'),
    ('byd-song-plus-dmi-2025', 'سونج بلس',          'سونج بلس',          'ar'),
    -- BYD Song Pro DM-i 2025
    ('byd-song-pro-dmi-2025',  'song pro',         'song pro',         'en'),
    ('byd-song-pro-dmi-2025',  'byd song pro',     'byd song pro',     'en'),
    ('byd-song-pro-dmi-2025',  'song pro dmi',     'song pro dmi',     'en'),
    ('byd-song-pro-dmi-2025',  'سونغ برو',          'سونغ برو',          'ar'),
    ('byd-song-pro-dmi-2025',  'سونج برو',          'سونج برو',          'ar'),
    -- BYD Sealion 05 DM-i 2025
    ('byd-sealion-05-dmi-2025','sealion 05',       'sealion 05',       'en'),
    ('byd-sealion-05-dmi-2025','sealion',          'sealion',          'en'),
    ('byd-sealion-05-dmi-2025','byd sealion 05',   'byd sealion 05',   'en'),
    ('byd-sealion-05-dmi-2025','seal u',           'seal u',           'en'),
    ('byd-sealion-05-dmi-2025','سيلايون 05',        'سيلايون 05',        'ar'),
    ('byd-sealion-05-dmi-2025','سيلايون',           'سيلايون',           'ar'),
    ('byd-sealion-05-dmi-2025','سيل يو',            'سيل يو',            'ar'),
    -- Tesla Model 3 2025
    ('tesla-model-3-2025',     'model 3',          'model 3',          'en'),
    ('tesla-model-3-2025',     'tesla model 3',    'tesla model 3',    'en'),
    ('tesla-model-3-2025',     'موديل 3',           'موديل 3',           'ar'),
    ('tesla-model-3-2025',     'تسلا موديل 3',       'تسلا موديل 3',       'ar'),
    ('tesla-model-3-2025',     'تسلا 3',            'تسلا 3',            'ar'),
    -- Dongfeng Mage PHEV 2026
    ('dongfeng-mage-phev-2026','dongfeng mage',    'dongfeng mage',    'en'),
    ('dongfeng-mage-phev-2026','mage phev',        'mage phev',        'en'),
    ('dongfeng-mage-phev-2026','دونغفنغ ماج',        'دونغفنغ ماج',        'ar'),
    -- Toyota RAV4 Hybrid 2025
    ('toyota-rav4-hybrid-2025','rav4',             'rav4',             'en'),
    ('toyota-rav4-hybrid-2025','rav 4',            'rav 4',            'en'),
    ('toyota-rav4-hybrid-2025','toyota rav4',      'toyota rav4',      'en'),
    ('toyota-rav4-hybrid-2025','rav4 hybrid',      'rav4 hybrid',      'en'),
    ('toyota-rav4-hybrid-2025','راف4',             'راف4',             'ar'),
    ('toyota-rav4-hybrid-2025','راف 4',            'راف 4',            'ar')
) as a(slug, alias, alias_norm, lang)
join public.supported_vehicles sv on sv.slug = a.slug
on conflict (vehicle_id, alias_norm) do nothing;
