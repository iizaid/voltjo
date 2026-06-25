# VoltJo — Cross-Language Retrieval Design
**Date:** 2026-06-25  
**Scope:** Multilingual retrieval strategy for Arabic ↔ English queries against an English-language knowledge corpus

---

## Problem Statement

The knowledge corpus (`vehicle_knowledge`) is authored in English. Users ask questions in Arabic, English, or a mix. The current FTS system uses `websearch_to_tsquery('simple', user_query)` — Arabic query tokens can never match English tsvector tokens. The workaround (`INTENT_ENGLISH_QUERY`) is a hardcoded category-keyword dictionary that discards query specificity entirely.

**Test cases that must all succeed:**

```
Arabic:  "كم ساعة يحتاج شحن بطارية سيلايون"
English: "How long does Sealion charging take"
Mixed:   "BYD سيلايون charging"
```

All three should retrieve the same high-relevance chunks from the battery_charging section of the Sealion 05 manual.

---

## Option Evaluation

### Option 1 — Keep current FTS + improve keyword fallback

**Approach:** Expand the `INTENT_ENGLISH_QUERY` map with more keywords per category.

**Why this doesn't work:** This is exactly the "manual mapping" approach rejected. It discards query specificity, cannot handle novel questions, and requires ongoing manual maintenance as the corpus grows to cover full owner manuals. Rejected.

---

### Option 2 — Query Translation (LLM-based)

**Approach:** Before FTS, detect if the query is primarily Arabic. If so, call a lightweight LLM (Gemini Flash) to translate the Arabic portion to English. Then run FTS on the English translation.

```
Arabic query: "كم ساعة يحتاج شحن بطارية سيلايون"
→ translate → "how many hours does Sealion battery charging take"
→ FTS → matches "Charging time", "battery", "hours" in tsvector
```

**Pros:**
- Zero new infrastructure (already have Gemini API)
- Works immediately on existing tsvector/GIN index
- Handles novel questions not covered by keyword maps
- Preserves English vehicle names and technical terms
- Mixed queries work naturally (only Arabic portions translated)

**Cons:**
- Adds ~100–200ms latency per Arabic query (one extra LLM call)
- Adds ~$0.0001–0.0003 cost per query (Gemini Flash input tokens)
- Translation quality depends on Gemini Flash — automotive Arabic may have edge cases
- Still limited by FTS precision (no stemming with 'simple' config)

**Verdict: Strong P0 candidate.** Immediate fix with minimal risk, zero new infrastructure. Not the permanent architecture, but gets retrieval working correctly within hours.

---

### Option 3 — Dual-Language Chunk Storage

**Approach:** When ingesting content, also store an Arabic translation of each chunk. Build a separate Arabic tsvector column or a second `vehicle_knowledge_ar` table. At query time, search the language-appropriate index.

**Pros:**
- FTS stays simple — no embeddings
- Arabic search could use proper Arabic text normalization

**Cons:**
- Doubles ingestion complexity and storage
- Translation of 200+ technical manual sections requires significant upfront cost
- Arabic translations of technical manuals need review — automated translation errors become grounded hallucinations
- Two indexes to maintain as corpus grows
- Mixed-language queries still problematic (which index to search?)

**Verdict: Not recommended.** Dual storage has high ingestion cost, translation errors become dangerous (grounded hallucinations), and mixed queries remain unsolved. Skipped in favor of embedding-based approaches.

---

### Option 4 — Full Semantic Retrieval (pgvector, monolingual embeddings)

**Approach:** Replace FTS with vector similarity search. Embed all chunks with a model like `text-embedding-004` (English-only). At query time, translate Arabic to English (Option 2), then embed the translated query and do ANN search.

**Pros:**
- Handles semantic paraphrasing ("charge" vs "charging" vs "plug in")
- Much better precision than keyword FTS

