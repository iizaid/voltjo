# VoltJo

Arabic-first Jordan-focused EV and hybrid vehicle intelligence platform.

## Setup

Install dependencies:

```bash
npm install
```

Create local environment file:

```bash
cp .env.example .env.local
```

Fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
# Public site origin, no trailing slash (e.g. https://voltjo.com).
# Local dev: http://localhost:3000. Used for the password-reset redirect.
NEXT_PUBLIC_SITE_URL=
```

Never place a Supabase service role key in client code.

See the [Production Deployment Runbook](#production-deployment-runbook) below for the full, ordered setup (migrations, storage bucket, auth redirects) and the [environment variable reference](#environment-variables).

## Supabase

> For the full, ordered production setup, follow the [Production Deployment Runbook](#production-deployment-runbook).
> The short version: run `schema.sql`, then every migration `001`–`006` in order, then create the public `avatars` storage bucket and configure Auth redirect URLs.

Run the initial database schema first:

```txt
supabase/schema.sql
```

This creates the `public.profiles` smart profile table, its RLS policies, and the
`set_updated_at()` trigger. Running only `schema.sql` is **not** enough for the app to
work end to end — the account, avatar, chat, vehicles, and location features each depend
on a later migration (see the runbook table below). Run all migrations in order.

## Production Deployment Runbook

This is the authoritative, ordered setup. Following it produces a fully working backend
for the current MVP. Skipping a step causes the matching feature to fail at runtime
(for example, the avatar upload route returns an Arabic "run the database upgrade first"
message if the avatar migrations or bucket are missing).

### 1. Database migrations — run in this exact order

Run each file once, top to bottom, in the Supabase SQL editor (or your migration tool):

```txt
supabase/schema.sql
supabase/migrations/001_chat_persistence.sql
supabase/migrations/002_account_settings.sql
supabase/migrations/003_profile_avatar_path.sql
supabase/migrations/004_avatar_storage_policies.sql
supabase/migrations/005_supported_vehicles_mvp.sql
supabase/migrations/006_user_location_preferences.sql
```

All migrations are additive and idempotent (`add column if not exists`, `create ... if not
exists`, `on conflict do update`), so re-running them is safe.

### Migration → feature reference

| File | Creates / changes | Powers (breaks if missing) |
| --- | --- | --- |
| `schema.sql` | `public.profiles` table, RLS, `set_updated_at()` trigger | Auth profile, onboarding (Smart Profile), `/account`, `/dashboard` |
| `001_chat_persistence.sql` | `chat_conversations`, `chat_messages` tables + RLS | Authenticated chat persistence in `/api/chat`; chat data in account export |
| `002_account_settings.sql` | `profiles.avatar_config`, `profiles.privacy_settings` (jsonb) | Privacy settings form on `/account` |
| `003_profile_avatar_path.sql` | `profiles.avatar_path` column | Avatar upload + display (`/api/account/avatar`, navbar, `/assistant`, `/account`) |
| `004_avatar_storage_policies.sql` | `storage.objects` RLS for the `avatars` bucket | Avatar upload security (per-user folder access) |
| `005_supported_vehicles_mvp.sql` | `vehicle_brands`, `supported_vehicles`, `vehicle_cost_profiles`, `charging_locations` tables + RLS + sample vehicle seed | `/vehicles`, `/vehicles/[slug]`, `/charging-calculator` options, `/charging-map` station source |
| `006_user_location_preferences.sql` | `profiles.location_preferences` (jsonb) | Saving map location to a profile (`/api/account/location-preferences`) |

> Note: `005` seeds **sample** vehicle data only (all rows are `data_confidence = 'estimate'`)
> and seeds **no** charging stations — `charging_locations` is created empty. Verify vehicle
> data and add verified charging stations before making public claims.

### 2. Storage bucket (manual, Supabase dashboard)

The avatar migrations set RLS policies but do **not** create the bucket. Create it manually:

- Supabase Dashboard → Storage → New bucket
- Name: `avatars`
- Visibility: **Public** (the current MVP resolves avatars via public object URLs)
- The per-user access rules come from `004_avatar_storage_policies.sql`
  (`(storage.foldername(name))[1] = auth.uid()::text`), so confirm that migration ran.

### 3. Auth configuration (manual, Supabase dashboard)

- Supabase Dashboard → Authentication → URL Configuration
- **Site URL:** your production origin (e.g. `https://voltjo.com`)
- **Redirect URLs:** add each of these (and their `http://localhost:3000` equivalents for dev):
  - `https://<your-domain>/auth/callback` — email and OAuth sign-in
  - `https://<your-domain>/auth/update-password` — password-reset link target
