# Spec Analysis — BYD Song Pro DM-i 2025

Research pass 1. Access date: 2026-06-04. Source IDs → `03 - Jordan Market/sources.md`.

## What the specs agree on (China 2025, database confidence)
- **Body:** compact SUV, 5-door/5-seat, 4735×1860×1710 mm, wheelbase 2712 mm, curb ~1635 kg. [P2]
- **Engine:** BYD472QC 1.5 L NA, 74 kW (101 hp), 126 N·m. [P2]
- **Drive motor:** ~120 kW, 210 N·m, front, PMSM. [P2/P3]
- **Battery:** LFP Blade — 12.9 kWh (75KM trims) or 18.3 kWh (115KM trims). [P2/P3]
- **EV range:** 75 km or 115 km — **CLTC** standard. [P2/P3]
- **Fuel tank:** 52 L. [P2]
- **Transmission/drive:** E-CVT, FWD. [P2]
- **Real-world fuel use:** ~3.06 L/100km (reviewer). [P4]

## Trim-dependent details that matter
- **DC fast charging:** **75KM trims have NO DC fast charge**; **115KM trims add DC fast charge (~0.57 h)**. [P3] — major usability difference.
- **AC charge time:** ~1.95 h (75KM) / ~2.77 h (115KM) per gneenev (slow charge). [P3]
- **Tires:** 225/60 R18 (most trims); 235/50 R19 (115KM Excellent). [P3]

## Conflicts / cautions
- **Test standard:** range is **CLTC** (most optimistic). Do not compare directly to vehicle 01's NEDC figures or to WLTP/ADR.
- **Power:** 101 hp is **engine-only**; 163 hp/120 kW is the **drive motor**. The **combined system power is NOT cleanly published** → needs_review. Do not sum or present motor power as system power.
- **Charging connector:** China spec → GB/T. The autocango "USB Type-C" rows are **cabin USB**, not the charging port — do not misread.
- **Model-year:** 2025 = "2nd-gen DM-i", 75/115 km. **2026** is a different, redesigned car (133 km) — keep separate. [P4]
- **GCC official spec:** none found for Song Pro (UAE/Saudi pages are Song **Plus**) → no official export connector confirmation for Song Pro.

## Usable for VoltJo (database confidence, China-market)
Battery/range(+CLTC label)/tank/engine/motor/dims/tire-sizes/charging-by-trim. All other (safety,
maintenance, Jordan connector, warranty) remain unknown/needs_review.
