# MVP Launch Scope

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
- user geolocation is browser-only and is not stored in localStorage, Supabase, or the server
- charging station visibility still depends on verified rows in `charging_locations`
- public UI must not show developer setup or migration messages
- the first-visit geolocation prompt is dismissible and remembered without storing coordinates
- authenticated users can optionally save location only with explicit consent

## Navigation policy for launch

Only production-ready public links should remain visible:

- السيارات المدعومة
- خريطة الشحن
- حاسبة الشحن
- المساعد الذكي
- الأسعار
