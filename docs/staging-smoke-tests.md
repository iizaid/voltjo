# VoltJo — Staging Deployment & Smoke-Test Checklist

> **Phase 9 reference document.**
> Copy-paste friendly. Work top to bottom. Check each box before promoting to production.

---

## 1. Environment Variables

Set all of the following in your staging host (Vercel → Project → Settings → Environment Variables).
Do **not** commit real values.

| Variable | Required | Staging value |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Your Supabase anon key |
| `NEXT_PUBLIC_SITE_URL` | Yes | Your staging origin, no trailing slash (e.g. `https://voltjo-staging.vercel.app`) |
| `AI_PROVIDER` | Yes | **`mock`** — keep mock for all staging and public MVP |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis REST URL — required for rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST token — required for rate limiting |
| `OPENAI_API_KEY` | No | Leave empty |
| `GEMINI_API_KEY` | No | Leave empty |
| `KIMI_API_KEY` | No | Leave empty |

**Monitoring env vars (Sentry etc.) are not wired yet.** See `docs/monitoring.md`.
Do not add `SENTRY_DSN` or `SENTRY_AUTH_TOKEN` until Sentry is installed.

> `NEXT_PUBLIC_SITE_URL` is required for `robots.txt` and `sitemap.xml` to reference the
> correct staging origin. Without it both files fall back to `https://voltjo.com`.

---

## 2. Supabase Setup (Manual — Dashboard)

### 2a. Database Migrations

Open **Supabase Dashboard → SQL Editor** and run each file exactly once, in this order:

```
1.  supabase/schema.sql
2.  supabase/migrations/001_chat_persistence.sql
3.  supabase/migrations/002_account_settings.sql
4.  supabase/migrations/003_profile_avatar_path.sql
5.  supabase/migrations/004_avatar_storage_policies.sql
6.  supabase/migrations/005_supported_vehicles_mvp.sql
7.  supabase/migrations/006_user_location_preferences.sql
```

All migrations are additive and idempotent — safe to re-run.

> **Run only the existing migrations listed above.**
> Migration `007` (verified launch data seed) does **not** exist yet.
> Verified launch data seed remains pending.
> Do not invent or run a `007` file.

- [ ] `schema.sql` — profiles table, RLS, `set_updated_at()` trigger
- [ ] `001_chat_persistence.sql` — chat_conversations, chat_messages tables + RLS
- [ ] `002_account_settings.sql` — avatar_config, privacy_settings columns
- [ ] `003_profile_avatar_path.sql` — avatar_path column
- [ ] `004_avatar_storage_policies.sql` — storage.objects RLS for avatars bucket
- [ ] `005_supported_vehicles_mvp.sql` — vehicles tables, sample seed (all rows `data_confidence = 'estimate'`), charging_locations table (empty — no stations seeded)
- [ ] `006_user_location_preferences.sql` — location_preferences column

### 2b. Storage Bucket (Manual)

- [ ] Supabase Dashboard → **Storage → New bucket**
- [ ] Name: `avatars`
- [ ] Visibility: **Public**
- [ ] Confirm `004_avatar_storage_policies.sql` ran before testing avatar upload

### 2c. Auth Configuration (Manual)

- [ ] Supabase Dashboard → **Authentication → URL Configuration**
- [ ] **Site URL:** set to your staging origin (e.g. `https://voltjo-staging.vercel.app`)
- [ ] **Redirect URLs — add all four:**
  - `https://<staging-domain>/auth/callback`
  - `https://<staging-domain>/auth/update-password`
  - `http://localhost:3000/auth/callback` (for local dev parity)
  - `http://localhost:3000/auth/update-password` (for local dev parity)
- [ ] Decide whether email confirmation is enabled (staging can disable for speed)
- [ ] If Google/GitHub buttons are visible in staging, enable both providers in **Authentication → Providers**
- [ ] Add Google and GitHub client credentials in the Supabase Dashboard only — never in repo env files
- [ ] Copy the provider callback URL shown by Supabase into the Google/GitHub OAuth app settings
- [ ] Confirm OAuth sign-in redirects back to `https://<staging-domain>/auth/callback`

---

## 3. Route Smoke Tests

Replace `STAGING_URL` with your actual staging origin before running.

### 3a. Public Routes

