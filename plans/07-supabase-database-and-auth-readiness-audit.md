# Supabase Database and Auth Readiness Audit

Date: 2026-06-07

## Executive Summary

VoltJo is close to a serious staging deployment, but it is not public-production-ready.

Current verdict:

| Question | Verdict |
| --- | --- |
| Staging-ready? | Conditional yes, after Supabase migrations `schema.sql` + `001`-`006`, the public `avatars` bucket, Supabase Auth redirect URLs/providers, and Upstash Redis env vars are configured in the staging host. |
| Public-production-ready? | No. Public launch remains blocked by verified vehicle data, verified charging station data, production email/SMTP readiness, operational monitoring/alerting, bot protection planning, and final launch checklist signoff. |
| Biggest database/auth blocker | Public data readiness: migration `005` exposes active vehicle and charging-location rows publicly, while vehicle seed rows are explicitly `estimate` and `charging_locations` is currently empty/pending verification. |

This audit did not change runtime behavior, migrations, schema, AI behavior, payments, vehicle data, or `public/cars/**`.

## Scope Inspected

Database and migrations:

- `supabase/schema.sql`
- `supabase/migrations/001_chat_persistence.sql`
- `supabase/migrations/002_account_settings.sql`
- `supabase/migrations/003_profile_avatar_path.sql`
- `supabase/migrations/004_avatar_storage_policies.sql`
- `supabase/migrations/005_supported_vehicles_mvp.sql`
- `supabase/migrations/006_user_location_preferences.sql`
- `lib/supabase/database.types.ts`
- `lib/supabase/server.ts`
- `lib/supabase/client.ts`
- `lib/supabase/env.ts`

Auth/session/OAuth:

- `lib/auth/actions.ts`
- `lib/auth/profile-validation.ts`
- `lib/auth/session.ts`
- `lib/auth/oauth-client.ts`
- `lib/auth/redirect.ts`
- `app/auth/callback/route.ts`
- `app/auth/update-password/page.tsx`
- `components/account/UpdatePasswordForm.tsx`
- `middleware.ts`
- `components/onboarding/OnboardingAuthPanel.tsx`
- `components/onboarding/OnboardingFlow.tsx`
- `lib/onboarding/storage.ts`

Security/API:

- `lib/security/rate-limit.ts`
- `lib/server/rate-limit.ts`
- `lib/server/redis.ts`
- `lib/server/auth.ts`
- `lib/server/api-response.ts`
- `lib/server/request-body.ts`
- `lib/server/timeout.ts`
- `lib/chat/server-persistence.ts`
- `app/api/chat/route.ts`
- `app/api/account/avatar/route.ts`
- `app/api/account/export/route.ts`
- `app/api/account/location-preferences/route.ts`

Environment/docs:

- `.env.example`
- `README.md`
- `docs/staging-smoke-tests.md`
- `docs/supabase-auth-foundation.md`
- `docs/account-settings-checklist.md`
- `docs/auth-email-branding.md`
- `plans/00-current-project-handoff.md`
- `plans/08-auth-email-resend-smtp-readiness.md`

## Database Inventory

