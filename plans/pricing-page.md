# Plan: Pricing Page Resolution

**Priority:** P1 · **Effort:** S · **Risk:** Low (credibility)

## Feature overview
`/[slug]` resolves `pricing` to a `PlaceholderPage` ("هذه الصفحة قيد التجهيز"),
yet the navbar links to "الأسعار". Resolve before launch: ship a real
informational page **or** remove the nav entry until ready.

## Business goal
Avoid a dead/placeholder page on a primary nav link, which reads as unfinished to
first-time visitors.

## User stories
- As a visitor, clicking "الأسعار" gives real, honest information (or the link
  isn't shown until content exists).

## Functional requirements
- Decide: (A) informational pricing/plans page (no payments), or (B) remove the
  `pricing` nav item and the placeholder slug from `pages`.
- If (A): replace placeholder with real content (tiers/value, "free during beta").

## Non-functional requirements
- Static/ISR; fast; RTL; accessible.

## Database requirements
- None.

## API requirements
- None.

## UI requirements
- If (A): pricing/plan layout matching the design system; clear "no charges yet"
  messaging since payments are out of scope.

## UX flow
Nav → pricing → understand offering → CTA to start.

## Validation rules
- N/A (static content).

## Security considerations
- None beyond standard headers.

## Edge cases
- Unknown slug still 404s (existing `notFound()`).

## Error handling
- N/A.

## Loading states
- N/A (static).

## Empty states
- N/A.

## Acceptance criteria
- No placeholder copy reachable from primary nav at launch.

## Testing requirements
- Manual nav click-through; metadata check.

## Rollout checklist
- [ ] Product decision: build vs hide.
- [ ] Implement chosen option.
- [ ] Update `data/navigation.ts` if hiding.
- [ ] Verify no "قيد التجهيز" reachable from nav.
