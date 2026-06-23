# Plan: Car Comparison

**Priority:** P2 (P1 if marketed at launch) · **Effort:** M · **Risk:** Low
**Depends on:** `vehicle-data-completion.md`, ideally `saved-vehicles.md`.

## Feature overview
Side-by-side comparison of 2–3 vehicles across specs and running costs. Promised
in dashboard copy ("المقارنات").

## Business goal
Help buyers decide faster — the core decision-support value proposition.

## User stories
- As a buyer, I pick 2–3 vehicles and compare specs and cost side by side.
- As a buyer, I share or revisit a comparison via URL.

## Functional requirements
- Select vehicles (from catalog or saved list).
- Comparison table: type, battery, range, price, cost/100km, confidence.
- Shareable URL encoding the selected slugs.

## Non-functional requirements
- Stateless/URL-driven (no table needed initially); fast render.

## Database requirements
- None initially (URL-encoded). Optional `comparisons` table later for saved sets.

## API requirements
- Reuse vehicle queries; fetch by slug list.

## UI requirements
- Responsive comparison grid; highlight best value per row; RTL-aware.

## UX flow
Choose vehicles → `/compare?ids=a,b,c` → table → adjust selection.

## Validation rules
- 2–3 valid slugs; dedupe; ignore unknown slugs gracefully.

## Security considerations
- Public read-only; sanitize slug params.

## Edge cases
- 1 or >3 selected; mixed types (EV vs hybrid) → label clearly.

## Error handling
- Unknown slug → drop with a notice, keep valid ones.

## Loading states
- Column skeletons while fetching.

## Empty states
- Selector prompt when no vehicles chosen.

## Acceptance criteria
- Comparing 3 vehicles shows correct, complete rows; shared URL reproduces it.

## Testing requirements
- Unit: slug parsing/dedupe. Integration: data fetch. E2E: build a comparison.

## Rollout checklist
- [ ] Comparison route + selector.
- [ ] Table with best-value highlighting.
- [ ] Shareable URL.
- [ ] Staging verification with verified data.
