# Cross-Language Retrieval — Implementation Report
**Date:** 2026-06-25  
**Status:** Implemented (Phase 1 complete)

---

## Root Cause

The `vehicle_knowledge` corpus is authored and stored in English. PostgreSQL FTS via
`websearch_to_tsquery('simple', user_query)` tokenises the query and matches it against
the `tsv` column, which is built from English content.

When a user asks `"كم ساعة يحتاج شحن بطارية سيلايون"`, Postgres produces Arabic tokens
(`كم`, `ساعة`, `شحن`, …). These tokens have no intersection with the English tokens in
the stored tsvector (`charging`, `battery`, `kw`, `ac`, …). The `@@` operator returns
`FALSE` for every row → **0 rows returned, always**.

The prior workaround (`INTENT_ENGLISH_QUERY`) mapped each knowledge category to a
hardcoded English keyword string and substituted that for the user's query when Arabic
was detected. This broke query specificity entirely: "how long to charge" and "what plug
type" both retrieved the exact same rows, ranked identically.

---

## Chosen Architecture — Phase 1: Query Translation Bridge

Translate Arabic (or Arabic-dominant) queries to English **before** FTS, using Gemini
Flash (cheapest, fastest). English-only queries bypass translation completely.

### Flow (after this implementation)

```
User query
    │
    ├─ English / no Arabic → FTS directly (unchanged)
    │
    └─ Contains Arabic chars
           │
           ▼
   translateQueryToEnglish()          ~100ms, ~$0.00002/query
   [Gemini 2.0 Flash Lite, T=0]
           │
           ▼
   English translation
           │
           ▼
   websearch_to_tsquery('simple', english_text)
           │
           ▼
   tsvector match → real, query-specific rows ✓
```

### Example

| Input | FTS query sent | Result |
|---|---|---|
| `"كم ساعة شحن البطارية؟"` | `"how many hours to charge the battery"` | Matches `charging`, `hours`, `battery` → real chunks |
| `"ما هو نوع الشاحن؟"` | `"what type of charger"` | Matches `charger`, `type` → real chunks |
| `"BYD سيلايون charging"` | `"BYD Sealion charging"` | Mixed query resolved → real chunks |
| `"battery charging time"` | `"battery charging time"` (no translation) | Direct FTS match |

---

## Files Modified

| File | Change |
|---|---|
| `lib/ai/query-translator.ts` | **New** — `queryNeedsTranslation()` + `translateQueryToEnglish()` with 5-min in-process cache, 3-second hard timeout, silent-fail contract |
| `lib/ai/retrieval.ts` | Removed `INTENT_ENGLISH_QUERY` dictionary. Imported translator. Translation call before FTS. Unified 2-path retry (primary → soft-narrow) for all query languages |
| `lib/ai/retrieval.test.ts` | Added mock for `@/lib/ai/query-translator`. Updated existing tests to use English queries where Arabic is not the test subject. Added `multilingual retrieval` describe block with 6 new tests |

### Code removed

```typescript
// DELETED from retrieval.ts — 7 lines, hardcoded category keyword map
const INTENT_ENGLISH_QUERY: Record<Exclude<KnowledgeCategory, "profile">, string> = {
  battery_charging: "charging battery kWh AC DC charge hours minutes plug port",
  engine_fuel: "engine fuel consumption hybrid range petrol torque",
  maintenance: "maintenance oil filter service interval km",
  safety: "safety airbag warning brake ABS crash",
  trims: "trim trims specs variant package equipment",
  market: "price warranty dealer availability jordan",
};
```

```typescript
// DELETED — three-step Arabic fallback path (28 lines)
if (englishFallbackQuery) {
  const englishPrimary = await run(englishFallbackQuery, category);
  if (englishPrimary.length > 0) return englishPrimary;
  return await run(englishFallbackQuery, null);
}
```

---

## Tradeoffs

### What we gain

- **Query specificity**: "charging time" and "plug type" now retrieve different, correctly
  ranked chunks. The old fallback retrieved identical rows for both.
- **Future-proof**: Any new vehicle manual added to the corpus works immediately — no
  keyword map entries to maintain.
