# VoltJo — Vehicle Knowledge Architecture

> **Scope:** the P0 knowledge-infrastructure layer (migration 012 + ingestion).
> **Status:** infrastructure built & validated; **retrieval in chat NOT yet wired**
> (that is roadmap P0 #4 / §B.4, a follow-up).
> **Date:** 2026-06-25
> **Related:** `plans/production-ai-roadmap.md` (build spec),
> `plans/vehicle-knowledge-ingestion-audit.md`,
> `plans/vehicle-knowledge-validation-report.md`.

---

## 1. Purpose

~76 Markdown files of cited, page-referenced, confidence-graded EV knowledge live
in `public/cars/**` but are **100% invisible at inference** (roadmap §A.3). This
layer is the **bridge**: it ingests the `04 - AI Data` and `05 - Trims` Markdown
into a full-text-searchable Postgres table (`vehicle_knowledge`) so that a future
retrieval step can inject grounded, cited facts into the chat prompt.

**This document covers the bridge only.** It deliberately stops before chat
retrieval — no change to `lib/ai/*` or `app/api/chat/route.ts` was made.

---

## 2. Ingestion flow

```
scripts/ingest-vehicle-knowledge.mjs   (idempotent; safe on every deploy)

 1. loadEnvLocal()            → NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 2. collectFiles()            → walk public/cars/{folder}/{04 - AI Data,05 - Trims}/*.md
                                · FOLDER_SLUG maps folder → DB slug (FK gate)
                                · folders w/o a slug → skipped, logged as coverage holes
                                · *.md only — PDFs ignored
 3. per file:
      chunkMarkdown()         → split on `##` (H2); preamble kept as `__intro__`;
                                drop sections with no letter/digit (noise guard)
      buildChunkFields()      → section = "<fileStem> / <heading>"  (uniqueness + provenance)
                                category from filename (trims/ ⇒ 'trims')
                                firstField() extracts source / file / page / market
                                sectionConfidence() → conservative enum + confidence_raw
 4. sha256(content)           → content_hash
 5. resolve slug → vehicle_id (select from supported_vehicles)
 6. per vehicle:
      fetch existing (category,section)→content_hash
      diff: unchanged ⇒ skip; new ⇒ insert; changed ⇒ update
      upsert(onConflict = vehicle_id,category,section)
 7. report inserted / updated / skipped
```

### 2.1 Key transforms

- **Chunking:** one chunk per `##` section, ~200–500 tokens (validated avg 318
  chars). Content before the first `##` becomes `__intro__` so format notes and
  per-file warnings survive.
- **Section qualification:** `section` is prefixed with the source-file stem
  (`vehicle-profile / Overview`). Several files share one `category`, so the raw
  heading is not unique within `(vehicle, category)`; the prefix keeps the spec's
  `unique (vehicle_id, category, section)` collision-free and records provenance.
- **Metadata parsing** handles three physical forms: inline (`· source: … · confidence: …`),
  separate bullets, and none. Fields stop at the `·` separator.
- **Confidence collapsing:** chains like `official (export) → needs_review (Jordan)`
  collapse to the **most conservative** token (severity:
  `unknown > needs_review > estimate > owner_reported > dealer > official`); the
  full text is kept in `confidence_raw`.
- **Idempotency:** `content_hash` change detection → re-runs write nothing when the
  corpus is unchanged.

---

## 3. Database schema (`vehicle_knowledge`, migration 012)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `vehicle_id` | uuid FK → `supported_vehicles(id)` | `on delete cascade` |
| `category` | text | CHECK: battery_charging \| engine_fuel \| maintenance \| safety \| trims \| profile \| market |
| `section` | text | `<fileStem> / <heading>` |
| `content` | text | chunk body, verbatim (citations preserved) |
| `source_ref` | text | e.g. `S5`, `S1, S13` |
| `source_file` | text | PDF source alias when cited |
| `page_ref` | text | e.g. `209`, `97–100` |
| `market` | text | default `jordan` |
| `confidence` | text | CHECK: official \| dealer \| owner_reported \| estimate \| needs_review \| unknown |
| `confidence_raw` | text | full original grade chain (nullable) |
| `content_hash` | text | sha256(content) |
| `tsv` | tsvector | trigger-maintained |
| `created_at` / `updated_at` | timestamptz | `updated_at` via shared trigger |
| **unique** | | `(vehicle_id, category, section)` |

**Indexes:** GIN on `tsv`; btree on `vehicle_id`, `category`, and `(vehicle_id, category)`.

