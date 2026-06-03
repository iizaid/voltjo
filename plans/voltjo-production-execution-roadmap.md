# VoltJo Production Execution Roadmap

> Companion to `plans/voltjo-production-readiness-plan.md`. This document turns the audit into ordered, safe, independently-reviewable execution phases. No code was written or changed to produce it.

## Executive Summary

The audit confirmed VoltJo's foundations are solid; the work left is **finishing, hardening, and documenting** — not rebuilding. This roadmap splits that work into **10 small phases**, each one focused, testable, and commit-friendly. The ordering is deliberate:

1. **Cheapest-first, safest-first.** Phases 1–4 are docs + small backend changes an AI agent can do safely with zero product redesign.
2. **Data before AI.** Verified vehicle/station data (Phase 5) is a hard gate before any real AI work (Phase 10). A real LLM over `estimate` data hallucinates Jordan specs — the one failure that kills trust.
3. **Stabilize → polish → secure → deploy → AI.** Nothing user-facing or commercial is promised before it's real.

I kept the order you proposed — it is sound. The only refinements: Phase 4 (rate limiter) is the true launch-blocking security item, so it stays in the pre-deploy group; and Phase 10 is **planning only**, gated on Phase 5.

**Global guardrails for every phase** (VoltJo project decisions — never violate):
Arabic-first RTL · no real AI before verified data · no payments/saved-cars/comparison/admin-CMS/MegaMenu now · no developer terms in public UI · no `service_role` in runtime · no secrets in `NEXT_PUBLIC_*` · `AI_PROVIDER=mock` for launch · public avatar bucket stays (only guessability changes) · migrations additive/idempotent only · RLS assumptions intact.

---

## Phase 1 — Authoritative Production Runbook (docs only)

### Goal
Produce one ordered, correct deploy runbook so a fresh deploy doesn't silently break account features.

### Why now
It's zero-risk (no app code), and every later phase's testing depends on being able to stand up a correct environment. Today's README lists only `schema.sql` + `005`, which leaves avatar/account/location/chat broken at runtime.

### Scope
- Document migration order: `schema.sql` → `001` → `002` → `003` → `004` → `005` → `006`.
- Document manual `avatars` bucket creation (public for MVP) and that `004` policies apply to it.
- Document Auth Site URL + Redirect URLs (`/auth/callback`, `/auth/update-password`).
- Add `NEXT_PUBLIC_SITE_URL` to `.env.example` with explanation.
- Add a "migration → feature it powers" table.

### Out of scope
- Any application code.
- Any SQL changes.
- SMTP configuration (Phase 6).
- Actually running migrations against a real project.

### Likely files
- `README.md`
- `.env.example`
- `docs/` (optionally a new `docs/deployment-runbook.md`)

### Manual steps
None executed in this phase — only documented. (The runbook *describes* bucket creation, migrations, and Auth config for later phases.)

