# VoltJo AI — Implementation Priority List
**Date:** 2026-06-25  
**Author:** Staff Engineer Audit  
**Scope:** Post-audit implementation roadmap across P0–P3 tiers

---

## Priority Framework

| Tier | Definition |
|------|-----------|
| P0 | Production is broken or misleading — users get wrong answers. Ship within days. |
| P1 | Major quality gap — retrieval is significantly degraded. Ship within 2 weeks. |
| P2 | Advanced capabilities — genuinely better than ChatGPT baseline. Ship within 4 weeks. |
| P3 | Future enhancements — full owner manual coverage, premium features. Quarter scope. |

---

## P0 — Critical Fixes (Ship within days)

### P0.1 — Query Translation Bridge (THE fix for the production bug)

**Problem:** Arabic queries return 0 retrieval rows. INTENT_ENGLISH_QUERY dictionary discards query specificity.  
**Impact:** Every Arabic-language user gets LOW confidence, no grounded answer. This is the majority of the target user base.  
**Solution:** Detect Arabic queries, call Gemini Flash for English translation, use translation for FTS. Remove `INTENT_ENGLISH_QUERY` entirely.

**Files to change:**
- `lib/ai/retrieval.ts` — Add `translateQueryIfArabic()`, remove `INTENT_ENGLISH_QUERY`, update `retrieveKnowledgeChunks` to call translation before FTS
- New: `lib/ai/translation.ts` — Isolated, tested translation helper

**Expected impact:** Arabic retrieval goes from 0% success to ~85% success rate.  
**Complexity:** Low — one new function, isolated, no DB changes.  
**Risk:** Low — translation adds latency but no data mutation. Fallback on translation failure: use original query (safe degradation).  
**Effort:** 4–6 hours.

```typescript
// lib/ai/translation.ts (new file)
export async function translateToEnglishForSearch(query: string): Promise<string> {
  // Only translate if Arabic is present
  if (!/[؀-ۿ]/.test(query)) return query;
  
  // Call Gemini Flash with a focused, low-token prompt
  // Preserve: vehicle names, model numbers, technical acronyms (kWh, AC, DC, BYD)
  // Translate: Arabic words
  // Return: English string suitable for FTS
  // On any failure: return original query (safe degradation)
}
```

---

### P0.2 — Remove the INTENT_ENGLISH_QUERY Dictionary

**Problem:** Even after translation is added, the old fallback path remains active for queries that mix Arabic + some Latin chars. The dictionary must be surgically removed to avoid interference.  
**Files:** `lib/ai/retrieval.ts:11-18`, `lib/ai/retrieval.ts:117-164` (fallback logic)  
**Impact:** Cleaner code, no more hardcoded keyword-to-category mappings.  
**Complexity:** Low — deletion + logic restructure.  
**Risk:** Low — translation bridge replaces this path.  
**Effort:** 1–2 hours (done together with P0.1).

---

### P0.3 — Surface Admin Client Failures in Production Logs

**Problem:** `createAdminClient()` returning null silently degrades retrieval to empty with no observable signal.  
**Files:** `lib/ai/retrieval.ts:128-130`, `lib/supabase/admin.ts`  
**Solution:** If admin client is null, emit an error-level structured log (not just a `d()` debug line). Piggyback on the existing `logAiRequest` system or use `console.error`.

```typescript
if (!admin) {
  console.error('[RAG:retrieval] CRITICAL: createAdminClient() returned null. SUPABASE_SERVICE_ROLE_KEY missing or invalid. All retrieval will fail.');
  return [];
}
```

**Impact:** Production incidents become detectable. Currently invisible.  
**Complexity:** Trivial.  
**Risk:** Zero.  
**Effort:** 30 minutes.

---

### P0.4 — Fix lastVehicleIds Never Being Passed (Multi-Turn Memory)

**Problem:** `buildSystemPrompt` calls `buildVehicleContextForPrompt(request.message)` with no options — `lastVehicleIds` is never populated. Multi-turn vehicle context is silently broken.

**Files:**
- `lib/ai/prompt.ts:53` — Pass `lastVehicleIds` from `request` context
- `lib/ai/types.ts` — Add `lastVehicleIds?: string[]` to `AiChatRequest` or a new context type
- The API route that calls `generateAiChatResponse` — Read previous vehicle IDs from conversation metadata and pass through

