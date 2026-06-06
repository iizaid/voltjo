# Security and Performance Audit

> This document is historical. It records the audit state at the time it was written. Check `plans/00-current-project-handoff.md` and the current repository before assuming any item is still open.

This audit covers the current VoltJo application state after the first authenticated chat persistence phase and the account/avatar rollout.

## Scope checked

- Auth/session helpers and redirects
- Protected routes and public routes
- Account avatar upload and export routes
- Chat API validation and authenticated Supabase persistence
- Chat localStorage handling
- Security headers
- Supabase schema and storage policy expectations
- Production build and production start behavior

## Routes reviewed

### Public

- `/`
- `/start`
- `/assistant`
- `/auth/callback`
- `/auth/update-password`
- marketing pages such as `/<slug>`

### Protected

- `/account`
- `/dashboard`
- `/api/account/avatar`
- `/api/account/export`

## Security fixes applied

### 1. Avatar upload hardening

- Added a request-size guard before parsing `FormData`.
- Added a per-user in-memory rate limit for avatar uploads.
- Added server-side magic-byte validation for:
  - JPEG
  - PNG
  - WEBP
- Kept the forced storage path:
  - `{user-id}/avatar.webp`
- Kept failure cleanup so a failed profile update does not leave an orphaned uploaded file.
- Kept safe Arabic error messages without exposing raw Supabase errors to the UI.

### 2. Account export hardening

- Added a per-user in-memory rate limit for account export.
- Added `Cache-Control: no-store, max-age=0` to avoid caching exported private account data.
- Kept export payload whitelisted instead of exporting broad database records.

### 3. Password reset hardening

- Added a basic server-side in-memory rate limit to the reset-link action.
- Kept reset-link delivery scoped to the currently authenticated user's email only.
- No arbitrary email entry was introduced.

### 4. Chat persistence integrity

- Added authenticated ownership verification before reusing a supplied `conversationId`.
- `/api/chat` now only attempts to append to an owned Supabase conversation.
- If ownership cannot be confirmed, persistence safely falls back instead of trusting the ID.
- Best-effort persistence remains in place so mock chat responses still return even if Supabase writes fail.

### 5. Existing protections audited and retained

- `/account` redirects unauthenticated users to `/start?next=%2Faccount`
- `/api/account/avatar` returns `401` for signed-out `POST`
- `/api/account/export` returns `401` for signed-out `GET`
- `/auth/callback` rejects unsafe external redirects and falls back to internal paths only
- No `dangerouslySetInnerHTML`, `eval`, or `new Function` usage was found in active app code paths reviewed
- No `service_role` usage was found in runtime code

## Performance fixes applied

### 1. Avatar URL resolution

- Removed unnecessary Supabase server-client creation from shared avatar URL resolution.
- Avatar display URLs are now derived directly from the public project URL and stored path.
- This reduces repeated SSR client setup work for:
  - `/account`
  - marketing header auth control
  - `/assistant`

### 2. Chat sidebar filtering

- Memoized visible conversation filtering in the assistant sidebar.
- Avoids re-running search and sorting logic on every unrelated sidebar render.

### 3. Active conversation lookup

- Memoized active conversation and message list resolution in `ChatShell`.
- Keeps chat rendering work tighter when unrelated state changes.

## Things audited but not changed

- `middleware.ts` deprecation warning:
  - Next.js 16 warns that `middleware.ts` should move to `proxy.ts`
  - This was not migrated in this pass because the current auth/session refresh flow is working and the change is not zero-risk
- Account page visual structure:
  - no redesign was done
- Supabase avatar bucket visibility:
  - current implementation still assumes a public bucket for MVP
- Update password page recovery handling:
  - current flow is acceptable for this phase and was not rewritten
- Chat guest localStorage behavior:
  - intentionally preserved

## Remaining risks

1. **Rate limiting is still in-memory**
   - Good enough for local and single-instance environments
   - Not sufficient for multi-instance production
   - Replace with Redis/Upstash/platform WAF before public launch

2. **Avatar bucket is public**
   - Acceptable for the current MVP path
   - Private avatars will require signed URLs in a future hardening phase

3. **No CSP yet**
   - Safe baseline headers are present
   - A full Content Security Policy still needs production-domain-specific rollout and testing

4. **No durable audit logging**
   - Failed upload/export/reset events are not stored in a shared audit trail yet

5. **No real AI provider yet**
   - `/api/chat` is still mock-provider based by design

## Manual Supabase setup still required

1. Run migrations in order:
   - `supabase/migrations/002_account_settings.sql`
   - `supabase/migrations/003_profile_avatar_path.sql`
   - `supabase/migrations/004_avatar_storage_policies.sql`
2. Create a Storage bucket named:
   - `avatars`
3. Keep the bucket public for the current implementation
4. Confirm Auth redirect URLs include:
   - `/auth/update-password`
5. Confirm storage policy syntax remains:
   - `(storage.foldername(name))[1] = auth.uid()::text`

## Local production test commands

```bash
npm run build
npm run start -- -p 3001
```

Then test:

- `http://localhost:3001`
- `http://localhost:3001/start`
- `http://localhost:3001/assistant`
- `http://localhost:3001/account`

## Observed production-mode behavior

- Production start succeeds on port `3001`
- `/` responds with `200`
- `/start` responds with `200`
- `/assistant` responds with `200`
- `/account` redirects unauthenticated users with `307`
- `/api/account/avatar` returns `401` for signed-out `POST`
- `/api/account/export` returns `401` for signed-out `GET`

## Localhost vs production notes

- Dev mode remains slower because of:
  - App Router development overhead
  - TypeScript/dev compilation
  - live SSR auth/session work
- Production mode is materially faster:
  - server started in about `146ms`
  - route responses were immediate during local checks
- The remaining perceived slowness on localhost is more likely to be development-mode cost than route-level code regressions
