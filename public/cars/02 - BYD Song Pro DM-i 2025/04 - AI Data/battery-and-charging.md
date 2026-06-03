# Battery & Charging — BYD Song Pro DM-i 2025

Format: value / source / ref / page / market / confidence / notes. Source IDs → `03 - Jordan Market/sources.md`.
Access date: 2026-06-04.

> ⚠️ Two battery tiers; **DC fast charging exists only on the 115KM trims**. Range is **CLTC**.
> Jordan connector unconfirmed (likely GB/T parallel import). Do not borrow Song Plus charging data.

## Battery capacity
- value: 12.9 kWh (75KM trims) / 18.3 kWh (115KM trims) · source: P2/P3 · market: China · confidence: database
- notes: BYD Blade (LFP).

## Battery chemistry
- value: LFP (lithium iron phosphate), BYD Blade · source: P2 · ref: autocango · market: China · confidence: database

## EV range
- value: 75 km (12.9 kWh) / 115 km (18.3 kWh) — **CLTC** · source: P2/P3 · market: China · confidence: database
- notes: CLTC is optimistic; real-world lower. Not comparable to NEDC/WLTP/ADR.

## Charging port type
- value: China = **GB/T**; Jordan = unknown (likely GB/T parallel import) · source: P2 (China), inference for Jordan · market: China/Jordan · confidence: database (China) / needs_review (Jordan)
- notes: No official GCC/export Song Pro connector confirmed. The autocango "USB Type-C" rows are cabin USB, not the charging connector.

## AC charging
- value: Slow/AC charge ~1.95 h (75KM) / ~2.77 h (115KM) · source: P3 · market: China · confidence: database
- notes: Charger kW not cleanly stated; times are gneenev's "slow charge" figures.

## DC fast charging
- value: **75KM trims: none.** 115KM trims: DC fast ~0.57 h · source: P3 · market: China · confidence: database
- notes: Major trim difference — entry trims cannot DC fast charge at all.

## V2L (vehicle-to-load)
- value: unknown · source: not confirmed · market: — · confidence: unknown
- notes: Not confirmed for Song Pro 2025 in sources reviewed.

## Home charging
- value: AC home charging supported (PHEV) · source: P3 · market: China · confidence: estimate
- notes: Time depends on trim/charger; ~2–3 h slow-charge per P3.

## Jordan connector status & evidence needed
- status: **needs_review** (likely GB/T). To close, obtain one of:
  1) charging-port photo on a Jordan unit; 2) dealer confirmation; 3) VIN/build sheet;
  4) official Jordan/GCC Song Pro spec/manual; 5) physical inspection. (See `03 - Jordan Market/jordan-verification-needed.md`.)

## Battery/charging safety
- value: unknown for Song Pro specifically — no Song Pro manual obtained · source: pending · confidence: unknown
- notes: Do NOT import the Song Plus manual's charging-safety text as Song Pro fact; see `safety-and-warnings.md`.
