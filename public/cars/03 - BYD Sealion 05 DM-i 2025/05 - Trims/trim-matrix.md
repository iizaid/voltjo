# Trim Matrix — BYD Sealion 05 DM-i 2025 (cross-market / cross-generation)

Source IDs → `03 - Jordan Market/sources.md`. Access date: 2026-06-04.
`?` = not captured → needs_review (not zero). **Two generations are shown — keep them separate.**

> Jordan name = "Seal 05 DM-i". The Jordan-listed "55 KM" row matches the **new generation**, not the China 2025款.

| Market | Model name | Trim | Year/Gen | Battery (kWh) | EV range (km) | Range std | Fuel tank (L) | Engine | Motor power | Drive | Trans | Charge port | AC | DC | Body | Source | Confidence | Notes |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Jordan | Seal 05 DM-i | 55 KM | new-gen (sold 2025/26) | 7.68 | 55 | CLTC | 65 | 1.5L NA BYD472QC 74 kW | 120 kW (~163 hp sys) | FWD | E-CVT | ? | ? | ? | compact SUV | L1 | dealer / needs_review | MEE Auto; 4780×1837×1515, WB 2718; "available now" |
| China | 海狮05 DM-i | 75KM 豪华型/尊贵型 | 2025款 | ? (~12.9) | 75 | CLTC | ? | 1.5L NA ~74 kW | ~120 kW | FWD | E-CVT | GB/T | ? | ? | compact SUV | L4 | database | exact kWh not extracted |
| China | 海狮05 DM-i | 115KM 尊荣型/旗舰型 | 2025款 | ? (~18.3) | 115 | CLTC | ? | 1.5L NA ~74 kW | ~120 kW | FWD | E-CVT | GB/T | ? | ? | compact SUV | L4 | database | + 智驾版 (smart-driving) versions |
| China | Sealion 05 DM-i | (220/305 km) | new-gen 2026 | 26.628 / 34.275 | 220 / 305 | CLTC | 65 | 1.5L NA | ? | FWD | E-CVT | GB/T | ? | ? (闪充/flash) | compact SUV | L5 | database | from RMB 97,900; ~2,105 km combined |
| Europe | Sealion 5 DM-i | (tbd) | export | 18.3 | 95 | WLTP | ? | 1.5L PHEV | ? | FWD | E-CVT | Type 2 + CCS2 (export) | ? | ? | compact SUV | L7/L8 | official/database → needs_review | Thailand RM93k; EU official page |
| Export | Seal 05 DM-i | (tbd) | export | 15.87 | ? | ? | ? | 1.5L | ~120 kW (163 hp) | FWD | E-CVT | ? | ? | ? | compact SUV | L6 | database / needs_review | auto-data.net; battery figure differs |

## Key reads
- **Battery is the messiest field:** 7.68 / ~12.9 / ~18.3 / 15.87 / 26.628 / 34.275 kWh across gen+trim+market. Do not pick one as "the" value.
- **Range standard varies:** CLTC (China) / WLTP (EU 95) / WLTC (one Jordan snippet 81). Always label.
- **Consistent:** 1.5L NA BYD472QC ~74 kW, ~120 kW motor, LFP Blade, FWD, E-CVT, compact SUV.
- **Connector:** China GB/T; export Type 2 + CCS2; Jordan unconfirmed.
- **Motor power conflict:** 120 kW (L1/L4) vs 145 kW (one snippet, R3) → needs_review.
