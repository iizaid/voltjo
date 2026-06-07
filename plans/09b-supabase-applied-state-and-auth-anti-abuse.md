# Phase 9B - Supabase Applied State and Auth Anti-Abuse

Date: 2026-06-07

## Executive Summary

This phase is audit and preparation only. It does not require new database tables or runtime auth changes before the staging database is manually verified.

Current verdict:

| Area | Verdict |
| --- | --- |
| Database/migrations | Repository contains the expected `schema.sql` plus migrations `001`-`006`. Migration `007` should not exist yet. Applied state must be verified manually in Supabase Dashboard or CLI. |
| Missing tables from repo | No expected application table appears missing from the current schema/migrations/type surface. |
| SQL injection risk | Low in current signup/login/profile code. Auth APIs and Supabase query builder are used; no raw SQL was found in the inspected auth path. |
| Malicious input risk | Reasonable MVP hardening exists: email/password validation, full-name validation, onboarding payload cap, whitelist validation, invisible/control character rejection, and no client-supplied user id trust. |
| Bot/spam readiness | Rate limiting exists and fails closed through Upstash, but production signup/login should add Supabase Auth CAPTCHA with Cloudflare Turnstile or hCaptcha. CAPTCHA should be configured through Supabase Dashboard first, not custom app-server verification. |
| Email readiness | Email confirmation/reset depends on Supabase Auth email configuration. Production still needs Custom SMTP/branded sender and template verification. |

No runtime auth logic, migrations, AI behavior, payment behavior, vehicle data, database schema, or `public/cars/**` should be changed in this phase.

## Expected Migration Set

Run and verify only these files in order:

```txt
supabase/schema.sql
supabase/migrations/001_chat_persistence.sql
supabase/migrations/002_account_settings.sql
supabase/migrations/003_profile_avatar_path.sql
supabase/migrations/004_avatar_storage_policies.sql
supabase/migrations/005_supported_vehicles_mvp.sql
supabase/migrations/006_user_location_preferences.sql
```

Migration `007` should not exist yet. Do not invent it, and do not seed verified launch data until human-verified vehicle and charging-station data is available.

## Expected Tables And Storage

Expected public tables:

| Table | Source |
| --- | --- |
| `public.profiles` | `supabase/schema.sql` |
| `public.chat_conversations` | `supabase/migrations/001_chat_persistence.sql` |
| `public.chat_messages` | `supabase/migrations/001_chat_persistence.sql` |
| `public.vehicle_brands` | `supabase/migrations/005_supported_vehicles_mvp.sql` |
| `public.supported_vehicles` | `supabase/migrations/005_supported_vehicles_mvp.sql` |
| `public.vehicle_cost_profiles` | `supabase/migrations/005_supported_vehicles_mvp.sql` |
| `public.charging_locations` | `supabase/migrations/005_supported_vehicles_mvp.sql` |

Expected storage bucket:

| Bucket | Manual setup | Notes |
| --- | --- | --- |
| `avatars` | Supabase Dashboard -> Storage -> New bucket | Current implementation uses public object URLs, so bucket visibility is expected to be public for MVP. Storage policies still restrict object writes to each user's folder. |

Expected `public.profiles` columns:

```txt
id
full_name
age_range
country
city
ownership_status
has_driven_ev_or_hybrid
main_goal
driving_pattern
home_charging_access
priorities
onboarding_completed
onboarding_completed_at
profile_version
avatar_config
privacy_settings
avatar_path
location_preferences
created_at
updated_at
```

## Manual Supabase SQL Verification

Paste this read-only SQL into Supabase SQL Editor. It only uses `select` statements.

