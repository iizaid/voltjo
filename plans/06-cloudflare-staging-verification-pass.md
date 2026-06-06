# Cloudflare Staging Verification Pass

## Goal

Verify the deployed Cloudflare Workers/OpenNext staging environment behaves like the local build and documented runbook.

## Scope

- Cloudflare Worker env/secrets.
- `wrangler.jsonc` and `.open-next` deployment output.
- Public route smoke tests.
- API smoke tests that are already documented.
- Worker runtime logs.

## Out Of Scope

- Real AI.
- Payments.
- Vehicle/station data changes.
- Supabase migration edits.

## Files Likely Involved

- `README.md`
- `docs/staging-smoke-tests.md`
- `docs/monitoring.md`
- `package.json`
- `wrangler.jsonc`
- `open-next.config.ts`
- `.github/workflows/ci.yml`

## Safety Rules

- Keep `AI_PROVIDER=mock`.
- Do not add secrets to the repo.
- Do not deploy without confirming Worker variables/secrets.
- Do not treat Upstash fail-closed 429 as a chat bug until secrets are checked.

## Acceptance Criteria

- `npm run cf:build` passes.
- `npx wrangler deploy` deploys the Worker.
- Required Worker env/secrets are present.
- `/assistant` works with mock responses unless legitimately rate-limited.
- `/charging-map` can request browser geolocation.
- CSP report-only header exists; no enforcing CSP yet.

## Commands To Run

```bash
npm test
npm run lint
npm run build
npm run cf:build
npx wrangler deploy
git status --short
```

## Final Report Requirements

- Deployment URL.
- Worker env/secrets checklist status.
- Route smoke-test results.
- Worker log findings.
- Build/deploy command results.
- Any Cloudflare-specific warnings.
