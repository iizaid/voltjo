# Plan: Ownership Reports

**Priority:** P3 (future) · **Effort:** M–L · **Risk:** Low
**Depends on:** verified vehicle data + cost profiles, onboarding profile.

## Feature overview
Generate a personalized ownership/cost report for a vehicle using the user's
smart-profile inputs (usage, electricity price, mileage). Promised in dashboard
copy ("التقارير").

## Business goal
Premium, sticky value: turn the calculator + profile into a shareable report and
a future monetization surface.

## User stories
- As a user, I generate a cost-of-ownership report for a chosen vehicle.
- As a user, I revisit saved reports and export/share them.

## Functional requirements
- Compute total cost of ownership from `charging-calculations.ts` + profile.
- Save reports; list on dashboard; export (print/PDF).

## Non-functional requirements
- Deterministic calculations; every figure traceable to inputs.

## Database requirements
- `reports(user_id, vehicle_id, inputs jsonb, results jsonb, created_at)`, RLS owner-only.

## API requirements
- `POST /api/reports` (generate+save), `GET /api/reports`, `GET /api/reports/[id]`.

## UI requirements
- Report builder; results view; saved-reports list; print-friendly layout.

## UX flow
Pick vehicle → confirm/adjust inputs → generate → save → revisit/export.

## Validation rules
- Inputs within sane ranges; vehicle must have a cost profile.

## Security considerations
- RLS owner-only; no PII beyond profile; sanitize jsonb (008 constraints pattern).

## Edge cases
- Vehicle without cost profile → block with explanation.
- Profile incomplete → prompt to finish onboarding.

## Error handling
- Calculation/storage failure → typed error, no partial save.

## Loading states
- Generating spinner; list skeleton.

## Empty states
- "لا توجد تقارير محفوظة بعد".

## Acceptance criteria
- Report numbers match the calculator for identical inputs; saved reports reload.

## Testing requirements
- Unit: TCO math (extend existing calc tests). Integration: API + RLS.

## Rollout checklist
- [ ] `reports` table + RLS.
- [ ] TCO calculation module + tests.
- [ ] APIs + builder UI.
- [ ] Export/print.
- [ ] Staging verification.
