# VoltJo Production Readiness Plan

> Read-only audit. No code was changed. Based on actual repository state at branch `main` (commit `8e098ad`).

## Context

VoltJo is an Arabic-first, Jordan-focused EV/PHEV/hybrid vehicle intelligence platform (Next.js 16, React 19, Supabase, MapLibre). The foundations are unusually disciplined for this stage: auth, RLS, account settings, avatar upload, a charging map, a charging calculator, a mock assistant, and a security/perf hardening pass already exist and are documented in `docs/`. The goal of this plan is **not** to rebuild anything — it is to identify the precise, concrete gaps between "demo that runs" and "credible public MVP," and sequence the work to close them.

The single most important theme: **most of the plumbing is real; the launch risk is in (a) production infrastructure that silently degrades on serverless, (b) empty/unverified data behind real-looking UI, and (c) a few deployment steps that are under-documented.**

---

## 1. Current State Summary

**What VoltJo does today:** A guest can browse the homepage, view supported vehicles, use an interactive charging map (browser geolocation, no API key), run a charging-cost calculator entirely client-side, and try a mock AI assistant. A user can sign up / log in (email+password, OAuth scaffolding), complete onboarding (Smart Profile), manage account/profile/avatar/privacy/location, export their data as JSON, and request account deletion by email.

| Area | Status | Notes |
|---|---|---|
| **Main pages** | Working | `/`, `/start`, `/vehicles`, `/vehicles/[slug]`, `/charging-map`, `/charging-calculator`, `/assistant`, `/account`, `/dashboard` |
| **Auth/account** | Mostly ready | Email/password + onboarding solid; OAuth not enabled; email-confirmation decision pending |
| **Chat/assistant** | Mock only | `getAiProvider()` always returns `mockProvider`; server-side persistence exists but client uses localStorage (dual state) |
| **Vehicle data** | Foundation only | 6 seeded rows, mostly `null` fields, all `data_confidence='estimate'` |
| **Charging map** | MVP, **no data** | Map + geolocation work; `charging_locations` table has **zero seed rows** |
| **Charging calculator** | Working | Pure client-side formula; only vehicles with `battery_kwh>0` appear (2 of 6) |
| **Database/Supabase** | Mostly ready | schema + 6 migrations, RLS on every table; manual steps under-documented in README |
| **Security** | Mostly ready w/ gaps | Good headers, magic-byte validation, RLS, safe redirects; **rate limiter is in-memory**, no CSP, public avatar bucket |
| **Performance** | Likely fine | Memoization done; MapLibre is the only heavy bundle; perceived slowness is dev-mode |
| **Design/UI** | Strong | Consistent design system, RTL Arabic, no developer messages leak into public UI |
| **Documentation** | Good but drifting | Excellent `docs/`; README under-lists required migrations |

---

## 2. What Is Ready

