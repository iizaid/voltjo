# Verified Data Gate

## Goal

Define the human-verified vehicle and charging-station data requirements that must be satisfied before public production and real AI launch.

## Scope

- Vehicle specs, trims, prices, import-origin caveats, and Jordan availability.
- Charging station locations, connector types, access rules, and verification dates.
- Public UI claim review.
- AI context readiness after data verification.

## Out Of Scope

- Inventing data.
- Editing `public/cars/**` during unrelated remediation.
- Creating migration `007` before human data is ready.
- Launching real AI or payments.

## Files Likely Involved

- `public/cars/**` for read-only source review.
- `supabase/migrations/005_supported_vehicles_mvp.sql`
- Future additive migration only after data is verified.
- `app/vehicles/**`
- `app/charging-map/**`
- `app/charging-calculator/**`
- `lib/vehicles/**`
- `lib/ai/**` only after real AI launch is approved.

## Safety Rules

- Do not mark estimate rows as verified without human review.
- Do not seed fake charging stations.
- Do not change existing migrations after application.
- Keep `AI_PROVIDER=mock` until the data gate is satisfied and a separate AI launch is approved.

## Acceptance Criteria

- Vehicle data has source links, verification owner, verification date, and confidence.
- Charging station data has verified coordinates and connector/access details.
- Public UI copy matches verified confidence.
- New data migration is additive and reviewed.
- AI context uses only verified or clearly caveated data.

## Commands To Run

```bash
npm test
npm run lint
npm run build
npm run cf:build
git status --short
```

## Final Report Requirements

- Data sources reviewed.
- Rows ready for migration.
- Rows rejected or needing more evidence.
- UI claims changed or retained.
- Confirmation whether the gate is passed.