**Expected impact:** "وكم سعرها؟" after a Sealion discussion now correctly retrieves Sealion data.  
**Complexity:** Medium — requires conversation state threading.  
**Risk:** Low.  
**Effort:** 4–8 hours.

---

## P1 — Major Quality Improvements (Ship within 2 weeks)

### P1.1 — Hybrid FTS + Multilingual Embeddings (pgvector)

**Problem:** Translation bridge adds latency and has translation quality risk. True multilingual embeddings handle Arabic natively.  
**Solution:** `text-multilingual-embedding-002` via Gemini API, stored in pgvector column, hybrid search RPC.

**Prerequisite:** Supabase Pro plan (for pgvector) or confirm pgvector is available on current plan.

**Files/migrations to create:**
- `supabase/migrations/015_pgvector_embedding.sql` — Add vector extension + embedding column + IVFFlat index
- `supabase/migrations/016_hybrid_search_rpc.sql` — `search_vehicle_knowledge_hybrid()` function
- `scripts/embed-vehicle-knowledge.mjs` — One-time embedding script for existing chunks
- `lib/ai/embed.ts` — `embedText(text: string): Promise<number[]>` wrapper
- `lib/ai/retrieval.ts` — Use hybrid RPC, pass both query text and embedding vector

**Expected impact:** True cross-language retrieval, better semantic matching, no translation latency.  
**Complexity:** High — new DB extension, schema change, new RPC, embedding integration.  
**Risk:** Medium — pgvector requires extension to be available; IVFFlat index needs tuning.  
**Effort:** 2–3 days.

---

### P1.2 — Calibrate Confidence Thresholds (TAU_LOW, TAU_HIGH)

**Problem:** `TAU_LOW = 0.02`, `TAU_HIGH = 0.1` were set as "conservative launch defaults." `ts_rank` values depend on document length and are not normalized. Thresholds have never been validated.

**Solution:** Build a small eval set (20–30 questions with known good answers). Run retrieval, collect actual `ts_rank` values for both correct and incorrect retrievals, set thresholds at natural breakpoints.

**Files:** `lib/ai/retrieval.ts:44-45`  
**Impact:** Reduces over-disclaiming (MEDIUM confidence on actually-relevant chunks) and under-disclaiming (HIGH confidence on garbage-ranked fallbacks).  
**Complexity:** Medium — requires building eval harness.  
**Risk:** Low.  
**Effort:** 1 day.

---

### P1.3 — Confidence Gate: Separate Source Trust from Retrieval Relevance

