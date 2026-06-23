# Plan: Chat History Sync

**Priority:** P1 · **Effort:** M · **Risk:** Low–Medium

## Feature overview
Surface server-side chat history. The **write path already exists**
(`lib/chat/server-persistence.ts` inserts into `chat_conversations` /
`chat_messages` from `/api/chat`), but the UI reads only `localStorage`
(`lib/chat/storage.ts`). Add cross-device retrieval and restore.

## Business goal
Let signed-in users keep and resume conversations across devices, increasing
return engagement and the value of an account.

## User stories
- As a signed-in user, I see my past conversations and reopen any of them.
- As a signed-in user on a new device, my history is there.
- As a guest, history stays local and is offered for sync on sign-in.

## Functional requirements
- List conversations (title, last message, timestamp) for the current user.
- Open a conversation → load its messages from the server.
- Create/rename/delete conversations.
- Optional: migrate local guest history into the account on first sign-in.

## Non-functional requirements
- Reads RLS-scoped to `auth.uid()`.
- Pagination for long histories.

## Database requirements
- Tables exist (migration `001`). Confirm RLS allows owner SELECT and indexes on
  `(user_id, updated_at)`.

## API requirements
- `GET /api/chat/conversations` (list), `GET /api/chat/conversations/[id]`
  (messages), `PATCH`/`DELETE` for rename/delete. Reuse rate limit + auth helpers.

## UI requirements
- Conversation sidebar (`ChatSidebar` exists) bound to server data, not local.

## UX flow
Open assistant → sidebar lists server conversations → select → messages load →
continue chatting (persists).

## Validation rules
- Ownership check on every read/write; title length limit.

## Security considerations
- Strict RLS; never expose other users' conversations; sanitize titles.

## Edge cases
- Guest → sign-in merge conflicts; very long threads; deleted conversation open.

## Error handling
- Failed load → retry affordance; never silently drop messages.

## Loading states
- Sidebar skeleton; per-conversation load spinner.

## Empty states
- "لا توجد محادثات محفوظة بعد".

## Acceptance criteria
- A conversation created on device A appears on device B for the same user.
- RLS blocks cross-user access (verified test).

## Testing requirements
- RLS tests (owner vs non-owner); API integration; merge-on-login.

## Rollout checklist
- [ ] Confirm `001` RLS + indexes.
- [ ] Build list/detail APIs.
- [ ] Bind sidebar to server.
- [ ] Optional guest→account merge.
- [ ] Verify cross-device + RLS in staging.
