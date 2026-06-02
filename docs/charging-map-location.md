# Charging Map Location

## Current behavior

- geolocation is initiated from the browser only after the user clicks `تفعيل موقعي`
- the first visit to `/charging-map` shows a centered permission modal
- the modal can be dismissed with `المتابعة بدون تحديد الموقع`
- closing the modal with `X` behaves like dismissal without location
- dismissal is remembered in `localStorage` only through:
  - `voltjo_charging_map_location_prompt_dismissed`
  - a dismissal timestamp
- coordinates are not stored in `localStorage`
- a custom locate control remains available on the map for requesting location later

## Guest behavior

- guests can use live browser geolocation inside the map
- the map can center on the guest location and show `موقعك الحالي`
- guest coordinates are not persisted server-side
- if the guest checks the save-location option, the UI explains that login is required first

## Authenticated persistence

- authenticated users can explicitly opt in through:
  - `احفظ موقعي لهذا الحساب لتجربة أدق لاحقًا`
- only after explicit consent, the app sends the browser coordinates to:
  - `POST /api/account/location-preferences`
- saved data is written to:
  - `profiles.location_preferences`
- stored shape is limited to:
  - `latitude`
  - `longitude`
  - `accuracy_meters`
  - `captured_at`
  - `source`
  - `consent`

## What is not stored

- no raw browser geolocation object
- no background tracking
- no location history array
- no device identifiers
- no IP-based location storage

## Validation and safety

- saving location requires an authenticated Supabase user
- the route never accepts `user_id` from the client
- latitude must be between `-90` and `90`
- longitude must be between `-180` and `180`
- accuracy is validated if present
- the route returns Arabic error messages only
- raw Supabase errors are not exposed to the UI
- responses use `Cache-Control: no-store, max-age=0`

## Charging station source

- charging station markers come from `public.charging_locations`
- if no station rows exist, the page still shows the map without developer empty-state cards
- no fake charging stations are rendered