```sql
-- Phase 9B VoltJo applied-state verification.
-- Read-only. No inserts, updates, deletes, drops, grants, or policy changes.

-- 1. Expected public tables.
with expected_tables(table_schema, table_name) as (
  values
    ('public', 'profiles'),
    ('public', 'chat_conversations'),
    ('public', 'chat_messages'),
    ('public', 'vehicle_brands'),
    ('public', 'supported_vehicles'),
    ('public', 'vehicle_cost_profiles'),
    ('public', 'charging_locations')
)
select
  e.table_schema,
  e.table_name,
  case when t.table_name is null then 'missing' else 'present' end as status
from expected_tables e
left join information_schema.tables t
  on t.table_schema = e.table_schema
 and t.table_name = e.table_name
order by e.table_name;

-- 2. Expected profiles columns.
with expected_columns(column_name) as (
  values
    ('id'),
    ('full_name'),
    ('age_range'),
    ('country'),
    ('city'),
    ('ownership_status'),
    ('has_driven_ev_or_hybrid'),
    ('main_goal'),
    ('driving_pattern'),
    ('home_charging_access'),
    ('priorities'),
    ('onboarding_completed'),
    ('onboarding_completed_at'),
    ('profile_version'),
    ('avatar_config'),
    ('privacy_settings'),
    ('avatar_path'),
    ('location_preferences'),
    ('created_at'),
    ('updated_at')
)
select
  e.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default,
  case when c.column_name is null then 'missing' else 'present' end as status
from expected_columns e
left join information_schema.columns c
  on c.table_schema = 'public'
 and c.table_name = 'profiles'
 and c.column_name = e.column_name
order by e.column_name;

-- 3. RLS enabled on expected tables.
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  c.relforcerowsecurity as force_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'profiles',
    'chat_conversations',
    'chat_messages',
    'vehicle_brands',
    'supported_vehicles',
    'vehicle_cost_profiles',
    'charging_locations'
  )
order by c.relname;

-- 4. Public table policies.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename in (
    'profiles',
    'chat_conversations',
    'chat_messages',
    'vehicle_brands',
    'supported_vehicles',
    'vehicle_cost_profiles',
    'charging_locations'
  )
order by tablename, policyname;

-- 5. Avatar bucket existence.
select
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
from storage.buckets
where id = 'avatars';

-- 6. Avatar storage policies.
select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and (
    policyname ilike '%avatar%'
    or qual ilike '%avatars%'
    or with_check ilike '%avatars%'
  )
order by policyname;

-- 7. Charging policy reminder.
-- Current repository migration 005 uses public read where is_active = true.
-- Before public launch, prefer active AND verified rows.
select
  policyname,
  qual
from pg_policies
where schemaname = 'public'
  and tablename = 'charging_locations';

-- 8. Optional row counts for sanity only.
select 'profiles' as table_name, count(*) as row_count from public.profiles
union all
select 'chat_conversations', count(*) from public.chat_conversations
union all
select 'chat_messages', count(*) from public.chat_messages
union all
select 'vehicle_brands', count(*) from public.vehicle_brands
union all
select 'supported_vehicles', count(*) from public.supported_vehicles
union all
select 'vehicle_cost_profiles', count(*) from public.vehicle_cost_profiles
union all
select 'charging_locations', count(*) from public.charging_locations;
```

Expected interpretation:

- Every expected table should be `present`.
- Every expected `profiles` column should be `present`.
- `rls_enabled` should be `true` on all listed public tables.
- `avatars` bucket should exist before avatar smoke tests.
- Avatar object policies should include select/insert/update/delete policies scoped to `bucket_id = 'avatars'` and `(storage.foldername(name))[1] = auth.uid()::text`.
- `charging_locations` public read currently allows `is_active = true`; before public launch this should become `is_active = true and is_verified = true`.

## SQL Injection And Malicious Input Audit

