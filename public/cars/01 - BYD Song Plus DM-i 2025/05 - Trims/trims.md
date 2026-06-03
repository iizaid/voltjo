# Vehicle Trims — BYD Song Plus DM-i 2025

Source IDs → `03 - Jordan Market/sources.md`. Access date: 2026-06-03 (pass 2).
See `trim-matrix.md` for the cross-market table and `trim-equivalence.md` for the alias mapping.

## Confirmed Jordan trims

- **Song Plus DM-i 112KM Premium 2025**
  - Source: S1 (Jordan listing) + S13 (Bustami & Saheb, official BYD Jordan dealer)
  - Confidence: dealer
  - Notes: 18.3 kWh Blade battery, 112 km EV range (NEDC), 60 L tank, ~218 HP system, 12.8" rotating
    screen, DiPilot. Price ~28,900 JOD (VAT incl.). This is the trim clearly surfaced in Jordan
    listings and on the dealer's e-commerce site. Whether the dealer also offers 75/160 km trims is
    not confirmed (full lineup = needs_review).

## Possible China trims (DM 5.0, 2025)

- **Song Plus DM-i 75KM** — battery 12.9 kWh · market China · source S2/S12 · confidence database
  - Notes: Names seen: "75KM Deluxe/Luxury". Not seen in Jordan listings.
- **Song Plus DM-i 112KM** — battery 18.3 kWh · market China · source S2/S12 · confidence database
  - Notes: Names seen: "112KM Honor/Premium". Matches the Jordan trim's battery/range.
- **Song Plus DM-i 160KM** — battery 26.6 kWh · market China · source S2/S12 · confidence database
  - Notes: Names seen: "160KM Flagship". China price band ~¥135,800–175,800 across the lineup.

## Possible export-alias trims

- **Seal U DM-i — Boost / Design / Comfort** (Europe) — 18.3 / 18.3 / 26.6 kWh · source S5 · needs_review
  - Notes: European trim names; Type 2 + CCS2. Equipment/naming differ from Jordan.
- **Sealion 6 DM-i — Dynamic / Premium** (Australia) — source S4 · needs_review
  - Notes: **Dynamic = Xiaoyun 1.5L NA engine; Premium = 1.5L turbo engine** (engine differs by trim!).
    BYD Blade battery, Type 2 (7 kW) AC + CCS2 (18 kW) DC, V2L adaptor. ADR 81/02 standard.

## Notes
- Only the Jordan "112KM Premium" trim name is treated as **confirmed**; all others are `database`/`needs_review`.
- No per-trim folders created yet (per task instruction).
- **Trim differences that matter for VoltJo:**
  - Battery/range differ by trim: 12.9 kWh/75 km · 18.3 kWh/112 km · 26.6 kWh/160 km.
  - **Charging port differs by market**, not trim: GB/T (China) vs Type 2 + CCS2 (export/GCC).
  - **Engine differs by trim** in export spec: NA 1.5L vs turbo 1.5L (S4). Confirm which the Jordan 112KM Premium uses.
- If a Jordan unit is found with a different battery/charger/engine/port, document it here and mark `needs_review` until sourced.
