# Supabase Database and Auth Readiness Audit

## Goal

Audit Supabase schema, RLS, storage, and Auth dashboard assumptions before serious staging or public launch.

## Scope

- `supabase/schema.sql`
- `supabase/migrations/001` through `006`
- Auth redirect URLs.
- OAuth provider setup.
- Avatar storage bucket.
- RLS behavior with two users.
- Public sample vehicle and empty charging station assumptions.

## Out Of Scope

- Editing migrations.
- Creating migration `007`.
- Adding verified vehicle/station data.
- Adding real AI or payment.

## Files Likely Involved

- `README.md`
- `docs/staging-smoke-tests.md`
- `docs/account-settings-checklist.md`
- `docs/supabase-auth-foundation.md`
- `docs/supabase-chat-persistence.md`
- `supabase/schema.sql`
- `supabase/migrations/**`

## Safety Rules

- Treat migrations as append-only and read-only during this audit.
- Never use service-role keys in client code.
- Verify with two separate users before public launch.
- Do not invent charging station rows.

## Acceptance Criteria

- Migrations are documented in the exact current order.
- No migration `007` is documented as existing.
- `avatars` bucket setup is documented and tested.
- OAuth callback URLs are correct.
- Account export and chat persistence respect user ownership.

## Commands To Run

```bash
npm test
npm run lint
npm run build
git status --short
```

## Final Report Requirements

- Migration order findings.
- RLS/storage assumptions.
- Auth dashboard checklist.
- Any route that would fail if a migration/bucket is missing.
- Public-production blockers.
