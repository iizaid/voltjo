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
- Enable Google / GitHub providers when the visible OAuth buttons should work:
  - Supabase Dashboard → Authentication → Providers → enable Google and GitHub.
  - Add provider client IDs/secrets inside Supabase only (never in `.env*` files).
  - Copy the provider callback URL shown by Supabase into the Google/GitHub OAuth app settings.
  - Confirm both providers redirect back to `https://<your-domain>/auth/callback`.

### 4. Environment variables

Set these in `.env.local` for development and in your hosting provider for production
(see [`.env.example`](.env.example)):

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Public Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public anon key |
| `NEXT_PUBLIC_SITE_URL` | Yes (prod) | Public origin, no trailing slash. Used by `lib/auth/actions.ts` (`getRequestOrigin`) to build the password-reset redirect. Safe to expose. |
| `AI_PROVIDER` | Yes | Keep `mock` for launch |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Yes | Required for server-side API rate limiting. Keep token server-only. |
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
- API rate limiting backed by Upstash Redis
- authenticated chat database persistence
- supported vehicles MVP foundation
- charging calculator MVP page
- interactive charging map MVP with browser-only geolocation and no map API key
- legal pages for privacy, terms, and manual data deletion requests
- security headers including CSP report-only for staging observation

Not implemented yet:

- AI provider integration
- saved cars
- comparison persistence
- reports
- payments
- CAPTCHA/bot protection
- monitoring vendor integration
- enforced final Content-Security-Policy

## Production Security Checklist

- Run `supabase/schema.sql` then migrations `001`–`006` in order (see the [Production Deployment Runbook](#production-deployment-runbook) and migration table).
- Create the public `avatars` storage bucket and confirm `004_avatar_storage_policies.sql` ran.
- Verify vehicle data and add verified `charging_locations` rows before public claims (the `005` seed is sample/estimate data only).
- Configure Supabase Site URL and Redirect URLs, including `/auth/callback` (email and OAuth) and `/auth/update-password` (password reset).
- Set `NEXT_PUBLIC_SITE_URL` to the production origin so password-reset links resolve correctly.
- Set Upstash Redis REST env vars before staging or production smoke tests; rate-limited APIs fail closed when the shared store is missing.
- Enable Google and GitHub providers in Supabase Auth dashboard with their respective credentials.
- Decide whether email confirmation is enabled.
- Use a production SMTP provider for auth email.
- Verify RLS with two separate users.
- Keep service role keys out of frontend code and `NEXT_PUBLIC_*`.
- Review auth and API rate-limit behavior before public launch.
- Review `docs/monitoring.md`; add monitoring vendor integration and bot protection only when the team is ready to configure them properly.
- Review Next.js `middleware.ts` to `proxy.ts` migration before deployment.
- Observe CSP report-only in staging, then tighten and enforce CSP once production domains are final.
- Deploy over HTTPS only.
- Before production, search runtime UI for provider names such as Supabase, OpenAI, Stripe, database, backend.

More details are in `docs/supabase-auth-foundation.md`.

See the [Staging Deployment & Smoke-Test Checklist](docs/staging-smoke-tests.md) for the ordered environment setup, Supabase manual steps, route smoke tests, curl examples, and rollback notes.

## Cloudflare Workers Deployment

Use the Workers/OpenNext setup already in this repo:

- Build command: `npm run cf:build`
- Deploy command: `npx wrangler deploy`
- Node.js version: `22` or newer
- Wrangler config: `wrangler.jsonc`

Required Worker variables/secrets:

| Variable | Value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | Cloudflare staging/production origin, no trailing slash |
| `AI_PROVIDER` | `mock` |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |

If `/assistant` immediately shows `محاولات كثيرة. حاول بعد قليل.`, first verify
the two Upstash Worker secrets above. The rate limiter fails closed when the
shared store is missing or unreachable.

## Account vs Dashboard

- `/account` is the main Smart Profile page: identity, onboarding preferences, completion status, and account/security information.
- `/dashboard` is intentionally lightweight until product databases exist. Future modules can include saved cars, comparisons, reports, and chat history.
- API rate limiting is backed by Upstash Redis and fails closed when the shared store is missing or unreachable. Review auth and API rate-limit behavior during staging before public launch.
- Vehicle data in the MVP seed is sample launch data and still requires business verification before making public claims.
