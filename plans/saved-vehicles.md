# Plan: Saved Vehicles

**Priority:** P1 · **Effort:** M · **Risk:** Low

## Feature overview
Let signed-in users save/bookmark vehicles from the catalog and detail pages and
view them on the dashboard. The dashboard already promises this ("وحدات السيارات
المحفوظة ... ستُضاف بعد تجهيز قواعد البيانات").

## Business goal
Create a reason to sign in and return; foundation for comparison and reports.

## User stories
- As a user, I tap a save icon on a vehicle and it persists to my account.
- As a user, I see all saved vehicles on my dashboard and can remove them.

## Functional requirements
- Toggle save on catalog card and detail page.
- Saved list on dashboard with quick links and remove.

## Non-functional requirements
- Optimistic UI; RLS-scoped reads/writes.

## Database requirements
- New migration `010_saved_vehicles.sql`: `saved_vehicles(user_id, vehicle_id,
  created_at)`, PK `(user_id, vehicle_id)`, FK to `supported_vehicles`, RLS owner-only,
  index `(user_id, created_at)`.

## API requirements
- `POST /api/saved-vehicles` (toggle), `GET /api/saved-vehicles` (list),
  `DELETE /api/saved-vehicles/[vehicleId]`. Auth + rate limit reuse.

## UI requirements
- Save button component with saved/unsaved state; dashboard saved-list section.

## UX flow
Browse → save (optimistic) → dashboard shows it → remove.

## Validation rules
- Vehicle must exist; reject duplicates via PK.

## Security considerations
- RLS owner-only; guests prompted to sign in (no anonymous writes).

## Edge cases
- Save while signed out → prompt sign-in, preserve intent.
- Saved vehicle later unpublished → hide or mark unavailable.

## Error handling
- Failed toggle → revert optimistic state + toast.

## Loading states
- Button pending state; dashboard list skeleton.

## Empty states
- "لم تحفظ أي سيارة بعد" with a link to the catalog.

## Acceptance criteria
- Save persists across sessions/devices; remove works; RLS verified.

## Testing requirements
- Unit: toggle reducer. Integration: API + RLS. E2E: save→dashboard.

## Rollout checklist
- [ ] Migration `010` + RLS.
- [ ] APIs.
- [ ] Save button on catalog + detail.
- [ ] Dashboard saved section.
- [ ] Staging verification.
