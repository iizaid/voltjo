create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.vehicle_brands (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name_en text not null,
  name_ar text not null,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.supported_vehicles (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.vehicle_brands(id) on delete restrict,
  slug text unique not null,
  name_en text not null,
  name_ar text not null,
  model_year integer not null,
  vehicle_type text not null,
  body_type text,
  market text not null default 'jordan',
  battery_kwh numeric,
  fuel_tank_liters numeric,
  engine_liters numeric,
  electric_range_km numeric,
  total_range_km numeric,
  price_jod_min integer,
  price_jod_max integer,
  charging_port text,
  dc_fast_charging boolean,
  home_charging_supported boolean,
  is_active boolean not null default true,
  summary_ar text,
  jordan_notes_ar text,
  data_confidence text not null default 'estimate',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.vehicle_cost_profiles (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.supported_vehicles(id) on delete cascade,
  scenario text not null,
  electricity_kwh_100km numeric,
  fuel_l_100km numeric,
  notes_ar text,
  confidence text not null default 'estimate',
  created_at timestamptz not null default now()
);

create table if not exists public.charging_locations (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  city text,
  area text,
  latitude numeric,
  longitude numeric,
  plug_types text[],
  power_kw numeric,
  is_verified boolean not null default false,
  source text,
  notes_ar text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'supported_vehicles_vehicle_type_check'
  ) then
    alter table public.supported_vehicles
      add constraint supported_vehicles_vehicle_type_check
      check (vehicle_type in ('ev', 'phev', 'hev'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'supported_vehicles_data_confidence_check'
  ) then
    alter table public.supported_vehicles
      add constraint supported_vehicles_data_confidence_check
      check (data_confidence in ('official', 'dealer', 'owner_reported', 'estimate'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'vehicle_cost_profiles_confidence_check'
  ) then
    alter table public.vehicle_cost_profiles
      add constraint vehicle_cost_profiles_confidence_check
      check (confidence in ('official', 'dealer', 'owner_reported', 'estimate'));
  end if;
end
$$;

create index if not exists supported_vehicles_brand_id_idx
  on public.supported_vehicles(brand_id);

create index if not exists supported_vehicles_vehicle_type_idx
  on public.supported_vehicles(vehicle_type);

create index if not exists supported_vehicles_is_active_idx
  on public.supported_vehicles(is_active);

create index if not exists supported_vehicles_market_is_active_idx
  on public.supported_vehicles(market, is_active);

create unique index if not exists vehicle_cost_profiles_vehicle_scenario_idx
  on public.vehicle_cost_profiles(vehicle_id, scenario);

create index if not exists charging_locations_city_idx
  on public.charging_locations(city);

create index if not exists charging_locations_active_city_idx
  on public.charging_locations(is_active, city);

alter table public.vehicle_brands enable row level security;
alter table public.supported_vehicles enable row level security;
alter table public.vehicle_cost_profiles enable row level security;
alter table public.charging_locations enable row level security;

drop policy if exists "Public can read active vehicle brands" on public.vehicle_brands;
create policy "Public can read active vehicle brands"
on public.vehicle_brands
for select
to public
using (
  exists (
    select 1
    from public.supported_vehicles sv
    where sv.brand_id = vehicle_brands.id
      and sv.is_active = true
      and sv.market = 'jordan'
  )
);

drop policy if exists "Public can read active supported vehicles" on public.supported_vehicles;
create policy "Public can read active supported vehicles"
on public.supported_vehicles
for select
to public
using (is_active = true and market = 'jordan');

drop policy if exists "Public can read active vehicle cost profiles" on public.vehicle_cost_profiles;
create policy "Public can read active vehicle cost profiles"
on public.vehicle_cost_profiles
for select
to public
using (
  exists (
    select 1
    from public.supported_vehicles sv
    where sv.id = vehicle_cost_profiles.vehicle_id
      and sv.is_active = true
      and sv.market = 'jordan'
  )
);

drop policy if exists "Public can read active charging locations" on public.charging_locations;
create policy "Public can read active charging locations"
on public.charging_locations
for select
to public
using (is_active = true);

drop trigger if exists set_vehicle_brands_updated_at on public.vehicle_brands;
create trigger set_vehicle_brands_updated_at
before update on public.vehicle_brands
for each row
execute function public.set_updated_at();

drop trigger if exists set_supported_vehicles_updated_at on public.supported_vehicles;
create trigger set_supported_vehicles_updated_at
before update on public.supported_vehicles
for each row
execute function public.set_updated_at();

drop trigger if exists set_charging_locations_updated_at on public.charging_locations;
create trigger set_charging_locations_updated_at
before update on public.charging_locations
for each row
execute function public.set_updated_at();

insert into public.vehicle_brands (slug, name_en, name_ar, country)
values
  ('byd', 'BYD', 'بي واي دي', 'China'),
  ('dongfeng', 'Dongfeng', 'دونغ فينغ', 'China'),
  ('toyota', 'Toyota', 'تويوتا', 'Japan'),
  ('tesla', 'Tesla', 'تسلا', 'United States')
on conflict (slug) do update
set
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  country = excluded.country;

insert into public.supported_vehicles (
  brand_id,
  slug,
  name_en,
  name_ar,
  model_year,
  vehicle_type,
  body_type,
  market,
  battery_kwh,
  fuel_tank_liters,
  engine_liters,
  electric_range_km,
  total_range_km,
  price_jod_min,
  price_jod_max,
  charging_port,
  dc_fast_charging,
  home_charging_supported,
  is_active,
  summary_ar,
  jordan_notes_ar,
  data_confidence
)
select
  vb.id,
  v.slug,
  v.name_en,
  v.name_ar,
  v.model_year,
  v.vehicle_type,
  v.body_type,
  'jordan',
  v.battery_kwh,
  v.fuel_tank_liters,
  v.engine_liters,
  v.electric_range_km,
  v.total_range_km,
  v.price_jod_min,
  v.price_jod_max,
  v.charging_port,
  v.dc_fast_charging,
  v.home_charging_supported,
  true,
  v.summary_ar,
  v.jordan_notes_ar,
  v.data_confidence
from (
  values
    ('byd', 'byd-song-plus-dmi-2025', 'BYD Song Plus DM-i', 'BYD Song Plus DM-i', 2025, 'phev', 'suv', 18.3::numeric, null::numeric, 1.5::numeric, 95::numeric, null::numeric, null::integer, null::integer, 'GB/T', false, true, 'كروس أوفر Plug-in Hybrid مناسب للعائلات والقيادة اليومية داخل الأردن.', 'المواصفات والأسعار قد تختلف حسب الوكيل والنسخة المتوفرة في السوق الأردني.', 'estimate'),
    ('byd', 'byd-sealion-05-dmi-2025', 'BYD Sealion 05 DM-i', 'BYD Sealion 05 DM-i', 2025, 'phev', 'suv', null::numeric, null::numeric, null::numeric, null::numeric, null::numeric, null::integer, null::integer, 'GB/T', false, true, 'موديل جديد ضمن فئة Plug-in Hybrid وما زالت بيانات السوق المحلي قيد المراجعة.', 'ننصح بمراجعة النسخة المحلية والتجهيزات قبل الاعتماد على أي رقم نهائي.', 'estimate'),
    ('byd', 'byd-song-pro-dmi-2025', 'BYD Song Pro DM-i', 'BYD Song Pro DM-i', 2025, 'phev', 'suv', null::numeric, null::numeric, null::numeric, null::numeric, null::numeric, null::integer, null::integer, 'GB/T', false, true, 'خيار Plug-in Hybrid متوسط الحجم ضمن عائلة Song.', 'توفر النسخ قد يختلف بين الوكلاء والمستوردين داخل الأردن.', 'estimate'),
    ('dongfeng', 'dongfeng-mage-phev-2026', 'Dongfeng Mage PHEV', 'Dongfeng Mage PHEV', 2026, 'phev', 'suv', null::numeric, null::numeric, null::numeric, null::numeric, null::numeric, null::integer, null::integer, 'GB/T', false, true, 'موديل PHEV حديث وبياناته المحلية الأولية ما زالت محدودة.', 'المعلومات الحالية تقديرية وتحتاج تأكيدًا من السوق المحلي.', 'estimate'),
    ('toyota', 'toyota-rav4-hybrid-2025', 'Toyota RAV4 Hybrid', 'Toyota RAV4 Hybrid', 2025, 'hev', 'suv', null::numeric, null::numeric, 2.5::numeric, null::numeric, null::numeric, null::integer, null::integer, null, false, false, 'هايبرد تقليدي معروف بالاعتمادية ولا يحتاج شحنًا خارجيًا.', 'تكلفة التشغيل تعتمد أكثر على الاستهلاك الفعلي داخل المدينة والسفر.', 'estimate'),
    ('tesla', 'tesla-model-3-2025', 'Tesla Model 3', 'Tesla Model 3', 2025, 'ev', 'sedan', 60::numeric, null::numeric, null::numeric, null::numeric, null::numeric, null::integer, null::integer, 'NACS / CCS حسب النسخة', true, true, 'سيارة كهربائية بالكامل وتحتاج التحقق من منفذ الشحن والمواصفات حسب بلد الاستيراد.', 'النسخ المستوردة قد تختلف في منفذ الشحن ونظام الخرائط والاتصال.', 'estimate')
) as v(
  brand_slug,
  slug,
  name_en,
  name_ar,
  model_year,
  vehicle_type,
  body_type,
  battery_kwh,
  fuel_tank_liters,
  engine_liters,
  electric_range_km,
  total_range_km,
  price_jod_min,
  price_jod_max,
  charging_port,
  dc_fast_charging,
  home_charging_supported,
  summary_ar,
  jordan_notes_ar,
  data_confidence
)
join public.vehicle_brands vb on vb.slug = v.brand_slug
on conflict (slug) do update
set
  brand_id = excluded.brand_id,
  name_en = excluded.name_en,
  name_ar = excluded.name_ar,
  model_year = excluded.model_year,
  vehicle_type = excluded.vehicle_type,
  body_type = excluded.body_type,
  market = excluded.market,
  battery_kwh = excluded.battery_kwh,
  fuel_tank_liters = excluded.fuel_tank_liters,
  engine_liters = excluded.engine_liters,
  electric_range_km = excluded.electric_range_km,
  total_range_km = excluded.total_range_km,
  price_jod_min = excluded.price_jod_min,
  price_jod_max = excluded.price_jod_max,
  charging_port = excluded.charging_port,
  dc_fast_charging = excluded.dc_fast_charging,
  home_charging_supported = excluded.home_charging_supported,
  is_active = excluded.is_active,
  summary_ar = excluded.summary_ar,
  jordan_notes_ar = excluded.jordan_notes_ar,
  data_confidence = excluded.data_confidence;

insert into public.vehicle_cost_profiles (
  vehicle_id,
  scenario,
  electricity_kwh_100km,
  fuel_l_100km,
  notes_ar,
  confidence
)
select
  sv.id,
  p.scenario,
  p.electricity_kwh_100km,
  p.fuel_l_100km,
  p.notes_ar,
  p.confidence
from (
  values
    ('byd-song-plus-dmi-2025', 'mixed', 5.2::numeric, 4.8::numeric, 'تقدير أولي لاستخدام مختلط داخل الأردن وقد يختلف حسب الشحن المتاح وطريقة القيادة.', 'estimate'),
    ('tesla-model-3-2025', 'city_ev', 13.8::numeric, null::numeric, 'تقدير أولي لاستخدام المدينة مع تكييف معتدل.', 'estimate'),
    ('tesla-model-3-2025', 'highway_120', 16.5::numeric, null::numeric, 'تقدير أولي للقيادة على سرعة طريق سريع مرتفعة نسبيًا.', 'estimate'),
    ('toyota-rav4-hybrid-2025', 'mixed', null::numeric, 5.9::numeric, 'تقدير أولي لاستخدام مختلط داخل الأردن.', 'estimate')
) as p(vehicle_slug, scenario, electricity_kwh_100km, fuel_l_100km, notes_ar, confidence)
join public.supported_vehicles sv on sv.slug = p.vehicle_slug
on conflict (vehicle_id, scenario) do update
set
  electricity_kwh_100km = excluded.electricity_kwh_100km,
  fuel_l_100km = excluded.fuel_l_100km,
  notes_ar = excluded.notes_ar,
  confidence = excluded.confidence;