| Route | Expected | Pass? |
| --- | --- | --- |
| `GET /` | 200 — homepage renders in Arabic, no JS errors | |
| `GET /start` | 200 — auth/onboarding page renders | |
| `GET /vehicles` | 200 — vehicle list renders with seeded sample rows | |
| `GET /vehicles/<existing-slug>` | 200 — vehicle detail page renders | |
| `GET /vehicles/bad-slug-that-does-not-exist` | 404 — not-found page renders | |
| `GET /charging-map` | 200 — map renders; empty charging stations state handled gracefully (005 seeds no stations) | |
| `/charging-map` location button | Browser geolocation permission prompt appears; denying permission keeps the consent/error UX stable | |
| `GET /charging-calculator` | 200 — calculator renders; vehicle dropdown populated from seeded rows | |
| `GET /assistant` | 200 — assistant chat page renders | |
| `GET /robots.txt` | 200 — `Sitemap:` line references staging origin, not `voltjo.com` | |
| `GET /sitemap.xml` | 200 — XML with staging origin URLs, not `voltjo.com` | |
| `GET /nonexistent-path-xyz` | 404 — custom not-found page | |

### 3b. Auth / Account Routes

| Route / Action | Expected | Pass? |
| --- | --- | --- |
| `GET /account` (signed-out) | Redirect to `/start?next=%2Faccount` | |
| `GET /dashboard` (signed-out) | Redirect to `/start` | |
| Signup flow (email confirmation off) | Account created, redirected to `/account` | |
| Login with valid credentials | Session established, redirected to intended page | |
| Login with wrong password | Arabic error message shown, no 500 | |
| Google OAuth button | With Supabase Google provider configured, redirects through Google and returns to `/auth/callback` without a fake UI-only action | |
| GitHub OAuth button | With Supabase GitHub provider configured, redirects through GitHub and returns to `/auth/callback` without a fake UI-only action | |
| OAuth provider not configured | Document as external setup missing; do not treat a provider-dashboard error as an app-code pass | |
| `GET /auth/callback` (no params) | Safe redirect — no crash, redirects to `/assistant` (the configured safe-redirect default) | |
| `GET /auth/update-password` | 200 — password update form renders | |
| `GET /account` (signed-in) | 200 — Smart Profile page loads with user data | |
| Sign out | Session cleared, redirected to `/` or `/start` | |

### 3c. API Smoke Tests

**POST /api/chat — valid mock request (expect 200):**

```bash
curl -s -X POST "$STAGING_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"ما هي أفضل سيارة كهربائية؟","modelId":"voltjo","thinkingMode":false}'
```

Expected: `200` with JSON body `{ message: { content: "...", ... }, conversationId: ... }`
Rate-limit response headers present: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

**POST /api/chat — over IP rate limit (anonymous: 10 req / 10 min window):**

Send 11 identical requests in quick succession (anonymous, no session cookie).
Expected: `429` with `Retry-After` header and Arabic error message body.

**POST /api/chat — oversized JSON body (expect 413):**

Send a JSON request larger than 12KB, including when `Content-Length` is missing or chunked.
Expected: `413` with an Arabic payload-size error and no raw stack trace.

Note: current rate limiting is fail-closed. If Upstash Redis env vars are missing or invalid,
rate-limited endpoints may return 429/deny instead of working normally.

**GET /api/account/export — signed-out (expect 401):**

```bash
curl -s -o /dev/null -w "%{http_code}" "$STAGING_URL/api/account/export"
```

**GET /api/account/export — signed-in (expect 200 JSON attachment):**

Expected: `200` with `Content-Disposition: attachment; filename="voltjo-account-data.json"`
Body is valid JSON containing account data (no raw stack traces).

