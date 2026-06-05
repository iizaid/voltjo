# Engine & Fuel — BYD Sealion 05 DM-i 2025

Format: value / source / ref / page / market / confidence / notes. Source IDs → `03 - Jordan Market/sources.md`.
Corrected access date: **2026-06-05**.

## Engine
- value: 1.5 L naturally aspirated petrol engine, BYD472QC family
- source: L2/L3
- market: China / Sealion 05 DM-i SUV
- confidence: database
- notes: Use only for Sealion 05 SUV / 海狮05 DM-i. Do not import Seal 05 sedan values as final.

## Engine output
- value: approximately 74 kW / 99–101 hp class
- source: L2/L3
- market: China
- confidence: database / needs_review for exact trim
- notes: Keep exact kW/hp per trim sourced where available.

## Drive motor
- value: approximately 120 kW class
- source: L2/L3
- market: China
- confidence: database / needs_review for exact trim
- notes: Do not use one-off conflicting sedan/export snippets as final.

## Combined system power
- value: unknown / needs_review
- source: pending official spec or clean config table
- confidence: needs_review
- notes: Do not sum engine + motor power. DM-i combined output must come from source.

## Fuel tank
- value: needs_review for exact Sealion 05 SUV trim
- source: L2/L3
- confidence: needs_review
- notes: Do not use Seal 05 sedan 65 L value as final for Sealion 05 SUV unless a Sealion 05 SUV source confirms it.

## Fuel type
- value: petrol + electric (PHEV)
- source: L1/L2/L3
- confidence: database

## Hybrid system
- value: BYD DM-i plug-in hybrid architecture
- source: L1/L2/L3
- market: China
- confidence: database

## Transmission / drivetrain
- value: E-CVT / FWD
- source: L2/L3
- confidence: database / needs_review for exact trim

## Fuel consumption
- value: source-dependent; needs_review for exact trim and test standard
- source: pending clean official/config extraction
- confidence: needs_review
- notes: Do not present one headline number as universal. Always label CLTC/WLTC/WLTP/NEDC if used.

## Combined range
- value: needs_review for exact trim and test standard
- source: L2/L3
- confidence: needs_review
- notes: Some launch articles mention very long combined range for Sealion 05 DM-i; keep as market/test-standard labeled context, not Jordan final.

## Jordan handling rule
- value: classify by import origin first
- notes: Jordan units may be China/GCC/EU imports. Apply source-market engine/fuel data only after identifying the unit's origin/build sheet.