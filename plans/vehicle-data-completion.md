# Plan: Vehicle Data Completion

**Priority:** P0 (data gate) · **Effort:** M–L (data-bound) · **Risk:** Medium (truthfulness)

## Feature overview
Move the vehicle catalog from the MVP seed in `005_supported_vehicles_mvp.sql`
to a verified, launch-credible dataset across `vehicle_brands`,
`supported_vehicles`, and `vehicle_cost_profiles`.

## Business goal
VoltJo's promise is trustworthy EV/PHEV/hybrid intelligence for Jordan. Thin or
unverified data undermines credibility on day one.

## User stories
- As a buyer, I see the EVs actually sold in Jordan with correct specs.
- As a buyer, I trust cost figures because each has a confidence label.

## Functional requirements
- Curated brand list relevant to the Jordan market.
- Each vehicle: nameAr/nameEn, type, model year, battery kWh, range, price range,
  summary, and at least one cost profile.
- `is_verified`/confidence semantics applied consistently.

## Non-functional requirements
- Source provenance recorded per row (where the figure came from).
- Catalog query stays fast (indexes from `008` cover ordering/filtering).

## Database requirements
- No schema change expected; a data-only migration `009_seed_verified_vehicles.sql`
  (idempotent upserts) OR an admin import path.
- Keep migrations in documented order; do not edit 001–008.

## API requirements
- Existing `listSupportedVehicles` / `getSupportedVehicleBySlug` suffice.

## UI requirements
- Catalog and detail pages already render; ensure graceful display when optional
  fields (range, price) are null.

## UX flow
Browse `/vehicles` → filter by brand/type → open detail → see specs + cost.

## Validation rules
- Battery kWh > 0 for EVs; price min ≤ max; confidence ∈ allowed set.

## Security considerations
- Public read only; writes via service-role in migration/admin only.

## Edge cases
- Missing range/price → show "غير متوفر" rather than blank.
- Duplicate slugs → unique constraint must reject.

## Error handling
- Query failure returns `[]` (already) → catalog shows empty state, not crash.

## Loading states
- ISR (`revalidate = 3600`) on detail; catalog server-rendered.

## Empty states
- "لا توجد سيارات مطابقة" for filtered-empty results.

## Acceptance criteria
- ≥ a launch-agreed minimum number of verified vehicles render with full specs.
- No vehicle shows placeholder/lorem values.
- Every cost figure carries a confidence label.

## Testing requirements
- Data validation script (counts, null checks, slug uniqueness).
- Spot-check render of 5 detail pages.

## Rollout checklist
- [ ] Agree launch-minimum catalog size with product.
- [ ] Source + verify data with a human owner.
- [ ] Author idempotent data migration `009`.
- [ ] Apply to staging → review render → apply to prod.
- [ ] Verify confidence labels visible everywhere.
