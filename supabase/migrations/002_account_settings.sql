alter table public.profiles
  add column if not exists avatar_config jsonb not null default '{}'::jsonb;

alter table public.profiles
  add column if not exists privacy_settings jsonb not null default '{}'::jsonb;