| Table / Object | Columns / behavior found | Evidence | Readiness |
| --- | --- | --- | --- |
| `public.profiles` | Auth-owned profile row keyed by `auth.users(id)` with onboarding fields, `priorities`, completion fields, timestamps, and updated-at trigger. Later migrations add `avatar_config`, `privacy_settings`, `avatar_path`, and `location_preferences`. | `supabase/schema.sql:5`, `supabase/schema.sql:16`, `supabase/schema.sql:105`; `supabase/migrations/002_account_settings.sql:2`, `supabase/migrations/003_profile_avatar_path.sql:2`, `supabase/migrations/006_user_location_preferences.sql:2` | Staging-ready when all migrations are applied. |
| `public.chat_conversations` | User-owned conversations with title/category/model/thinking/archived timestamps, constraints, indexes, and updated-at trigger. | `supabase/migrations/001_chat_persistence.sql:5`, `supabase/migrations/001_chat_persistence.sql:23`, `supabase/migrations/001_chat_persistence.sql:75` | Staging-ready. |
| `public.chat_messages` | User-owned messages linked to conversations; role/status/content/metadata constraints and indexes. | `supabase/migrations/001_chat_persistence.sql:32`, `supabase/migrations/001_chat_persistence.sql:43`, `supabase/migrations/001_chat_persistence.sql:47`, `supabase/migrations/001_chat_persistence.sql:57` | Staging-ready; direct authenticated table access can still create own assistant/system-looking rows. |
| `public.vehicle_brands` | Public-read reference table for brands with active Jordan vehicle dependency. | `supabase/migrations/005_supported_vehicles_mvp.sql:15`, `supabase/migrations/005_supported_vehicles_mvp.sql:136` | Staging-ready only as sample/public MVP data. |
| `public.supported_vehicles` | Public-read active Jordan vehicles with EV/PHEV/HEV type and `data_confidence`, seeded rows all `estimate`. | `supabase/migrations/005_supported_vehicles_mvp.sql:25`, `supabase/migrations/005_supported_vehicles_mvp.sql:48`, `supabase/migrations/005_supported_vehicles_mvp.sql:151`, `supabase/migrations/005_supported_vehicles_mvp.sql:259` | Not public-production-ready until verified data gate is complete. |
| `public.vehicle_cost_profiles` | Public-read cost scenarios linked to active vehicles; seeded rows all `estimate`. | `supabase/migrations/005_supported_vehicles_mvp.sql:53`, `supabase/migrations/005_supported_vehicles_mvp.sql:60`, `supabase/migrations/005_supported_vehicles_mvp.sql:158`, `supabase/migrations/005_supported_vehicles_mvp.sql:329` | Not public-production-ready until verified data gate is complete. |
| `public.charging_locations` | Public-read active charging locations with `is_verified` default `false`; no seed rows in migration `005`. | `supabase/migrations/005_supported_vehicles_mvp.sql:64`, `supabase/migrations/005_supported_vehicles_mvp.sql:74`, `supabase/migrations/005_supported_vehicles_mvp.sql:173`, `supabase/migrations/005_supported_vehicles_mvp.sql:178` | Staging-ready as empty state only. Public launch blocked until verified stations exist and policy is tightened. |
| `storage.objects` for `avatars` | Authenticated storage policies scoped to bucket `avatars` and first path segment equal to `auth.uid()`. Bucket is not created by SQL and must be created manually as public for current URL flow. | `supabase/migrations/004_avatar_storage_policies.sql:6`, `supabase/migrations/004_avatar_storage_policies.sql:11`, `supabase/migrations/004_avatar_storage_policies.sql:15`, `README.md:91` | Staging-ready after manual bucket setup. Public bucket is acceptable for MVP avatars but must be a conscious privacy decision. |

`lib/supabase/database.types.ts` includes the current `001`-`006` table/column surface, including `avatar_config`, `privacy_settings`, `avatar_path`, and `location_preferences` (`lib/supabase/database.types.ts:164`, `lib/supabase/database.types.ts:168`, `lib/supabase/database.types.ts:178`).

Migration `007` does not exist in the repository. Current docs correctly warn not to invent or run it (`docs/staging-smoke-tests.md:57`, `plans/00-current-project-handoff.md:114`).

## Database Findings