### Environment variables
Document (don't set): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`, `AI_PROVIDER=mock`, empty `OPENAI_API_KEY`/`GEMINI_API_KEY`/`KIMI_API_KEY`. Note future `UPSTASH_*` (Phase 4).

### Acceptance criteria
- README lists `schema.sql` then `001`–`006` in exact order.
- README documents creating the public `avatars` bucket.
- README documents Auth redirect URLs including `/auth/update-password`.
- `.env.example` includes `NEXT_PUBLIC_SITE_URL` with a comment.
- A migration→feature table exists.
- No application/source file changed.

### Test checklist
- `git diff --stat` shows only docs/`.env.example` changed.
- `npm run lint` and `npm run build` still pass (unchanged).
- A reader can follow README top-to-bottom and end with a working schema + bucket + auth config.

### Risks
Very low. Only risk is documentation drifting from reality — mitigate by cross-checking each migration file's actual contents.

### Commit strategy
Single commit: `docs: authoritative production deploy runbook + NEXT_PUBLIC_SITE_URL`.

### AI coding prompt
> **Task:** Update `README.md` and `.env.example` so a fresh production deploy is fully documented. Inspect `supabase/schema.sql`, every file in `supabase/migrations/`, `lib/auth/actions.ts` (for `NEXT_PUBLIC_SITE_URL` usage in `getRequestOrigin`), and `app/api/account/avatar/route.ts` (for the `avatars` bucket dependency).
> **Do:** (1) Document running `schema.sql` then migrations `001`→`006` in order. (2) Document creating a **public** Supabase Storage bucket named `avatars` and that migration `004` policies apply to it. (3) Document Auth Site URL + Redirect URLs including `/auth/callback` and `/auth/update-password`. (4) Add `NEXT_PUBLIC_SITE_URL` to `.env.example` with a comment. (5) Add a table mapping each migration to the feature it powers.
> **Do NOT:** change any `.ts`/`.tsx` files, change SQL, configure SMTP, or run anything against a live project.
> **Checks:** `git diff --stat` shows only docs + `.env.example`; `npm run lint` and `npm run build` pass.
> **Report:** list every file changed and paste the final migration→feature table.

---

## Phase 2 — Account Export Completeness (small backend)

### Goal
Make "export my data" actually complete: include location preferences and chat history.

### Why now
Small, isolated, RLS-protected backend change with clear pass/fail; good warm-up after docs and improves a data-rights claim before launch.

### Scope
- Extend the whitelisted JSON payload in the export route to include `profiles.location_preferences` and the user's `chat_conversations` + `chat_messages`.
- Keep existing `no-store` headers, attachment filename, rate-limit call, and 401 behavior.

### Out of scope
- Avatar changes (Phase 3).
- Rate limiter store change (Phase 4).
- Any schema change (data is already there from `001` and `006`).

### Likely files
- `app/api/account/export/route.ts` (only).

### Manual steps
None. (Requires migrations `001` + `006` already applied in the test environment — per Phase 1 runbook.)

### Environment variables
None new.

### Acceptance criteria
- Signed-out `GET /api/account/export` → 401.
- Authenticated export JSON includes `location_preferences`.
- Authenticated export JSON includes the user's conversations and messages, owner-scoped.
- No other user's data is returned (RLS + `auth.uid()` only).
- Headers `Cache-Control: no-store` and the `voltjo-account-data.json` attachment name preserved.

### Test checklist
- Signed-out request → 401.
- Signed-in user with saved location + a chat → all three present in JSON.
- Signed-in user with no chat → empty arrays, not an error.
- Confirm response is still a downloadable attachment.

### Risks
Low. Main risk is accidentally widening the query beyond the current user — mitigate by relying on RLS and explicit `.eq("user_id", user.id)` / conversation ownership.

### Commit strategy
Single commit: `feat(account): include location + chat history in data export`.

### AI coding prompt
> **Task:** In `app/api/account/export/route.ts` only, extend the exported JSON to include the authenticated user's `location_preferences` (from `profiles`) and their `chat_conversations` + `chat_messages`.
> **Inspect first:** `app/api/account/export/route.ts`, `supabase/migrations/001_chat_persistence.sql` and `006_user_location_preferences.sql` (column names + RLS), `lib/supabase/server.ts`.
> **Constraints:** rely on RLS and `auth.uid()` — never accept a user id from the client; keep the existing `no-store` headers, rate-limit call, 401 path, and attachment filename; whitelist columns (no `select('*')` dumps of unrelated tables).
> **Do NOT:** touch any other file, add migrations, or change the avatar/rate-limit code.
> **Checks:** signed-out → 401; signed-in → JSON contains `location_preferences` + conversations + messages; `npm run lint` + `npm run build` pass.
> **Report:** show the final selected columns/tables and a sample (redacted) JSON shape.

---

## Phase 3 — Avatar Non-Guessable Path (small privacy)

### Goal
Stop avatar URLs from being enumerable while keeping the public bucket for MVP.

### Why now
Isolated, small, no dashboard work, and closes a real (if low-severity) privacy leak before public traffic.

### Scope
- Change stored object path from fixed `{uid}/avatar.webp` to `{uid}/{random}.webp`.
- Persist the full path in `profiles.avatar_path`; resolve display URLs from the stored path.
- Preserve magic-byte validation, size/MIME guards, rate limit, and old-file cleanup on replace.

### Out of scope
- Switching to a private bucket / signed URLs (later hardening).
- Storage RLS policy change (the `[1] = auth.uid()` folder rule still works — keep it).
- Any migration (the `avatar_path` column already exists from `003`).

### Likely files
- `app/api/account/avatar/route.ts`
- `lib/account/avatar.ts`

### Manual steps
None. (Bucket already public; folder-prefix RLS unchanged.)

### Environment variables
None new. (May use existing crypto/`nanoid`-style randomness — prefer built-in `crypto.randomUUID()` to avoid new deps; confirm before adding any dependency.)

### Acceptance criteria
- New uploads land at `{uid}/{random}.webp`.
- `profiles.avatar_path` stores the full randomized path; display URL resolves from it.
- Replacing an avatar deletes the previous object (no orphans).
- Storage RLS still enforces the user's own folder (`[1] = auth.uid()`).
- Magic-byte + MIME + size validation unchanged.

### Test checklist
- Upload → new file has a random segment; old fixed file (if any) handled.
- Upload twice → only the latest object remains for that user.
- Avatar renders on `/account`, navbar, `/assistant`.
- Signed-out `POST` → 401; oversized/invalid type → correct Arabic error.

### Risks
Low–medium. Orphaned files if cleanup ordering is wrong — keep the existing "upload → update profile → delete old" sequence and its failure rollback.

### Commit strategy
Single commit: `fix(account): randomize avatar object path to prevent URL enumeration`.

### AI coding prompt
> **Task:** Make avatar storage paths non-guessable. In `app/api/account/avatar/route.ts` and `lib/account/avatar.ts`, change the object path from `{uid}/avatar.webp` to `{uid}/{random}.webp` (use `crypto.randomUUID()`; do not add a dependency without asking). Persist the full path in `profiles.avatar_path` and resolve display URLs from the stored path.
> **Inspect first:** both files above and `supabase/migrations/003_profile_avatar_path.sql` + `004_avatar_storage_policies.sql`.
> **Preserve:** magic-byte signature validation, MIME allow-list, size guard, per-user rate limit, and the upload→update→delete-old cleanup with rollback. Keep the bucket public and the folder-prefix RLS (`(storage.foldername(name))[1] = auth.uid()::text`) unchanged.
> **Do NOT:** switch to a private bucket, add signed URLs, change RLS, or add migrations.
> **Checks:** upload works and renders in `/account`, navbar, `/assistant`; replacing leaves no orphan; signed-out POST → 401; `npm run lint` + `npm run build` pass.
> **Report:** show the new path-construction code and confirm cleanup ordering.

---

## Phase 4 — Durable Rate Limiter (Upstash Redis)

### Goal
Replace the in-memory limiter with a shared store so abuse protection actually works on serverless.

### Why now
This is the top launch-blocking security item. It must land before any public/staging deploy that accepts real traffic. It's after the small backend phases because it needs a manual external setup step.

### Scope
- Swap the storage backend behind the existing `checkRateLimit({key, action, limit, windowMs})` API to Upstash Redis (or Vercel KV).
- Keep the same function signature and return shape so call sites are untouched.
- Fail closed for auth actions if the store is unreachable; degrade gracefully elsewhere.
- Add `UPSTASH_*` env vars to `.env.example`.

### Out of scope
- Changing limits/windows at call sites.
- CAPTCHA/bot protection (post-MVP).
- The separate auth limiter logic semantics (only the store changes).

### Likely files
- `lib/server/rate-limit.ts`
- `lib/security/rate-limit.ts`
- `.env.example`
- (call sites only if the API must become async — see risk) `app/api/chat/route.ts`, `app/api/account/avatar/route.ts`, `app/api/account/export/route.ts`, `lib/auth/actions.ts`

### Manual steps
- Create an Upstash Redis database (free tier).
- Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to the environment (local `.env.local` + hosting provider).

### Environment variables
`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN` (server-only — never `NEXT_PUBLIC_*`).

### Acceptance criteria
- Rate limit state persists across server restarts / separate instances (i.e., not a per-process `Map`).
- Exceeding a limit returns 429 with `Retry-After` and `X-RateLimit-*` headers as today.
- If Upstash env is missing, auth-related limits fail closed (deny) rather than silently allowing unlimited attempts.
- Call-site behavior (limits, messages, Arabic text) unchanged.

### Test checklist
- Hammer `POST /api/chat` past the guest limit → 429 with headers.
- Restart the dev server → previously-consumed bucket still counts (proves shared store).
- Remove env vars → auth actions deny; document the behavior.
- `POST /api/account/avatar` and `GET /api/account/export` still rate-limit per user.

### Risks
Medium. The Upstash REST client is async; the current `checkRateLimit` is sync. If it must become `async`, all four call sites need `await` — keep that change mechanical and reviewed. Cold-start latency added to limited routes — acceptable.

### Commit strategy
Two commits if signature changes: `feat(security): back rate limiter with Upstash Redis` then `refactor: await checkRateLimit at call sites`. Otherwise one commit.

### AI coding prompt
> **Task:** Replace the in-memory rate limiter store with Upstash Redis while preserving the public `checkRateLimit({key, action, limit, windowMs})` contract used by `app/api/chat/route.ts`, `app/api/account/avatar/route.ts`, `app/api/account/export/route.ts`, and `lib/auth/actions.ts`.
> **Inspect first:** `lib/server/rate-limit.ts`, `lib/security/rate-limit.ts`, and all four call sites.
> **Do:** implement a fixed/sliding window keyed by `action:key` in Redis; read `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` from server env; **fail closed** for auth actions if env is missing; add the env vars to `.env.example`. If the API must become async, update the four call sites to `await` and nothing else.
> **Do NOT:** change limit values, windows, Arabic messages, response headers, or any unrelated logic; do not put tokens in `NEXT_PUBLIC_*`.
> **Checks:** 429 still returns `Retry-After` + `X-RateLimit-*`; bucket survives a dev-server restart; `npm run lint` + `npm run build` pass.
> **Report:** state whether the signature became async, list call-site edits, and describe the fail-closed behavior.

---

## Phase 5 — Verified Data Readiness (vehicles + charging stations)

### Goal
Replace sample/`estimate` content with a small, **verified** dataset so public claims and the map are credible.

### Why now
This is the hard gate before AI (Phase 10) and before claiming the map/vehicles are launch features. It's also the phase with the most human (non-AI) work.

### Scope
- New idempotent seed migration (`007_*`) adding ~5–8 real Jordan-market vehicles with verified core fields and truthful `data_confidence`.
- Verified `charging_locations` rows (`is_verified=true`, real coordinates) — a handful in Amman + 1–2 cities.
- Keep `estimate` rows' "قيد المراجعة" disclaimer intact in the UI.

### Out of scope
- Modifying `005` (additive only — new file).
- Inventing specs (unknown fields stay `null`).
- Any admin CMS.
- Calculator UI redesign (a small EV/PHEV-only framing note is acceptable but optional here).

### Likely files
- `supabase/migrations/007_*.sql` (new)
- `data/navigation.ts` (only if choosing to temporarily hide the map — decision point)
- `app/vehicles/*`, `app/charging-map/*` (read-only verification; avoid changes unless hiding nav)

### Manual steps
- **Human:** gather/verify vehicle specs and station coordinates from official/dealer sources (AI must not fabricate these).
- Run `007_*` in Supabase per the Phase 1 runbook.

### Environment variables
None new.

### Acceptance criteria
- Every publicly shown spec is `official`/`dealer`, **or** carries the `estimate` disclaimer.
- `/charging-map` shows ≥1 verified station, **or** the map is removed from primary nav until data exists.
- `/vehicles` and `/vehicles/[slug]` render verified rows; unknown fields are hidden (already `null`-guarded).
- Calculator lists EV/PHEV vehicles with real `battery_kwh`.
- `007` is additive and idempotent (`on conflict do update`); `005` untouched.

### Test checklist
- `/vehicles` lists verified vehicles; bad slug → `notFound()`.
- `/charging-map` shows real markers (or nav hidden).
- `/charging-calculator` dropdown shows EV/PHEV with battery sizes.
- Re-running `007` produces no duplicates/errors.

### Risks
Medium — but the effort is verification, not code. Risk is publishing a wrong "verified" claim; mitigate by requiring a source per row in `source`/`notes_ar`.

### Commit strategy
`feat(data): add verified Jordan vehicle + charging seed (007)` — paired with a short data-source note in the PR description. Decision to hide map nav, if taken, is a separate commit.

### AI coding prompt
> **Task:** Create a new idempotent seed migration `supabase/migrations/007_verified_launch_data.sql` that inserts a small set of verified Jordan-market vehicles and verified charging stations. **Do not invent data** — I will supply the verified specs/coordinates; structure the migration to accept them.
> **Inspect first:** `supabase/migrations/005_supported_vehicles_mvp.sql` (schema + insert pattern), `lib/vehicles/queries.ts`, `app/vehicles/*`, `app/charging-map/*`.
> **Constraints:** additive + idempotent (`on conflict (slug) do update` for vehicles; explicit `is_verified=true` + real lat/long for `charging_locations`); set `data_confidence` truthfully (`official`/`dealer` only for verified specs, else `estimate` with the existing disclaimer UI preserved); leave unknown fields `null`; record a source in `source`/`notes_ar`.
> **Do NOT:** modify `005`, write destructive SQL, fabricate specs/prices, or build an admin CMS.
> **Checks:** re-running `007` is safe; `/vehicles`, `/vehicles/[slug]`, `/charging-map`, `/charging-calculator` render correctly against it.
> **Report:** list rows added with their `data_confidence` and source, and flag any field left null.

---

## Phase 6 — Pricing Copy & Launch Scope Cleanup

### Goal
Ensure no unfinished commercial promise is implied before billing exists.

### Why now
Cheap copy-level change; best done once data is credible (Phase 5) so the whole public surface is honest together, before UI/SEO polish.

### Scope
- Soften pricing presentation: clearly label plans as "مبدئية / قريبًا" or use ranges; keep the existing "الأسعار مؤقتة" disclaimer.
- Verify no nav/footer link points to unfinished routes (compare/saved/reports/admin).
- Confirm no developer terms surface anywhere public.

### Out of scope
- Stripe/payments/billing.
- Removing the pricing section entirely (unless you decide to).
- MegaMenu reintroduction (forbidden).

### Likely files
- `components/ui/pricing.tsx`
- `components/sections/PricingSection.tsx`
- `data/navigation.ts`
- `components/layout/Footer.tsx` / `SiteFooter.tsx` (link audit only)

### Manual steps
None.

### Environment variables
None.

### Acceptance criteria
- Pricing buttons make no commitment they can't keep (no fake checkout; "coming soon" framing explicit at section level).
- Every nav and footer link resolves to a real, finished page.
- No occurrence of provider/dev terms (Supabase, OpenAI, Stripe, "database", "migration", "backend") in public-facing copy.

### Test checklist
- Click every navbar + footer link → all land on real pages.
- Pricing CTAs show the "coming soon"/preliminary notice; no checkout implied.
- Grep public components for forbidden developer terms → none.

### Risks
Low.

### Commit strategy
Single commit: `chore(launch): clarify preliminary pricing + audit public links`.

### AI coding prompt
> **Task:** Make the public commercial surface honest for launch. In `components/ui/pricing.tsx` and `components/sections/PricingSection.tsx`, frame plans explicitly as preliminary/"قريبًا" (keep the existing temporary-pricing disclaimer; do not add a real checkout). Audit `data/navigation.ts` and the footer components so every link targets a finished page.
> **Inspect first:** the files above plus `app/` route folders to confirm which pages exist.
> **Do NOT:** add payments/Stripe, reintroduce a MegaMenu, add compare/saved/reports/admin links, or expose developer terms (Supabase/OpenAI/Stripe/database/migration/backend) in public copy.
> **Checks:** all nav/footer links resolve; pricing implies no commitment; `npm run lint` + `npm run build` pass.
> **Report:** list copy changes and the link-audit result (link → destination → exists?).

---

## Phase 7 — Launch UI / SEO Polish

### Goal
Credible first impression: per-page metadata, crawlability, and error states — Arabic-first, mobile-first.

### Why now
Once content is honest (5–6), polish the presentation layer before deploying.

### Scope
- Per-page `metadata` (title/description/OpenGraph) for key routes.
- `robots.txt` and `sitemap.xml`.
- Verify/define `not-found` and error states.
- Mobile pass on `/charging-map`, `/account`, `/charging-calculator`.

### Out of scope
- Visual redesign / design-system changes.
- New features.

### Likely files
- `app/layout.tsx` (already has root metadata)
- per-route `page.tsx` files (export `metadata`)
- `app/robots.ts` / `app/sitemap.ts` (new, Next conventions)
- `app/not-found.tsx` (verify/add)

### Manual steps
None (real domain needed for absolute OG URLs — can use `NEXT_PUBLIC_SITE_URL`).

### Environment variables
Uses existing `NEXT_PUBLIC_SITE_URL`.

### Acceptance criteria
- Key public routes export distinct `metadata` (Arabic).
- `robots.txt` and `sitemap.xml` resolve and list public routes only.
- A custom 404 renders for unknown routes.
- Mobile layout has no overflow/RTL breakage on map/account/calculator.

### Test checklist
- View source on `/`, `/vehicles`, `/charging-map` → correct Arabic title/description/OG.
- `/robots.txt` and `/sitemap.xml` return valid content.
- Visit a random bad URL → branded 404.
- Mobile viewport pass on the three heavy pages.

### Risks
Low. Watch that `sitemap` excludes protected/auth routes.

### Commit strategy
Single commit: `feat(seo): per-page metadata, robots, sitemap, 404 polish`.

### AI coding prompt
> **Task:** Add per-page metadata and crawlability. Inspect `app/layout.tsx` (existing metadata pattern) and each public `page.tsx`. Add Arabic `metadata` exports to key public routes, create `app/robots.ts` and `app/sitemap.ts` (public routes only, using `NEXT_PUBLIC_SITE_URL`), and verify/add `app/not-found.tsx`. Do a mobile/RTL check on `/charging-map`, `/account`, `/charging-calculator`.
> **Do NOT:** change the design system, add features, or include protected/auth routes in the sitemap.
> **Checks:** distinct titles in page source; `/robots.txt` + `/sitemap.xml` valid; branded 404; `npm run lint` + `npm run build` pass.
> **Report:** list routes given metadata and what the sitemap includes/excludes.

---

## Phase 8 — Monitoring, CI, and Minimal Tests

### Goal
Get production error visibility and a basic safety net without test-framework overkill.

### Why now
Right before deployment, so the staging deploy (Phase 9) is observable and regressions are caught by CI.

### Scope
- Lightweight error reporting (Sentry free tier or Vercel built-in) on server routes + client.
- GitHub Actions running `npm run lint` + `npm run build` on PRs.
- A few unit tests: `validateAiChatRequest`, the calculator formula, and `getSafeRedirectPath` redirect-safety.

### Out of scope
- E2E framework, large test suites, coverage gates.
- Audit-log infrastructure (note as post-MVP).

### Likely files
- `app/` error boundaries / instrumentation file (per chosen tool)
- `.github/workflows/ci.yml` (new)
- a minimal test setup + `lib/ai/validation.test.ts`, calculator + redirect tests
- `package.json` (test script/dev deps — confirm before adding)

### Manual steps
- Create monitoring account; add DSN/env to hosting + `.env.example` (documented, not committed).

### Environment variables
Monitoring DSN (e.g. `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` per tool guidance — keep server secret server-side).

### Acceptance criteria
- A thrown server error appears in the monitoring dashboard.
- CI runs lint + build on PRs and fails on a real lint/build error.
- The three unit tests pass and actually assert behavior.

### Test checklist
- Trigger a deliberate 500 in a non-prod build → event captured.
- Open a PR with a lint error → CI red.
- `npm test` (or chosen runner) → 3 tests green.

### Risks
Low–medium. Adding a test runner touches `package.json`/config — keep minimal; confirm dependency additions.

### Commit strategy
Up to three commits: `chore(ci): lint+build on PRs`, `feat(obs): error monitoring`, `test: validation/calculator/redirect units`.

### AI coding prompt
> **Task:** Add minimal production observability and a small safety net. (1) Add a GitHub Actions workflow running `npm run lint` and `npm run build` on PRs. (2) Wire a lightweight error reporter (propose Sentry free tier or Vercel's built-in; ask before adding heavy deps) for server + client; document its env var in `.env.example`. (3) Add unit tests for `validateAiChatRequest` (`lib/ai/validation.ts`), the charging calculator formula (`components/vehicles/ChargingCalculatorClient.tsx` logic), and `getSafeRedirectPath` (`app/auth/callback/route.ts`).
> **Do NOT:** add E2E frameworks, coverage gates, or broad refactors; do not put server secrets in `NEXT_PUBLIC_*` unless the tool requires a public DSN.
> **Checks:** deliberate error appears in monitoring; CI fails on a lint error; the 3 tests pass.
> **Report:** list new files, any added dependencies (with justification), and the env vars introduced.

---

## Phase 9 — Staging Deployment & Smoke Tests

### Goal
Stand up a real staging deploy and prove every route works end-to-end.

### Why now
Everything blocking is done (1–8). This validates the whole system on production-like infra before going public.

### Scope
- Deploy to staging (Vercel assumed) with all env vars.
- Run all migrations + create bucket + configure Auth per Phase 1 runbook.
- Execute the full smoke-test checklist over HTTPS.
- Document the rollback procedure.

### Out of scope
- Real AI (still mock).
- Custom production domain DNS (can be Phase 9b).

### Likely files
- None (configuration/ops). Possibly `vercel.json` if needed.

### Manual steps
- Configure hosting project + env vars (incl. `UPSTASH_*`, `NEXT_PUBLIC_SITE_URL`, monitoring DSN).
- Apply migrations `schema.sql`→`006`→`007`; create public `avatars` bucket.
- Set Auth Site URL + redirect URLs.

### Environment variables
All from Phases 1/4/8 set in the hosting dashboard; `AI_PROVIDER=mock`.

### Acceptance criteria (smoke tests — exact routes)
- `/` 200 · `/start` 200 · `/assistant` 200 (mock reply returns).
- `/vehicles` lists rows · `/vehicles/[slug]` renders · bad slug → 404.
- `/charging-map` loads (markers or hidden-nav decision honored).
- `/charging-calculator` computes a cost.
- `/account` signed-out → redirect `/start?next=%2Faccount`; signed-in loads.
- `/auth/callback` exchanges code & redirects safely; `/auth/update-password` renders.
- `POST /api/chat` within limit → mock + rate-limit headers; over limit → 429.
- `POST /api/account/avatar` signed-out → 401; happy path uploads + links.
- `GET /api/account/export` signed-out → 401; signed-in → JSON incl. location + chat.
- `POST /api/account/location-preferences` signed-out → 401; saves with consent.

### Test checklist
The acceptance list above, executed over HTTPS, plus: monitoring receives events; rate limit survives across requests/instances.

### Risks
Medium. Most failures here are config (missing env, unrun migration, bucket missing) — the Phase 1 runbook exists precisely to prevent these.

### Commit strategy
Ops/config, not code. Tag the release (e.g. `v0.1.0-staging`) and record the deployment ID for rollback.

### AI coding prompt
> **Task (assist-only):** Help validate a staging deployment. Generate a copy-paste smoke-test script/checklist hitting every route in the acceptance list and asserting the expected status/behavior. If a `vercel.json` is needed, propose a minimal one.
> **Do NOT:** change application code, flip `AI_PROVIDER` off mock, or run destructive commands. Deployment/migrations/bucket/Auth config are performed manually by a human.
> **Checks:** the script reports pass/fail per route; rollback steps are documented (promote previous Vercel deployment; data seed reverts by re-running corrected seed).
> **Report:** the route-by-route smoke result and any config gaps found.

---

## Phase 10 — Real AI Integration (Planning Only — Gated)

### Goal
Produce the implementation plan and safety design for the first real AI provider — **without coding it**.

### Why now / gate
**Hard gate: Phase 5 verified data must be live first.** A real LLM over `estimate` data hallucinates Jordan specs/prices — the exact trust failure to avoid. Until data is verified, this stays planning only and `AI_PROVIDER=mock`.

### Scope (planning artifacts only)
- Provider selection criteria (OpenAI/Gemini/Kimi already stubbed in env).
- Grounding design: `lib/ai/vehicle-context.ts` injects only DB-sourced facts; model must answer "غير متوفر" instead of guessing and defer to `data_confidence`.
- Privacy design: `privacy_settings.showDataInAssistant` gates whether profile context enters the prompt.
- Safety: server-only keys, token caps, existing 30s timeout + durable rate limit, visible "قد تحتوي على أخطاء" disclaimer.
- Decision on chat history read-back (finish vs. formally defer as session-local for launch).

### Out of scope
- Any provider code, keys, or flipping `AI_PROVIDER` off `mock`.
- New chat features beyond grounding/persistence decision.

### Likely files (for the plan to reference, not edit now)
- `lib/ai/provider.ts`, `lib/ai/providers/mock.ts`, `lib/ai/vehicle-context.ts`, `lib/ai/validation.ts`
- `app/api/chat/route.ts`, `components/chat/ChatShell.tsx`, `lib/chat/*`

### Manual steps
None until implementation is approved (then: provider account + server-only key).

### Environment variables
Documented for later only: one of `OPENAI_API_KEY`/`GEMINI_API_KEY`/`KIMI_API_KEY` (server-only). `AI_PROVIDER` stays `mock` now.

### Acceptance criteria (of the plan)
- Plan names the chosen provider + rationale.
- Plan specifies exactly how `vehicle-context.ts` grounds answers and how confidence is surfaced.
- Plan specifies the `showDataInAssistant` consent gate.
- Plan defines the minimum-safe v1 (token cap, timeout, rate limit, disclaimer).
- Plan states the chat-history decision.
- Plan explicitly confirms the Phase 5 data gate is satisfied before any coding starts.

### Test checklist
N/A (planning). Future implementation will reuse the Phase 9 smoke tests plus AI-specific grounding checks.

### Risks
Low now (planning). High later if the data gate is skipped — the plan must restate the gate.

### Commit strategy
Single docs commit: `docs(ai): real-provider integration & grounding plan (no code)`.

### AI coding prompt
> **Task (planning only — write no application code):** Produce `docs/ai-integration-plan.md` for VoltJo's first real AI provider. Inspect `lib/ai/provider.ts`, `lib/ai/providers/mock.ts`, `lib/ai/vehicle-context.ts`, `lib/ai/validation.ts`, `app/api/chat/route.ts`, and `lib/chat/*`.
> **Cover:** provider choice + rationale; how to ground answers strictly in DB vehicle data and force "غير متوفر" over guessing; how `privacy_settings.showDataInAssistant` gates profile context; minimum-safe v1 (server-only key, token cap, 30s timeout, durable rate limit, "قد تحتوي على أخطاء" disclaimer); the chat-history read-back decision.
> **Hard constraint:** state clearly that implementation must NOT begin until Phase 5 verified vehicle data is live, and that `AI_PROVIDER` stays `mock` until then. Do not add keys, change provider wiring, or flip the provider.
> **Report:** the plan file path and a one-paragraph summary of the minimum-safe v1.

---

## Recommended First Phase to Execute

**Phase 1 (Runbook).** It's zero-risk, unblocks correct environments for testing every later phase, and fixes the silent "deploy looks fine but account features break" trap. Pair it immediately with **Phase 4 planning** (create the Upstash account early) since that's the only true launch-blocking security item and needs an external setup step.

## What Not to Do Yet

- No real AI provider / no flipping `AI_PROVIDER` off `mock` (gated on Phase 5).
- No payments, saved cars, comparison tools, reports, or admin CMS.
- No MegaMenu reintroduction.
- No private avatar bucket / signed URLs yet (Phase 3 only changes guessability).
- No destructive or non-idempotent SQL; never modify `005` — add `007`.
- No `service_role` in runtime; no secrets in `NEXT_PUBLIC_*`.
- No CSP enforcement before the production domain is fixed (report-only first, post-deploy).

## Suggested Review Process After Each Phase

1. **Diff scope check** — `git diff --stat` matches the phase's "Likely files"; nothing in "Out of scope" was touched.
2. **Build gates** — `npm run lint` (zero warnings) and `npm run build` pass.
3. **Acceptance criteria** — tick every box; a failed box blocks merge.
4. **Route smoke** — run the phase's test checklist locally (or on staging from Phase 9).
5. **Guardrail scan** — confirm no forbidden item (developer terms in UI, `service_role`, `NEXT_PUBLIC_*` secrets, fake data, destructive SQL) slipped in.
6. **One concern per PR** — independently reviewable, with the AI agent's final report attached to the PR description.
7. **Data phases (5) extra gate** — every "verified" row cites a source in the PR before merge.

---

*Execution roadmap only. No application code was written or modified to produce this document.*
