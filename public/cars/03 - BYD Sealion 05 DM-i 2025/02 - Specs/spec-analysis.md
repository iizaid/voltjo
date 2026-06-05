# Spec Analysis — BYD Sealion 05 DM-i 2025

Research pass 1. Access date: 2026-06-04. Source IDs → `03 - Jordan Market/sources.md`.

## The core problem: which car is "Sealion 05 DM-i 2025"?
Sources describe **two generations** under near-identical names:
- **A) China 2025款 海狮05 DM-i** — trims **75KM / 115KM** (CLTC), 1.5L NA, smaller batteries. [L4]
- **B) New-generation Sealion 05 DM-i** (launched ~Apr 2026) — trims **55 / 220 / 305 km** (CLTC), batteries
  **7.68 / 26.628 / 34.275 kWh**, **65 L** tank, dims **4780×1837×1515**, WB 2718. [L5/L1]
- The **Jordan-sold "Seal 05 DM-i 55 KM"** (MEE Auto, L1) matches **(B)** — 7.68 kWh, 65 L, 4780 mm.
- The **export "Sealion 5 DM-i"** (Europe/Thailand) is quoted at **18.3 kWh / 81–95 km (WLTC/WLTP)** [L7], which
  resembles the **115KM** tier of (A) on a different standard.

→ **The generation/trim identity is unresolved.** Treat battery, EV range, and tank as `needs_review`, and
record each variant with its market + standard rather than picking one "final" number.

## What is consistent across sources (higher confidence)
- **Body:** compact PHEV SUV, 5-seat, FWD. [L1/L4]
- **Engine:** 1.5 L naturally-aspirated, BYD472QC, ~74 kW (~99–101 hp). [L1/L4]
- **Drive motor:** ~120 kW. [L1/L4] (One Jordan search snippet said 145 kW/300 Nm → needs_review; not used as final.)
- **Battery chemistry:** LFP Blade. [L1/L7]
- **Hybrid:** BYD DM-i (5th-gen DM). [search/L4]
- **Sold in Jordan** as "Seal 05 DM-i". [L1/L2/L3]

## Conflicts to carry forward
- **EV range standard:** CLTC (China) vs WLTC (Jordan listing, 81 km) vs WLTP (Europe, 95 km) — not comparable.
- **Battery:** 7.68 (55KM new-gen) / ~12.9–18.3 (China 2025款 75/115KM) / 18.3 (export) / 26.6 / 34.3 (new-gen long range).
- **Tank:** 65 L (new-gen / MEE Jordan) vs unknown for China 2025款.
- **Motor power:** 120 kW (most) vs 145 kW (one snippet).
- **Power type:** engine-only ~74 kW/99 hp vs motor 120 kW/163 hp vs **combined system power not cleanly published** → needs_review.

## Usable now (with labels)
Body, engine (1.5L NA ~74 kW), LFP Blade, DM-i, FWD/E-CVT, Jordan presence + name. Battery/range/tank/connector/power-combined = `needs_review`.
