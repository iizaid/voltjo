# Battery & Charging — BYD Song Plus DM-i 2025

Format: value / source / source file / page / market / confidence / notes.
Source IDs → `03 - Jordan Market/sources.md`. Access date: 2026-06-03 (pass 2).

> ⚠️ The **charging port differs by market** (China GB/T vs export Type 2 + CCS2). The Jordan
> unit's port is still not confirmed by primary evidence — see "Charging port" below.

## Battery capacity (Jordan 112KM trim)
- value: 18.3 kWh · source: S1, S13, S2 · page: n/a · market: Jordan/China · confidence: dealer
- notes: BYD Blade (LFP). Corresponds to the 112 km EV-range variant.

## Battery capacity (other variants)
- value: 12.9 kWh (75 km) and 26.6 kWh (160 km) · source: S2, S12 · market: China · confidence: database
- notes: China variants; not seen in Jordan listings.

## Battery chemistry
- value: BYD Blade battery (LFP / lithium iron phosphate) · source: S4 (Sealion 6 spec) · file: BYD-Sealion-6-DMi-Specs-AU-source-alias.pdf · page: 1 · market: AU export · confidence: official (export) → needs_review (Jordan)
- notes: Platform-level; very likely identical chemistry in Jordan.

## Electric-only range
- value: 112 km (NEDC) for the 18.3 kWh trim · source: S1, S2 · market: Jordan/China · confidence: dealer
- notes: NEDC; real-world lower. 75/160 km for the 12.9/26.6 kWh variants. EU uses WLTP, AU uses ADR — not directly comparable.

## AC charging
- value: Type 2 connector, **7 kW** (export) · source: S4 · file: BYD-Sealion-6-DMi-Specs-AU-source-alias.pdf · page: 1 · market: AU export · confidence: official (export) → needs_review (Jordan)
- notes: China Song Plus uses GB/T AC. Jordan AC speed unconfirmed (export figure shown).

## DC fast charging
- value: CCS2 connector, **18 kW** (export) · source: S4 · file: BYD-Sealion-6-DMi-Specs-AU-source-alias.pdf · page: 1 · market: AU export · confidence: official (export) → needs_review (Jordan)
- notes: Modest DC rate typical for a PHEV. China uses GB/T DC. Jordan DC support/speed unconfirmed.

## Charging port type (Jordan) — CONDITIONAL
- value: needs_review — **export/GCC/dealer units almost certainly Type 2 (AC) + CCS2 (DC); China-direct imports use GB/T**
- source: S15 (BYD GCC uses IEC 62196 Type 2 + CCS2; China = GB/T), S4 (export confirmed), S2 (China GB/T), S13 (official Jordan dealer = GCC-spec channel)
- page: n/a · market: Jordan · confidence: estimate / needs_review
- notes: Reasoning: Bustami & Saheb is BYD's official Jordan dealer (S13) and GCC/export BYD cars use Type 2 + CCS2 (S15), so **dealer stock is most likely Type 2 + CCS2**. But parallel/China-direct imports would be GB/T. No port photo or Jordan build sheet obtained → keep as needs_review, do not state as final.

## V2L (vehicle-to-load)
- value: V2L discharge adaptor available (export) · source: S4 · page: 1 · market: AU export · confidence: official (export) → needs_review
- notes: Availability in Jordan trim unconfirmed.

## Home charging
- value: Supported via AC (Type 2 on export units). Exact home-charge time unknown. · source: S4/S5 · market: export · confidence: estimate
- notes: Time depends on battery variant and AC rate; not verified for Jordan.

## Battery & charging safety
- value: See `safety-and-warnings.md` — page-cited from the official EU manual (charging safety pp.97–100, HV pp.41–42, fault table p.100).
- source: S5 · file: BYD-Seal-U-DMi-Owner-Manual-EU-source-alias.pdf · page: 97–100, 41–42 · market: EU export · confidence: official (EU) → needs_review
