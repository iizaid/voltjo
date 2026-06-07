# Plan 17 — Production Performance & Load Readiness Audit

**Date**: 2026-06-08  
**Status**: Active  
**Author**: Claude Code (Sonnet 4.6)

---

## 1. Current Architecture Summary

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Runtime | Cloudflare Workers via OpenNext 1.19 |
| Database / Auth | Supabase (SSR + @supabase/ssr) |
| Rate limiting | Upstash Redis (REST, fail-closed) |
| Fonts | Readex Pro + Changa (next/font/google, display: swap) |
| Animation | motion v12 (Framer Motion), GSAP v3 |
| Map | MapLibre GL v5 |
| CSS | Tailwind v4 |
| Deploy | `npx wrangler deploy`, main branch |

**Route map:**

| Route | Auth Required | Type | Supabase Calls |
|---|---|---|---|
| `/` | No | Server Component | None |
| `/vehicles` | No | Server Component | `listSupportedVehicles()` |
| `/vehicles/[slug]` | No | Server Component | `getSupportedVehicleBySlug()` x2 |
| `/charging-calculator` | No | Server Component | `getChargingCostInputs()` — `listSupportedVehicles()` |
| `/charging-map` | Soft (UI toggle) | Server Component | `listChargingLocations()` + `getCurrentUser()` |
| `/assistant` | No (but profile loaded) | Server Component | `getCurrentUserAndProfile()` |
| `/dashboard` | Yes | Server Component | `getCurrentUserAndProfile()` |
| `/account` | Yes | Server Component | `getCurrentUserAndProfile()` |
| `/start` | No | Server Component | `getCurrentUserAndProfile()` |
| `/api/chat` | Soft | API Route | `getCurrentUser()` x1 + persistence |
| `/api/health/auth` | No | API Route | `getCurrentUserAndProfile()` |

---

## 2. Performance Bottlenecks Found

### 2.1 Double Supabase Query on Vehicle Detail Page — HIGH IMPACT

**File**: `app/vehicles/[slug]/page.tsx`

`getSupportedVehicleBySlug(slug)` is called in BOTH:
- `generateMetadata()` (line 15)
- `VehicleDetailPage()` (line 54)

Each call does:
1. `createClient()` — new Supabase SSR client with cookie store
2. Internal Supabase session validation
3. `SELECT * FROM supported_vehicles WHERE slug=... JOIN vehicle_brands`
4. `SELECT * FROM vehicle_cost_profiles WHERE vehicle_id=...`

Result: **4 Supabase queries per uncached page load** (2 x (1 join query + 1 cost_profiles query)).

There is no `React.cache()` or request-level deduplication on the query function.

**Fix applied**: Add `revalidate = 3600` so the page renders from cache on repeat requests.  
**Future fix**: Wrap `getSupportedVehicleBySlug` in `React.cache()` — requires human approval.

---

### 2.2 No Caching on Public Catalog Pages — HIGH IMPACT

All public catalog pages hit Supabase on every request with no caching:

| Page | Data Fetched | Staleness Tolerance |
|---|---|---|
| `/vehicles` | All active Jordan vehicles | Hours |
| `/vehicles/[slug]` | One vehicle + cost profiles | Hours |
| `/charging-calculator` | All vehicles with battery data | 24 hours |
| `/charging-map` | All charging locations + user auth | User-dependent — cannot cache |

Without `revalidate`, Next.js renders these pages dynamically on every request inside the Cloudflare Worker. Each request pays Supabase round-trip latency.

---

### 2.3 Missing `optimizePackageImports` — MEDIUM IMPACT

`next.config.ts` has no `optimizePackageImports`. This affects:

- `lucide-react` — used across ~8 files. Without `optimizePackageImports`, the compiler may include more of the package barrel than needed.
- `motion` — used in 17 files; large library with many exports.

---

### 2.4 Two Competing `getCurrentUser` Functions — MEDIUM (confusion/correctness risk)

Two exported `getCurrentUser` functions exist:
- `lib/auth/session.ts` — returns `User | null`
- `lib/server/auth.ts` — returns `{ user, supabase }`

`charging-map/page.tsx` imports from `lib/auth/session`, while `api/chat/route.ts` imports from `lib/server/auth`. Both create a fresh Supabase client and call `getUser()`.

