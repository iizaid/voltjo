# Spec Analysis — BYD Sealion 05 DM-i 2025

Corrected deep pass. Access date: **2026-06-05**. Source IDs → `03 - Jordan Market/sources.md`.

## Correct target
This file is for **BYD Sealion 05 DM-i / 海狮05 DM-i**, a compact crossover SUV. It is **not** BYD Seal 05 DM-i / 海豹05, which is a compact sedan.

## What is strongly established
- **Vehicle class:** compact crossover SUV / PHEV.
- **Family:** Ocean-series SUV, sister/counterpart to BYD Song Pro DM-i.
- **Powertrain:** BYD DM-i plug-in hybrid, 1.5L BYD472QC naturally aspirated engine, electric motor, FWD, E-CVT.
- **China 2025 trim families:** 75KM and 115KM versions, with standard and smart-driving/facelift variants.
- **Battery family:** LFP Blade battery; commonly tracked around 12.9 kWh for 75KM and 18.3 kWh for 115KM family, but exact per-trim extraction remains `needs_review` until confirmed from a clean config table.

## What was corrected
The previous pass mixed in data from **BYD Seal 05 DM-i sedan**. The following values are now rejected for this SUV folder unless a future source explicitly proves a Sealion 05 SUV trim with those values:
- 7.68 kWh battery
- 55 km CLTC range
- 65 L fuel tank
- 4780 × 1837 × 1515 mm sedan-like dimensions
- MEE Auto “Seal 05 DM-i 55 KM” page

## First-generation / China 2025 Sealion 05 DM-i SUV
Use as the main data track for this folder:
- China name: 海狮05 DM-i
- trims: 75KM / 115KM families
- model year: 2025款, including 智驾版 / smart-driving facelift entries
- confidence: database
- source: S1/L2 China configuration databases

## Possible export track
- BYD Europe **Sealion 5 DM-i** exists as an official EU compact SUV model.
- Treat it as **official for Europe** but only `needs_review` as exact equivalence to China Sealion 05 until a spec bridge is found.
- Do not overwrite China/Jordan data with EU WLTP specs unless the vehicle is proven to be EU/export stock.

## Jordan handling rule
Jordan likely receives China/GCC/EU import stock, not a Jordan-specific engineering version. Therefore, do not search for “Jordan-only specs” as if they must exist. Instead, classify each Jordan unit by origin:
- China-direct: likely China trim/connector/specs
- EU/GCC/export: likely export trim/connector/specs
- unknown import: keep battery/range/connector `needs_review`

## Current usable facts for database seed
- brand: BYD
- model: Sealion 05 DM-i
- chinese_name: 海狮05 DM-i
- body: compact SUV
- powertrain: PHEV / DM-i
- engine: 1.5L BYD472QC NA
- drivetrain: FWD
- transmission: E-CVT
- confidence: partial / needs_review

## Must remain needs_review/null
- exact Jordan trim
- battery_kwh
- electric_range_km and standard
- fuel_tank_l
- charging_port
- ac_charging_kw
- dc_fast_charging
- tire pressure
- warranty
- maintenance intervals
- official owner manual