**Triggers:**
- `vehicle_knowledge_tsv_trg` (before insert/update of section,content) →
  `setweight(to_tsvector('simple', section),'A') || setweight(to_tsvector('simple', content),'B')`.
  `'simple'` config = no stemming (Postgres has no Arabic dictionary; English
  stemming would corrupt Arabic tokens). Heading weighted above body.
- `set_vehicle_knowledge_updated_at` → reuses `public.set_updated_at()` (migration 005).

**RLS:**
- Enabled. **Read:** `authenticated` only, and only for active Jordan-market vehicles.
- **Write:** none granted to anon/authenticated → only `service_role` (which
  bypasses RLS) can write. The ingestion script uses the service-role key.

---

## 4. Retrieval strategy (designed; not yet implemented)

The intended consumer is `buildVehicleContextForPrompt(message, history)` in
`lib/ai/vehicle-context.ts` (roadmap §B.4). Planned query:

```sql
select id, section, content, source_ref, page_ref, confidence, confidence_raw
from public.vehicle_knowledge
where vehicle_id = any(:matched)
  and (:intent is null or category = :intent)        -- narrow by detected intent
  and tsv @@ websearch_to_tsquery('simple', :query)
order by ts_rank(tsv, websearch_to_tsquery('simple', :query)) desc
limit :k;   -- K = 4 single-vehicle, 2 per vehicle when comparing
```

Then: assemble a token-budgeted context block, tag `estimate` facts `تقديري`,
emit inline citations `[المصدر: S5 ص.209 — ثقة: …]` from `source_ref`/`page_ref`/
`confidence_raw`, and apply the confidence gate (no structured match AND no chunks
⇒ context null ⇒ model answers generally and disclaims).

**Validated today:** the `tsv @@ websearch_to_tsquery('simple', …)` +
`ts_rank` path returns correctly ranked rows and uses the GIN index.

---

## 5. Limitations

1. **No retrieval wired into chat yet** — this is infrastructure only.
2. **FTS, not semantic** — `websearch_to_tsquery('simple', …)` is lexical. Arabic
   morphology/synonyms (شحن vs يشحن) and typos are not matched. Mitigated later by
   `vehicle_aliases` (P0 #3) and pgvector (P2).
3. **FK-gated coverage** — only the 6 vehicles in `supported_vehicles` are
   ingestable; 6 folders are unreachable until seeded.
4. **Citation sparsity** — 51% of chunks lack `source_ref`; these surface as
   `unknown` and must not be presented as verified.
5. **Export-biased confidence** — `official = 0` for Jordan; most facts are
   `needs_review (Jordan)`. The badge is the honest mitigation, not a bug.
6. **`'simple'` config trade-off** — robust for mixed Arabic/English but does no
   stemming, so English plural/singular variants won't match.

---

## 6. Future pgvector integration (P2)

The schema is **forward-compatible** with semantic search; no breaking change needed:

1. **Migration 016** (roadmap §B.2): `create extension vector;`
   `alter table vehicle_knowledge add column embedding vector(768);`
   `create index … using hnsw (embedding vector_cosine_ops);`
2. **Batch embed at ingest** — extend `ingest-vehicle-knowledge.mjs` to call Gemini
   `text-embedding-004` for new/changed chunks only (gated by `content_hash`, so
   re-embedding is incremental and idempotent). Store the 768-d vector.
3. **Hybrid retrieval** — combine FTS `ts_rank` with cosine similarity
   (`embedding <=> query_embedding`) via a weighted score or reciprocal-rank
   fusion; embed only the user query at request time (zero per-doc query cost).
4. **Earn it with eval data** — adopt only after the P1 golden eval harness shows
   FTS missing the Arabic long tail. FTS-first keeps launch at zero new paid infra.

---

## 7. Operational notes

- **Run:** `node scripts/ingest-vehicle-knowledge.mjs` (or `--dry-run` to validate
  parsing with no DB). Idempotent; intended to run on every deploy.
- **Secrets:** needs `SUPABASE_SERVICE_ROLE_KEY` — server/CI only, never `NEXT_PUBLIC_*`.
- **Adding a vehicle:** seed its `supported_vehicles` row, add its folder→slug entry
  in `FOLDER_SLUG`, drop its Markdown under `04 - AI Data` / `05 - Trims`, re-run.
- **Editing the corpus:** edit the Markdown and re-run; changed sections re-upsert
  via `content_hash`, unchanged ones are skipped.
