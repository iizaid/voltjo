# VoltJo — Final Launch Roadmap

> Master roadmap derived from `plans/18-final-delivery-audit-2026-06-22.md` and
> the per-feature plans in this directory. All findings are repository-verified.

## Readiness scorecard

| Dimension | Score | Rationale |
|---|---:|---|
| **Launch readiness** | **6.5 / 10** | Solid, production-grade foundation; blocked by data + AI decision + monitoring |
| **Security readiness** | **7 / 10** | RLS, Upstash rate limiting, security headers, request validation in place; CSP still report-only, Turnstile keys/verification pending |
| **Product completeness** | **6 / 10** | Core flows complete; the marquee differentiator (assistant) is mock; saved/compare/reports unbuilt |
| **Data completeness** | **3 / 10** | MVP vehicle seed only; **zero verified charging stations** (008 RLS hides unverified) |
| **UX readiness** | **7 / 10** | Polished, RTL-first, good a11y primitives & touch targets; placeholder pricing on primary nav, some empty states missing |

### Remaining work
- **~30%** if the assistant ships **clearly labeled as a demo** (mock retained).
- **~40%** if a **real AI assistant** is required for launch.

### Estimated time to completion
- **Credible soft launch (1 week):** achievable *only if* AI is demo-labeled,
  a launch-minimum verified vehicle set is supplied, charging map ships with an
  honest empty state, and monitoring + CSP/bot hardening land.
- **Full launch with real AI + saved/compare:** ~2–3 weeks, data-sourcing bound.

The hard constraint is **human-verified data** (vehicles + charging stations),
not engineering — this is the project's own stated gate and remains true.

---

## Priority groups

### P0 — Critical launch blockers
1. **AI provider decision** — `ai-provider-integration.md`. Either integrate a
   real provider behind the existing abstraction, or relabel the assistant as a
   demo. Shipping mock answers as "ذكي" unlabeled is a truthfulness risk.
2. **Vehicle data completion** — `vehicle-data-completion.md`. Launch-minimum
   verified catalog with confidence labels.
3. **Charging station data + map** — `charging-station-data-and-map.md`. Verified
   rows + empty state + confirm latency on Cloudflare.

### P1 — Must-have before launch
4. **Pricing page resolution** — `pricing-page.md`. Build real page or hide nav.
5. **Monitoring & analytics** — `monitoring-and-analytics.md`.
6. **CSP enforcement + bot protection** — `launch-hardening-csp-and-bot-protection.md`.
7. **Chat history sync** — `chat-history-sync.md` (write path already exists).
8. **InitialSiteLoader perf** — already reduced 3.5s→1.6s; confirm it feels right.

### P2 — Important improvements
9. **Saved vehicles** — `saved-vehicles.md`.
10. **Car comparison** — `car-comparison.md`.
11. **Formal accessibility + responsive sign-off** (device matrix, screen reader).
12. **E2E smoke tests** (Playwright) for auth, catalog, map, assistant.

### P3 — Future enhancements
13. **Ownership reports** — `ownership-reports.md`.
14. **Payments / subscriptions** (intentionally out of current scope).
15. **MFA/2FA** (see historical `plans/09-mfa-2fa-readiness.md`).

---

## Recommended implementation order (1-week soft-launch path)

| Day | Focus |
|---|---|
| 1 | P0 AI **decision** (demo-label vs real); start data sourcing with a human owner |
| 1–2 | Charging map: empty state + `.limit()` + confirm Cloudflare latency; lazy-load map |
| 2–3 | Vehicle data: ingest + verify launch-minimum set (migration `009`) |
| 3 | Pricing resolution; monitoring + error tracking wired |
| 4 | CSP review→enforce; Turnstile keys + server verification |
| 4–5 | Chat history sync (reuse existing write path) |
| 5 | Staging hardening pass: load smoke (`tests/load/*`), CSP sweep, a11y spot-check |
| 6 | Buffer + bugfix; final data verification |
| 7 | Go/no-go review against acceptance criteria; staged enable |

If **real AI** is required, insert +3–5 days (P0 #1) and push P1 chat-sync and
P2 features past launch.

---

## Go / no-go gate (must all be true to launch)
- [ ] Assistant is either real **or** unambiguously labeled as a demo.
- [ ] Vehicle catalog meets the agreed launch-minimum, all with confidence labels.
- [ ] Charging map shows verified stations **or** an honest empty state — never blank/stalled.
- [ ] No placeholder content reachable from primary navigation.
- [ ] Error tracking + uptime alerting live.
- [ ] CSP enforced with zero violations; auth bot-protected and verified server-side.
- [ ] Production page timings confirmed acceptable on Cloudflare (esp. `/charging-map`).

---

## Index of plans
- `18-final-delivery-audit-2026-06-22.md` — full audit + status matrix
- `ai-provider-integration.md` — P0
- `vehicle-data-completion.md` — P0
- `charging-station-data-and-map.md` — P0/P1
- `pricing-page.md` — P1
- `monitoring-and-analytics.md` — P1
- `launch-hardening-csp-and-bot-protection.md` — P1
- `chat-history-sync.md` — P1
- `saved-vehicles.md` — P2
- `car-comparison.md` — P2
- `ownership-reports.md` — P3
