# k6 Learning and Safe Smoke Load Tests

## Goal

Use k6 for light staging smoke/load learning without stressing the app, Supabase, Upstash, or Cloudflare.

## Scope

- Public page GET checks only.
- Small virtual-user counts.
- No authenticated flows unless a later plan provides throwaway staging users.
- No destructive or write-heavy APIs.

## Out Of Scope

- Stress testing.
- DDoS-style testing.
- Avatar upload, signup spam, password reset spam, or account export loops.
- Real AI provider testing.

## Files Likely Involved

- `tests/load/public-pages.js`
- `docs/staging-smoke-tests.md`
- `plans/00-current-project-handoff.md`

## Safety Rules

- Set `BASE_URL` explicitly before running.
- Keep traffic small and short.
- Do not run against production unless approved.
- Watch Cloudflare Workers logs and Upstash metrics during tests.

## Acceptance Criteria

- k6 script only hits public pages.
- Thresholds are conservative.
- Any failures are classified as app, network, platform, or rate-limit related.
- No write endpoints are exercised.

## Commands To Run

```bash
k6 run tests/load/public-pages.js
k6 run -e BASE_URL=https://your-staging-origin.example tests/load/public-pages.js
```

Also run after documentation or app changes:

```bash
npm test
npm run lint
npm run build
npm run cf:build
```

## Final Report Requirements

- Target URL used.
- k6 version.
- Pages tested.
- Failure rate and p95 latency.
- Cloudflare/Upstash observations.
- Confirmation no write endpoints were tested.
