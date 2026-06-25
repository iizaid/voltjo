# VoltJo — Vehicle Knowledge Validation Report

> **Scope:** P0 #2 of `plans/production-ai-roadmap.md`.
> **Date:** 2026-06-25
> **Artifacts validated:** `supabase/migrations/012_vehicle_knowledge.sql`,
> `scripts/ingest-vehicle-knowledge.mjs`.
> **Method:**
> 1. **Parser/transform** — `node scripts/ingest-vehicle-knowledge.mjs --dry-run`
>    (pure, no DB). Validates chunking, metadata extraction, confidence
>    collapsing, uniqueness, content quality.
> 2. **Migration/schema** — applied to an **ephemeral Postgres 16 container**
>    (Docker), never the hosted project. Validates DDL, idempotency, FTS,
>    constraints, triggers, FK cascade.
> 3. **Live data load** — **NOT executed.** Requires writing to the hosted
>    Supabase project; gated on owner authorization (see §7).

---

## 1. Summary

| Check | Result |
|---|---|
| Migration 012 applies | ✅ |
| Migration 012 idempotent (applied twice) | ✅ |
| `tsvector` auto-populated by trigger | ✅ |
| GIN FTS index serves `websearch_to_tsquery` | ✅ (Bitmap Index Scan) |
| `category` CHECK constraint enforced | ✅ rejects bad value |
| `confidence` CHECK constraint enforced | ✅ rejects bad value |
| `unique (vehicle_id, category, section)` enforced | ✅ rejects duplicate |
| `updated_at` trigger fires on update | ✅ |
| FK cascade deletes child knowledge | ✅ (2 → 0) |
| `confidence_raw` stored verbatim | ✅ |
| Duplicate chunks in parsed corpus | ✅ **0** |
| Empty/noise chunks filtered | ✅ (min content 56 chars) |
| Live ingestion row counts in hosted DB | ⏳ pending authorization |

---

## 2. Files processed

| Metric | Value |
|---|--:|
| Vehicle folders scanned | 12 |
| Folders ingestable (have DB row) | 6 |
| Markdown files processed | **39** |
| PDFs ignored (by design) | all |
| Folders skipped (no DB row) | 6 |

**Skipped folders (coverage holes — no `supported_vehicles` row):**
Qin Plus DM-i, Yuan Plus / Atto 3, Tesla Model Y, Changan Eado EV,
Deepal S07/S7, Hyundai Kona Electric (1 trims stub file each, ~12 chunks unreached).

---

## 3. Chunks generated

**Total chunks: 274**

### 3.1 Per vehicle
| Vehicle (slug) | Chunks |
|---|--:|
| `byd-sealion-05-dmi-2025` | 99 |
| `byd-song-pro-dmi-2025` | 85 |
| `byd-song-plus-dmi-2025` | 84 |
| `tesla-model-3-2025` | 2 |
| `dongfeng-mage-phev-2026` | 2 |
| `toyota-rav4-hybrid-2025` | 2 |

> The 3 DB-only vehicles (Tesla M3, Dongfeng, RAV4) have only a `trims.md` stub
> on disk → 2 chunks each. This mirrors roadmap §A.4's "inversion": the
> richest-documented cars (Song Pro, Sealion 05) have the emptiest DB rows.

### 3.2 Per category
| Category | Chunks |
|---|--:|
| profile | 81 |
| trims | 49 |
| maintenance | 34 |
| battery_charging | 33 |
| engine_fuel | 33 |
| safety | 27 |
| market | 17 |

### 3.3 Content size
`min=56  median=242  max=2609  avg=318` characters per chunk — comfortably within
the ~200–500 token target (roadmap §B.1); no oversized chunks needing sub-splitting.

---

## 4. Metadata quality

### 4.1 Source / page coverage
| Field | Chunks with value | % |
|---|--:|--:|
| `source_ref` | 133 / 274 | 49% |
| `page_ref` | 59 / 274 | 22% |

### 4.2 Confidence distribution (conservative enum)
| Confidence | Chunks |
|---|--:|
| unknown | 163 |
| needs_review | 60 |
| estimate | 40 |
| dealer | 10 |
| owner_reported | 1 |
| official | 0 |