**Cons:**
- Requires translation step anyway (so adds Option 2's latency)
- `pgvector` extension requires Supabase Pro plan (costs ~$25/mo more)
- Embedding all chunks upfront: ~$0.002 for 500 chunks at current Gemini pricing (one-time, negligible)
- At query time: one embedding API call + vector search
- English-only models may not handle Arabic query terms in mixed queries even after translation

**Verdict: Good long-term architecture but requires translation step — combine with Option 5.**

---

### Option 5 — Hybrid FTS + Multilingual Embeddings (RECOMMENDED FINAL ARCHITECTURE)

**Approach:** Use a multilingual embedding model to produce language-agnostic semantic vectors. `شحن بطارية` and `battery charging` map to nearby vectors in multilingual embedding space. Store embeddings in pgvector alongside the existing tsvector. At query time: run both FTS and vector search in parallel, then merge/rerank results.

**Recommended embedding model:** `text-multilingual-embedding-002` (Google, 768 dimensions, supports 100+ languages including Arabic). Available via the Vertex AI SDK or through the Gemini API client. The same API key VoltJo already uses.

**Pros:**
- True cross-language retrieval — no translation needed at query time
- Handles Arabic, English, and mixed queries identically
- FTS fallback provides exact-match precision where embeddings may be fuzzy
- Semantic understanding ("emergency charging" still matches "DC fast charging")
- Full owner manuals benefit greatly — many sections use technical vocabulary with Arabic paraphrases

**Cons:**
- Requires `pgvector` Supabase extension (Pro plan or self-hosted)
- Upfront embedding cost for all chunks (one-time, small)
- ~50–80ms additional query latency for embedding API call
- Slightly more complex retrieval code (two search paths, merging)

**Verdict: This is the target architecture. Build toward it in Phase 2 (P1).**

---

## Recommended Two-Phase Strategy

### Phase 1 (P0) — Query Translation Bridge: Ship in days

Fix the immediate production bug without new infrastructure.

**How it works:**

```typescript
// lib/ai/retrieval.ts (modified retrieveKnowledgeChunks)

async function translateQueryIfArabic(query: string): Promise<string> {
  const hasLatin = /[a-zA-Z]/.test(query);
  const hasArabic = /[؀-ۿ]/.test(query);
  
  if (!hasArabic) return query; // Already English or mixed-Latin, use as-is
  if (hasLatin && !hasArabic) return query; // Pure English
  
  // Arabic-only or Arabic-dominant: translate to English
  // Use Gemini Flash (cheapest, fastest) with a focused prompt
  const translated = await translateToEnglish(query);
  
  // For mixed queries: preserve Latin vehicle names, translate Arabic words
  // "BYD سيلايون charging" → "BYD Sealion charging" (not needed if mixed handled below)
  return translated;
}

async function translateToEnglish(arabicQuery: string): Promise<string> {
  // Single focused call, ~50 tokens in, ~20 tokens out, ~$0.0002
  const prompt = `Translate this automotive question from Arabic to English. 
Keep vehicle names, model numbers, and technical acronyms (kWh, AC, DC) unchanged.
Output only the English translation, nothing else.

Arabic: ${arabicQuery}`;
  
  // Call Gemini Flash (not the primary model — use a lightweight call)
  // Returns English translation
}
```

**Retrieval flow after translation:**

```
User: "كم ساعة يحتاج شحن بطارية سيلايون"
    ↓
detectArabic() → true
    ↓
translateToEnglish() → "how many hours does Sealion battery charging take"
    ↓
FTS: websearch_to_tsquery('simple', 'how many hours does Sealion battery charging take')
    ↓
Matches: "Charging time", "battery", "hours", "Sealion" in tsvector
    ↓
Returns relevant chunks ✓
```

**Mixed query flow:**

```
User: "BYD سيلايون charging"
    ↓
hasLatin = true (BYD, charging), hasArabic = true (سيلايون)
    ↓
translateToEnglish() → "BYD Sealion charging"
    ↓
FTS matches ✓
```

**Cost:** ~$0.0002–0.0004 per Arabic query (Gemini Flash pricing). For 1,000 Arabic queries/day: $0.20–0.40/day. Negligible.

**Latency:** ~100–150ms per Arabic query for the translation call (parallel with vehicle detection if needed). Acceptable.

**Eliminating the INTENT_ENGLISH_QUERY dictionary:** Once translation is in place, the hardcoded category keyword fallback (`INTENT_ENGLISH_QUERY`) is completely removed. Query specificity is preserved through translation rather than discarded via keyword substitution.

---

### Phase 2 (P1) — True Multilingual Embeddings: Ship in weeks

Replace translation dependency with language-agnostic semantic retrieval.

**Database changes:**

```sql
-- Migration 015: Add pgvector extension and embedding column
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.vehicle_knowledge 
  ADD COLUMN IF NOT EXISTS embedding vector(768);

-- IVFFlat index for ANN search (tune lists= after data volume grows)
CREATE INDEX IF NOT EXISTS vehicle_knowledge_embedding_idx
  ON public.vehicle_knowledge 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);
```

**New search function:**

```sql
-- Migration 016: Hybrid search RPC
CREATE OR REPLACE FUNCTION public.search_vehicle_knowledge_hybrid(
  p_vehicle_ids uuid[],
  p_query_text  text,
  p_query_vec   vector(768),
  p_category    text DEFAULT NULL,
  p_limit       int  DEFAULT 6,
  p_alpha       real DEFAULT 0.5  -- 0=FTS only, 1=vector only, 0.5=balanced
)
RETURNS TABLE (
  id uuid, vehicle_id uuid, category text, section text, content text,
  source_ref text, source_file text, page_ref text,
  confidence text, confidence_raw text, rank real
)
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  WITH fts AS (
    SELECT k.id,
           ts_rank(k.tsv, websearch_to_tsquery('simple', p_query_text)) AS fts_score
    FROM public.vehicle_knowledge k
    WHERE k.vehicle_id = ANY(p_vehicle_ids)
      AND (p_category IS NULL OR k.category = p_category)
      AND k.tsv @@ websearch_to_tsquery('simple', p_query_text)
  ),
  vec AS (
    SELECT k.id,
           1 - (k.embedding <=> p_query_vec) AS vec_score
    FROM public.vehicle_knowledge k
    WHERE k.vehicle_id = ANY(p_vehicle_ids)
      AND (p_category IS NULL OR k.category = p_category)
      AND k.embedding IS NOT NULL
    ORDER BY k.embedding <=> p_query_vec
    LIMIT p_limit * 3
  ),
  merged AS (
    SELECT COALESCE(fts.id, vec.id) AS id,
           (COALESCE(fts.fts_score, 0) * (1 - p_alpha)) +
           (COALESCE(vec.vec_score, 0) * p_alpha) AS rank
    FROM fts FULL OUTER JOIN vec ON fts.id = vec.id
  )
  SELECT k.id, k.vehicle_id, k.category, k.section, k.content,
         k.source_ref, k.source_file, k.page_ref,
         k.confidence, k.confidence_raw,
         m.rank
  FROM merged m
  JOIN public.vehicle_knowledge k ON k.id = m.id
  ORDER BY m.rank DESC
  LIMIT greatest(1, least(coalesce(p_limit, 6), 24));
$$;
```

**Embedding all chunks (one-time ingestion, ~$0.002 for 500 chunks):**

```javascript
// scripts/embed-vehicle-knowledge.mjs
// Reads all vehicle_knowledge rows with NULL embedding,
// calls text-multilingual-embedding-002 via Gemini API in batches,
// updates rows with embedding vectors
```

**Query-time embedding call:**

```typescript
// In retrieveKnowledgeChunks:
const queryEmbedding = await embedText(query); // ~30ms, language-agnostic
const results = await admin.rpc('search_vehicle_knowledge_hybrid', {
  p_vehicle_ids: vehicleIds,
  p_query_text: query,  // Still used for FTS on any English/Latin terms
  p_query_vec: queryEmbedding,
  p_category: category,
  p_limit: limit,
  p_alpha: 0.7,  // Bias toward semantic for mixed-language queries
});
```

**Result:** All three test cases succeed without any translation step:
- `كم ساعة يحتاج شحن بطارية سيلايون` → embedding near "Sealion battery charging time" ✓
- `How long does Sealion charging take` → FTS + embedding both match ✓  
- `BYD سيلايون charging` → embedding handles Arabic car name + English term ✓

---

## Retrieval Flow Comparison

### Current (broken for Arabic)
```
User query → normalizeArabic → FTS (Arabic tokens vs English tsvector) → 0 rows
                                    ↓
                          INTENT_ENGLISH_QUERY fallback → generic keywords → garbage ranking
```

### Phase 1 (translation bridge)
```
User query → detectLanguage → [Arabic] → translateToEnglish (Gemini Flash, 150ms)
                                              ↓
                                         FTS (English translation) → real results ✓
                           → [English] → FTS directly ✓
```

### Phase 2 (hybrid embeddings — target architecture)
```
User query → embedText (multilingual, 30ms, language-agnostic)
                 ↓                              ↓
          vector similarity search    +    FTS (for exact Latin terms)
                 ↓                              ↓
                    merged + reranked by hybrid score
                              ↓
                      top-k grounded chunks ✓
```

---

## Important: What NOT to Do

1. **Do not store Arabic translations of chunks.** Translation errors in grounded knowledge become hallucinations. If the Arabic translation says "3 hours" and the English original says "3.5 hours", the model will state an incorrect fact with "official" confidence.

2. **Do not expand the `INTENT_ENGLISH_QUERY` dictionary.** More keywords = more maintenance burden, no gain in specificity, same root problem.

3. **Do not use a separate Arabic FTS index.** User content is English; building Arabic tsvectors over English content solves nothing.

4. **Do not use Elasticsearch or Pinecone.** The solo-developer constraint means one infrastructure: Supabase. pgvector keeps everything in Postgres.
