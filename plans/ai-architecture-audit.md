# VoltJo AI Architecture Audit
**Date:** 2026-06-25  
**Scope:** Full end-to-end AI pipeline audit — vehicle detection → alias matching → intent detection → retrieval orchestration → search RPC → prompt building → Gemini interaction → confidence gating → fallback behaviour → citations → structured catalog integration → knowledge ingestion pipeline  
**Severity labels:** CRITICAL | HIGH | MEDIUM | LOW

---

## Executive Summary

The pipeline is architecturally sound at a high level. The layered design (catalog → alias → intent → FTS → grounded context → LLM) is the right shape for a solo-developer RAG system. However, **one root cause accounts for virtually all retrieval failures**: the FTS index stores English tokens and the query path sends Arabic tokens. Every other layer works correctly when retrieval succeeds.

Beyond the root cause, the audit found 6 additional HIGH severity issues (silent failure paths, broken multi-turn memory, a disguised keyword dictionary, flawed confidence calibration, leaking conversation context, and an over-trust of the fallback path) and 8 MEDIUM issues.

---

## Phase A — Layer-by-Layer Findings

### A1. Vehicle Detection

**File:** `lib/ai/vehicle-context.ts:115–149`

**What it does:** Three-tier lookup: (1) alias match, (2) catalog token fallback, (3) carry-over from prior turns.

**Findings:**

**MEDIUM — Tier 3 (carry-over) is silently broken.**  
`buildVehicleContextForPrompt` accepts `options: RetrievalOptions = {}` with `lastVehicleIds?: string[]`. `buildSystemPrompt` in `lib/ai/prompt.ts:47` calls `buildVehicleContextForPrompt(request.message)` — no `options` argument. Multi-turn memory (`lastVehicleIds`) is never passed. If a user says "كم سعرها؟" after previously asking about the Sealion, the system correctly has no memory and returns `EMPTY_RETRIEVAL`. This is a feature gap, not a crash, but it degrades the conversational experience silently.

**LOW — Comparison cap at 2 vehicles is undocumented in UI.**  
`Array.from(matched).slice(0, 2)` at line 148. When a user asks to compare 3 cars, the third is silently dropped. No user-facing indication.

**LOW — Catalog token fallback uses `≥4 chars` guard but not language-aware.**  
A 4-char English token like `atto` passes; a 4-char Arabic token like `ماج` (3 chars) from "Dongfeng Mage" would be skipped. The filter is asymmetrically strict for Arabic names.

---

### A2. Alias Matching

**File:** `lib/ai/vehicle-alias-cache.ts`, `supabase/migrations/013_vehicle_aliases.sql`

**What it does:** Loads all `vehicle_aliases` rows once per hour into process memory. Matching is exact (normalized substring).

**Findings:**

**MEDIUM — Stampede window is real on cold start.**  
The in-flight promise collapses concurrent load requests correctly, but: on a serverless/edge deployment, each cold instance races to load aliases independently. The TTL_MS = 1 hour is appropriate for Next.js server components but in a stateless deployment model (Vercel functions), the cache is effectively per-invocation. Each cold start costs one DB round trip before aliases work. This is acceptable today (tiny table) but worth noting.

**MEDIUM — Error path returns stale cache, not empty.**  
Line 30: `if (error || !data) return cached ?? []`. If `cached` is populated from a previous successful load and then the DB goes down, the function returns the stale alias list. This is the correct behavior (graceful degradation), but it means an alias update doesn't propagate until the next successful load — and there's no way to force invalidation from the outside without calling `invalidateVehicleAliasCache()` directly.