- Decide whether email confirmation is enabled (the signup flow supports both modes).
- Configure a production SMTP provider for auth email; the default Supabase SMTP is
  rate-limited and not intended for production.
- Enable Google / GitHub providers only if you actually launch them, using credentials
  set inside the Supabase Auth dashboard (never in the repo).

### 4. Environment variables

Set these in `.env.local` for development and in your hosting provider for production
(see [`.env.example`](.env.example)):

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | Public origin, no trailing slash. Used by `lib/auth/actions.ts` (`getRequestOrigin`) to build the password-reset redirect. Safe to expose. |
| `AI_PROVIDER` | Yes | Keep `mock` for launch |
| `OPENAI_API_KEY` / `GEMINI_API_KEY` / `KIMI_API_KEY` | No | Leave empty for launch (assistant is mock-only). Server-only — never `NEXT_PUBLIC_*` |

Never place a Supabase `service_role` key in client code or any `NEXT_PUBLIC_*` variable;
it bypasses RLS and must stay server-only.

## Development

```bash
npm run dev
npm run lint
npm run build
```

## Current Backend Scope

Implemented:

- Supabase email/password auth foundation
- profile-aware onboarding persistence
- protected Smart Profile page at `/account`
- lightweight control center at `/dashboard`
- RLS schema for `public.profiles`
- protected account/security page
- auth callback redirect hardening
- basic in-memory auth rate limiting
- supported vehicles MVP foundation
- charging calculator MVP page
- interactive charging map MVP with browser-only geolocation and no map API key

Not implemented yet:

- AI provider integration
- chat database persistence
- saved cars
- comparison persistence
- reports
- payments
- distributed production rate limiting
- CAPTCHA/bot protection
- monitoring/audit logs
- final Content-Security-Policy

## Production Security Checklist

- Run `supabase/schema.sql` then migrations `001`–`006` in order (see the [Production Deployment Runbook](#production-deployment-runbook) and migration table).
- Create the public `avatars` storage bucket and confirm `004_avatar_storage_policies.sql` ran.
- Verify vehicle data and add verified `charging_locations` rows before public claims (the `005` seed is sample/estimate data only).
- Configure Supabase Site URL and Redirect URLs, including `/auth/callback` (email and OAuth) and `/auth/update-password` (password reset).
- Set `NEXT_PUBLIC_SITE_URL` to the production origin so password-reset links resolve correctly.
- Enable Google and GitHub providers in Supabase Auth dashboard with their respective credentials.
- Decide whether email confirmation is enabled.
- Use a production SMTP provider for auth email.
- Verify RLS with two separate users.
- Keep service role keys out of frontend code and `NEXT_PUBLIC_*`.
- Replace the in-memory rate limiter before public launch.
- Add monitoring/logging and bot protection before public launch.
- Review Next.js `middleware.ts` to `proxy.ts` migration before deployment.
- Add and test CSP once production domains are final.
- Deploy over HTTPS only.
- Before production, search runtime UI for provider names such as Supabase, OpenAI, Stripe, database, backend.

More details are in `docs/supabase-auth-foundation.md`.

See the [Staging Deployment & Smoke-Test Checklist](docs/staging-smoke-tests.md) for the ordered environment setup, Supabase manual steps, route smoke tests, curl examples, and rollback notes.

## Account vs Dashboard

- `/account` is the main Smart Profile page: identity, onboarding preferences, completion status, and account/security information.
- `/dashboard` is intentionally lightweight until product databases exist. Future modules can include saved cars, comparisons, reports, and chat history.
- Login rate-limit buckets reset after successful login, but the in-memory limiter is still temporary and must be replaced before public launch.
- Vehicle data in the MVP seed is sample launch data and still requires business verification before making public claims.