**Reading:** 60% of chunks land at `unknown` — these are narrative/equivalence
sections (`ai-context-summary`, `unresolved-questions`, `trim-equivalence`,
stubs) with no per-fact citation. This is **correct, not a defect**: the corpus
is honest about what is unverified, and the confidence badge is the feature
(roadmap §D). `official = 0` because every "official" grade in the corpus is an
**export-market** grade that degrades to `needs_review (Jordan)` — the
conservative collapse correctly refuses to present export facts as Jordan-official.
The full chain is preserved in `confidence_raw` for citation display.

---

## 5. Ingestion issues found & resolved

| # | Issue | Resolution |
|---|---|---|
| 1 | `unique (vehicle_id, category, section)` collided — 4 files map to `profile`, 3 to `trims`, so their `__intro__` (and any shared headings) overwrote each other, silently dropping content (incl. the per-file charging-port ⚠️ note). | `section` qualified with source-file stem (`vehicle-profile / Overview`). Keeps the spec's unique key, restores 15 lost chunks (262 → 277), adds doc provenance. |
| 2 | Stub `## Confirmed Jordan trims` sections with body `-` produced 1-char noise chunks that would pollute FTS. | Meaningful-content guard (`/[\p{L}\p{N}]/u`) drops sections with no letter/digit. Min content size rose 1 → 56 chars; total 277 → 274. |
| 3 | Confidence is often a degradation chain (`official (export) → needs_review (Jordan)`). | Conservative (most cautious) token stored in `confidence`; full chain in new `confidence_raw` column. |

---

## 6. Missing metadata / known gaps

- **51% of chunks have no `source_ref`**; **78% have no `page_ref`** — concentrated
  in narrative and stub files. Acceptable for launch; these surface as
  `unknown`/uncited and are gated by the retrieval-confidence rule.
- **3 DB vehicles have no deep docs** (Tesla M3, Dongfeng, RAV4) — only trims stubs.
- **6 documented-or-stub vehicles are unreachable** (no DB row).
- **`official = 0`** for the Jordan market by construction (export-only sourcing).

---

## 7. Pending: live data load (requires authorization)

The hosted Supabase project (`gqee….supabase.co`) was **not modified**. To
complete the load against it, the owner must run, in order:

1. **Apply migration 012** to the hosted DB (Supabase SQL editor or CLI):
   paste `supabase/migrations/012_vehicle_knowledge.sql`.
2. **Run the ingestion** (writes ~274 rows; `.env.local` already has the URL +
   service-role key):
   ```bash
   node scripts/ingest-vehicle-knowledge.mjs        # idempotent; re-runnable
   ```
3. **Verify in SQL:**
   ```sql
   select count(*) from public.vehicle_knowledge;                       -- expect ~274
   select category, count(*) from public.vehicle_knowledge group by 1;  -- matches §3.2
   -- no duplicates (must return 0 rows):
   select vehicle_id, category, section, count(*)
   from public.vehicle_knowledge group by 1,2,3 having count(*) > 1;
   -- FTS smoke test:
   select section, ts_rank(tsv, websearch_to_tsquery('simple','charging')) r
   from public.vehicle_knowledge
   where tsv @@ websearch_to_tsquery('simple','charging') order by r desc limit 5;
   ```

A second `node scripts/ingest-vehicle-knowledge.mjs` should report
`inserted=0 updated=0 skipped(unchanged)=274` — proving idempotency end-to-end.

---

## 8. Recommendations

1. **Proceed to load** once authorized; the schema and parser are verified.
2. **Seed the 6 missing vehicles** (roadmap P0 #7) to unlock their corpus.
3. **Backfill citations** for high-traffic `unknown` chunks (maintenance/safety)
   to raise the cited-chunk ratio before P1 citation chips ship.
4. **Re-run ingestion on every deploy** — `content_hash` makes it a no-op when
   the corpus is unchanged.
5. **Defer pgvector** (P2) until FTS retrieval has eval data, per roadmap.
