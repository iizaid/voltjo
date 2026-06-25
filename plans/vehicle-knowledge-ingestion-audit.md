# VoltJo — Vehicle Knowledge Ingestion Audit

> **Scope:** P0 #2 of `plans/production-ai-roadmap.md` — inventory the Markdown
> knowledge corpus that will feed `vehicle_knowledge` (migration 012).
> **Date:** 2026-06-25
> **Method:** Static scan of `public/cars/**`, `## `-heading counts, and metadata
> probes (`source:` / `confidence:` lines). Estimated chunk count = number of
> `## ` sections per file (the ingestion script emits one chunk per `##` section).
> **Audit only — no data written.**

---

## 1. Corpus shape

- **12 vehicle folders**, each with the canonical 5-folder layout
  (`01 - Manuals` … `05 - Trims`).
- **76 Markdown files total.** This audit covers the **44 files** under
  `04 - AI Data/` and `05 - Trims/` (the P0 ingestion target). `01 - Manuals`,
  `02 - Specs`, `03 - Jordan Market` are **deferred** (roadmap §B.1, P2).
- Only folders **01 / 02 / 03** are deeply built. Folders 04–12 contain a single
  `05 - Trims/trims.md` stub each.

### 1.1 Ingestability gate (FK constraint)

`vehicle_knowledge.vehicle_id → supported_vehicles(id)`. A folder can only be
ingested if its vehicle exists in the DB (seeded by migrations 005/010/011).
**6 of 12 folders** have a DB row; the other 6 are skipped and logged as
**coverage holes**.

| # | Folder | DB slug | Ingestable? |
|---|---|---|---|
| 01 | BYD Song Plus DM-i 2025 | `byd-song-plus-dmi-2025` | ✅ |
| 02 | BYD Song Pro DM-i 2025 | `byd-song-pro-dmi-2025` | ✅ |
| 03 | BYD Sealion 05 DM-i 2025 | `byd-sealion-05-dmi-2025` | ✅ |
| 06 | Tesla Model 3 | `tesla-model-3-2025` | ✅ (trims stub only) |
| 10 | Dongfeng Mage PHEV | `dongfeng-mage-phev-2026` | ✅ (trims stub only) |
| 12 | Toyota RAV4 Hybrid | `toyota-rav4-hybrid-2025` | ✅ (trims stub only) |
| 04 | BYD Qin Plus DM-i | — | ❌ no DB row |
| 05 | BYD Yuan Plus Atto 3 | — | ❌ no DB row |
| 07 | Tesla Model Y | — | ❌ no DB row |
| 08 | Changan Eado EV | — | ❌ no DB row |
| 09 | Deepal S07 S7 | — | ❌ no DB row |
| 11 | Hyundai Kona Electric | — | ❌ no DB row |

---

## 2. Filename → category mapping

The ingestion script derives `category` from the filename (folder `05 - Trims/*`
always → `trims`):

| Filename | category |
|---|---|
| `battery-and-charging.md` | `battery_charging` |
| `engine-and-fuel.md` | `engine_fuel` |
| `maintenance.md` | `maintenance` |
| `safety-and-warnings.md` | `safety` |
| `vehicle-profile.md` | `profile` |
| `ai-context-summary.md` | `profile` |
| `unresolved-questions.md` | `profile` |
| `extraction-checklist.md` | `profile` |
| `jordan-market-summary.md` | `market` |
| `05 - Trims/*.md` (any) | `trims` |

---

## 3. Detailed inventory (ingestable folders)

Legend — **Chunks** = `## ` section count (est.); **Src** = file contains
`source:` lines; **Conf** = file contains `confidence:` lines.

### 3.1 Folder 01 — BYD Song Plus DM-i 2025 → `byd-song-plus-dmi-2025`

| File | Category | Chunks | Src | Conf |
|---|---|--:|:--:|:--:|
| `04 - AI Data/ai-context-summary.md` | profile | 6 | — | — |
| `04 - AI Data/battery-and-charging.md` | battery_charging | 10 | ✅ | ✅ |
| `04 - AI Data/engine-and-fuel.md` | engine_fuel | 9 | ✅ | ✅ |
| `04 - AI Data/extraction-checklist.md` | profile | 1 | — | — |
| `04 - AI Data/jordan-market-summary.md` | market | 4 | — | — |
| `04 - AI Data/maintenance.md` | maintenance | 13 | ✅ | ✅ |
| `04 - AI Data/safety-and-warnings.md` | safety | 7 | ✅ | ✅ |
| `04 - AI Data/unresolved-questions.md` | profile | 5 | — | — |
| `04 - AI Data/vehicle-profile.md` | profile | 8 | ✅ | ✅ |
| `05 - Trims/trim-equivalence.md` | trims | 4 | — | ✅ |
| `05 - Trims/trim-matrix.md` | trims | 1 | — | — |
| `05 - Trims/trims.md` | trims | 4 | ✅ | ✅ |
| **Subtotal** | | **72** | | |

### 3.2 Folder 02 — BYD Song Pro DM-i 2025 → `byd-song-pro-dmi-2025`

