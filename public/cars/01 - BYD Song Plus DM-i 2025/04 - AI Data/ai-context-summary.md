# AI Context Summary — BYD Song Plus DM-i 2025

Compact, labeled context for VoltJo AI. Source IDs → `03 - Jordan Market/sources.md`.
Access date: 2026-06-03 (pass 2).

## Safe facts
- BYD Song Plus DM-i is a plug-in hybrid (DM-i) SUV. [S1/S2, dealer/database]
- Sold in Jordan by the **official BYD dealer Bustami & Saheb** (appointed 2023); listed trim "Song Plus DM-i 112KM Premium 2025", ~28,900 JOD. [S1/S13, dealer]
- 112KM trim: **18.3 kWh BYD Blade (LFP)** battery, **112 km** EV range (NEDC), **60 L** tank, **1.5 L** petrol engine, runs on petrol + grid charge. [S1/S2/S4, dealer/official-export]
- Same platform as Seal U DM-i (Europe) and Sealion 6 DM-i (Australia). [S6, database]
- Official safety, charging, towing, jump-start, and maintenance guidance is available (from the EU Seal U manual) — see safety/maintenance files with page numbers.

## Conditional facts (state the condition when answering)
- **Charging port:** dealer/GCC stock almost certainly **Type 2 (AC) + CCS2 (DC)**; China-direct imports use **GB/T**. [S4/S15/S13 — estimate/needs_review]
- **AC/DC speed:** export spec = 7 kW AC / 18 kW DC (Sealion 6). [S4 — needs_review for Jordan]
- **Engine:** 1.5 L, but NA vs turbo **differs by trim** (AU: Dynamic NA / Premium turbo). [S4 — needs_review for Jordan]
- **Power:** ~218 HP combined system vs ~101 HP engine-alone — clarify which. [S1/S2]
- **Battery tiers:** 12.9/18.3/26.6 kWh = 75/112/160 km; only 18.3/112 seen in Jordan. [S2]
- **Maintenance intervals** (engine oil & air filter 12mo/15,000km; brake fluid & coolant 24mo/30,000km; spark plug 45,000km) come from the EU manual — likely shared, but Jordan warranty/service terms differ. [S5 — official EU → needs_review Jordan]
- **Tire pressure** 250/250 kPa (EU manual) — verify on the Jordan car's door placard. [S5 — needs_review]

## Market-specific facts (do not cross-apply)
- Connector: China GB/T ↔ export Type 2 + CCS2.
- Range/economy test standards: China NEDC ↔ EU WLTP ↔ AU ADR 81/02 (not comparable).
- Trim names: China 75/112/160KM ↔ EU Boost/Design/Comfort ↔ AU Dynamic/Premium ↔ Jordan "112KM Premium".

## Unknowns
- Actual charging connector on a Jordan unit (no photo/build sheet).
- Jordan warranty terms; full Jordan trim lineup; whether Jordan 112KM Premium is NA or turbo.
- A single verifiable economy/combined-range figure (sources conflict: 3.9 / 4.95 / 6.9 L/100km; 890 / 1500 km).
- Exact dimensions (AU spec PDF dims were scrambled on extraction).

## Do-not-claim
- Do NOT state the Jordan charging port as a hard fact — give the conditional and ask about import source.
- Do NOT quote one economy/range number as definitive (note the test standard).
- Do NOT present EU/AU/China trims, equipment, or port as the Jordan spec.
- Do NOT present EU-manual tire pressure or warranty as guaranteed for Jordan.

## Suggested assistant behaviour
- **Charging port:** "On official-dealer (Bustami & Saheb) cars it's almost certainly Type 2 + CCS2; on China-direct imports it's GB/T. Is your car from the dealer or a parallel import?" Do not answer as a final fact otherwise.
- **Maintenance:** answer from the manual-derived schedule, but add that Jordan warranty/service terms should be confirmed with the dealer.
- **Fuel economy / range:** explain figures depend on test standard (NEDC/WLTP/ADR) and real-world use.
- **Trims:** present Jordan-confirmed trim separately from China/EU/AU trims.
- **Seal U / Sealion 6 questions:** explain they are export aliases of the same platform, but port, equipment, and trim names are not always identical.
- **Engine:** note the 1.5 L may be NA or turbo depending on trim; confirm for the specific Jordan car.