| Check | Current finding | Evidence | Verdict |
| --- | --- | --- | --- |
| Raw SQL in auth path | No raw SQL was found in the inspected signup/login/profile auth path. The code uses Supabase Auth APIs and Supabase query builder methods. | `lib/auth/actions.ts`, `lib/auth/profile-validation.ts`, `lib/auth/oauth-client.ts`, `app/auth/callback/route.ts` | Low SQL injection risk. |
| Signup API | Uses `supabase.auth.signUp` with validated email/password and metadata. | `lib/auth/actions.ts` | Safe enough for MVP SQL injection concerns. |
| Login API | Uses `supabase.auth.signInWithPassword`; no SQL string construction. | `lib/auth/actions.ts` | Safe enough for MVP SQL injection concerns. |
| Profile writes | Uses `.from("profiles").upsert(...)` and `.update(...).eq("id", user.id)`. User id comes from Supabase Auth, not the form. | `lib/auth/actions.ts` | Good IDOR and injection posture. |
| Email validation | Trims, lowercases, length-caps at 254, and validates with an email regex. | `lib/auth/actions.ts` | Good baseline. |
| Password validation | Requires 8-128 characters in signup/login and update-password form. | `lib/auth/actions.ts`, `components/account/UpdatePasswordForm.tsx` | Good baseline; strengthen later with MFA/breached-password policy if needed. |
| Full name validation | Requires a string, trims, enforces 2-80 chars, and rejects suspicious control/invisible characters. | `lib/auth/profile-validation.ts` | Good baseline. |
| Onboarding payload cap | Hidden onboarding payload is capped at 6000 characters before JSON parsing. | `lib/auth/actions.ts` | Good baseline. |
| Onboarding value whitelist | Values are checked against `lib/onboarding/questions.ts` option values. Country/city logic and duplicate priorities are enforced server-side. | `lib/auth/profile-validation.ts` | Good baseline. |
| Suspicious/invisible characters | Control/invisible Unicode characters are rejected in validated profile strings and option values. | `lib/auth/profile-validation.ts` | Good baseline. |
| Client-supplied user id | No signup/login/profile form path trusts a user id from the client. Profile row id is derived from `supabase.auth.getUser()`. | `lib/auth/actions.ts` | Good. |
| Raw Supabase errors | User-facing auth errors are generic Arabic messages. | `lib/auth/actions.ts` | Good. |
| HTML injection | Inspected auth/onboarding/profile display uses React text rendering. No `dangerouslySetInnerHTML` was found in the inspected auth path. | `components/onboarding/**`, `components/account/UpdatePasswordForm.tsx` | Low XSS risk for these fields. |

Verdict: signup/login/profile fields are safe enough against SQL injection in the current codebase. The remaining abuse risk is bot/spam automation, not SQL injection.

Recommended additional validation before public launch:

- Add IP/device-level auth rate limiting in addition to the current email-keyed auth limiter.
- Add CAPTCHA through Supabase Auth before exposing public signup at scale.
- Add a stronger password/MFA plan if accounts become high value.

## Bot And Spam Protection Plan

Current protection:

- Signup/login rate limiting is backed by Upstash Redis and fails closed when the shared store is missing or unreachable.
- API routes also use shared Upstash rate limiting.
- OAuth providers are configured in Supabase Dashboard; app env should not contain Google/GitHub secrets.

Recommended next layer:

Use Supabase Auth CAPTCHA with Cloudflare Turnstile.

Why this path:

- Supabase Auth supports CAPTCHA on signup, sign-in, and password-reset endpoints.
- Supabase supports Turnstile and hCaptcha-style provider flows.
- The CAPTCHA secret belongs in Supabase Dashboard/Auth settings, not in VoltJo app env.
- The app only needs a public site key if it renders the Turnstile widget.
- CAPTCHA complements rate limiting; it does not replace Upstash rate limiting.

Secret handling:

| Key | Where it belongs | Public? |
| --- | --- | --- |
| Turnstile site key | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` only if the frontend widget is rendered by VoltJo | Yes |
| Turnstile secret key | Supabase Dashboard CAPTCHA settings if Supabase verifies CAPTCHA | No |
| Google/GitHub OAuth secrets | Supabase Dashboard provider settings | No |
| SMTP credentials | Supabase Dashboard Custom SMTP or secure provider settings | No |
| Supabase service-role key | Not needed in this app runtime | No |

Implementation status after the emergency auth UX fix:

Turnstile CAPTCHA is now implemented for the onboarding email/password signup and login form only. OAuth buttons remain unchanged and do not require Turnstile. The app renders a frontend Turnstile widget with `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, submits the returned token as `captchaToken`, and passes it to Supabase Auth through `signUp` and `signInWithPassword` options. The Turnstile secret key remains in Supabase Dashboard CAPTCHA settings and is not stored in the app repository.