| File | Category | Chunks | Src | Conf |
|---|---|--:|:--:|:--:|
| `04 - AI Data/ai-context-summary.md` | profile | 6 | — | — |
| `04 - AI Data/battery-and-charging.md` | battery_charging | 11 | ✅ | ✅ |
| `04 - AI Data/engine-and-fuel.md` | engine_fuel | 10 | ✅ | ✅ |
| `04 - AI Data/extraction-checklist.md` | profile | 1 | — | — |
| `04 - AI Data/jordan-market-summary.md` | market | 4 | — | — |
| `04 - AI Data/maintenance.md` | maintenance | 9 | ✅ | ✅ |
| `04 - AI Data/safety-and-warnings.md` | safety | 8 | ✅ | ✅ |
| `04 - AI Data/unresolved-questions.md` | profile | 5 | — | — |
| `04 - AI Data/vehicle-profile.md` | profile | 8 | ✅ | ✅ |
| `05 - Trims/trim-equivalence.md` | trims | 6 | — | ✅ |
| `05 - Trims/trim-matrix.md` | trims | 1 | — | — |
| `05 - Trims/trims.md` | trims | 4 | — | — |
| **Subtotal** | | **73** | | |

### 3.3 Folder 03 — BYD Sealion 05 DM-i 2025 → `byd-sealion-05-dmi-2025`

| File | Category | Chunks | Src | Conf |
|---|---|--:|:--:|:--:|
| `04 - AI Data/ai-context-summary.md` | profile | 6 | — | — |
| `04 - AI Data/battery-and-charging.md` | battery_charging | 9 | ✅ | ✅ |
| `04 - AI Data/engine-and-fuel.md` | engine_fuel | 11 | ✅ | ✅ |
| `04 - AI Data/extraction-checklist.md` | profile | 7 | — | — |
| `04 - AI Data/jordan-market-summary.md` | market | 6 | — | — |
| `04 - AI Data/maintenance.md` | maintenance | 9 | ✅ | ✅ |
| `04 - AI Data/safety-and-warnings.md` | safety | 9 | ✅ | ✅ |
| `04 - AI Data/unresolved-questions.md` | profile | 7 | — | — |
| `04 - AI Data/vehicle-profile.md` | profile | 9 | ✅ | ✅ |
| `05 - Trims/trim-equivalence.md` | trims | 8 | — | — |
| `05 - Trims/trim-matrix.md` | trims | 1 | — | — |
| `05 - Trims/trims.md` | trims | 5 | — | ✅ |
| **Subtotal** | | **87** | | |

### 3.4 Folders 06 / 10 / 12 — stubs only

| Folder | DB slug | File | Category | Chunks | Src | Conf |
|---|---|---|---|--:|:--:|:--:|
| 06 Tesla Model 3 | `tesla-model-3-2025` | `05 - Trims/trims.md` | trims | 2 | — | — |
| 10 Dongfeng Mage PHEV | `dongfeng-mage-phev-2026` | `05 - Trims/trims.md` | trims | 2 | — | — |
| 12 Toyota RAV4 Hybrid | `toyota-rav4-hybrid-2025` | `05 - Trims/trims.md` | trims | 2 | — | — |

---

## 4. Skipped (no DB row — coverage holes)

| Folder | File | Est. chunks (lost) |
|---|---|--:|
| 04 BYD Qin Plus DM-i | `05 - Trims/trims.md` | 2 |
| 05 BYD Yuan Plus Atto 3 | `05 - Trims/trims.md` | 2 |
| 07 Tesla Model Y | `05 - Trims/trims.md` | 2 |
| 08 Changan Eado EV | `05 - Trims/trims.md` | 2 |
| 09 Deepal S07 S7 | `05 - Trims/trims.md` | 2 |
| 11 Hyundai Kona Electric | `05 - Trims/trims.md` | 2 |
| **Total skipped** | | **~12** |

> To ingest these, first add their rows to `supported_vehicles` (roadmap P0 #7
> "seed top-8 Jordan vehicles").

---

## 5. Totals & metadata availability

| Metric | Value |
|---|--:|
| Vehicle folders total | 12 |
| Folders ingestable (have DB row) | 6 |
| Markdown files in 04/05 (ingestable folders) | 39 |
| **Estimated ingestable chunks** | **~238** |
| Files with source references (`source:`) | 18 |
| Files with confidence labels (`confidence:`) | 21 |
| Estimated chunks skipped (no DB row) | ~12 |

**Source / confidence availability is concentrated** in the BYD `04 - AI Data`
files (`battery-and-charging`, `engine-and-fuel`, `maintenance`, `safety-and-warnings`,
`vehicle-profile`). Narrative files (`ai-context-summary`, `jordan-market-summary`,
`unresolved-questions`, `extraction-checklist`) and most `trims.md` stubs carry
**no per-fact citations** — these chunks will land with `confidence = 'unknown'`
and NULL `source_ref` / `page_ref`.

### 5.1 Metadata physical forms the parser must handle
1. **Inline** on the value line: `- value: X · source: S1 · page: 209 · confidence: dealer`
2. **Separate bullets**: `- source: …` / `- page: …` / `- confidence: …`
3. **None** (narrative/equivalence sections) → NULL refs, `confidence = 'unknown'`.

### 5.2 Confidence chains
Grades are frequently degradation chains, e.g.
`official (export) → needs_review (Jordan)`. Per decision in this task, the
ingestion stores the **conservative (right-most) enum** in `confidence` and the
**full original chain** in `confidence_raw` (additive column, §012).

---

## 6. Recommendations feeding Phase 2/3

1. **One chunk per `##` section.** Content before the first `##` (H1 + preamble)
   is captured as a synthetic `__intro__` section so format notes / warnings
   aren't lost.
2. **Idempotency key** = `(vehicle_id, category, section)` with `content_hash`
   change detection — safe to re-run on every deploy.
3. **Skip, don't fail**, on folders without a DB row; print them as coverage holes.
4. **Do not invent Jordan certainty.** Chunks without citations stay
   `confidence = 'unknown'`; the badge is the feature (roadmap §D).
