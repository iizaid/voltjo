# Supabase Chat Persistence

## What was added

This phase adds database foundation only for authenticated chat persistence.

New tables:

- `public.chat_conversations`
- `public.chat_messages`

Frontend chat still uses localStorage in this phase.
Nothing in `/assistant` has been switched to Supabase chat reads/writes yet.

## Table summary

### `public.chat_conversations`

Stores one conversation record per user-owned thread, including:

- title
- category
- selected model
- thinking mode
- archived state
- timestamps

### `public.chat_messages`

Stores the ordered messages inside each conversation, including:

- role
- content
- optional bullets
- metadata
- optional attachment metadata
- status
- timestamp

## RLS protection

RLS is enabled on both chat tables.

### `chat_conversations`

Authenticated users can only:

- view their own conversations
- insert conversations with their own `user_id`
- update their own conversations
- delete their own conversations

### `chat_messages`

Authenticated users can only:

- view messages from conversations they own
- insert messages only into conversations they own
- update messages tied to conversations they own
- delete messages tied to conversations they own

Ownership is enforced with `auth.uid()` and `exists (...)` checks against `chat_conversations`.

## Manual apply steps in Supabase

1. Open Supabase Dashboard.
2. Go to **SQL Editor**.
3. Create a new query.
4. Open:
   - [supabase/migrations/001_chat_persistence.sql](</C:/Main Folder/IT/Programing Works/Electric car/supabase/migrations/001_chat_persistence.sql>)
5. Paste the SQL into the editor.
6. Click **Run**.
7. Open **Table Editor**.
8. Confirm:
   - `chat_conversations` exists
   - `chat_messages` exists

## Current app behavior

- `/assistant` still reads and writes localStorage only.
- `/api/chat` still uses the server-side mock provider.
- No Supabase chat sync is active yet.

## Next step

The next backend step will be:

- integrate `/api/chat` and/or server actions with these tables
- write authenticated conversations/messages to Supabase
- later decide how localStorage and Supabase should coexist or migrate
