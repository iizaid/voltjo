# VoltJo RAG v2 — Architecture Roadmap
**Date:** 2026-06-25  
**Status:** Design complete, implementation pending

---

## Current State Assessment

### What Works
- Vehicle detection (alias + catalog token fallback)
- Intent classification (rule-based, 6 categories)
- Structured vehicle context injection (catalog facts)
- Ingestion pipeline (idempotent, SHA-256 change detection)
- Citation system (section + source + page + confidence)
- FTS index and search RPC (for English queries)
- Confidence gating (logic is sound, thresholds uncalibrated)
- Provider chain with fallbacks

### What Is Broken
- Cross-language retrieval (primary bug — all Arabic queries fail at FTS layer)
- Multi-turn vehicle memory (lastVehicleIds never passed)
- Production observability for retrieval failures
- Confidence calibration (thresholds never validated)

### Architectural Grade
**Current: B- (good structure, one critical bug blocking most real-world usage)**

---

## Retrieval Architecture Decision

### Evaluated Options

| Architecture | Cross-Lang | Latency | Cost | Infra Change | Solo Maintainable |
|---|---|---|---|---|---|
| FTS only (current) | ✗ broken | fast | free | none | yes |
| FTS + manual dictionary | ✗ broken for novel queries | fast | free | none | no (maintenance burden) |
| Query translation + FTS | ✓ near-complete | +150ms | ~$0.0003/query | none | yes |
| Monolingual embeddings + pgvector | ✓ (with translation) | +80ms | ~$0.0001/query | pgvector + schema | yes |
| **Multilingual embeddings + pgvector** | **✓ native** | **+50ms** | **~$0.0001/query** | **pgvector + schema** | **yes** |
| Full-stack semantic (Pinecone, etc.) | ✓ | +100ms | $$$ | external service | no |

### Decision

**Two-phase hybrid approach:**

**Phase 1 (now):** Query translation bridge. Detect Arabic in user query, call Gemini Flash to produce English translation, use translation for FTS. Remove `INTENT_ENGLISH_QUERY` dictionary entirely. Zero new infrastructure.

**Phase 2 (next sprint):** Hybrid FTS + multilingual embeddings via pgvector. Store `text-multilingual-embedding-002` vectors alongside tsvectors. Run both searches in parallel, merge results. Phase 1 translation bridge removed once Phase 2 is stable.

**Why not jump directly to Phase 2?** pgvector on Supabase requires Pro plan (or manual setup). The translation bridge ships in one day and fixes the production bug now.

---

## Target Architecture (RAG v2)

```
User Message
     │
     ▼
┌─────────────────────────────────────┐
│        Vehicle Context Builder       │
│                                      │
│  1. normalizeArabic(message)         │
│  2. detectVehicleIds()               │
│     ├─ alias cache (in-memory, 1hr) │
│     └─ catalog token fallback       │
│  3. detectIntent()                   │
│  4. buildVehicleContextForPrompt()   │
└─────────────────────────────────────┘
     │
     │ vehicleIds, intent, normalized message
     ▼
┌─────────────────────────────────────┐
│         Retrieval Orchestrator       │
│                                      │
│  ┌──────────────────────────────┐   │
│  │  Multilingual Query Embedder │   │
│  │  (text-multilingual-emb-002) │   │
│  │  Input: raw user message     │   │
│  │  Output: 768-dim vector      │   │
│  └──────────────────────────────┘   │
│            │                         │
│  ┌─────────▼────────────────────┐   │
│  │   Hybrid Search RPC          │   │
│  │   search_vehicle_knowledge   │   │
│  │   _hybrid()                  │   │
│  │                              │   │
│  │   FTS branch:                │   │
│  │   websearch_to_tsquery on    │   │
│  │   any Latin tokens in query  │   │
│  │                              │   │
│  │   Vector branch:             │   │
│  │   embedding <=> p_query_vec  │   │
│  │   (language-agnostic)        │   │
│  │                              │   │
│  │   Merge: alpha-weighted      │   │
│  │   combined score             │   │
│  └──────────────────────────────┘   │
│            │                         │
│  ┌─────────▼────────────────────┐   │
│  │  Confidence Gate             │   │
│  │  (calibrated TAU thresholds) │   │
│  └──────────────────────────────┘   │
└─────────────────────────────────────┘
     │
     │ grounded chunks, citations, confidence band
     ▼
┌─────────────────────────────────────┐
│         Context Assembler            │
│                                      │
│  structuredText (catalog facts)      │
│  + RAG chunks (cited, trimmed)       │
│  = contextText for system prompt     │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│         System Prompt Builder        │
│                                      │
│  BASE_SYSTEM_PROMPT                 │
│  + language instruction              │
│  + context block (<<<...>>>)        │
│  + confidence disclaimer if LOW     │
└─────────────────────────────────────┘
     │
     ▼
┌─────────────────────────────────────┐
│         LLM Provider Chain           │
│                                      │
│  Primary → Fallback 1 → Fallback 2  │
│  (Gemini / OpenAI / DeepSeek)       │
└─────────────────────────────────────┘
     │
     ▼
   Response + citations + confidence band
```