**LOW — `seal u` alias maps to Sealion 05.**  
This is intentional (it's the export name) but could create false matches if a user mentions "seal" alone (e.g., "what's the BYD Seal price?"). The alias `seal u` requires the word `u` to be present, which is correct. Watch for future "BYD Seal" (a different model) being added to the catalog.

---

### A3. Intent Detection

**File:** `lib/ai/intent.ts`

**What it does:** Rule-based keyword scoring over 6 categories. Returns the highest-scoring category or null.

**Findings:**

**MEDIUM — Single-winner scoring masks ambiguity.**  
A question like "كم يكلف صيانة بطارية السيلايون" scores both `maintenance` and `battery_charging`. Whichever has more keyword hits wins. If it picks `maintenance`, retrieval narrows to maintenance chunks and misses the battery data. The soft-narrow fallback (retry without category) partially rescues this, but adds a DB round trip and usually returns unordered mixed results.

**LOW — `profile` category exists in `KnowledgeCategory` type but is not in `RULES`.**  
It is intentionally excluded (line 9: "rule-based intent classification"). However there is no route by which `detectIntent` can return `"profile"`. The type's inclusion of `"profile"` creates a type lie — callers see it as a possible return value but it can never be returned. This can cause confusion in switch/exhaustiveness checks.

**LOW — Arabic substring matching allows over-triggering.**  
The comment at line 76–78 allows Arabic tokens ≥4 chars to match as substrings ("Arabic words rarely stand alone"). However `بطارية` (7 chars) would match inside `عبطارية` (a hypothetical misspelling). This is a minor theoretical risk, not a practical problem today.

---

### A4. Retrieval Orchestration

**File:** `lib/ai/retrieval.ts`

**What it does:** Calls the FTS RPC, implements a 3-path fallback (primary → English fallback → no-category), gates on confidence, assembles grounded context.

**Findings:**

**CRITICAL — `INTENT_ENGLISH_QUERY` is a manual keyword dictionary in disguise.**  
Lines 11–18 define per-category English FTS fallback strings. This is functionally identical to the "manual mapping solution" the project owner explicitly rejected. It is just one level of indirection removed. The fallback maps `battery_charging` to `"charging battery kWh AC DC charge hours minutes plug port"` — the same 9 tokens regardless of which vehicle is being asked about, regardless of what actually appears in that vehicle's manual. This produces low-precision retrieval where the FTS score is dominated by which chunks happen to contain the most of these 9 words, not by semantic relevance to the user's actual question.

**CRITICAL — Arabic-only queries ALWAYS use the English keyword fallback.**  
When a user asks in pure Arabic, line 117–121 detects no Latin chars and routes to `englishFallbackQuery`. This means: every single Arabic-language query retrieves based on 9 hardcoded English keywords per category. The entire specificity of the user's question is discarded. A question about "شحن طارئ في الطريق" (emergency charging on the road) and a question about "كم ساعة يحتاج الشحن الكامل" (full charge duration) both retrieve the same chunks — everything that mentions battery/charging/kWh.

**HIGH — The confidence gate is uncalibrated.**  
`TAU_LOW = 0.02`, `TAU_HIGH = 0.1` are labeled "conservative launch defaults" in the code. `ts_rank` is not normalized — it depends on document length and term frequency. A document with exactly one mention of "battery" gets a very different rank than one with 15 mentions. The thresholds have never been calibrated against an eval set (the code comment at line 43 acknowledges this: "calibrate against the golden eval set (P1)"). In production today, a chunk retrieved via the English keyword fallback may have a rank of 0.05 (above TAU_LOW, below TAU_HIGH), yielding MEDIUM confidence on what is actually a garbage retrieval.

**HIGH — Silent failures are completely opaque in production.**  
Lines 128–130, 142–145, 147–149: every failure path returns `[]` with a `d()` debug log behind `process.env.RAG_DEBUG === "1"`. In production, `RAG_DEBUG` is not set. If `createAdminClient()` returns null (missing service role key), if the RPC errors, or if data is null — the pipeline silently degrades to a LOW confidence answer with no observable signal. There is no error counter, no Sentry event, no structured log that survives to production monitoring.

**MEDIUM — Three DB round trips for Arabic queries.**  
Path: `run(arabicQuery, category)` → 0 rows → `run(englishFallback, category)` → maybe 0 → `run(englishFallback, null)`. That's up to 3 sequential RPC calls, each with network latency. On Vercel's edge, a cold Supabase connection adds ~100ms per call. Worst-case latency contribution: ~300ms before the LLM even starts.

**MEDIUM — Chunk trimming uses Arabic-specific sentence boundary `۔` (U+06D4 Urdu full stop) but content is primarily English.**  
`trimToBudget` at line 228 checks for `۔` (Urdu/Arabic full stop). English content uses `.`. This is fine as a combined check, but the `۔` check is dead code for English manuals.

---

### A5. Search RPC

**File:** `supabase/migrations/014_search_vehicle_knowledge.sql`

**What it does:** `search_vehicle_knowledge(p_vehicle_ids, p_query, p_category, p_limit)` — FTS using `websearch_to_tsquery('simple', p_query)`.

**Findings:**

**CRITICAL — Language mismatch at the DB level.**  
The tsvector (migration 012, line 104–108) is built with `to_tsvector('simple', ...)` over English-language Markdown content. `websearch_to_tsquery('simple', 'شحن بطارية')` tokenizes Arabic words which can never match English tsvector tokens. This is the single root cause of `[RAG:retrieval] RPC returned 0 rows` for Arabic queries.

The `'simple'` configuration was chosen correctly (no Arabic dictionary available in Postgres, and English stemming would corrupt Arabic tokens). But this means no stemming for English either — "charging" and "charge" are different tsvector tokens. A user asking "how do I charge the car" (verb form) may miss chunks that use "charging" (gerund).

**MEDIUM — No minimum rank filter in SQL.**  
The RPC returns all matching rows up to `p_limit`, ordered by rank. There is no `WHERE rank > threshold` in the SQL — rank gating happens in TypeScript. This means a row with rank 0.001 (essentially no match) can be returned and only gets filtered by TypeScript's confidence gate. However the TypeScript gate uses per-chunk confidence labels, not rank thresholds, so a rank-0.001 chunk from an "official" source still gets included.

**LOW — `SECURITY DEFINER` + explicit `revoke from public` is correct.**  
No finding here — this is the right approach. The grant to `service_role` only is appropriate.

---

### A6. Prompt Building

**File:** `lib/ai/prompt.ts`

**What it does:** Calls `buildVehicleContextForPrompt`, assembles final system prompt with BASE_SYSTEM_PROMPT + context block + mode instruction.

**Findings:**

**HIGH — No conversation history in retrieval.**  
`buildSystemPrompt(request: AiChatRequest)` receives only the current message. The `AiChatRequest` type does not include prior conversation turns. Retrieval is single-turn. A multi-turn conversation about the Sealion loses vehicle context if the user's follow-up doesn't mention the car name. This is different from the broken `lastVehicleIds` — even if that were fixed, the retrieval query would still be based only on the current message, not the full conversational context.

**MEDIUM — System prompt has no explicit language instruction.**  
`BASE_SYSTEM_PROMPT` says "أجب بالعربية الفصحى المبسطة" (answer in simplified formal Arabic). But it does not instruct the model what to do when the user writes in English. If a user writes in English, the model may respond in Arabic (following the instruction) when the user expected English. This creates friction for bilingual users.

**LOW — Context block uses `<<<` / `>>>` delimiters which are not standard.**  
The context injection uses `<<<\n${retrieval.contextText}\n>>>`. Gemini models are trained on various delimiter formats; this is safe but `<context>...</context>` XML tags are more robustly parsed by current-generation instruction-tuned models.

---

### A7. Gemini Interaction

**File:** `lib/ai/providers/gemini.ts` (not fully read, but reviewed via provider.ts)

**Findings:**

**LOW — Provider chain (primary → fallbacks) is robust.**  
The fallback logic in `lib/ai/provider.ts:80–88` correctly distinguishes retryable errors (UPSTREAM, RATE_LIMIT, QUOTA, TIMEOUT, EMPTY) from fatal ones (CONFIG, AUTH). This is correct.

**LOW — No streaming.**  
The response is buffered entirely before returning. For long thinking-mode responses, this means perceived latency is high. Streaming would improve UX but is a P2 concern.

---

### A8. Confidence Gating

**File:** `lib/ai/retrieval.ts:188–202`

**What it does:** Two-dimensional: strong sources (official/dealer) + rank ≥ TAU_HIGH → HIGH; anything else → MEDIUM or LOW.

**Findings:**

**HIGH — Confidence label on fallback-retrieved chunks is misleading.**  
When the English keyword fallback runs, the returned chunks are ranked by `ts_rank` against the intent keywords (not the user's actual query). A chunk that is "official" confidence but matched only because it uses the word "charging" 15 times gets HIGH confidence, even though it may not answer the user's specific Arabic question at all. The confidence gate conflates source trustworthiness with retrieval relevance.

**MEDIUM — All-unknown gate returns LOW even for genuinely useful chunks.**  
If a chunk has `confidence = 'unknown'` but is highly relevant (rank 0.5), `computeRetrievalConfidence` returns LOW because `chunks.every(c => c.confidence === 'unknown')`. This causes Gemini to disclaim more than necessary on estimate-grade data.

---

### A9. Knowledge Ingestion Pipeline

**File:** `scripts/ingest-vehicle-knowledge.mjs`

**Findings:**

**HIGH — `FOLDER_SLUG` is a hardcoded map — adding a vehicle requires editing source code.**  
Every new vehicle requires an edit to lines 62–69 of the ingestion script, then a re-deploy. There is no self-discovery. A file in `public/cars/07 - New Car/` will be silently skipped and reported as a "coverage hole." An operator could easily miss this.

**MEDIUM — No chunking overlap.**  
`chunkMarkdown` splits strictly on `##` boundaries with zero overlap. A question that spans two adjacent sections (e.g., charging speed mentioned at the end of "Battery Overview" and continued at the start of "Charging Ports") will never match both chunks simultaneously. This is a precision problem that worsens as manuals grow.

**MEDIUM — `###` subsections are merged into their parent `##` chunk.**  
Only `## ` (H2) triggers a split. If a section has multiple `###` subsections totaling 5000 chars, it all goes into one chunk. This can produce chunks far exceeding `MAX_CHUNK_CHARS = 600` — the trimming in `trimToBudget` will then truncate content that may contain the relevant answer.

**MEDIUM — Section uniqueness key is `(vehicle_id, category, section)` where `section` includes the file stem.**  
If a file is renamed, all its rows get new section strings but the old rows are not deleted — they become orphaned knowledge in the DB. The upsert uses `ON CONFLICT (vehicle_id, category, section)` so renamed sections create duplicates. The deduplication in the ingestion script only deduplicates within a single run, not against existing DB state.

**LOW — `market` field defaults to `"jordan"` and is normalized to `"jordan"` if the word "jordan" appears anywhere in the field value.**  
`market.toLowerCase().includes("jordan") ? "jordan" : market` — the RLS policy on `vehicle_knowledge` already filters by `market = 'jordan'` in the `supported_vehicles` join, so this is safe. But chunks for future non-Jordan markets would need a more careful approach.

---

## Summary Table

| # | Layer | Severity | Issue |
|---|-------|----------|-------|
| 1 | FTS/SQL | CRITICAL | Language mismatch — Arabic queries can never match English tsvectors |
| 2 | Retrieval | CRITICAL | `INTENT_ENGLISH_QUERY` is a disguised manual keyword dictionary |
| 3 | Retrieval | HIGH | Silent failures completely invisible in production |
| 4 | Prompt | HIGH | No conversation history in retrieval — single-turn only |
| 5 | Confidence | HIGH | Confidence label conflates source trustworthiness with retrieval relevance |
| 6 | Ingestion | HIGH | `FOLDER_SLUG` hardcoding requires code edit per new vehicle |
| 7 | Retrieval | HIGH | Uncalibrated confidence thresholds TAU_LOW/TAU_HIGH |
| 8 | Context | MEDIUM | `lastVehicleIds` (multi-turn memory) is never passed from the caller |
| 9 | Intent | MEDIUM | Single-winner scoring on ambiguous queries |
| 10 | Retrieval | MEDIUM | Up to 3 sequential DB round trips for Arabic queries |
| 11 | Ingestion | MEDIUM | No chunk overlap — cross-section answers may be missed |
| 12 | Ingestion | MEDIUM | `###` subsections merge into giant chunks exceeding budget |
| 13 | Ingestion | MEDIUM | Orphaned chunks on file rename — stale data accumulates |
| 14 | SQL | MEDIUM | No minimum rank filter in SQL — garbage-rank chunks returned |
| 15 | Prompt | MEDIUM | No explicit language-response instruction for English users |