**POST /api/account/avatar — signed-out (expect 401):**

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST "$STAGING_URL/api/account/avatar"
```

**POST /api/account/avatar — upload hardening:**

- Missing or invalid `Content-Length`: `400` with Arabic error before multipart parsing
- Request larger than the avatar upload cap: `413`
- JPG, PNG, and WEBP uploads keep matching storage extensions and content types

**POST /api/account/location-preferences — signed-out (expect 401):**

```bash
curl -s -o /dev/null -w "%{http_code}" -X POST "$STAGING_URL/api/account/location-preferences"
```

**POST /api/account/location-preferences — signed-in with consent (expect 200):**

Send with a valid session cookie and body `{ "latitude": 31.9, "longitude": 35.9, "consent": true }`.
Expected: `200` — location saved to profile.

**POST /api/account/location-preferences — repeated saves (expect 429):**

After 10 signed-in saves within 10 minutes, the next request returns `429` with `Retry-After`.

### 3d. Data / UI Verification

- [ ] `/vehicles` renders current seeded rows from migration 005 (all marked sample / preliminary)
- [ ] Announcement bar says vehicle data is experimental / under review, not launch-ready
- [ ] Vehicle list/detail pages show a visible note that data may differ by import origin, trim, dealer, and Jordan market availability
- [ ] `/charging-calculator` vehicle dropdown lists vehicles that have `battery_kwh` populated
- [ ] `/charging-map` shows graceful empty state — migration 005 seeds no charging stations
- [ ] `/charging-map` can ask for browser location after the app-level `Permissions-Policy` header is applied
- [ ] Pricing labels say preliminary / coming soon / قيد التحضير — no confirmed paid-plan JOD figures and no active payment/subscription claim
- [ ] AI assistant returns mock responses only — no real AI provider is launched
- [ ] Assistant public copy says experimental guidance and does not imply final AI advice
- [ ] Assistant model menu labels alternate modes as experimental; Gemini/Kimi must not appear as live provider integrations unless implemented
- [ ] No provider names leak into UI (Supabase, OpenAI, Stripe, database, backend)
- [ ] Arabic text renders correctly — RTL layout, font loaded

---

## 4. Quick curl Smoke Script

```bash
STAGING_URL=https://your-staging-url.example

# Public pages
curl -I "$STAGING_URL/"
curl -I "$STAGING_URL/start"
curl -I "$STAGING_URL/vehicles"
curl -I "$STAGING_URL/charging-map"
curl -I "$STAGING_URL/charging-calculator"
curl -I "$STAGING_URL/assistant"

# SEO files
curl -s "$STAGING_URL/robots.txt"
curl -s "$STAGING_URL/sitemap.xml"

# 404
curl -I "$STAGING_URL/nonexistent-path-xyz"

# Mock chat (expect 200)
curl -s -X POST "$STAGING_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"ما هي أفضل سيارة كهربائية؟","modelId":"voltjo","thinkingMode":false}' | head -c 300

# Auth-protected endpoints (all expect 401 without session)
curl -s -o /dev/null -w "export: %{http_code}\n" "$STAGING_URL/api/account/export"
curl -s -o /dev/null -w "avatar: %{http_code}\n" -X POST "$STAGING_URL/api/account/avatar"
curl -s -o /dev/null -w "location: %{http_code}\n" -X POST "$STAGING_URL/api/account/location-preferences"
```

---

## 5. Rollback Notes

### Vercel Deployment Rollback

1. Vercel Dashboard → **Deployments** tab for the project
2. Find the last known-good deployment
3. Click **...** → **Promote to Production** (or **Redeploy**)
4. Takes effect within seconds — no downtime window needed

### Bad Additive Data Seed

If a migration seeded wrong vehicle or location data:
- Run a corrective `UPDATE` or `DELETE ... WHERE id = '...'` against specific rows only
- **Never run `DROP TABLE`, `TRUNCATE`, or `DELETE` without a `WHERE` clause** on any table that may hold user data
- Use `ON CONFLICT DO UPDATE` (already used in migration 005) to correct seed rows safely
- Document the correction as a new migration file — do not edit existing migration files after they have been applied

### AI Provider

- `AI_PROVIDER=mock` must remain set for all staging and public MVP deployments
- Do **not** set `OPENAI_API_KEY`, `GEMINI_API_KEY`, or `KIMI_API_KEY` until the data gate is satisfied (verified vehicle data, verified charging stations) and an intentional AI launch is approved

### Rate Limiting

- Current rate limiting is fail-closed. If Upstash Redis env vars are missing or invalid, rate-limited endpoints may return 429/deny instead of working normally.
- Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` before running any staging smoke tests.

---

## 6. Pre-Production Gate

Do not promote to production until all boxes are checked:

- [ ] All route smoke tests pass (sections 3a–3d)
- [ ] No raw stack traces visible in UI or API responses
- [ ] `robots.txt` references staging/production origin — not `localhost`
- [ ] `sitemap.xml` references correct origin
- [ ] Avatar upload works end-to-end (avatars bucket created, migration 004 ran)
- [ ] Auth callback does not crash on malformed or missing state parameter
- [ ] Google/GitHub OAuth buttons are tested with configured Supabase providers or explicitly documented as not configured for the environment
- [ ] Vehicle data verified by human review before any public claims
- [ ] Charging station data added and verified before public map claims
- [ ] `AI_PROVIDER=mock` confirmed — no live AI costs
- [ ] Monitoring plan reviewed (`docs/monitoring.md`)
- [ ] HTTPS confirmed — no HTTP-only deployment
