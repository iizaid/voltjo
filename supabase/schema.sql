-- VoltJo Smart Profile
-- This table is intentionally separate from auth.users. Supabase Auth owns
-- credentials and sessions; public.profiles stores product personalization
-- answers collected during onboarding.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  age_range text,
  country text,
  city text,
  ownership_status text,
  has_driven_ev_or_hybrid text,
  main_goal text,
  driving_pattern text,
  home_charging_access text,
  priorities text[] not null default '{}',
  onboarding_completed boolean not null default false,
  onboarding_completed_at timestamptz,
  profile_version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false,
  add column if not exists onboarding_completed_at timestamptz,
  add column if not exists profile_version integer not null default 1;

comment on table public.profiles is
  'VoltJo Smart Profile. One row per auth user with onboarding answers used for assistant personalization, recommendations, comparisons, and future dashboard insights.';

comment on column public.profiles.id is
  'Always equals auth.users.id. Never accept this value from client payloads.';

comment on column public.profiles.priorities is
  'Backend validates values against lib/onboarding/questions.ts. Database constraints here are safety rails, not the primary source of option truth.';

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'profiles_full_name_length'
  ) then
    alter table public.profiles
      add constraint profiles_full_name_length
      check (full_name is null or char_length(full_name) <= 80);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_profile_version_positive'
  ) then
    alter table public.profiles
      add constraint profiles_profile_version_positive
      check (profile_version >= 1);
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'profiles_priorities_reasonable_size'
  ) then
    alter table public.profiles
      add constraint profiles_priorities_reasonable_size
      check (cardinality(priorities) <= 10);
  end if;
end
$$;

alter table public.profiles enable row level security;

drop policy if exists "Users can select their own profile" on public.profiles;
create policy "Users can select their own profile"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can insert their own profile" on public.profiles;
create policy "Users can insert their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- No delete policy is created in Phase 1. Account/profile deletion should be
-- implemented deliberately with a confirmed account-deletion flow.

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

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();
