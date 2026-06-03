# Trim Matrix — BYD Song Plus DM-i 2025 (cross-market)

Source IDs → `03 - Jordan Market/sources.md`. Access date: 2026-06-03.
`?` = not captured / scrambled in source → treat as needs_review. Do not read `?` as zero.

> Read horizontally per row. Jordan is the only market where the trim is dealer-confirmed; all
> others are database/export and must NOT be presented as Jordan specs.

| Market | Model name | Trim | Battery (kWh) | EV range (km) | Range std | Fuel tank (L) | Engine | System power | Drive | Trans | Charge port | AC speed | DC speed | Body | Source | Confidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Jordan | Song Plus DM-i | 112KM Premium | 18.3 | 112 | NEDC | 60 | 1.5L petrol | ~218 HP | FWD | E-CVT | ? (GB/T or CCS2) | ? | ? | SUV | S1, S13 | dealer (port=needs_review) | 12.8" screen, DiPilot, ~28,900 JOD |
| China | 宋PLUS DM-i / Song Plus DM-i | 75KM (Deluxe) | 12.9 | 75 | NEDC | 60 | 1.5L petrol | ? | FWD | E-CVT | GB/T | ? | ? | SUV | S2, S12 | database | Entry battery variant |
| China | Song Plus DM-i | 112KM (Honor) | 18.3 | 112 | NEDC | 60 | 1.5L petrol | ~160 kW system (~218 HP) | FWD | E-CVT | GB/T | ? | ? | SUV | S2, S12 | database | Same battery/range as Jordan trim |
| China | Song Plus DM-i | 160KM (Flagship) | 26.6 | 160 | NEDC | 60 | 1.5L petrol | ? | FWD/AWD? | E-CVT | GB/T | ? | ? | SUV | S2, S12 | database | Long-range variant; AWD option unconfirmed |
| GCC (KW) | Song Plus DM-i | (trim n/a) | ? | ? | NEDC | ? | 1.5L | ? | FWD | E-CVT | Type 2 + CCS2 (export) | ? | ? | SUV | S3, S15 | official (low detail) | Page lists only 890 km combined, 6.9 L/100km |
| Europe | Seal U DM-i | Boost | 18.3 | ? | WLTP | ? | 1.5L | ? | FWD | E-CVT | Type 2 | ? | CCS2 | SUV | S5 | official (export)→needs_review | EU trim name |
| Europe | Seal U DM-i | Design | 18.3 | ? | WLTP | ? | 1.5L | ? | FWD | E-CVT | Type 2 | ? | CCS2 | SUV | S5 | official (export)→needs_review | EU trim name |
| Europe | Seal U DM-i | Comfort | 26.6 | ? | WLTP | ? | 1.5L | ? | FWD/AWD? | E-CVT | Type 2 | ? | CCS2 | SUV | S5 | official (export)→needs_review | Long-range EU trim |
| Australia | Sealion 6 DM-i | Dynamic | ? (Blade LFP) | ? | ADR 81/02 | ? | Xiaoyun 1.5L NA | ? | FWD | E-CVT | Type 2 (7 kW) | 7 kW | CCS2 (18 kW) | SUV | S4 | official (export)→needs_review | NA engine; V2L adaptor |
| Australia | Sealion 6 DM-i | Premium | ? (Blade LFP) | ? | ADR 81/02 | ? | 1.5L turbo | ? | FWD/AWD? | E-CVT | Type 2 (7 kW) | 7 kW | CCS2 (18 kW) | SUV | S4 | official (export)→needs_review | **Turbo engine** (differs from Dynamic) |

## Key cross-market reads
- **Battery/range tiers are consistent** across markets: 12.9/75, 18.3/112, 26.6/160. The Jordan 112KM = the global 18.3 kWh tier.
- **Charging port splits by market, not trim:** China = GB/T; export (EU/AU/GCC) = Type 2 + CCS2. Jordan unit depends on import channel → needs_review.
- **Engine splits by trim** in export spec: Sealion 6 Dynamic = NA 1.5L; Premium = turbo 1.5L. The Jordan trim is named "Premium" but Jordan naming ≠ AU naming — confirm engine for the Jordan car.
- **AC/DC speeds** only cleanly sourced for AU (7 kW AC / 18 kW DC); other cells `?`.
- Dimensions deliberately omitted — the AU spec PDF's 2-column dims were scrambled on extraction (read the PDF directly).
