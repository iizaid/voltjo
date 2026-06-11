create table if not exists public.account_deletion_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  reason text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint account_deletion_requests_status_check
    check (status in ('pending', 'reviewing', 'cancelled', 'completed', 'rejected')),
  constraint account_deletion_requests_reason_length_check
    check (reason is null or char_length(reason) <= 1000)
);

create index if not exists account_deletion_requests_user_status_idx
  on public.account_deletion_requests(user_id, status);

create unique index if not exists account_deletion_requests_one_pending_per_user_idx
  on public.account_deletion_requests(user_id)
  where status = 'pending';

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists account_deletion_requests_set_updated_at
  on public.account_deletion_requests;

create trigger account_deletion_requests_set_updated_at
  before update on public.account_deletion_requests
  for each row execute function public.set_updated_at();

alter table public.account_deletion_requests enable row level security;

drop policy if exists "Users can read own deletion requests"
  on public.account_deletion_requests;

create policy "Users can read own deletion requests"
  on public.account_deletion_requests
  for select
  using (auth.uid() = user_id);

drop policy if exists "Users can create own deletion requests"
  on public.account_deletion_requests;

create policy "Users can create own deletion requests"
  on public.account_deletion_requests
  for insert
  with check (auth.uid() = user_id);
