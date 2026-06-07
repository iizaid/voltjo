# VoltJo Performance Runbook

**Last updated**: 2026-06-08

This runbook covers production operations, cache strategy, observability, and load testing for VoltJo on Cloudflare Workers + OpenNext.

---

## Cloudflare Deployment Notes

| Setting | Value |
|---|---|
| Worker name | `voltjo` |
| Build command | `npm run cf:build` |
| Deploy command | `npx wrangler deploy` |
| Production branch | `main` |
| Compatibility date | `2026-05-29` |
| Compatibility flags | `nodejs_compat`, `global_fetch_strictly_public` |
| Assets binding | `ASSETS` — `.open-next/assets` |
| Self-reference binding | `WORKER_SELF_REFERENCE` (enables ISR revalidation) |
| Observability | Enabled — see Cloudflare dashboard |

**Redeploy after config changes** to `wrangler.jsonc`, `next.config.ts`, or any server-side code:
```bash
npm run cf:build && npx wrangler deploy
```

---

## Required Environment Variables

Set in Cloudflare Workers dashboard (Settings → Variables) or via Wrangler secrets:

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Yes | Full URL including protocol |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Yes | Cloudflare Turnstile public key |
| `NEXT_PUBLIC_AUTH_DEBUG` | No | Set to `"true"` for debug UI only — disable before launch |
| `AI_PROVIDER` | No | `"mock"` (default) |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis token — never log this |

---

## Cache Strategy

### What IS cached

| Route | Revalidate | Reason |
|---|---|---|
| `/vehicles` | 3600s (1 hour) | Public read-only catalog |
| `/vehicles/[slug]` | 3600s (1 hour) | Public read-only vehicle detail |
| `/charging-calculator` | 86400s (24 hours) | Vehicle + electricity defaults are stable |
| `_next/static/**` | Immutable (Cloudflare default) | Fingerprinted JS/CSS assets |

### What MUST NOT be cached

| Route / Data | Reason |
|---|---|
| `/api/health/auth` | Auth state — `Cache-Control: no-store` enforced |
| `/api/chat` | Per-request user + rate limit state |
| `/dashboard` | Authenticated, user-specific |
| `/account` | Authenticated, user-specific |
| `/assistant` | User profile loaded per request |
| `/start` | Auth state checked per request |
| `/charging-map` | Soft auth check per request |
| Auth callbacks and confirm routes | OAuth session state |

**Rule**: If a route calls `getUser()` or `getCurrentUserAndProfile()`, its HTML response must never be served from a shared cache.

---

## How to Run k6 Smoke Tests

See `tests/load/README.md` for full setup instructions.

**Quick start (local dev server):**
```bash
npm run dev
npm run load:public
npm run load:auth-health
```

**Against staging (with explicit decision):**
```bash
k6 run -e BASE_URL=https://staging.voltjo.com tests/load/public-smoke.js
```

**NEVER run against production** without team approval.

---

## How to Check Cloudflare Observability Logs

1. Go to Cloudflare Dashboard
2. Workers and Pages → **voltjo** → **Observability** → **Logs**
3. Filter useful patterns:
   - `outcome: exception` — Worker crashes
   - `status: 500` — Server errors
   - High `cpu_time` values — CPU-intensive requests

Key Worker limits to watch:
- CPU time: 50ms (bundled plan)
- Memory: 128MB per request
- Subnets/subrequests: counted toward platform limits

---

## How to Read /api/health/auth

```bash
curl https://voltjo.com/api/health/auth | jq
```

Expected healthy (unauthenticated) response:
```json
{
  "authenticated": false,
  "hasProfile": false,
  "onboardingCompleted": null,
  "hasSupabaseUrl": true,
  "hasSupabaseAnonKey": true,
  "cookieCount": 0,
  "hasSupabaseCookieNamePrefix": false,
  "timestamp": "..."
}
```

Diagnose problems:
- `hasSupabaseUrl: false` — env variable missing — redeploy with correct env
- 5xx response — Worker error — check Cloudflare logs immediately

---

## How to Inspect Supabase Slow Queries

In Supabase dashboard:
1. Project → **Database** → **Query Performance**
2. Sort by **Total time** or **Mean time**
3. Focus on `supported_vehicles`, `vehicle_cost_profiles`, `charging_locations`

Apply proposed indexes if slowness is confirmed:
```bash
# Review first, then apply:
# supabase/proposed/2026-06-08-performance-indexes.sql
psql -h <host> -U <user> -d <db> -f supabase/proposed/2026-06-08-performance-indexes.sql
```

---

## How to Rollback a Cloudflare Deployment

**Via Wrangler:**
```bash
npx wrangler rollback
```

**Check deployment history:**
```bash
npx wrangler deployments list
```

**Manual via git:**
```bash
git log --oneline -10
git checkout <commit-hash> -- .
npm run cf:build && npx wrangler deploy
```

---

## How to Disable Debug Flags Before Launch

1. In Cloudflare Workers env: remove `NEXT_PUBLIC_AUTH_DEBUG` or set to `"false"`
2. Verify debug routes are inaccessible in production
3. Keep CSP as `Content-Security-Policy-Report-Only` until browser reports are reviewed

---

## Pre-Launch Checklist

- [ ] `NEXT_PUBLIC_AUTH_DEBUG` removed or set to `"false"` in production
- [ ] All Cloudflare env variables verified via `/api/health/auth`
- [ ] `HSTS` header confirmed: `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- [ ] Rate limiting active — Upstash env vars set
- [ ] Turnstile site key set and matches domain
- [ ] k6 smoke test passed against staging: `npm run load:public`
- [ ] Cloudflare observability logs reviewed after last deploy
- [ ] ISR revalidation tested manually on `/vehicles`
- [ ] No secrets, tokens, cookies, or user IDs in logs
- [ ] Proposed database indexes reviewed and applied if warranted
- [ ] CSP report-only violations reviewed

---

## Cache Invalidation

ISR cache expires automatically per the `revalidate` window. On next request after expiry, the Worker self-calls to regenerate.

To force-clear cache on vehicle data change:
- Wait for `revalidate` to expire (automatic, safest)
- Use Cloudflare Cache Purge API (requires Cache Purge API token)
- Redeploy — a new Worker deployment clears ISR cache

On-demand revalidation (`revalidateTag`/`revalidatePath`) is not yet implemented. If data changes frequently, lower the `revalidate` window.

---

## Performance Budget Reference

| Metric | Target | Action if Exceeded |
|---|---|---|
| p95 page response | < 2000ms | Check Supabase query times, Worker CPU time |
| p99 page response | < 5000ms | Investigate tail latency |
| Error rate | < 1% | Check Cloudflare logs, rate limit triggers |
| Worker CPU time | < 50ms/req | Profile expensive operations |
| Client JS gzipped | < 300KB | Run `next build`, inspect chunk sizes |
