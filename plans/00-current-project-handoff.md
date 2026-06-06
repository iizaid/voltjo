# VoltJo Current Project Handoff

Read this first in new Codex or ChatGPT sessions.

## Project Identity

- Product: VoltJo
- Repository: https://github.com/iizaid/voltjo.git
- Domain: Arabic-first Jordan-focused EV / PHEV / hybrid vehicle intelligence platform
- Stack: Next.js 16, React 19, Supabase, Upstash Redis, OpenNext Cloudflare Workers
- Current documented staging URL: `https://voltjo.mousatam96.workers.dev` in `tests/load/public-pages.js`

## Current Exact Status

- Close to serious staging verification, not public-production-ready.
- Cloudflare/OpenNext deployment support exists.
- API hardening exists for chat, avatar upload, account export, and location preferences.
- Legal/privacy pages exist: `/privacy`, `/terms`, `/data-deletion`.
- CSP is report-only for staging observation.
- Rate limiting is backed by Upstash Redis and fails closed if the shared store is missing or unreachable.
- `AI_PROVIDER` must remain `mock`; real AI is not launched.
- Payment/subscriptions are inactive.
- Verified vehicle data and verified charging station data remain the public-production gate.

## Completed Phases

- Phase 1: Staging runtime enablement and visible feature wiring.
- Phase 2: API/avatar/security hardening.
- Phase 3: product truthfulness and launch-scope documentation.
- Phase 4: Upstash Redis-backed rate limiting.
- Phase 6A: security headers and production-ops preparation.
- Cloudflare/OpenNext deployment setup and button contrast hotfix.
- Phase 7A: docs cleanup and deployment runbook consistency.

## Current Phase

Phase 7B-prep: plans organization, project handoff attachment, and safe repository cleanup audit.

## Next Recommended Phase

1. Repository cleanup audit.
2. `.gitignore` and deployment artifact cleanup.
3. k6 learning and safe smoke load tests.
4. Cloudflare staging verification pass.
5. Supabase DB/RLS/Auth readiness audit.
6. Resend/Supabase SMTP planning.
7. MFA/2FA planning.
8. Return to verified vehicle/station data when human data is ready.

## Public Production Blockers

- Human-verified vehicle data is not ready.
- Verified charging station data is not ready.
- Real monitoring vendor and alerting are not installed.
- Bot protection is planned, not integrated.
- Production SMTP/Auth email setup still needs final verification.
- Final enforced CSP is not enabled yet.
- Real AI and payments are intentionally not launched.

## Important Commands

```bash
npm test
npm run lint
npm run build
npm run cf:build
npx wrangler deploy
```

For Cloudflare Workers, use Node.js `22` or newer in the deployment environment.
The CI workflow currently runs normal `npm run build` on Node `20`; Cloudflare Worker deployment should still use the documented Node `22+` environment.

## Important Env Vars

```txt
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
AI_PROVIDER=mock
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Leave `OPENAI_API_KEY`, `GEMINI_API_KEY`, and `KIMI_API_KEY` empty until a real AI launch is approved. Never add Supabase service-role keys to client code or `NEXT_PUBLIC_*`.

## What Not To Touch

- Do not touch `public/cars/**` except read-only audit.
- Do not touch Supabase migrations except read-only audit.
- Do not change AI behavior or connect real AI.
- Do not add payments.
- Do not change vehicle data or invent verified data.
- Do not modify `.agents/**` or `skills-lock.json` without explicit approval.
- Do not commit or push unless the user explicitly asks.

## public/cars Handling

Treat `public/cars/**` as research/source material. It may include PDFs and extracted notes. Do not delete, rewrite, or normalize it during production remediation. Only check that app code does not depend on unsafe assumptions from it.

## Supabase Migrations Handling

Run migrations in documented order only:

```txt
supabase/schema.sql
supabase/migrations/001_chat_persistence.sql
supabase/migrations/002_account_settings.sql
supabase/migrations/003_profile_avatar_path.sql
supabase/migrations/004_avatar_storage_policies.sql
supabase/migrations/005_supported_vehicles_mvp.sql
supabase/migrations/006_user_location_preferences.sql
```

No migration `007` exists in the current repository. Do not invent one or seed fake charging stations.

## Cloudflare/OpenNext Notes

- `npm run build` remains the normal Next.js CI/local build.
- `npm run cf:build` runs `opennextjs-cloudflare build` and writes `.open-next/`.
- `npx wrangler deploy` deploys the built Worker using `wrangler.jsonc`.
- `.open-next/` and `.wrangler/` are generated artifacts and should not be committed.

## k6 Status

k6 was installed locally by the user and a public-pages script exists at `tests/load/public-pages.js`. k6 learning/testing is paused until repository cleanup and staging deployment consistency are complete.