| Severity | Area | Issue | Evidence | Impact | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| P0 launch blocker | Public vehicle data | Public vehicle/cost data is seeded as estimates, not verified launch data. | `supabase/migrations/005_supported_vehicles_mvp.sql:48`, `supabase/migrations/005_supported_vehicles_mvp.sql:259`, `supabase/migrations/005_supported_vehicles_mvp.sql:329` | Public users could treat preliminary figures as confirmed market data. | Keep public copy as preliminary in staging. Before public launch, add a new migration with verified rows and confidence/source rules, or gate public display to verified rows. |
| P0 launch blocker | Charging stations | `charging_locations` is public for every `is_active = true` row, while verification is separate and defaults false. | `supabase/migrations/005_supported_vehicles_mvp.sql:64`, `supabase/migrations/005_supported_vehicles_mvp.sql:74`, `supabase/migrations/005_supported_vehicles_mvp.sql:178` | Any future active but unverified station row becomes publicly readable. | In the next migration, change public read policy to `is_active = true and is_verified = true`, then seed only human-verified stations. |
| P1 staging blocker if omitted | Manual storage dependency | `004_avatar_storage_policies.sql` creates policies but not the `avatars` bucket. | `supabase/migrations/004_avatar_storage_policies.sql:6`, `README.md:91`, `README.md:94` | Avatar upload fails until the bucket exists and is public for current `getPublicUrl` flow. | Create public `avatars` bucket in Supabase Dashboard before staging smoke tests. |
| P1 staging blocker if omitted | Migration order | `schema.sql` alone is not enough; account/privacy/avatar/chat/location/public data features depend on migrations `001`-`006`. | `README.md:36`, `README.md:62`, `docs/staging-smoke-tests.md:47` | Routes may return setup errors or fail queries if migrations are skipped. | Run `schema.sql`, then `001` through `006` in order on each environment. |
| P2 medium | JSON profile columns | `avatar_config`, `privacy_settings`, and `location_preferences` are `jsonb` but lack DB-level `jsonb_typeof(...) = 'object'` constraints. | `supabase/migrations/002_account_settings.sql:2`, `supabase/migrations/002_account_settings.sql:5`, `supabase/migrations/006_user_location_preferences.sql:2` | Runtime validation protects current routes, but direct authenticated writes could store odd JSON shapes if exposed through Supabase APIs. | Add DB check constraints in a future migration if direct REST access remains enabled. |
| P2 medium | Chat integrity | Authenticated users can insert/update/delete their own `chat_messages` by RLS, including `role = 'assistant'` or `role = 'system'`. | `supabase/migrations/001_chat_persistence.sql:43`, `supabase/migrations/001_chat_persistence.sql:127`, `supabase/migrations/001_chat_persistence.sql:142` | Not an IDOR/privacy issue, but future UI could trust user-forged assistant/system rows. | If chat history becomes authoritative, restrict direct client writes or enforce role/status transitions through server-only RPC/API. |
| P2 medium | Location privacy | Precise browser latitude/longitude is persisted in `profiles.location_preferences` and included in account export. | `app/api/account/location-preferences/route.ts:92`, `app/api/account/export/route.ts:64` | Privacy-sensitive data requires clear retention and user control before public launch. | Keep explicit consent UX, add retention/deletion policy, and consider storing coarse location unless precise coordinates are product-critical. |
| Info | Type drift | Generated Supabase type surface appears aligned with migrations `001`-`006`. | `lib/supabase/database.types.ts:12`, `lib/supabase/database.types.ts:110`, `lib/supabase/database.types.ts:164`, `lib/supabase/database.types.ts:241`, `lib/supabase/database.types.ts:333`, `lib/supabase/database.types.ts:363` | Low risk currently. | Regenerate/check types after any future migration. |

## RLS Findings

