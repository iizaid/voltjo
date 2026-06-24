# VoltJo — Vehicle Data Gap Analysis

> Source of truth: `supabase/migrations/005_supported_vehicles_mvp.sql`,
> `010_vehicle_ai_dataset.sql`, `011_vehicle_ev_intelligence.sql`,
> schema in `lib/vehicles/types.ts`. Verified 2026-06-24/25.

## Current inventory (the entire catalog)

| Slug | Type | Confidence | Notable gaps |
|---|---|---|---|
| `tesla-model-3-2025` | EV | estimate | price = wide estimate; charging port varies by import |
| `byd-song-plus-dmi-2025` | PHEV | estimate | cost profiles partial |
| `byd-sealion-05-dmi-2025` | PHEV | estimate | many structured cols NULL |
| `byd-song-pro-dmi-2025` | PHEV | estimate | many structured cols NULL |
| `dongfeng-mage-phev-2026` | PHEV | estimate | low-confidence specs left NULL |
| `toyota-rav4-hybrid-2025` | HEV | estimate | HEV (not plug-in) |

**Total: 6 vehicles.** That is the assistant's entire factual knowledge base.

## Why this is a launch risk

The product promise is "أفضل مساعد للسيارات الكهربائية والهجينة في الأردن."
Six vehicles — all `estimate`-grade — cannot credibly back that claim. The most
common Jordan-market EVs/PHEVs are absent, so most user questions fall through to
ungrounded model knowledge (hallucination risk the prompt explicitly tries to
avoid, `lib/ai/prompt.ts:16-17`).

## Missing vehicles (Jordan market priority)

Jordan's EV/PHEV market is dominated by Chinese imports + Tesla + used Korean/
Japanese EVs. **High-priority additions** (verify before seeding):

**EV (BEV):**
- BYD Atto 3, BYD Dolphin, BYD Seal, BYD Yuan Plus
- Tesla Model Y (very common in JO), Model 3 LR/Performance trims
- Hyundai Kona Electric, Ioniq 5, Ioniq 6
- Kia EV6, Niro EV
- MG 4, MG ZS EV
- Volkswagen ID.4/ID.6 (import)
- Nissan Leaf (large used market in JO)
- Chevrolet Bolt (used import, very common)
- Geely Geometry C, Zeekr 001/X

**PHEV:**
- BYD Song/Tang/Qin DM-i variants (broaden)
- Mercedes/BMW PHEV (premium import)
- Jeep/Wrangler 4xe (niche)

**HEV (if in scope):**
- Toyota Corolla/Camry/Prius hybrid, RAV4 (have)
- Honda CR-V hybrid

> Target a **curated, verified ~25–40 vehicles** that cover ≥80% of real JO buyer
> questions, rather than a long thin list.

## Missing / incomplete fields per vehicle

The schema (`lib/vehicles/types.ts`) is already rich. Gaps are **data**, not
schema, plus a few recommended additions:

### Populate existing columns (currently NULL on most rows)
- `batteryKwh`, `electricRangeKm`, `totalRangeKm`, `efficiencyKwh100km`
- `acChargeKw`, `dcChargeKw`, `charge1080Min`, `chargingPort`, `dcFastCharging`
- `priceJodMin/Max` (narrow the ranges; cite source/date)
- `costProfiles` (city/highway/mixed) — drives the calculator + advice
- `strengthsAr`, `weaknessesAr`, `useCaseTags`, `jordanNotesAr`
- `dataConfidence` upgraded from `estimate` → `dealer`/`official` where sourced

### Recommended NEW fields (schema additions)
| Field | Why |
|---|---|
| `warranty_years` / `warranty_km` / `battery_warranty` | #1 JO buyer concern |
| `local_dealer` / `has_official_dealer` (bool) | parts + service reliability |
| `spare_parts_availability` (enum: good/limited/scarce) | JO ownership reality |
| `service_network_notes_ar` | where to service in Amman/Irbid/Zarqa |
| `resale_value_note_ar` | JO resale dynamics differ by brand origin |
| `customs_class` / `import_notes_ar` | JO EV/PHEV customs differ sharply |
| `seats` / `cargo_liters` / `ground_clearance_mm` | family/practical filters |
| `source_url` / `source_date` per fact or per row | **citation support** (see intelligence doc) |
| `data_verified_by` / `verified_at` | audit trail for the "verified data gate" |

## Recommended additional structured data tables

- `vehicle_sources` — (vehicle_id, field, value, source_url, source_date,
  confidence) → enables per-fact citation + retrieval confidence.
- `vehicle_comparisons_cache` — precomputed common pair comparisons (optional).
- `charging_locations` already exists (migration); needs **verified rows**
  (separate from this doc; tracked in `18-final-delivery-audit`).

## Prioritization

| Priority | Work | Effort |
|---|---|---|
| **P0** | Either (a) seed 25–40 verified vehicles, or (b) ship with an explicit "بيانات تجريبية/تقديرية" disclosure + confidence chips so claims stay truthful | Data: L · Eng: S |
| **P0** | Mark `data_confidence` honestly per row; never present `estimate` as fact | S |
| **P1** | Add warranty + dealer + parts fields (top JO concerns) | Schema S + Data M |
| **P1** | Add `vehicle_sources` for citations | Schema S + Data M |
| **P2** | Cost profiles for all rows (feeds calculator + ROI advice) | Data M |
| **P2** | Practical fields (seats/cargo/clearance) | Data M |

## Launch decision required

VoltJo cannot be *both* "deeply specialized" *and* truthful on 6 estimate-grade
cars. Pick one for week-1:
- **Option A (recommended):** invest in verified data for ~25 core vehicles.
- **Option B:** launch the 6 with prominent confidence labeling and scope the
  assistant to "guidance, not a spec sheet" — and say so in the UI.

This choice drives whether P0-3 in `chat-production-readiness.md` is closed.