`charging-map/page.tsx` creates **two independent Supabase clients** in the same request:
1. `listChargingLocations()` — `createClient()` — queries charging_locations
2. `getCurrentUser()` — another `createClient()` — calls `getUser()`

---

### 2.5 `select("*")` on profiles Table — LOW-MEDIUM IMPACT

`getCurrentUserAndProfile()` uses `select("*")` on the `profiles` table, fetching all columns (including `privacy_settings` JSONB) on every auth-protected page load.

---

### 2.6 No HSTS Header — LOW SECURITY GAP

`next.config.ts` has no `Strict-Transport-Security` header. Safe to add for Cloudflare HTTPS deployments where all traffic is TLS-terminated.

---

### 2.7 Public Assets Without Explicit Long-Term Cache Headers — LOW IMPACT

Brand images in `public/brands/` are `.png` format (not WebP/AVIF). No explicit `Cache-Control: public, max-age=31536000, immutable` header is set for these assets. Cloudflare Workers static asset serving handles `_next/static` fingerprinted files automatically, but `/brands/` and `/logo/` paths benefit from explicit headers.

---

### 2.8 GSAP in FloatingHelpWidget — LOW-MEDIUM IMPACT

`components/layout/FloatingHelpWidget.tsx` imports `gsap` (~60KB gzipped) for a single floating widget animation present on every page. The `motion` library is already a dependency and could replace this usage.

---

### 2.9 MapLibre GL Bundle — ACCEPTABLE

`ChargingMapClient.tsx` uses `maplibre-gl` (~350KB gzipped). This is a client component used only on `/charging-map`. Acceptable for a mapping component — no action needed.

---

### 2.10 InitialSiteLoader in Root Layout — LOW

`InitialSiteLoader` runs for first-time visitors with a 3.5s loading screen. Session storage prevents repeat shows. This is a UX choice; no performance change recommended.

---

## 3. Caching Opportunities

| Page / Data | Proposed Revalidate | Risk | Notes |
|---|---|---|---|
| `/vehicles` | `revalidate = 3600` (1 hour) | Low | Public, read-only catalog |
| `/vehicles/[slug]` | `revalidate = 3600` (1 hour) | Low | Public, read-only |
| `/charging-calculator` | `revalidate = 86400` (24 hours) | Low | Electricity defaults rarely change |
| `/charging-map` | None | — | Auth state read — must not cache |
| `/assistant` | None | — | User-specific profile data |
| `/dashboard` | None | — | Authenticated user data |
| `/account` | None | — | Authenticated user data |

---

## 4. Bundle-Size Opportunities

| Item | Action | Risk |
|---|---|---|
| `optimizePackageImports: ["lucide-react", "motion"]` | Add to `next.config.ts` | Low |
| GSAP in FloatingHelpWidget | Replace with CSS transitions or motion/react | Low-Medium (visual regression risk) |

---

## 5. Supabase Query Opportunities

| Issue | Recommendation | Risk |
|---|---|---|
| Double `getSupportedVehicleBySlug` per render | Wrap in `React.cache()` | Medium — requires Cloudflare Workers cache compat testing |
| `select("*")` on profiles | Narrow to needed columns | Medium — audit all callers first |
| `listSupportedVehicles` JS filters | Push `vehicleType` filter to SQL `.eq()` | Low-Medium — regression test needed |
| `getChargingCostInputs` delegates to `listSupportedVehicles` | No extra queries; acceptable |  — |

---

## 6. Cloudflare / OpenNext Opportunities

| Item | Action |
|---|---|
| `open-next.config.ts` is empty `{}` | Fine; ISR handled by route segment `revalidate` |
| `WORKER_SELF_REFERENCE` service binding | Already configured — supports ISR revalidation |
| No `[observability]` in `wrangler.jsonc` | Add for Cloudflare Workers Logs (applied in this plan) |
| Static asset cache headers | Cloudflare auto-applies long-cache to `_next/static/**` |
| `compatibility_date` | `2026-05-29` — current; review quarterly |

---

## 7. Risk Levels for Each Proposed Change

