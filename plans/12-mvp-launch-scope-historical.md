# MVP Launch Scope

> This document is historical. It records the audit state at the time it was written. Check `plans/00-current-project-handoff.md` and the current repository before assuming any item is still open.

## Public launch pages

- `/vehicles`
- `/charging-map`
- `/charging-calculator`
- `/assistant`
- `/account`

## Out of launch scope

- `/compare`
- saved cars
- reports
- payments
- real AI provider integration
- admin CMS

## Supported vehicles foundation

- run `supabase/migrations/005_supported_vehicles_mvp.sql`
- seed data is MVP/sample data only
- all public claims must still be verified before marketing or dealer-facing publication

## Charging map MVP

- `/charging-map` now includes an interactive MapLibre MVP
- geolocation is browser-initiated only from the first-visit modal or the map locate control
- coordinates are not stored in localStorage
- guest location is not persisted server-side
- authenticated users can optionally save location only with explicit consent
- location persistence depends on `supabase/migrations/006_user_location_preferences.sql`
- charging station visibility still depends on verified rows in `charging_locations`
- no fake charging stations are rendered when no verified rows exist
- public UI must not show developer setup or migration messages
- the first-visit geolocation prompt is dismissible and remembered without storing coordinates
- the charging map page should not contain developer empty-state cards or extra assistant CTA buttons

## Navigation policy for launch

Only production-ready public links should remain visible:

- السيارات المدعومة
- خريطة الشحن
- حاسبة الشحن
- المساعد الذكي
- الأسعار
