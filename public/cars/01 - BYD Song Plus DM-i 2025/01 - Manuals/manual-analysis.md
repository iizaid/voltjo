# Manual Analysis — BYD Song Plus DM-i 2025

Research pass 2. Access date: 2026-06-03.

## Was an exact Song Plus DM-i manual found?
- **No exact China/GCC/Jordan owner's manual was downloaded.**
- An exact China manual (宋PLUS DM-I 2025, ~312 pages, 47.3 MB) appears to exist on a third-party
  mirror (shouce365.com, source **S9**), but that host returned an **expired TLS certificate** and
  was rejected as untrusted. The legitimate route is BYD's official China portal (**S10**,
  byd.com/cn/user-manual) — Chinese-language, portal-gated, not retrieved this pass.

## Alias manual(s) downloaded / used
- **`BYD-Seal-U-DMi-Owner-Manual-EU-source-alias.pdf`** (in `01 - Manuals/`)
  - Source: **S5** · Official BYD Europe owner's manual · 62 MB · 263 pages · English · LHD
  - Model name in manual: **Seal U DM-i** (European export name of the Song Plus DM-i platform)
  - Source market: **Europe (export, CCS2)**
- **`BYD-Sealion-6-DMi-Specs-AU-source-alias.pdf`** (in `02 - Specs/`)
  - Source: **S4** · Official BYD Australia spec sheet · 7.4 MB · 2 pages
  - Model name: **Sealion 6 DM-i** (Australian export name) · Market: Australia (export, ADR 81/02)

## Manual sections LIKELY SHARED across the platform (safe to reuse with care)
These are engineering/operation topics that are generally common to the Song Plus / Seal U /
Sealion 6 DM-i platform. Reuse as **official (EU) → needs_review (Jordan)**:
- High-voltage safety principles (orange HV cables, electric-shock warnings) — pp. 41–42
- General charging safety behaviour (wet hands, thunderstorm, no repair while charging) — pp. 97–100
- Battery thermal behaviour (charge in heated/ventilated space in extreme temps) — p. 99
- Towing principles and trailer tire-pressure logic — pp. 115–122
- Jump-start caution (12 V, short duration only) — p. 226
- Long-term parking / storage advice — p. 211
- Maintenance **schedule structure** and most intervals (oil, filters, brake fluid, coolant) — pp. 207–210
- Braking-system fluid level (MIN/MAX) and engine-oil guidance — p. 220

## Sections that are MARKET-SPECIFIC (do NOT treat as Jordan facts)
- **Charging connector type and AC/DC speeds** — EU/AU = Type 2 + CCS2; China = GB/T. Jordan unconfirmed.
- **Exact tire size and the printed tire-pressure value** (250/250 kPa in the EU manual, p. 247) —
  depends on the wheel/tire fitted to the Jordan trim; treat as needs_review.
- **Equipment lists, trim names, V2L availability, infotainment** — vary by market/trim.
- **Warranty and authorized-service terms** — Jordan terms come from the local dealer (S13), not this manual.
- **Engine variant** (NA vs turbo) — varies by trim (S4).

## Is the manual useful for VoltJo AI?
- **Yes, substantially** — it converts the previously-empty safety/charging/maintenance files into
  real, page-cited content, which lets the assistant give grounded safe-handling guidance.
- It must always be cited as the **export (EU) Seal U** source, with Jordan-specific items
  (port, tire pressure value, warranty, equipment) flagged `needs_review`.

## What should remain UNKNOWN for Jordan
- The actual charging connector on a Jordan unit (primary evidence still needed).
- The exact tire size/pressure for the Jordan trim's wheels.
- Jordan warranty and service-interval commitments (dealer-specific).
- Whether the Jordan trim uses the NA or turbo 1.5L engine.