- **Auth core** — signup, login, logout, password-reset-link (scoped to logged-in user's own email), update-password page, onboarding persistence with server-side validation (`lib/auth/profile-validation.ts`).
- **Route protection** — `proxy.ts` (Next 16 middleware successor) gates `/dashboard` + `/account`; pages also self-defend with `redirect("/start")`. Double-gated.
- **Auth callback safety** — `app/auth/callback/route.ts` blocks `//`, backslashes, encoded backslashes, and `http:`/`javascript:`/`data:` open-redirects; falls back to internal paths only.
- **RLS everywhere** — `profiles`, `chat_conversations`, `chat_messages`, `vehicle_brands`, `supported_vehicles`, `vehicle_cost_profiles`, `charging_locations` all have RLS enabled with owner-scoped or public-read-active policies. Storage objects scoped by `(storage.foldername(name))[1] = auth.uid()::text`.
- **Avatar upload hardening** — request-size guard, MIME allow-list, size limit, **magic-byte signature validation** (JPEG/PNG/WEBP), forced path `{uid}/avatar.webp`, orphaned-file cleanup on failed DB update, safe Arabic errors.
- **Chat API validation** — `lib/ai/validation.ts` strictly validates message/model/thinking/conversationId (UUID)/attachment; ownership check before reusing a `conversationId`; 30s provider timeout; per-key rate-limit headers.
- **Security headers** — X-Frame-Options DENY, nosniff, Referrer-Policy, Permissions-Policy (camera/mic/geo off).
- **No `service_role` in runtime, no `dangerouslySetInnerHTML`/`eval`** (confirmed by prior audit + grep).
- **Charging map privacy** — geolocation is user-initiated, coordinates not stored in localStorage, server-save requires explicit consent + auth, validated lat/long ranges, no `user_id` accepted from client.
- **Design system & RTL** — consistent tokens, Arabic-first, dismissible geolocation modal, empty-states written for the public (no migration/provider language).

---

## 3. What Is Not Ready

- **Production rate limiting** — `lib/server/rate-limit.ts` and `lib/security/rate-limit.ts` are in-memory `Map`s. On Vercel serverless these reset per cold start → effectively no protection on chat, avatar, export, password-reset, login.
- **Charging map data** — `charging_locations` is empty. Map launches blank.
- **Vehicle data credibility** — 6 rows, almost all specs `null`, every row `estimate`. Not safe for public claims without verification.
- **Real AI** — assistant is mock; correct for now, but `/assistant` is public and presented as a product feature.
- **CSP** — none.
- **Avatar privacy** — public bucket + predictable path (`{uid}/avatar.webp`) = enumerable/guessable avatar URLs.
- **Deployment documentation** — README lists only `schema.sql` + `005`; it omits `001` (chat), `002` (account settings), `003` (avatar path), `004` (storage policies), `006` (location prefs), the **manual `avatars` bucket creation**, and `NEXT_PUBLIC_SITE_URL`.
- **Account export completeness** — exports profile + account, but **not** `location_preferences` or chat history.
- **Operational basics** — no monitoring/logging/audit trail, no CI, no tests, no analytics, no `robots.txt`/`sitemap`/SEO metadata per page, no error/404 polish verified.
- **Real support email** — `DeleteAccountRequest` and delete flow depend on `support@voltjo.com` existing.

---

## 4. Critical Blockers
*(Must fix before any public launch.)*

### C1 — In-memory rate limiter is a no-op on serverless
- **Severity:** Critical (security)
- **Files:** `lib/server/rate-limit.ts`, `lib/security/rate-limit.ts`; consumed by `app/api/chat/route.ts`, `app/api/account/avatar/route.ts`, `app/api/account/export/route.ts`, `lib/auth/actions.ts`.
- **Why:** On Vercel/multi-instance hosting each request may hit a fresh process, so buckets never accumulate. Login brute-force, chat abuse, and export scraping are unthrottled in practice.
- **Fix:** Back the limiter with Upstash Redis (or Vercel KV). Keep the existing `checkRateLimit` signature; swap the store. MVP-appropriate, not enterprise.
- **Effort:** Medium · **AI-safe:** Yes (with the Upstash account/env provided) · **Manual dashboard:** Yes (create Upstash DB, add env vars).

### C2 — Required migrations & storage bucket not fully documented → broken account features on deploy
- **Severity:** Critical (deployment correctness)
- **Files:** `README.md`, `supabase/migrations/001–006`, manual Supabase Storage.
- **Why:** If a deployer follows README they run only `schema.sql` + `005`. Then avatar upload (needs `003`+`004`+bucket), account settings (`002`), location save (`006`), and chat persistence (`001`) all fail at runtime. The avatar route even returns Arabic "run the DB upgrade first" errors to users.
- **Fix:** Author one ordered, authoritative deploy runbook (all migrations in order; create public `avatars` bucket; set Auth Site URL + redirect URLs incl. `/auth/update-password` and `/auth/callback`; set `NEXT_PUBLIC_SITE_URL`).
- **Effort:** Small · **AI-safe:** Yes (docs only) · **Manual dashboard:** Yes (the steps themselves).

### C3 — Decide & configure email confirmation + production SMTP
- **Severity:** Critical (auth correctness)
- **Files:** Supabase Auth dashboard; `lib/auth/actions.ts` already branches on `data.session` for both modes.
- **Why:** Without a production SMTP provider, confirmation/reset emails silently fail to send → users cannot complete signup or reset passwords. Default Supabase SMTP is rate-limited and not for production.
- **Fix:** Choose confirmation on/off; configure production SMTP; brand templates per `docs/auth-email-branding.md`; test signup + reset end-to-end.
- **Effort:** Small–Medium · **AI-safe:** No (dashboard + DNS) · **Manual dashboard:** Yes.

### C4 — Empty charging map presented as a finished feature
- **Severity:** Critical (credibility) — *or* downgrade to High for a private beta.
- **Files:** `supabase/schema.sql`/`005` (table), `app/charging-map/page.tsx`, `data/navigation.ts`.
- **Why:** "خريطة الشحن في الأردن" is a top-nav promise. An empty map reads as broken to a public user.
- **Fix (pick one):** (a) Seed a small set of **verified** Jordan charging stations before launch, or (b) temporarily remove the map from primary nav until ≥1 verified row exists. Do **not** seed fake stations (current code correctly renders nothing — keep that).
- **Effort:** Small (hide) / Medium (seed verified data) · **AI-safe:** Hiding yes; data verification no (human research) · **Manual:** SQL seed.

---

## 5. High-Priority Issues
*(Fix before public launch; a closed private beta could tolerate some.)*

### H1 — Vehicle data is not credible for public claims
- **Files:** `supabase/migrations/005_supported_vehicles_mvp.sql`, `app/vehicles/*`.
- **Why:** All 6 rows are `estimate` with mostly `null` specs; the detail page still renders "مستوى الثقة" but the data underneath isn't verified. README itself warns this needs business verification.
- **Fix:** Promote a small verified set (see §9). Until then the UI's existing "قيد المراجعة" disclaimers are doing real work — keep them.
- **Effort:** Medium · **AI-safe:** SQL writing yes; **fact verification no.** · **Manual:** SQL seed.

### H2 — Public avatar bucket with guessable paths
- **Files:** `lib/account/avatar.ts`, `app/api/account/avatar/route.ts`, migration `004`.
- **Why:** Public bucket + `{uid}/avatar.webp` means anyone who knows a user id can fetch their avatar. Low severity content, but it's a real privacy leak and trivially enumerable.
- **Fix (MVP):** Acceptable to ship public for launch (documented decision), but add a randomized filename segment (e.g. `{uid}/{random}.webp`) so URLs aren't guessable; longer term move to private bucket + signed URLs.
- **Effort:** Small · **AI-safe:** Yes · **Manual:** None (policy already path-prefixed by uid folder).

### H3 — Account export is incomplete (data-rights gap)
- **Files:** `app/api/account/export/route.ts`.
- **Why:** Omits `location_preferences` and chat history. If you advertise "export your data," it should be complete.
- **Fix:** Add `location_preferences` and the user's `chat_conversations`/`chat_messages` to the whitelisted payload.
- **Effort:** Small · **AI-safe:** Yes · **Manual:** None.

### H4 — Pricing section shows concrete prices with non-functional CTAs
- **Files:** `components/ui/pricing.tsx`, `components/sections/PricingSection.tsx`, `data/navigation.ts` (`/#pricing`).
- **Why:** Plans show `4.99/9.99 د.أ` with buttons that only toast "coming soon." There *are* disclaimers ("الأسعار مؤقتة") and the buttons don't fake a checkout, so this is borderline-acceptable — but real numbers on a launch page imply a commitment.
- **Fix:** Either mark clearly as "خطط مبدئية / قريبًا" at the section header level, or soften to ranges until billing exists. No Stripe needed for MVP.
- **Effort:** Small · **AI-safe:** Yes · **Manual:** None.

### H5 — No CSP
- **Files:** `next.config.ts`.
- **Why:** Baseline headers exist but no `Content-Security-Policy`. MapLibre + Google Fonts + Supabase + inline styles make a strict CSP non-trivial, which is why it was deferred.
- **Fix:** Add a report-only CSP once the production domain is fixed; tune allow-list for `*.supabase.co`, fonts, MapLibre tile/style host; then enforce.
- **Effort:** Medium · **AI-safe:** Yes (iterative) · **Manual:** Domain decision.

### H6 — No monitoring / error visibility
- **Why:** Failed uploads/exports/reset/login and 500s currently only `console.*`. On Vercel you'll be blind to production errors.
- **Fix:** Wire a lightweight error reporter (Sentry free tier or Vercel's built-in logging/analytics). MVP-appropriate.
- **Effort:** Small–Medium · **AI-safe:** Yes (with DSN) · **Manual:** Account + env.

---

## 6. Medium-Priority Improvements
*(Important; fine shortly after MVP.)*

- **M1 — Chat persistence is dual-state.** Server writes messages (auth users) but the assistant UI reads localStorage; there's no "load my history" path. Either finish read-back or document chat as session-local for launch. (Files: `app/api/chat/route.ts`, `lib/chat/*`, `components/chat/ChatShell.tsx`.)
- **M2 — Calculator ↔ vehicles coupling.** Only `battery_kwh>0` vehicles appear (2 of 6); hybrids never appear. Add fuel-based cost mode or clearer "EV/PHEV only" framing. Add a Jordan electricity-tariff preset note (current default `0.12 JOD/kWh` is hardcoded). (Files: `lib/vehicles/queries.ts`, `components/vehicles/ChargingCalculatorClient.tsx`.)
- **M3 — SEO/meta.** Only root `layout.tsx` has metadata. Add per-page metadata, `robots.txt`, `sitemap.xml`, OpenGraph for an Arabic public site.
- **M4 — Tests/CI.** No tests and no CI. Add a minimal GitHub Actions run of `npm run lint` + `npm run build` on PRs; a few unit tests for `validateAiChatRequest`, the calculator formula, and redirect-safety.
- **M5 — `set_updated_at()` defined twice** (schema.sql + 005) — harmless (`create or replace`) but consolidate to avoid drift.
- **M6 — Confirm `database.types.ts` covers all 6 migrations** so typed queries don't silently fall back to `any`.

---

## 7. Security Review

**Already implemented (keep):** RLS on all tables + storage; owner-scoped policies; magic-byte avatar validation; size/MIME guards; redirect allow-listing; safe Arabic errors (no raw Supabase leakage); 30s AI timeout; no `service_role`/`eval`/`dangerouslySetInnerHTML`; security headers; consent-gated, validated location save.

**Must fix before production:**
1. **C1** Durable rate limiting (Upstash/KV).
2. **C3** Production SMTP + confirmation decision.
3. **H2** Non-guessable avatar paths.
4. **C2** Document/run all migrations + bucket so RLS/storage actually exist in prod.

**Should fix after MVP:**
- **H5** CSP (report-only → enforce).
- **H6** Error monitoring + a minimal audit trail for auth/upload/export events.
- Bot protection/CAPTCHA on signup/login — defer unless abuse appears; durable rate limiting covers most of the need first.
- Private avatar bucket + signed URLs (after H2).

**Monitor:** failed-login spikes, export frequency, chat volume per user, storage growth/orphans.

**Explicitly NOT needed for MVP:** WAF appliances, SIEM, pen-test program, enterprise SSO.

---

## 8. Performance Review

**Likely fine; perceived slowness is dev-mode** (confirmed in `docs/security-performance-audit.md`: prod cold start ~146ms, routes immediate).

- **Real bottleneck to watch:** MapLibre on `/charging-map` is the only heavy client bundle. It's already isolated to a client component on one route → acceptable. Verify it's not pulled into shared chunks.
- **Already optimized:** memoized sidebar filtering + active-conversation lookup in chat; avatar URL resolution no longer spins up an SSR Supabase client.
- **Optimize before launch:** confirm `/vehicles`, `/charging-map`, `/charging-calculator` ship minimal client JS; ensure motion/gsap/lenis libs on the marketing page aren't loaded on app routes; check `react`/`maplibre` aren't double-bundled.
- **Measure in production (not dev):** run Lighthouse on the deployed marketing page and `/charging-map` on a mid-range mobile (Arabic users, mobile-heavy).
- **Can wait:** image optimization for `public/brands/*` (some PNGs are large); route-level caching strategy for vehicle queries (data is small).

---

## 9. Data Readiness Review

VoltJo's credibility *is* its data. The schema already models this well: `data_confidence ∈ {official, dealer, owner_reported, estimate}` and per-scenario `vehicle_cost_profiles`.

**Minimum launch dataset:** ~5–8 vehicles actually sold in Jordan, each with verified core fields. Better to ship 5 trustworthy rows than 30 guesses.

**Required (non-null) per vehicle for launch:** `brand`, `name_ar/name_en`, `model_year`, `vehicle_type`, `market='jordan'`, `summary_ar`, `data_confidence`, `is_active`.
**May stay null:** `price_jod_*` (volatile by dealer), `total_range_km`, `body_type`, fine-grained charging fields — better null than wrong.
**Must be verified if shown:** `battery_kwh`, `electric_range_km`, `charging_port`, `dc_fast_charging` (these drive the calculator and user trust).

**Confidence usage (make it visible & honest):**
- `official` — manufacturer spec → safe to state plainly.
- `dealer` — Jordanian dealer-confirmed → safe with "حسب الوكيل".
- `owner_reported` — real-world → label as such.
- `estimate` — show the existing "قيد المراجعة" disclaimer (already implemented). **Never** let `estimate` data appear without that label.

**Charging stations:** add only `is_verified=true` rows with real coordinates. Minimum for a credible Jordan launch: a handful of confirmed public stations in Amman + 1–2 other cities. The code already refuses to render fakes — preserve that.

**Update workflow before an admin CMS:** keep one reviewed SQL seed file per data domain, idempotent via `on conflict do update` (already the pattern). Treat the seed file as the source of truth; PR-review data changes like code. Build a CMS only post-MVP.

---

## 10. AI Readiness Review

**Current:** `getAiProvider()` returns `mockProvider` for every value of `AI_PROVIDER`. Validation, persistence scaffolding, timeout, and rate-limit wiring are already in place around it. This is the right state.

**Do not connect a real provider until vehicle data is reliable (§9).** A real LLM over thin/`estimate` data will confidently hallucinate Jordan-specific specs and prices — the exact failure that destroys trust.

**Before first real AI:**
1. Verified vehicle dataset exists (§9).
2. `lib/ai/vehicle-context.ts` injects **only** DB-sourced facts as grounding context; instruct the model to answer "غير متوفر" rather than guess, and to defer to listed confidence.
3. Respect privacy: `privacy_settings.showDataInAssistant` (already persisted via `savePrivacySettingsAction`) must gate whether profile data enters the prompt.
4. Keep keys server-only (`.env.example` already warns; never `NEXT_PUBLIC_*`).
5. Show source/confidence in answers; prefer citing the vehicle page.

**Minimum safe v1:** single provider, vehicle-grounded, profile context only with consent, low token cap, the existing 30s timeout + durable rate limit, and a visible "قد تحتوي على أخطاء" disclaimer. Provider choice (OpenAI/Gemini/Kimi already stubbed in env) is secondary to grounding quality.

---

## 11. Deployment Checklist

**Environment variables**
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL` (used by `getRequestOrigin` for reset redirects — **add to `.env.example`**)
- `AI_PROVIDER=mock` (keep mock for launch); leave `OPENAI_API_KEY`/`GEMINI_API_KEY`/`KIMI_API_KEY` empty
- (after C1) `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Never set a `service_role` key in any `NEXT_PUBLIC_*`.

**Supabase migrations — run in order:** `schema.sql` → `001` → `002` → `003` → `004` → `005` → `006`.

**Supabase storage:** create bucket `avatars` (public for MVP). Confirm policies from `004` applied.

**Supabase Auth:** Site URL = production domain; Redirect URLs include `https://<domain>/auth/callback` and `https://<domain>/auth/update-password` (and localhost equivalents for dev); enable OAuth providers only if you actually launch them; configure production SMTP + branded templates; decide email confirmation.

**Build/runtime:** `npm run lint` (zero warnings — `--max-warnings=0`) → `npm run build` → `npm run start`. HTTPS only.

**Post-deploy smoke tests (exact routes):**
- `/` 200 · `/start` 200 · `/assistant` 200 (mock reply returns)
- `/vehicles` lists rows · `/vehicles/[slug]` renders + `notFound()` on bad slug
- `/charging-map` loads (map tiles render; geolocation prompt appears once)
- `/charging-calculator` computes a cost
- `/account` redirects signed-out → `/start?next=%2Faccount`; loads signed-in
- `/auth/callback` exchanges code & redirects safely
- `/auth/update-password` renders
- `POST /api/chat` 401-free for guests within limit, returns mock; rate-limit headers present
- `POST /api/account/avatar` → 401 signed-out; happy path uploads + links
- `GET /api/account/export` → 401 signed-out; returns JSON attachment signed-in
- `POST /api/account/location-preferences` → 401 signed-out; saves with consent

**Rollback plan:** Vercel keeps immutable deployments — roll back by promoting the previous deployment. DB migrations are additive/idempotent (`add column if not exists`, `on conflict do update`); a bad **data** seed is reverted by re-running a corrected seed (no destructive DDL involved). Keep the prior seed file in git.

---

## 12. Production Roadmap

### Milestone 1 — Stabilize current MVP
- **Goal:** Everything that's visible actually works in production conditions.
- **Tasks:** C1 durable rate limiter; C2 deploy runbook + `.env.example` adds `NEXT_PUBLIC_SITE_URL`; H3 complete export; H2 non-guessable avatar path; M6 verify `database.types.ts`; H4 soften pricing copy.
- **Acceptance:** All §11 smoke tests pass on a staging deploy; rate limit holds across instances; export contains profile+location+chat.
- **Do before coding:** Provision Upstash; confirm hosting target (Vercel assumed).
- **Files:** `lib/server/rate-limit.ts`, `lib/security/rate-limit.ts`, `app/api/account/export/route.ts`, `lib/account/avatar.ts`, `app/api/account/avatar/route.ts`, `README.md`, `.env.example`, `components/ui/pricing.tsx`.
- **Risk:** Medium.

### Milestone 2 — Data readiness
- **Goal:** No public claim rests on a guess; map isn't blank.
- **Tasks:** H1 verified vehicle set (§9); C4 verified charging stations *or* hide map nav; keep confidence labels honest.
- **Acceptance:** Every publicly shown spec is `official`/`dealer` or carries the `estimate` disclaimer; `/charging-map` shows ≥1 real station or is removed from primary nav; calculator lists EVs/PHEVs correctly.
- **Manual Supabase steps:** Run corrected `005` seed + new `charging_locations` seed.
- **Risk:** Medium (effort is human verification, not code).

### Milestone 3 — Launch UI polish
- **Goal:** Credible first impression on mobile, Arabic-first.
- **Tasks:** M3 SEO/meta + robots/sitemap; verify 404/error pages; mobile pass on map + account + calculator; confirm no developer copy anywhere public.
- **Acceptance:** Lighthouse mobile ≥ good on `/` and `/charging-map`; no broken links; all nav targets real.
- **Risk:** Low.

### Milestone 4 — Production security
- **Goal:** Defensible for a public audience.
- **Tasks:** C3 SMTP + confirmation; H5 CSP (report-only→enforce); H6 monitoring + minimal audit log; verify RLS with two real users.
- **Acceptance:** Signup+reset emails arrive & are branded; CSP enforced with no console violations on core routes; errors visible in dashboard; cross-user data access denied in manual test.
- **Risk:** Medium.

### Milestone 5 — Deployment
- **Goal:** Repeatable production deploy.
- **Tasks:** Execute §11 checklist on the real domain; smoke tests; document rollback.
- **Acceptance:** Public URL serves all routes over HTTPS; smoke tests green; rollback rehearsed once.
- **Risk:** Low–Medium.

### Milestone 6 — Real AI integration (post-launch)
- **Goal:** Grounded assistant without hallucinated Jordan specs.
- **Tasks:** Implement one provider behind `getAiProvider()`; wire `vehicle-context.ts` grounding; enforce `showDataInAssistant` consent; token caps + disclaimers; finish or formally defer chat history read-back (M1 chat).
- **Acceptance:** Assistant answers only from grounded data, says "غير متوفر" when unknown, respects privacy toggle, stays within rate/timeout limits.
- **Risk:** Medium. **Gate:** Milestone 2 must be complete first.

---

## 13. Recommended Next Action

**Start Milestone 1 with C1 (durable rate limiter) and C2 (deploy runbook), in parallel.** They are the two issues that make a deploy *look* fine while being broken — C1 silently disables abuse protection on serverless, and C2 causes account features to fail at runtime for anyone following the README. Both are small/medium and unblock a trustworthy staging deploy that the rest of the roadmap builds on. Do **not** touch AI (Milestone 6) until data (Milestone 2) lands.

---

## 14. Focused Prompts for Future Coding Agents

> One task each. Hand them out individually, not as a batch.

**Prompt 1 — Durable rate limiting (C1)**
> Replace the in-memory rate limiter with Upstash Redis while preserving the existing `checkRateLimit({key, action, limit, windowMs})` API and return shape used in `app/api/chat/route.ts`, `app/api/account/avatar/route.ts`, `app/api/account/export/route.ts`, and `lib/auth/actions.ts`. Use a sliding/fixed window in Redis keyed by `action:key`. Read `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` from server env. If env is missing, fail closed for auth actions and fall back gracefully elsewhere. Do not change call sites' logic. Add the env vars to `.env.example`.

**Prompt 2 — Authoritative deploy runbook + env (C2)**
> Update `README.md` and `.env.example` to document the complete production setup: run `schema.sql` then migrations `001`→`006` in order; create a public Supabase Storage bucket named `avatars`; set Auth Site URL and Redirect URLs (`/auth/callback`, `/auth/update-password`); add `NEXT_PUBLIC_SITE_URL`. Add a "Required migrations" table mapping each migration to the feature it powers. Do not change any application code.

**Prompt 3 — Complete the account export (H3)**
> In `app/api/account/export/route.ts`, extend the whitelisted export payload to include the user's `location_preferences` (from `profiles`) and their `chat_conversations` + `chat_messages` (owner-scoped via RLS). Keep the existing `no-store` headers and attachment filename. Do not expose other users' data; rely on RLS and `auth.uid()`. Add nothing to other files.

**Prompt 4 — Non-guessable avatar paths (H2)**
> Change avatar storage in `app/api/account/avatar/route.ts` and `lib/account/avatar.ts` so the object path includes a random segment (e.g. `{uid}/{nanoid}.webp`) instead of the fixed `{uid}/avatar.webp`. Persist the full path in `profiles.avatar_path` and resolve display URLs from it. Preserve the existing storage RLS (folder `[1] = auth.uid()`), magic-byte validation, and old-file cleanup on replacement. Do not change the bucket's public/private setting in this task.

**Prompt 5 — Verified vehicle + charging seed (Milestone 2, data only)**
> Create a new idempotent seed migration (`007_*`) that inserts a small set of **verified** Jordan-market vehicles and verified charging stations. Use `on conflict (slug) do update` for vehicles and explicit `is_verified=true` + real coordinates for `charging_locations`. Set `data_confidence` truthfully per row (`official`/`dealer` only for verified specs; `estimate` rows must keep the existing disclaimer UI). Provide each row's source in `source`/`notes_ar`. Do not modify `005`; do not invent specs — leave unknown fields null.

---

*End of plan. No application code was modified during this audit.*