| Severity | Object | RLS / policy status | Evidence | Risk | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| Info | `profiles` | RLS enabled. Authenticated users can select/insert/update only own row. No delete policy. | `supabase/schema.sql:66`, `supabase/schema.sql:69`, `supabase/schema.sql:76`, `supabase/schema.sql:83`, `supabase/schema.sql:90` | Good ownership boundary. | Verify with two users in Supabase SQL/API during staging. |
| Info | `chat_conversations` | RLS enabled. Authenticated users can select/insert/update/delete only own conversations. | `supabase/migrations/001_chat_persistence.sql:81`, `supabase/migrations/001_chat_persistence.sql:85`, `supabase/migrations/001_chat_persistence.sql:92`, `supabase/migrations/001_chat_persistence.sql:99`, `supabase/migrations/001_chat_persistence.sql:107` | Good ownership boundary. | Add RLS regression tests when possible. |
| P2 medium | `chat_messages` | RLS scopes access through owned conversation and `auth.uid()`, but permits own-row role/status writes. | `supabase/migrations/001_chat_persistence.sql:114`, `supabase/migrations/001_chat_persistence.sql:128`, `supabase/migrations/001_chat_persistence.sql:143`, `supabase/migrations/001_chat_persistence.sql:167` | Privacy boundary is acceptable; data-integrity boundary is weaker. | Restrict direct writes or route writes through server-only code before treating persisted chat as authoritative. |
| Info | `vehicle_brands` | RLS enabled with public read for brands that have active Jordan vehicles. | `supabase/migrations/005_supported_vehicles_mvp.sql:131`, `supabase/migrations/005_supported_vehicles_mvp.sql:137` | Intentional public read. | Keep no public write policies. |
| P0 launch blocker | `supported_vehicles` | RLS enabled with public read for active Jordan rows. | `supabase/migrations/005_supported_vehicles_mvp.sql:132`, `supabase/migrations/005_supported_vehicles_mvp.sql:152` | Intentional for MVP, but public production depends on verified data. | Gate public claims or public rows to verified confidence/source before launch. |
| P0 launch blocker | `vehicle_cost_profiles` | RLS enabled with public read when parent vehicle is active Jordan row. | `supabase/migrations/005_supported_vehicles_mvp.sql:133`, `supabase/migrations/005_supported_vehicles_mvp.sql:159` | Cost estimates become public with parent row. | Keep estimate labels in staging; verify or hide before launch. |
| P0 launch blocker | `charging_locations` | RLS enabled with public read for `is_active = true`, not `is_verified = true`. | `supabase/migrations/005_supported_vehicles_mvp.sql:134`, `supabase/migrations/005_supported_vehicles_mvp.sql:174`, `supabase/migrations/005_supported_vehicles_mvp.sql:178` | Future active/unverified locations would be public. | Tighten policy in next migration before verified station launch. |
| P1 high if bucket omitted | `storage.objects` / `avatars` | Authenticated policies restrict object operations to `{user-id}/...` folder. | `supabase/migrations/004_avatar_storage_policies.sql:11`, `supabase/migrations/004_avatar_storage_policies.sql:20`, `supabase/migrations/004_avatar_storage_policies.sql:29`, `supabase/migrations/004_avatar_storage_policies.sql:42` | Good per-user write boundary; bucket creation is manual. Public URLs mean uploaded avatars are publicly retrievable by URL. | Keep bucket public only if MVP privacy accepts public avatars; otherwise move to signed URLs later. |

## Auth Findings

