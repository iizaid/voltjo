-- ============================================================
-- VoltJo — EV Intelligence structured columns
-- Migration: 011_vehicle_ev_intelligence
-- Date: 2026-06-23
-- ============================================================
--
-- Goal: promote the high-value EV facts that migration 010 was forced to stuff
-- into the free-text `summary_ar` (drivetrain, AC/DC charging speed, efficiency,
-- strengths/weaknesses, use-case tags) into STRUCTURED, QUERYABLE columns. This
-- is the foundation the AI context layer needs to *filter and compare* vehicles
-- instead of merely quoting prose.
--
-- Scope: schema change (additive, nullable) + a confidence-respecting backfill
-- of the 6 existing vehicles. Backfill values are taken ONLY from facts already
-- asserted in migration 010's summaries — no new specs are invented. Vehicles
-- whose specs were left NULL/low-confidence in 010 stay NULL here.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS + UPDATE ... WHERE slug = ...

-- ------------------------------------------------------------
-- 1. New structured columns (all nullable; additive, safe to re-run)
-- ------------------------------------------------------------
alter table public.supported_vehicles
  add column if not exists drivetrain text,
  add column if not exists ac_charge_kw numeric,
  add column if not exists dc_charge_kw numeric,
  add column if not exists efficiency_kwh_100km numeric,
  add column if not exists charge_10_80_min integer,
  add column if not exists availability text not null default 'unconfirmed',
  add column if not exists use_case_tags text[] not null default '{}',
  add column if not exists strengths_ar text[] not null default '{}',
  add column if not exists weaknesses_ar text[] not null default '{}';

-- ------------------------------------------------------------
-- 2. Constraints for the new enum-like text columns
-- ------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'supported_vehicles_drivetrain_check'
  ) then
    alter table public.supported_vehicles
      add constraint supported_vehicles_drivetrain_check
      check (drivetrain is null or drivetrain in ('fwd', 'rwd', 'awd'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'supported_vehicles_availability_check'
  ) then
    alter table public.supported_vehicles
      add constraint supported_vehicles_availability_check
      check (availability in ('available', 'preorder', 'discontinued', 'unconfirmed'));
  end if;
end
$$;

-- GIN index so recommendation queries can filter on tags (use_case_tags @> '{taxi}').
create index if not exists supported_vehicles_use_case_tags_idx
  on public.supported_vehicles using gin (use_case_tags);

-- ------------------------------------------------------------
-- 3. Backfill — facts asserted in migration 010 prose, now structured.
-- ------------------------------------------------------------

-- Tesla Model 3 2025 (EV) — HIGH confidence specs in 010.
update public.supported_vehicles set
  drivetrain = 'rwd',
  ac_charge_kw = 11,
  dc_charge_kw = 170,
  efficiency_kwh_100km = 14,
  charge_10_80_min = 25,
  availability = 'unconfirmed',   -- import-dependent in Jordan
  use_case_tags = '{city,highway,long_trip}',
  strengths_ar = array['مدى طويل', 'شحن سريع', 'كفاءة عالية', 'برمجيات متقدمة'],
  weaknesses_ar = array['منفذ الشحن يختلف حسب بلد الاستيراد (NACS/CCS)', 'شبكة صيانة محدودة في الأردن', 'السعر متغيّر حسب الاستيراد']
where slug = 'tesla-model-3-2025';

-- BYD Song Plus DM-i 2025 (PHEV) — HIGH confidence specs in 010.
update public.supported_vehicles set
  drivetrain = 'fwd',
  ac_charge_kw = 3.3,
  dc_charge_kw = 18,
  availability = 'unconfirmed',
  use_case_tags = '{city,family,long_trip}',
  strengths_ar = array['تكلفة تشغيل منخفضة', 'مدى إجمالي طويل (~1100 كم)', 'مساحة عائلية مناسبة'],
  weaknesses_ar = array['شحن سريع بطيء نسبيًا', 'مدى كهربائي صافٍ أقل من السيارات الكهربائية بالكامل']
where slug = 'byd-song-plus-dmi-2025';

-- BYD Song Pro DM-i 2025 (PHEV) — MEDIUM confidence specs in 010.
update public.supported_vehicles set
  drivetrain = 'fwd',
  ac_charge_kw = 3.3,
  availability = 'unconfirmed',
  use_case_tags = '{city,family}',
  strengths_ar = array['اقتصادي بالوقود والكهرباء', 'مناسب للاستخدام اليومي'],
  weaknesses_ar = array['مدى كهربائي قصير', 'شحن AC/DC بطيء', 'توفر النسخ يختلف بين الوكلاء']
where slug = 'byd-song-pro-dmi-2025';

-- Toyota RAV4 Hybrid 2025 (HEV) — not plug-in; AC/DC intentionally NULL.
-- Drivetrain NULL: both FWD and AWD are sold; left NULL rather than guess.
update public.supported_vehicles set
  availability = 'unconfirmed',
  use_case_tags = '{city,family,long_trip}',
  strengths_ar = array['اعتمادية عالية', 'لا حاجة لبنية شحن', 'اقتصادية داخل المدينة'],
  weaknesses_ar = array['ليست كهربائية بالكامل', 'تعتمد على الوقود', 'لا يمكن شحنها من الكهرباء']
where slug = 'toyota-rav4-hybrid-2025';

-- BYD Sealion 05 DM-i 2025 (PHEV) — LOW confidence in 010: specs stay NULL.
-- Only the broad use-case is asserted; no strengths claimed as fact.
update public.supported_vehicles set
  availability = 'unconfirmed',
  use_case_tags = '{family}'
where slug = 'byd-sealion-05-dmi-2025';

-- Dongfeng Mage PHEV 2026 (PHEV) — LOW confidence in 010: specs stay NULL.
update public.supported_vehicles set
  availability = 'unconfirmed',
  use_case_tags = '{family}'
where slug = 'dongfeng-mage-phev-2026';
