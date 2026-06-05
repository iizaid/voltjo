# Battery & Charging — BYD Sealion 05 DM-i 2025

Format: value / source / ref / page / market / confidence / notes. Source IDs → `03 - Jordan Market/sources.md`.
Access date: 2026-06-04.

> ⚠️ Battery and range are **unresolved** — they differ by generation, trim, market, and test standard.
> Do not present a single "final" value. Connector for Jordan is unknown.

## Battery capacity (record all variants; none final)
- value: 7.68 kWh (Jordan "55 KM" / new-gen entry) · source: L1 · market: Jordan · confidence: dealer / needs_review
- value: ~12.9 kWh (China 2025款 75KM) / ~18.3 kWh (China 2025款 115KM) · source: L4 · market: China · confidence: database (exact kWh not extracted)
- value: 26.628 / 34.275 kWh (new-gen 220/305 km) · source: L5 · market: China · confidence: database
- value: 18.3 kWh (EU "Sealion 5") / 15.87 kWh (auto-data "Seal 05") · source: L7/L6 · market: export · confidence: database/needs_review
- notes: The spread (7.68→34.275) reflects different cars/trims under similar names. Resolve generation first.

## Battery chemistry
- value: LFP (lithium iron phosphate), BYD Blade · source: L1/L7 · market: Jordan/export · confidence: dealer/database
- notes: Consistent across sources; safe.

## EV range (always label standard)
- value: 55 km CLTC (Jordan 55KM) / 75 & 115 km CLTC (China 2025款) / 220 & 305 km CLTC (new-gen) / 95 km WLTP (EU) / 81 km WLTC (one Jordan snippet)
- source: L1/L4/L5/L7 · confidence: database / needs_review
- notes: CLTC ≠ WLTP ≠ WLTC ≠ real-world. Do not compare across standards.

## Charging port type
- value: China = GB/T; export (EU) = Type 2 + CCS2; **Jordan = unknown**
- source: L8 (export), general (China GB/T) · market: China/EU/Jordan · confidence: database (China/EU) / needs_review (Jordan)
- notes: MEE Auto page did not state the connector. Highest-value Jordan gap.

## AC charging
- value: unknown (kW not sourced) · source: pending · confidence: unknown

## DC fast charging
- value: unknown for Jordan; new-gen China supports 闪充 (flash/DC charge) · source: L5 · market: China · confidence: database/needs_review
- notes: DC support may be trim-dependent; not confirmed for the Jordan unit.

## V2L
- value: unknown · source: pending · confidence: unknown

## Home charging
- value: AC home charging supported (PHEV) · source: general · confidence: estimate
- notes: Time depends on battery/charger; not sourced.

## Jordan connector status & evidence needed
- status: **needs_review**. To close: 1) charging-port photo on a Jordan unit; 2) dealer confirmation (MEE/BSG);
  3) VIN/build sheet; 4) official Jordan/GCC spec or manual; 5) physical inspection.

## Safety
- value: see `safety-and-warnings.md` — no model manual yet; platform-level only (needs_review).