| Severity | Area | Finding | Evidence | Impact | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| Info | Supabase SSR | Server client uses `createServerClient`; middleware refreshes cookies using `getUser()`. This aligns with Supabase SSR guidance for session refresh. | `lib/supabase/server.ts:14`, `middleware.ts:38`, `middleware.ts:63` | Good session-read pattern. | Keep middleware/proxy migration on roadmap for Next.js convention cleanup. |
| Info | Protected routes | `/account` and `/dashboard` are protected; `/assistant` remains public by explicit product decision. | `middleware.ts:6`, `middleware.ts:8`, `middleware.ts:67` | Acceptable for mock AI staging. | Require auth before real AI, paid usage, or persistent sensitive assistant history. |
| Info | Signup/login validation | Email is normalized, password length is 8-128, onboarding payload is capped at 6000 chars, and profile answers are validated server-side. | `lib/auth/actions.ts:54`, `lib/auth/actions.ts:87`, `lib/auth/actions.ts:105`, `lib/auth/actions.ts:120`, `lib/auth/profile-validation.ts:78` | Good baseline validation. | Consider stronger password/MFA policy before public launch. |
| Info | Suspicious characters | Full name/onboarding values reject control/invisible characters and invalid option values. | `lib/auth/profile-validation.ts:25`, `lib/auth/profile-validation.ts:47`, `lib/auth/profile-validation.ts:60` | Good input hardening. | Keep ids/values synchronized with onboarding questions. |
| Info | User ownership | Profile writes derive `user.id` from Supabase Auth, not client payload. | `lib/auth/actions.ts:144`, `lib/auth/profile-validation.ts:179` | Good IDOR protection. | Keep this pattern. |
| Info | Safe errors | Auth errors return Arabic generic messages instead of raw Supabase error details. | `lib/auth/actions.ts:56`, `lib/auth/actions.ts:217`, `lib/auth/actions.ts:266` | Good user-facing error hygiene. | Keep raw error details out of UI. |
| P1 staging blocker if missing env | Auth/API rate limiting | Auth and API rate limiting are Upstash-backed and fail closed when Redis config is missing/unreachable. | `lib/security/rate-limit.ts:43`, `lib/server/rate-limit.ts:44`, `lib/server/redis.ts:16` | Missing Upstash secrets can make signup/login/chat/avatar/export/location appear broken. | Configure Upstash in staging/production and include it in smoke tests. |
| P2 medium | Auth brute-force coverage | Auth limiter is keyed by email, not also by IP/device. | `lib/security/rate-limit.ts:30`, `lib/auth/actions.ts:196`, `lib/auth/actions.ts:250` | Protects targeted account attempts, but does not throttle broad credential stuffing across many emails. | Add a second IP/device bucket or edge/WAF rule before public launch. |
| P2 medium | Password policy | Password minimum is 8 chars; no MFA/2FA or breached-password check is implemented. | `lib/auth/actions.ts:105`, `components/account/UpdatePasswordForm.tsx:7` | Acceptable MVP baseline, but not a mature public auth posture. | Decide MFA/2FA and stronger password policy before public production. |
| Info | OAuth redirect | OAuth client uses `/auth/callback?next=/start`; callback exchanges code and uses a safe relative redirect helper. | `lib/auth/oauth-client.ts:11`, `app/auth/callback/route.ts:18`, `lib/auth/redirect.ts:5`, `lib/auth/redirect.ts:15` | Good open-redirect mitigation. | Keep Supabase dashboard Redirect URLs synchronized across local/staging/production. |
| Info | OAuth draft save | Onboarding answers are saved locally before OAuth and saved to profile on OAuth return. | `components/onboarding/OnboardingAuthPanel.tsx:81`, `components/onboarding/OnboardingFlow.tsx:220`, `components/onboarding/OnboardingFlow.tsx:227` | Good visible OAuth wiring; not fake buttons. | Smoke-test configured Google/GitHub providers in staging. |
| P1 public launch blocker | Email delivery | Production SMTP/custom email provider is still a manual readiness item. | `README.md:107`, `docs/auth-email-branding.md:22` | Default Supabase email is not suitable as the final production sender. | Configure Custom SMTP/Resend-equivalent in Supabase dashboard and verify all auth templates. |
| P2 medium | CSRF residual | Account/profile server actions rely on framework/session protections; no explicit CSRF token is visible in the form actions. | `lib/auth/actions.ts:323`, `lib/auth/actions.ts:425` | Risk is lower with SameSite cookies and server actions, but public launch should explicitly assess CSRF posture for account mutations. | Add explicit CSRF review/testing or token pattern for high-risk account mutations if needed. |

## OAuth And Environment Findings

