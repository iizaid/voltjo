-- VoltJo chat persistence foundation
-- Frontend still uses localStorage in this phase.
-- These tables prepare secure Supabase-backed chat storage for a later integration step.

create table if not exists public.chat_conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  category text,
  model_id text not null default 'voltjo',
  thinking_mode boolean not null default false,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_conversations_title_length
    check (char_length(title) between 1 and 160),
  constraint chat_conversations_model_id_valid
    check (model_id in ('voltjo', 'gemini', 'kimi')),
  constraint chat_conversations_category_length
    check (category is null or char_length(category) between 1 and 120)
);

create index if not exists chat_conversations_user_id_idx
  on public.chat_conversations (user_id);

create index if not exists chat_conversations_user_updated_at_idx
  on public.chat_conversations (user_id, updated_at desc);

create index if not exists chat_conversations_user_archived_idx
  on public.chat_conversations (user_id, archived);

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.chat_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null,
  content text not null default '',
  bullets jsonb,
  metadata jsonb not null default '{}'::jsonb,
  attachment jsonb,
  status text not null default 'done',
  created_at timestamptz not null default now(),
  constraint chat_messages_role_valid
    check (role in ('user', 'assistant', 'system')),
  constraint chat_messages_status_valid
    check (status in ('sending', 'done', 'error')),
  constraint chat_messages_content_length
    check (char_length(content) <= 12000),
  constraint chat_messages_bullets_array
    check (bullets is null or jsonb_typeof(bullets) = 'array'),
  constraint chat_messages_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint chat_messages_attachment_object
    check (attachment is null or jsonb_typeof(attachment) = 'object')
);

create index if not exists chat_messages_conversation_created_at_idx
  on public.chat_messages (conversation_id, created_at asc);

create index if not exists chat_messages_user_created_at_idx
  on public.chat_messages (user_id, created_at desc);

create or replace function public.update_updated_at_column()
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

drop trigger if exists set_chat_conversations_updated_at on public.chat_conversations;
create trigger set_chat_conversations_updated_at
before update on public.chat_conversations
for each row
execute function public.update_updated_at_column();

alter table public.chat_conversations enable row level security;
alter table public.chat_messages enable row level security;

drop policy if exists "Users can view their chat conversations" on public.chat_conversations;
create policy "Users can view their chat conversations"
on public.chat_conversations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can create their chat conversations" on public.chat_conversations;
create policy "Users can create their chat conversations"
on public.chat_conversations
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update their chat conversations" on public.chat_conversations;
create policy "Users can update their chat conversations"
on public.chat_conversations
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete their chat conversations" on public.chat_conversations;
create policy "Users can delete their chat conversations"
on public.chat_conversations
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can view their chat messages" on public.chat_messages;
create policy "Users can view their chat messages"
on public.chat_messages
for select
to authenticated
using (
  exists (
    select 1
    from public.chat_conversations c
    where c.id = chat_messages.conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can create their chat messages" on public.chat_messages;
create policy "Users can create their chat messages"
on public.chat_messages
for insert
to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = chat_messages.conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can update their chat messages" on public.chat_messages;
create policy "Users can update their chat messages"
on public.chat_messages
for update
to authenticated
using (
  user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = chat_messages.conversation_id
      and c.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1
    from public.chat_conversations c
    where c.id = chat_messages.conversation_id
      and c.user_id = auth.uid()
  )
);

drop policy if exists "Users can delete their chat messages" on public.chat_messages;
create policy "Users can delete their chat messages"
on public.chat_messages
for delete
to authenticated
using (
  exists (
    select 1
    from public.chat_conversations c
    where c.id = chat_messages.conversation_id
      and c.user_id = auth.uid()
  )
);
