# Trim / Name Equivalence — BYD Sealion 05 DM-i 2025

Source IDs → `03 - Jordan Market/sources.md`. Access date: 2026-06-04.

## Same vehicle, different market names (aliases)
- **China:** 海狮05 DM-i = **Sealion 05 DM-i**
- **Europe:** **Sealion 5 DM-i** (official BYD EU) [L8]
- **Jordan / Thailand:** **Seal 05 DM-i** [L1/L7]
- These are the **same vehicle** under different market names. Use "Seal 05 DM-i" as the Jordan-facing name.

## CONTAMINATION BLOCKLIST — these are DIFFERENT vehicles, do NOT merge
- **Sealion 6 DM-i** = the BYD **Song Plus** export (vehicle 01) — larger SUV. NOT this car.
- **Sealion 07** — a larger EV SUV. NOT this car.
- **Seal U DM-i** = also Song Plus export naming. NOT this car.
- **Seal 06 / Seal 6 Touring** — Seal-family sedan/estate. NOT this car.
- **Song Plus DM-i** (vehicle 01) / **Song Pro DM-i** (vehicle 02) — different Song-family SUVs. NOT this car.
- One-digit/one-word name differences (5 vs 6 vs 07) are *different vehicles*. Require a source that says exactly "Sealion 05 / Seal 05 / Sealion 5 DM-i".

## GENERATION SPLIT — two different cars share this name
- **A) 2025款 海狮05 DM-i** — trims 75KM/115KM, CLTC, smaller battery. [L4]
- **B) New-generation Sealion 05 DM-i** (~Apr 2026) — trims 55/220/305 km, 7.68/26.628/34.275 kWh, 65 L, 4780 mm. [L5]
- The Jordan "Seal 05 DM-i 55 KM" (L1) matches **(B)**. Do **not** blend A and B figures.

## What can be reused safely
- Across the alias names (China/EU/Jordan) within the **same generation**: body type, engine family (1.5L NA), LFP Blade, DM-i architecture.

## What must NOT be reused
- **Any Sealion 6 / 07 / Seal U / Song data** (different vehicles).
- **Cross-generation** battery/range/tank/dimensions (A vs B).
- **Cross-standard** range numbers (CLTC vs WLTC vs WLTP).
- **Charging connector** across markets (China GB/T vs export Type 2 + CCS2) without per-unit evidence.

## Differences summary
- **Trim names:** China 75KM/115KM 豪华/尊贵/尊荣/旗舰 (+智驾版) ↔ new-gen 55/220/305 ↔ Jordan "55 KM" ↔ EU trims (tbd).
- **Battery/range/tank:** vary by generation (see split above).
- **Test standard:** CLTC (China) / WLTC (Jordan listing) / WLTP (EU).
- **Confidence:** China 2025款 `database`; new-gen `database`; Jordan `dealer`/`needs_review`.

## Reuse rule for VoltJo AI
Treat "Sealion 05 / Seal 05 / Sealion 5 DM-i" as one vehicle with **two generations**; never import data from
Sealion 6/07/Seal U/Song models; always carry the market + test standard; default to `needs_review` when the
generation or connector is unclear.