| Severity | Area | Finding | Evidence | Impact | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| Info | OAuth secrets location | Google/GitHub secrets are not referenced in app code. Docs correctly say provider secrets belong in Supabase Dashboard, not app env. | `lib/auth/oauth-client.ts:13`, `.env.example:15`, `README.md:109`, `docs/staging-smoke-tests.md:88` | Good secret boundary. | Keep app `.env*` free of Google/GitHub client secrets. |
| P1 staging blocker if omitted | Redirect URLs | Staging docs include local/staging callback and update-password URLs; `.env.example` needed clearer staging/update-password comments. | `docs/staging-smoke-tests.md:82`, `.env.example:19` | Misconfigured URLs break OAuth and password reset. | Keep Supabase Redirect URLs for local, staging, and production documented. |
| Info | Public env vars | Supabase URL/anon and site URL are `NEXT_PUBLIC_*`; these are expected public values. | `lib/supabase/env.ts:3`, `lib/auth/actions.ts:70`, `README.md:122` | Acceptable. | Never add service-role keys to `NEXT_PUBLIC_*`. |
| Info | Server-only env vars | Upstash and AI keys are read server-side. | `lib/server/redis.ts:16`, `lib/server/env.ts:5` | Good boundary. | Keep Upstash token server-only in hosting secrets. |
| Info | AI provider | `AI_PROVIDER` defaults to mock and real provider cases return mock. | `lib/server/env.ts:5`, `lib/ai/provider.ts:15` | Meets current product truth. | Do not set live AI keys until launch is approved. |
| P1 staging blocker if omitted | Upstash | Missing Redis config triggers fail-closed rate limit denial. | `lib/server/rate-limit.ts:44`, `lib/security/rate-limit.ts:43`, `docs/staging-smoke-tests.md:162` | Staging smoke tests can fail immediately with rate-limit messages. | Configure `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. |

Google/GitHub OAuth client IDs and secrets should be configured in Supabase Dashboard provider settings, not in app env files. Do not add `GOOGLE_CLIENT_SECRET`, `GITHUB_CLIENT_SECRET`, or similar variables to `.env.example`.

Required Supabase Auth redirect URLs:

```txt
http://localhost:3000/auth/callback
http://localhost:3000/auth/update-password
https://<staging-domain>/auth/callback
https://<staging-domain>/auth/update-password
https://<production-domain>/auth/callback
https://<production-domain>/auth/update-password
```

## API Security Findings

| Severity | Route | Finding | Evidence | Impact | Recommended fix |
| --- | --- | --- | --- | --- | --- |
| Info | `POST /api/chat` | Public mock chat route has content-length precheck, byte-limited JSON reading, validation, rate limiting, timeout, and safe 500. Authenticated users get chat persistence. | `app/api/chat/route.ts:14`, `app/api/chat/route.ts:68`, `app/api/chat/route.ts:83`, `app/api/chat/route.ts:110`, `app/api/chat/route.ts:134`, `app/api/chat/route.ts:216`, `app/api/chat/route.ts:241` | Good staging posture for mock AI. | Require auth and stricter quotas before real AI/provider launch. |
| Info | `POST /api/account/avatar` | Auth happens before rate limit and before `formData()`. Content-Length, size, MIME mapping, magic bytes, random path, old-avatar cleanup, and storage error handling exist. | `app/api/account/avatar/route.ts:106`, `app/api/account/avatar/route.ts:117`, `app/api/account/avatar/route.ts:134`, `app/api/account/avatar/route.ts:157`, `app/api/account/avatar/route.ts:167`, `app/api/account/avatar/route.ts:241`, `app/api/account/avatar/route.ts:326` | Good staging posture. | Add `Cache-Control: no-store` to all JSON error/success responses if consistent API cache semantics are desired. |
| Info | `GET /api/account/export` | Requires auth, rate-limits by `user.id`, filters profile/conversation/message queries by authenticated user, returns `no-store` JSON attachment. | `app/api/account/export/route.ts:18`, `app/api/account/export/route.ts:25`, `app/api/account/export/route.ts:66`, `app/api/account/export/route.ts:81`, `app/api/account/export/route.ts:93`, `app/api/account/export/route.ts:115` | Good ownership boundary. | Logs include `userId` and Supabase error message for optional query failures; keep logs private and avoid payload/email logging. |
| Info | `POST /api/account/location-preferences` | Requires auth, rate-limits, validates lat/lon/accuracy, requires explicit consent, writes only current user's profile. | `app/api/account/location-preferences/route.ts:35`, `app/api/account/location-preferences/route.ts:41`, `app/api/account/location-preferences/route.ts:62`, `app/api/account/location-preferences/route.ts:73`, `app/api/account/location-preferences/route.ts:88`, `app/api/account/location-preferences/route.ts:104` | Good API ownership and consent boundary. | Decide retention/coarsening policy before public launch. |
| P2 medium | API rate-limit observability | Fail-closed is safe, but can look like product breakage if Upstash is missing. | `lib/server/rate-limit.ts:44`, `docs/staging-smoke-tests.md:162` | Staging operator confusion. | Keep staging smoke checklist note and monitor logs for `store unavailable`. |

## P0 Launch Blockers

| Area | Blocker | Required next step |
| --- | --- | --- |
| Vehicle data | Public vehicle seed rows are estimate/sample, not verified launch data. | Human-verify vehicle specs/pricing/range/source data; add a new data migration or verified content source; keep public UI caveats until complete. |
| Charging data | `charging_locations` has no verified station seed, and current public policy allows any active station regardless of `is_verified`. | Add verified station data and tighten public read policy to verified active rows. |
| Production email | Custom SMTP/branded auth email setup is not completed. | Configure Supabase Custom SMTP/provider and verify confirmation/reset templates and links. |
| Operations | Monitoring/alerting and bot protection are not installed. | Use logs for staging; choose and configure production monitoring/alerting and WAF/bot strategy before public launch. |
| Final launch governance | AI remains mock; payments inactive; legal exists but final operational checklist still pending. | Keep AI/payment claims off public launch copy; complete launch checklist. |

## P1 Staging Blockers

| Area | Staging blocker | Required setup |
| --- | --- | --- |
| Supabase DB | Migrations not applied in order. | Run `schema.sql`, then migrations `001`-`006`. |
| Storage | `avatars` bucket not created or not public. | Create public `avatars` bucket and run migration `004`. |
| Auth URLs | Supabase Site URL/Redirect URLs missing. | Add local/staging callback and update-password URLs. |
| OAuth | Google/GitHub providers not configured while buttons are visible. | Configure providers in Supabase Dashboard or document them as disabled for that environment. |
| Rate limiting | Upstash env missing/unreachable. | Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. |

## P2 Improvements

| Area | Improvement | Suggested file(s) |
| --- | --- | --- |
| RLS tests | Add automated or scripted two-user RLS tests for profiles/chat/avatar policies. | `tests/` or a future docs QA script. |
| Chat integrity | Prevent direct authenticated users from forging assistant/system chat rows if persisted chat becomes authoritative. | Future migration/RPC and `lib/chat/server-persistence.ts`. |
| Auth throttling | Add IP/device-level auth rate limiting in addition to email bucket. | `lib/security/rate-limit.ts`, `lib/auth/actions.ts`. |
| Location privacy | Add retention/coarsening/deletion policy for precise location data. | `app/api/account/location-preferences/route.ts`, legal/privacy docs. |
| JSON constraints | Add DB check constraints for object-shaped JSON profile settings. | Future migration. |
| CSRF review | Explicitly review account mutation server actions for CSRF posture. | `lib/auth/actions.ts`, account forms. |

## Manual Supabase Dashboard Checklist

Database:

- Run `supabase/schema.sql`.
- Run migrations `001` through `006` in order.
- Confirm no migration `007` is expected or present.
- Verify RLS is enabled on `profiles`, `chat_conversations`, `chat_messages`, vehicle tables, cost profiles, and `charging_locations`.
- With two test users, verify user A cannot read/update user B profile/chat rows.

Storage:

- Create bucket `avatars`.
- Set visibility to public for the current MVP `getPublicUrl` flow.
- Confirm policies from `004_avatar_storage_policies.sql` exist.
- Verify user A cannot upload/update/delete under user B's `{user-id}/...` folder.

Auth:

- Set Site URL for local/staging/production environment.
- Add redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/update-password`
  - `https://<staging-domain>/auth/callback`
  - `https://<staging-domain>/auth/update-password`
  - `https://<production-domain>/auth/callback`
  - `https://<production-domain>/auth/update-password`