---

## Database Schema Changes (RAG v2)

### Migration 015 — pgvector + embedding column

```sql
CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE public.vehicle_knowledge
  ADD COLUMN IF NOT EXISTS embedding vector(768);

CREATE INDEX IF NOT EXISTS vehicle_knowledge_embedding_idx
  ON public.vehicle_knowledge
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);
```

### Migration 016 — Hybrid search RPC

Replace `search_vehicle_knowledge` with `search_vehicle_knowledge_hybrid` (additive — keep old RPC for rollback capability).

### Migration 017 — Conversation context table (for multi-turn memory)

```sql
CREATE TABLE IF NOT EXISTS public.chat_vehicle_context (
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  vehicle_ids     uuid[] NOT NULL DEFAULT '{}',
  intent          text,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (conversation_id)
);
```

---

## Multi-Turn Memory Fix

**Current problem:** `lastVehicleIds` parameter in `RetrievalOptions` is never populated because `buildSystemPrompt` receives only the current message.

**Fix:** Pass conversation context into the prompt builder.

```typescript
// lib/ai/prompt.ts
export async function buildSystemPrompt(
  request: AiChatRequest,
  context?: { lastVehicleIds?: string[] }  // Add this
): Promise<SystemPromptResult> {
  retrieval = await buildVehicleContextForPrompt(request.message, {
    lastVehicleIds: context?.lastVehicleIds,  // Now actually used
  });
}
```

The API route reads the last matched vehicle IDs from `chat_vehicle_context`, passes them to `buildSystemPrompt`, and upserts the new matched IDs after successful retrieval.

---

## Observability Requirements (Missing Today)

The current pipeline swallows all errors silently. RAG v2 requires:

```typescript
// Structured retrieval log (goes to your existing logAiRequest system)
logRetrievalEvent({
  requestId: string,
  vehicleIds: string[],
  intent: KnowledgeCategory | null,
  query: string,
  translationUsed: boolean,  // Phase 1
  embeddingUsed: boolean,    // Phase 2
  chunksReturned: number,
  confidence: RetrievalConfidence,
  ftsRows: number,
  vecRows: number,
  errorCode?: string,         // Surface admin client failures
  latencyMs: number,
});
```

At minimum: if `createAdminClient()` returns null, this must produce an error-level log, not a silent degradation.

---

## Ingestion Pipeline v2

### Auto-discovery (remove FOLDER_SLUG hardcoding)

```javascript
// Instead of static FOLDER_SLUG map, read from supported_vehicles
const { data: vehicles } = await supabase
  .from('supported_vehicles')
  .select('id, slug, name_en')
  .eq('market', 'jordan')
  .eq('is_active', true);

// Convention: folder name contains slug, e.g. "03 - BYD Sealion 05 DM-i 2025"
// Use fuzzy slug matching or a separate folder_slug column in supported_vehicles
```

### Embedding on ingest

After upserting a chunk (new or updated), compute and store its embedding:

```javascript
// After upsert:
const embedding = await embedText(chunk.content); // text-multilingual-embedding-002
await supabase
  .from('vehicle_knowledge')
  .update({ embedding })
  .eq('id', chunk.id);
```

### Overlap chunking

Replace the strict `##` split with overlapping chunks:

```javascript
// Split on ##, but also create overlap chunks that span the last 150 chars
// of a section + the first 150 chars of the next section
// This catches answers that bridge two sections
```

---

## What "Genuinely Better than ChatGPT" Looks Like

VoltJo beats a general-purpose LLM on this domain when:

1. **Grounded specs:** Battery sizes, charge times, range figures from owner manuals — cited, not hallucinated
2. **Jordan-specific pricing:** JOD price ranges from live catalog, not outdated training data
3. **Warranty and dealer info:** Jordan dealer network, warranty terms (not export market data)
4. **Comparison:** Side-by-side structured comparison with per-vehicle citations
5. **Confidence honesty:** "This figure is from the EU export manual — Jordan specs may differ" — ChatGPT won't say this
6. **Document depth:** Page-cited answers from owner manuals (Section 5, Page 209) — not a paraphrase

The embedding-based retrieval is the foundation for (1) and (3). The structured catalog is already doing (2) and (5). Multi-turn memory enables (4). Citation formatting enables (6).
