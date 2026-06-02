alter table public.profiles
add column if not exists location_preferences jsonb not null default '{}'::jsonb;