- Decide email confirmation on/off for staging.
- Configure Custom SMTP before public production.
- Enable Google/GitHub providers only in Supabase Dashboard.
- Put Google/GitHub OAuth credentials in Supabase Dashboard provider settings, not app env.
- Copy Supabase provider callback URL into each Google/GitHub OAuth app.

Hosting env:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`
- `AI_PROVIDER=mock`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- Leave `OPENAI_API_KEY`, `GEMINI_API_KEY`, and `KIMI_API_KEY` empty until real AI launch is approved.
- Do not add Supabase `service_role` keys to the app runtime or `NEXT_PUBLIC_*`.

## What Not To Change In The Next Fix Phase

- Do not edit existing applied migrations in place.
- Do not seed fake charging stations.
- Do not invent migration `007` without verified data.
- Do not connect real AI providers.
- Do not add payment.
- Do not add Google/GitHub secrets to repository env files.
- Do not use Supabase service-role keys in client code or normal app runtime.
- Do not change onboarding question ids/values.

## Recommended Next Phase

Phase 9B should be a docs-plus-dashboard hardening pass:

1. Apply/stage Supabase migrations in a real staging Supabase project.
2. Create the public `avatars` bucket and verify storage policies with two users.
3. Configure Auth Site URL and redirect URLs for local/staging/production.
4. Configure Google/GitHub providers in Supabase Dashboard or explicitly mark them unavailable for staging.
5. Configure Upstash Redis env vars in Cloudflare Workers.
6. Run the staging smoke checklist end to end.
7. Prepare a future migration that tightens `charging_locations` public read to verified active rows before any real station launch.
8. Keep public production blocked until verified vehicle/station data and ops/email readiness are complete.