**Problem:** `computeRetrievalConfidence` returns HIGH based on `official` confidence label AND rank ≥ TAU_HIGH. A chunk retrieved via keyword fallback (not the user's actual question) can get HIGH confidence because the chunk source is "official."

**Solution:** Add a relevance score separate from source trust.

```typescript
export function computeRetrievalConfidence(
  chunks: KnowledgeChunk[],
  retrievalMode: 'semantic' | 'fts_direct' | 'fts_translated' | 'fts_fallback'
): RetrievalConfidence {
  if (chunks.length === 0) return 'LOW';
  if (retrievalMode === 'fts_fallback') return 'LOW'; // Fallback = low relevance by definition
  
  // Only upgraded by genuine query relevance
  const topRank = chunks.reduce((m, c) => Math.max(m, c.rank), 0);
  const hasStrong = chunks.some(c => 
    (c.confidence === 'official' || c.confidence === 'dealer') && c.rank >= TAU_HIGH
  );
  
  if (hasStrong && retrievalMode !== 'fts_fallback') return 'HIGH';
  if (topRank < TAU_LOW) return 'LOW';
  if (chunks.every(c => c.confidence === 'unknown')) return 'MEDIUM'; // Changed from LOW
  return 'MEDIUM';
}
```

**Files:** `lib/ai/retrieval.ts:188-202`  
**Effort:** 2 hours.

---

### P1.4 — Fix Ingestion: Remove FOLDER_SLUG Hardcoding

**Problem:** Every new vehicle requires editing `scripts/ingest-vehicle-knowledge.mjs`.

**Solution:** Add a `cars_folder` column to `supported_vehicles` (or derive it from slug), auto-discover matching folders.

```sql
-- Alternative: add metadata column
ALTER TABLE public.supported_vehicles
  ADD COLUMN IF NOT EXISTS knowledge_folder text;
-- 'byd-sealion-05-dmi-2025' → 'knowledge_folder' = '03 - BYD Sealion 05 DM-i 2025'
```

Or: convention-based discovery where the ingestion script matches slug tokens against folder names without an explicit map.

**Files:** `scripts/ingest-vehicle-knowledge.mjs:62-69`, new migration  
**Impact:** Adding a new vehicle is entirely self-service — no code edit required.  
**Complexity:** Medium.  
**Effort:** 4 hours.

---

### P1.5 — Observability: Structured Retrieval Logging

**Problem:** Retrieval errors are completely invisible in production.  
**Solution:** Emit one structured JSON log per retrieval attempt with all relevant fields.

**Files:** `lib/ai/retrieval.ts`, `lib/ai/vehicle-context.ts`

```typescript
logRetrievalEvent({
  requestId, vehicleIds, intent, queryLength: query.length,
  translationUsed, embeddingUsed, chunksReturned,
  confidence, ftsRows, vecRows, errorCode, latencyMs
});
```

**Effort:** 2 hours.

---

## P2 — Advanced Capabilities (Ship within 4 weeks)

### P2.1 — Conversation History in Retrieval

**Problem:** Retrieval is single-turn. Follow-up questions without explicit vehicle mention fail.  
**Solution:** Store matched vehicle IDs per conversation, include them in retrieval options. Optionally include the last 1–2 turns in the retrieval query for better context.

```typescript
// Enhanced query for retrieval: "وكم سعرها؟" + last turn: "سؤال عن Sealion 05"
// Combined: "كم سعر Sealion 05"
```

**Complexity:** Medium (requires conversation state threading through the request pipeline).  
**Effort:** 1–2 days.

---

### P2.2 — Language-Aware Response Instruction

**Problem:** System prompt says "أجب بالعربية" regardless of user language. English users get Arabic responses.  
**Solution:** Detect primary language of user message, inject matching instruction.

```typescript
const responseLanguageInstruction = isPrimaryArabic(message)
  ? "أجب بالعربية الفصحى المبسطة."
  : "Answer in clear, simple English. You may include Arabic vehicle names as-is.";
```

**Effort:** 2 hours.

---

### P2.3 — Overlapping Chunk Ingestion

**Problem:** Answers spanning two consecutive manual sections are missed by strict `##` boundary splitting.  
**Solution:** After splitting, generate overlap chunks (last 150 chars of section N + first 150 chars of section N+1). Store with special section name `"overlap / N + N+1"`.

**Tradeoff:** Increases chunk count by ~50%, increases storage and embedding cost proportionally. Still negligible at current corpus size.

**Effort:** 1 day (ingestion script change + re-ingest).

---

### P2.4 — Chunk Size Normalization

**Problem:** `###` subsections merge into parent `##` chunks, producing chunks that exceed `MAX_CHUNK_CHARS = 600`.  
**Solution:** Also split on `###` when the resulting chunk would exceed the size limit.

**Effort:** 3 hours.

---

### P2.5 — Eval Harness for Retrieval Quality

**Problem:** No way to measure whether changes improve or regress retrieval quality.  
**Solution:** Create `tests/retrieval.eval.ts` with a golden set of (query, expected_section) pairs. Run against live DB and report precision@k.

```typescript
const GOLDEN_SET = [
  { query: "كم ساعة يحتاج شحن بطارية سيلايون", expected: "battery-and-charging / Charging time" },
  { query: "How long does Sealion charging take", expected: "battery-and-charging / Charging time" },
  // ... 20 more
];
```

**Effort:** 1 day.

---

### P2.6 — `profile` Category Cleanup

**Problem:** `KnowledgeCategory` type includes `"profile"` but `detectIntent()` can never return it. This creates a type lie.  
**Solution:** Either (a) remove `"profile"` from the public type and only use it internally for storage, or (b) add an intent rule that returns `"profile"` for vehicle overview questions.

**Effort:** 1 hour.

---

## P3 — Future Enhancements (Quarter scope)

### P3.1 — Full Owner Manual Ingestion

Ingest complete owner manual PDFs (not just AI Data folders). Requires:
- PDF text extraction (likely `pdf-parse` or Gemini's PDF understanding)
- More granular chunking for 200+ page manuals
- Arabic + English dual content in some manuals

**Effort:** 1–2 weeks per vehicle batch.

---

### P3.2 — Reranking Layer

After retrieving top-20 candidates via hybrid search, use a cross-encoder or Gemini to rerank by relevance to the specific query. Significantly improves precision for complex questions.

**Cost:** ~$0.001 per reranking call.  
**Latency:** +100–150ms.  
**When to add:** When corpus > 2,000 chunks and precision recall becomes measurable.

---

### P3.3 — Live Market Data Integration

Replace static JOD price ranges with live prices from dealer APIs or web scraping. Ground "how much does X cost in Jordan" in real-time data.

---

### P3.4 — User Feedback Loop

"Was this helpful?" feedback captured per answer, linked to retrieval metadata. Enables supervised fine-tuning of confidence thresholds and retrieval alpha weights.

---

## Summary Table

| # | Task | Priority | Impact | Effort | Risk |
|---|------|----------|--------|--------|------|
| P0.1 | Query translation bridge | P0 | Critical — fixes all Arabic queries | 6h | Low |
| P0.2 | Remove INTENT_ENGLISH_QUERY | P0 | High — cleaner fallback logic | 2h | Low |
| P0.3 | Surface admin client failures | P0 | High — production observability | 30m | Zero |
| P0.4 | Fix lastVehicleIds threading | P0 | High — multi-turn memory | 6h | Low |
| P1.1 | pgvector + multilingual embeddings | P1 | Very High — true cross-lang | 3d | Medium |
| P1.2 | Calibrate TAU thresholds | P1 | Medium — confidence accuracy | 1d | Low |
| P1.3 | Separate source trust from relevance | P1 | Medium — confidence honesty | 2h | Low |
| P1.4 | Remove FOLDER_SLUG hardcoding | P1 | Medium — onboarding new vehicles | 4h | Low |
| P1.5 | Structured retrieval logging | P1 | High — observability | 2h | Zero |
| P2.1 | Conversation history in retrieval | P2 | High — multi-turn UX | 2d | Medium |
| P2.2 | Language-aware response instruction | P2 | Medium — UX for English users | 2h | Low |
| P2.3 | Overlapping chunk ingestion | P2 | Medium — cross-section answers | 1d | Low |
| P2.4 | Chunk size normalization | P2 | Medium — long chunk trimming | 3h | Low |
| P2.5 | Eval harness | P2 | High — quality measurement | 1d | Zero |
| P3.1 | Full owner manual ingestion | P3 | Very High — depth of knowledge | 2w | Medium |
| P3.2 | Reranking layer | P3 | High — precision at scale | 1d | Low |

---

## Sprint Plan (Solo Developer)

### Sprint 1 (Days 1–3): P0 fixes
- Day 1: P0.1 (translation bridge) + P0.2 (remove dictionary) + P0.3 (logging)
- Day 2: P0.4 (multi-turn memory threading) + P1.5 (structured retrieval logging)
- Day 3: Test all Arabic/English/mixed queries manually. Deploy.

### Sprint 2 (Days 4–10): P1 foundations  
- Days 4–6: P1.1 (pgvector setup + embedding script + hybrid RPC)
- Day 7: P1.2 (eval set + threshold calibration)
- Day 8: P1.3 (confidence gate fix) + P1.4 (ingestion auto-discovery)
- Days 9–10: End-to-end testing of hybrid retrieval. Remove translation bridge if Phase 2 stable.

### Sprint 3 (Days 11–20): P2 quality
- Days 11–12: P2.1 (conversation history)
- Day 13: P2.2 (language instruction) + P2.3 (chunk overlap)
- Day 14: P2.4 (chunk size) + P2.5 (eval harness)
- Days 15–20: Eval harness results, iterate on alpha weighting, document improvements.
