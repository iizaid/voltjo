# Plan: Charging Station Data + Map Readiness

**Priority:** P0 (data gate) + P1 (perf) · **Effort:** Data S–M, Eng S · **Risk:** Medium

## Feature overview
Make `/charging-map` production-ready: (1) supply verified charging stations so
the map is not empty under migration `008`'s RLS (`is_active AND is_verified`),
(2) add a proper empty state, (3) investigate the ~7s `listChargingLocations()`
latency observed on a local production server.

## Business goal
The charging map is a core utility. An empty or slow map damages trust in a
launch-critical feature.

## User stories
- As a driver, I see verified charging points across Jordan on one map.
- As a driver, if none exist yet, I see an honest message, not a blank/stall.

## Functional requirements
- Seed/verify `charging_locations` rows (`is_active=true, is_verified=true`).
- Empty-state panel when zero stations returned.
- Confirm query latency is acceptable on the Cloudflare deployment.

## Non-functional requirements
- Map page server response p95 < 1s on the real deployment.
- maplibre (1 MB) already code-split to this route — consider `next/dynamic`
  with a skeleton so the header paints before the map JS loads.

## Database requirements
- Data-only verified station rows (idempotent). No schema change required.
- Confirm indexes from `008` cover `is_active, is_verified` + ordering columns.

## API requirements
- `listChargingLocations()` in `lib/vehicles/queries.ts` — add an explicit
  upper bound (`.limit(...)`) and confirm it only selects needed columns.

## UI requirements
- Skeleton while map JS loads; markers + popups (exist in `mapcn-marker-popup`).

## UX flow
Open map → see Jordan view → markers cluster → tap → details + directions.

## Validation rules
- Lat/long present and within Jordan bounds for displayed markers.

## Security considerations
- Public read limited to verified+active rows (008 enforces). No PII in dataset.

## Edge cases
- Zero verified stations → empty state.
- Geolocation denied → keep default Jordan center (already handled).
- Station without coordinates → excluded (`hasCoordinates` exists).

## Error handling
- Query failure → `[]` → empty state (no crash).

## Loading states
- `app/loading.tsx` during fetch; map skeleton during JS load.

## Empty states
- "لا توجد محطات شحن موثّقة بعد" with a note that data is being verified.

## Acceptance criteria
- With verified rows, markers render; with none, the empty state shows.
- Map page server time confirmed < 1s on the deployed environment.

## Testing requirements
- Verify query latency on Cloudflare (not just local-to-remote Supabase).
- Render test: empty vs populated.

## Rollout checklist
- [ ] Confirm whether 7s reproduces on Cloudflare or was local network latency.
- [ ] Add `.limit()` + skeleton lazy-load.
- [ ] Source + verify station data with a human owner.
- [ ] Apply data → confirm markers in staging.
- [ ] Confirm empty state copy with product.