- **Maintainability**: Zero manual additions needed as corpus grows.
- **Mixed-query support**: `"BYD سيلايون charging"` now routes correctly; the Arabic
  car name doesn't pollute the tsquery.

### What we accept

- **+~100ms per Arabic query** for the Gemini Flash translation call. English queries
  are unaffected. The main generation call (Gemini 2.5 Flash) already takes 800–2000ms,
  so 100ms overhead is ~5–12% added latency on Arabic queries.
- **~$0.00002 per Arabic query** (Gemini Flash Lite pricing). At 1,000 Arabic queries/day:
  ~$0.02/day. Negligible.
- **Cache**: In-process 5-minute TTL reduces repeated-query cost to zero. Cache is
  process-local (no Redis needed). Dev server restarts clear it.
- **Translation quality**: Gemini Flash Lite with `temperature: 0` and an
  automotive-focused system prompt handles standard automotive Arabic well. Edge cases
  (highly dialectal Arabic, very long queries) may produce suboptimal translations, but
  the soft-narrow fallback still gives retrieval a second chance.

---

## Retrieval Path Comparison

### Before (broken for Arabic)

```
Arabic query
    → websearch_to_tsquery('simple', arabic) → 0 rows (always)
    → INTENT_ENGLISH_QUERY[category] substituted
    → "charging battery kWh AC DC charge hours minutes plug port"
    → same 6 rows regardless of what the user actually asked ✗
```

### After (this implementation)

```
Arabic query
    → translateQueryToEnglish() → specific English translation
    → websearch_to_tsquery('simple', english_translation)
    → rows ranked by actual query relevance ✓
    → soft-narrow if 0 rows (wrong category guess) ✓
```

---

## Performance Impact

| Metric | Before | After |
|---|---|---|
| English query latency | baseline | unchanged |
| Arabic query latency | baseline (wrong results) | +~100ms (correct results) |
| Arabic query cost | $0 (wrong results) | ~$0.00002 (correct results) |
| RPC calls per Arabic query | 3 (Arabic + English fallback + soft-narrow) | 1–2 (translated + optional soft-narrow) |
| Cache hit cost | N/A | $0, 0ms overhead |

---

## Rollback Plan

To revert to the previous (broken) behaviour:

1. Delete `lib/ai/query-translator.ts`
2. Revert `lib/ai/retrieval.ts` to the previous commit:
   ```
   git checkout HEAD~1 -- lib/ai/retrieval.ts
   ```
3. The `INTENT_ENGLISH_QUERY` dictionary and 3-step fallback path are preserved in git
   history.

The rollback takes under 2 minutes. No database changes were made — the schema, RPC,
and GIN index are untouched.

---

## Tests Added

The `multilingual retrieval` describe block in `lib/ai/retrieval.test.ts` proves:

1. Arabic-only query → translator called → FTS receives English text
2. English-only query → translator not called → FTS receives original text
3. Mixed Arabic+English query → translator called → Arabic portion resolved
4. Arabic and English equivalent queries → identical text arrives at FTS
5. Translation failure (identity return) → soft-narrow still rescues retrieval
6. All four requirement examples (`كم ساعة شحن البطارية؟`, `كم يستغرق الشحن؟`,
   `ما هي سعة البطارية؟`, `ما هو نوع الشاحن؟`) → each retrieves chunks via translation

---

## What Comes Next (Phase 2)

Phase 1 fixes retrieval correctness via translation. The target architecture (Phase 2)
eliminates the translation dependency entirely using multilingual embeddings:

- `text-multilingual-embedding-002` (Google, 768 dims, 100+ languages including Arabic)
- `pgvector` column on `vehicle_knowledge` (requires Supabase Pro or self-hosted)
- Hybrid search RPC combining FTS score + cosine similarity score
- Query-time embedding call (~30ms) replaces translation call (~100ms)
- Arabic `شحن بطارية` maps to same embedding neighbourhood as English `battery charging`
  — no translation needed at any point

See `plans/rag-v2-roadmap.md` for the Phase 2 schema, RPC, and ingestion plan.