Confirmed API surface:

- Supabase docs show `options: { captchaToken }` for `signUp`.
- Installed local `@supabase/auth-js` types expose `captchaToken` for `SignUpWithPasswordCredentials`, `SignInWithPasswordCredentials`, and `resetPasswordForEmail` options.

Implementation checklist used:

1. Enable Turnstile CAPTCHA in Supabase Dashboard Auth settings.
2. Store the Turnstile secret key only in Supabase Dashboard.
3. Add `NEXT_PUBLIC_TURNSTILE_SITE_KEY` to staging/production hosting only if VoltJo renders the widget.
4. Add a small Turnstile widget to the `/start` email/password form.
5. Store the returned token in component state.
6. Submit the token as hidden form value `captchaToken`.
7. In `signUpAction`, pass `options: { captchaToken }` to `supabase.auth.signUp`.
8. In `signInAction`, pass `options: { captchaToken }` to `supabase.auth.signInWithPassword`.
9. Keep password reset unchanged until that UI collects a CAPTCHA token.
10. Keep OAuth flows unchanged unless Supabase provider policy requires CAPTCHA for those endpoints.
11. Keep Upstash auth/API rate limits.
12. Test Arabic onboarding layout, keyboard access, failed CAPTCHA, expired token, signup, login, and reset-password flows.

## Environment Guidance

Allowed app env additions:

```txt
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
```

Do not add:

```txt
TURNSTILE_SECRET_KEY=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
```

`TURNSTILE_SECRET_KEY` should not be added to app env unless VoltJo later chooses direct app-server verification. The preferred plan is Supabase Dashboard verification, so the secret stays outside the repo and outside the app runtime.

## Email Readiness

Current state:

- Email confirmation/reset currently depends on Supabase Auth email configuration.
- Google/GitHub OAuth providers have been enabled by the user in Supabase Dashboard.
- Email/SMTP is not configured yet.
- Production should use Custom SMTP and a branded sender.

Required before public launch:

- Decide confirmation behavior for staging and production.
- Configure Custom SMTP in Supabase Dashboard or equivalent secure provider settings.
- Use a branded sender such as `VoltJo <no-reply@your-domain>`.
- Verify signup confirmation template.
- Verify password reset template.
- Verify email change template.
- Verify Arabic rendering in Gmail web/mobile.
- Confirm auth links route back to VoltJo `/auth/callback` or `/auth/update-password` as appropriate.
- Never store SMTP secrets in the app repo.

## No-Schema-Change Verdict

No new database table is needed for Phase 9B.

Reasons:

- Supabase Auth owns the CAPTCHA verification decision when configured in Dashboard.
- Existing profile/chat/account flows already have the needed tables in migrations `schema.sql` and `001`-`006`.
- Bot protection should be layered through Supabase Auth CAPTCHA, Upstash rate limiting, and future WAF/IP-device controls, not a new app table.

## OAuth Return UX Fix

The OAuth return flow should now behave deterministically:

1. Google/GitHub starts from the onboarding auth screen and saves the local onboarding draft before redirecting.
2. `/auth/callback` exchanges the Supabase code for a session.
3. If the profile is complete, `/auth/callback` redirects directly to `/assistant`.
4. If the profile is missing or incomplete, `/auth/callback` redirects to `/start?auth=oauth-success`.
5. `/start?auth=oauth-success` shows a processing screen instead of the login/signup form.
6. If a local draft exists, the app saves it to the authenticated profile and redirects to `/assistant`.
7. If no local draft exists, the app sends the user back to the questions step with a clear Arabic notice.
8. If profile saving fails, the user sees a clear Arabic error and can retry or review answers.
