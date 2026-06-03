# Manual Analysis — BYD Song Pro DM-i 2025

Research pass 1. Access date: 2026-06-04.

## Was an exact Song Pro DM-i manual found?
- **No — the exact Song Pro DM-i 2025 owner's manual is still not found.** An exact China manual
  (宋Pro DM-i) very likely exists on BYD's China portal (P8/cn), Chinese-language and portal-gated; not retrieved.
- **However, an official BYD "Song Pro EV" owner's manual WAS found (P9, version 201902).** It is a
  *pure-electric* sibling — useful as an **older EV-sibling / Song Pro family reference**, NOT a DM-i manual.

## Which manuals were used / downloaded?
- **Song Pro EV manual (P9)** — official BYD, link recorded (not downloaded in this patch). Useful as
  an EV-sibling reference for powertrain-agnostic content.
- **No DM-i manual** and **no Song Plus manual** used as Song Pro DM-i facts (Plus is a different, larger model).

## Song Pro EV manual (P9) — what it is useful for vs not
- **Useful (powertrain-agnostic, label official EV → needs_review DM-i):** broad BYD/Song Pro safety,
  warning lights, charging workflow/etiquette, emergency handling, towing, HV precautions, general layout.
- **NOT usable for DM-i:** engine/fuel/hybrid system, DM-i 2025 trims, DM-i maintenance intervals,
  **battery chemistry (EV = NMC/ternary vs DM-i = LFP)**, EV vehicle specs (BYD6461SBEV, 4560×1860×1700,
  **tire pressure 230 kPa**), or any Jordan-specific fact. Note the EV body (4560 mm) is shorter than the DM-i (4735 mm).

## Source market / model name in each candidate
- BYD ME&A / EU / China manual portals — official, but no confirmed Song Pro DM-i entry retrieved.
- ManualsLib / Scribd — "Song **Plus** DM-i 2021/2022" — wrong model + old year. Down-weighted.

## Which sections are LIKELY shared across the BYD DM-i platform (use with caution, needs_review)
General BYD DM-i operating principles are broadly similar across models, so the following *topics*
are likely comparable — but must be treated as **platform-level, needs_review for Song Pro**, since
the Song Pro is a distinct, smaller model with its own equipment:
- High-voltage safety principles (orange HV cables, no DIY HV service).
- General charging safety behaviour.
- Jump-start (12 V) caution; long-term parking guidance.
- LFP Blade-battery handling principles.

## Which sections are MODEL/MARKET-SPECIFIC (do NOT infer for Song Pro)
- Exact maintenance intervals, fluids, and tire pressures (Song Pro has its own tire sizes: 225/60 R18 / 235/50 R19).
- Charging connector and AC/DC behaviour (China GB/T; 75KM trims have **no DC fast charge** — a Song-Pro-specific trait).
- Dashboard/equipment, dimensions, warranty.

## What can be used for VoltJo AI now?
- Only the **spec-derived** facts (battery, range/standard, tank, engine, dims, tire sizes, charging-by-trim)
  from the database/spec sources in `02 - Specs/`. Safety/maintenance must stay `unknown`/`needs_review`
  until a correct-model manual is obtained — **do not borrow the Song Plus manual's numbers.**

## What must remain UNKNOWN for Jordan
- All manual-derived safety/maintenance specifics (intervals, fluids, tire pressure values).
- Charging connector on a Jordan unit; warranty/service terms.
