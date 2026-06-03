# Trim / Name Equivalence — BYD Song Plus DM-i 2025

How the names relate, and what may be reused safely. Source IDs → `03 - Jordan Market/sources.md`.
Access date: 2026-06-03. Platform identity basis: S6 (MarkLines), S4/S5 (official export docs).

## Name → market map
- **Song Plus DM-i** = China / GCC / **Jordan** / common name (our canonical identity).
- **Seal U DM-i** = **Europe** export name.
- **Sealion 6 DM-i** = **Australia** export name.
- **Seal 6 DM-i Touring** = related **estate/wagon body** — NOT the same SUV; do not equate.

## Per-alias assessment

### Seal U DM-i (Europe) — S5 (manual downloaded)
- Same platform? **Yes.** Same body? **Yes (SUV).**
- Safe to reuse: high-voltage safety, charging safety behaviour, battery thermal guidance, towing
  principles, jump-start caution, maintenance schedule structure & most intervals, fluid guidance.
- Do NOT reuse for Jordan: exact charging connector confirmation (EU = Type 2 + CCS2), exact printed
  tire pressure value, equipment lists, trim names (Boost/Design/Comfort), warranty.
- Port: Type 2 (AC) + CCS2 (DC). Confidence: official (EU) → needs_review (Jordan).

### Sealion 6 DM-i (Australia) — S4 (spec downloaded)
- Same platform? **Yes.** Same body? **Yes (SUV).**
- Safe to reuse: confirmation of Blade (LFP) battery, export charge architecture (Type 2 7 kW / CCS2 18 kW),
  V2L adaptor existence, the NA-vs-turbo engine split by trim.
- Do NOT reuse for Jordan: trim names (Dynamic/Premium), ADR-based range/economy figures, dimensions
  (scrambled in extraction), equipment lists, warranty.
- Port: Type 2 + CCS2. Confidence: official (AU) → needs_review (Jordan).

### Seal 6 DM-i Touring (UK) — S8
- Same platform family? Related, but **different body (estate/wagon)**.
- Safe to reuse: almost nothing structural. Body, dimensions, boot, and some equipment differ.
- Treat as: needs_review / mostly excluded.

## Differences summary (what changes across aliases)
- **Port:** China GB/T ↔ export Type 2 + CCS2 (biggest functional difference for Jordan users).
- **Trim names:** China (75/112/160 KM Deluxe/Honor/Flagship) ↔ EU (Boost/Design/Comfort) ↔ AU (Dynamic/Premium) ↔ Jordan ("112KM Premium").
- **Engine:** NA 1.5L vs turbo 1.5L by trim (export evidence).
- **Equipment & infotainment:** vary by market/trim.
- **Test standard:** China NEDC ↔ EU WLTP ↔ AU ADR 81/02 — range/economy numbers are NOT directly comparable.

## Reuse rule for VoltJo AI
Battery tiers, body type, hybrid architecture, and safety/maintenance principles transfer well.
**Connector type, exact range/economy numbers, tire pressure value, equipment, and warranty do NOT
transfer** — these stay `needs_review` for Jordan until a Jordan-specific source confirms them.