| Change | Risk | Requires Approval? |
|---|---|---|
| `revalidate = 3600` on `/vehicles` | **Low** | No |
| `revalidate = 3600` on `/vehicles/[slug]` | **Low** | No |
| `revalidate = 86400` on `/charging-calculator` | **Low** | No |
| `optimizePackageImports` in next.config.ts | **Low** | No |
| HSTS header | **Low** | No |
| Cloudflare observability in wrangler.jsonc | **Low** | No |
| k6 load test scripts (no prod traffic) | **None** | No |
| Performance runbook | **None** | No |
| Wrap queries in `React.cache()` | **Medium** | Yes |
| Narrow `select("*")` on profiles | **Medium** | Yes |
| Push vehicle type filter to SQL | **Low-Medium** | Yes |
| Replace GSAP with motion/CSS | **Medium** | Yes |
| Apply SQL indexes | **Medium** | Yes — DBA review |

---

## 8. Safe Changes Implemented in This Plan

1. `revalidate = 3600` on `app/vehicles/page.tsx`
2. `revalidate = 3600` on `app/vehicles/[slug]/page.tsx`
3. `revalidate = 86400` on `app/charging-calculator/page.tsx`
4. `optimizePackageImports: ["lucide-react", "motion"]` in `next.config.ts`
5. `Strict-Transport-Security` HSTS header in `next.config.ts`
6. Cloudflare `[observability]` section in `wrangler.jsonc`
7. k6 smoke tests in `tests/load/`
8. `docs/performance-runbook.md`
9. `supabase/proposed/2026-06-08-performance-indexes.sql` (manual SQL — not auto-applied)
10. `load:public` and `load:auth-health` scripts in `package.json`

---

## 9. Changes Requiring Human Approval

1. **Wrap query functions in `React.cache()`** — Eliminates double `getSupportedVehicleBySlug`. Requires testing that `cookies()` and React cache don't conflict in Cloudflare Workers.
2. **Narrow `select("*")` on profiles** — Audit all consumers of `CurrentProfile` type before changing.
3. **Push vehicle filters to SQL** — `listSupportedVehicles` fetches all active Jordan vehicles and filters in JS. Moving to SQL reduces data transfer. Needs regression tests.
4. **Replace GSAP with motion/CSS in FloatingHelpWidget** — Saves ~60KB gzipped per page. Visual regression test required.
5. **Apply SQL indexes from `supabase/proposed/`** — DBA review required before applying.

---

## 10. Manual SQL / Index Recommendations

See `supabase/proposed/2026-06-08-performance-indexes.sql` for full details with rollback statements.

**Summary:**

| Table | Index Columns | Query It Helps | Safe? |
|---|---|---|---|
| `supported_vehicles` | `(market, is_active, model_year DESC, name_ar)` | `listSupportedVehicles` | Yes, CONCURRENTLY |
| `supported_vehicles` | `(slug, market, is_active)` | `getSupportedVehicleBySlug` | Yes, CONCURRENTLY |
| `vehicle_cost_profiles` | `(vehicle_id, scenario)` | cost profile joins | Yes, CONCURRENTLY |
| `charging_locations` | `(is_active, city, name_ar)` | `listChargingLocations` | Yes, CONCURRENTLY |

---

## 11. Load Testing Strategy

- Use k6 for local and staging smoke tests **only**
- **Never** run high-VU tests against the production URL
- Two scripts:
  - `tests/load/public-smoke.js` — public pages, 3 VUs, 30 seconds
  - `tests/load/auth-health-smoke.js` — health endpoint only, 2 VUs, 20 seconds
- Thresholds: p95 < 2000ms, error rate < 1%
- Any load increase requires explicit team approval

---

## 12. Rollback Plan

| Change | Rollback Method |
|---|---|
| `revalidate` on catalog pages | Remove `export const revalidate` line — pages return to dynamic |
| `optimizePackageImports` | Remove from `next.config.ts` — rebuild |
| HSTS header | Remove from `securityHeaders` array — rebuild |
| Cloudflare observability | Remove `[observability]` from `wrangler.jsonc` |
| Cloudflare Worker deploy | `npx wrangler rollback` or redeploy previous commit |
| SQL indexes | `DROP INDEX CONCURRENTLY` — see proposed SQL file for exact statements |
