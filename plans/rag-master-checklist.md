# VoltJo RAG — Master Implementation Checklist
**Date:** 2026-06-25  
**Author:** Staff Engineer audit (post full codebase inspection)  
**Authority:** This document supersedes all prior roadmap estimates where they conflict.  
**Rule:** Nothing in this file is implemented until explicitly approved.

---

## Verification Log

Files inspected before writing this checklist:
- `lib/ai/retrieval.ts` — full read
- `lib/ai/intent.ts` — full read
- `lib/ai/vehicle-context.ts` — full read
- `lib/ai/prompt.ts` — full read
- `lib/ai/provider.ts` — full read
- `lib/ai/providers/gemini.ts` — full read
- `lib/ai/normalize-arabic.ts` — full read
- `lib/ai/vehicle-alias-cache.ts` — full read
- `lib/ai/types.ts` — full read
- `lib/ai/config.ts` — full read
- `lib/ai/registry.ts` — full read
- `lib/ai/errors.ts` — full read
- `lib/ai/observability.ts` — full read
- `lib/ai/cost-control.ts` — full read
- `lib/ai/validation.ts` — full read
- `lib/ai/retrieval.test.ts` — full read
- `lib/ai/intent.test.ts` — full read
- `lib/ai/normalize-arabic.test.ts` — full read
- `lib/ai/vehicle-aliases-seed.test.ts` — full read
- `lib/vehicles/catalog-cache.ts` — full read
- `lib/chat/conversation-utils.ts` — full read
- `app/api/chat/route.ts` — full read
- `supabase/migrations/012_vehicle_knowledge.sql` — full read
- `supabase/migrations/013_vehicle_aliases.sql` — full read
- `supabase/migrations/014_search_vehicle_knowledge.sql` — full read
- `scripts/ingest-vehicle-knowledge.mjs` — full read
- `proxy.ts` — full read

---

## Legend

| Status | Meaning |
|--------|---------|
| `[DONE]` | Implemented, tested, working in production |
| `[PARTIALLY DONE]` | Code exists but has a critical gap or is never invoked |
| `[BROKEN]` | Code exists but produces wrong output in production |
| `[NOT IMPLEMENTED]` | No code exists for this capability |
| `[REMOVE]` | Exists but should be deleted |

---

## SECTION 0 — Verified Working (Do Not Touch)

These were audited against the actual code. They are correct. Mark as DONE and move on.

* [x] **Arabic normalization** `[DONE]`  
  `lib/ai/normalize-arabic.ts` — 10 normalization steps, pure, no I/O, well-tested.  
  Tests: full coverage in `normalize-arabic.test.ts`. No action needed.

* [x] **Alias cache** `[DONE]`  
  `lib/ai/vehicle-alias-cache.ts` — TTL cache, stampede collapse, stale-on-error. Correct.  
  Loaded via service-role client (anon bypass handled). No action needed.

* [x] **Vehicle alias seed drift guard** `[DONE]`  
  `lib/ai/vehicle-aliases-seed.test.ts` — re-normalizes every seed pair and asserts equality.  
  CI fails automatically if `normalizeArabic` changes break seed values. No action needed.

* [x] **Vehicle catalog cache** `[DONE]`  
  `lib/vehicles/catalog-cache.ts` — identical design to alias cache, correct. No action needed.

* [x] **Intent detection** `[DONE]`  
  `lib/ai/intent.ts` — rule-based, 6 categories, priority tie-breaking, substring/boundary logic.  
  Tests: `intent.test.ts` covers Arabic, English, ambiguous, and null cases. No action needed.  
  **NOTE:** `"profile"` in `KnowledgeCategory` type is a storage-only category, never returned by `detectIntent`. This is a type lie but LOW priority — tracked in P2.5 below.

* [x] **Structured vehicle context injection** `[DONE]`  
  `lib/ai/vehicle-context.ts:40–98` — builds Arabic fact summary from catalog fields.  
  Clean, deterministic, no network call required beyond catalog cache. No action needed.

* [x] **Vehicle detection (alias + catalog fallback)** `[DONE]`  
  Three-tier logic: alias hit → catalog token fallback → carry-over. Precision-first. Correct.  
  **NOTE:** carry-over (tier 3) exists in code but is never invoked — tracked in P1.4 below.

* [x] **Context assembly + citations** `[DONE]`  
  `assembleGroundedContext` — token-budgeted, inline citation tags, parallel citation list.  
  Tests: `retrieval.test.ts:117–136`. Correct. No action needed.

* [x] **Confidence gating (logic)** `[DONE]`  
  `computeRetrievalConfidence` — two-dimensional: source label + ts_rank threshold. Logic correct.  
  **NOTE:** TAU thresholds are uncalibrated. Tracked in P1.3.

* [x] **Gemini provider** `[DONE]`  
  `lib/ai/providers/gemini.ts` — raw fetch (no SDK), retry with exponential backoff + jitter,  
  AbortSignal propagation, structured error classification. Solid. No action needed.

* [x] **Provider chain and fallbacks** `[DONE]`  
  `lib/ai/provider.ts`, `lib/ai/registry.ts` — correct retryable vs fatal error distinction.  
  No action needed.

* [x] **Cost control / circuit breaker** `[DONE]`  
  `lib/ai/cost-control.ts` — layered Redis budget (global/user/anon), auto-trip breaker.  
  Correct fail-closed design. No action needed.

* [x] **Input validation** `[DONE]`  
  `lib/ai/validation.ts` — thorough boundary checks on message, model, conversationId,  
  attachment fields. No injection surface. No action needed.

* [x] **Error classification + user messages** `[DONE]`  
  `lib/ai/errors.ts` — clean code/retryable mapping, Arabic user messages. No action needed.

* [x] **Ingestion pipeline (functional)** `[DONE]`  
  `scripts/ingest-vehicle-knowledge.mjs` — SHA-256 change detection, idempotent upsert,  
  confidence normalization, section deduplication. Works for the 6 current vehicles.  
  **NOTE:** FOLDER_SLUG hardcoding — tracked in P1.5.

---

## Phase 0 — Critical Production Fixes

### P0.1 — Arabic Query Translation Bridge

* [ ] **Title:** Arabic-only FTS always returns 0 rows — implement query translation  
  **Status:** `[BROKEN]`  
  **Priority:** CRITICAL  
  **Why:**  
  `search_vehicle_knowledge` runs `websearch_to_tsquery('simple', p_query)`. The tsvector is built  
  from English-language Markdown content. An Arabic query like `"شحن بطارية"` produces Arabic FTS  
  tokens that cannot match any English tsvector token. Every Arabic-only user query returns 0 rows.  
  This is confirmed by runtime logs: `[RAG:retrieval] RPC returned 0 rows`.  
  
  The current "fix" (`INTENT_ENGLISH_QUERY`) — tracked in P0.2 below — is a hardcoded category  
  keyword dictionary that discards all query specificity and must be removed, not improved.

  **Files affected:**  
  - `lib/ai/retrieval.ts` (modify `retrieveKnowledgeChunks`, remove `INTENT_ENGLISH_QUERY` block)  
  - `lib/ai/translation.ts` (NEW — isolated translation helper, ~50 lines)  
  - `lib/ai/retrieval.test.ts` (add test for Arabic → translation → FTS path)

  **Action:**  
  1. Create `lib/ai/translation.ts` with a single export:  
     `translateForSearch(query: string): Promise<string>`  
     - Return `query` immediately if it contains no Arabic characters (`/[؀-ۿ]/`)  
     - Otherwise call Gemini Flash with a focused prompt: translate automotive Arabic to English,  
       preserve vehicle names / model numbers / technical acronyms (kWh, AC, DC, BYD)  
     - On any error → return original `query` (safe degradation, not a throw)  
  2. In `retrieveKnowledgeChunks`, call `translateForSearch(query)` once before any RPC call.  
     Use the result as `ftsQuery` in ALL `run()` calls.  
  3. Remove the `hasLatinOrDigit` detection + `englishFallbackQuery` variable + all branches  
     that reference them (this removes P0.2 in the same diff).  
  4. Add a `translationUsed: boolean` field to the debug log.

  **Dependencies:** None. Requires `GOOGLE_AI_API_KEY` (already required for the primary provider).  
  **Risks:**  
  - Translation adds ~100–150ms latency on Arabic queries. Acceptable given the alternative is 0 results.  
  - Gemini Flash may mistranslate specialized automotive Arabic terms. On failure: degrades to original  
    query (safe).  
  - Do NOT use the primary model (`gemini-2.5-flash`) — use the smallest/fastest available model  
    (currently also `gemini-2.5-flash` but with minimal token budget). Keep the translation prompt  
    to ~30 output tokens.
  
  **Estimated effort:** 4–6 hours  
  **Implement together with P0.2 in a single diff.**

---

### P0.2 — Remove INTENT_ENGLISH_QUERY Dictionary

* [ ] **Title:** Delete the hardcoded category-to-English-keyword mapping  
  **Status:** `[BROKEN]` / `[REMOVE]`  
  **Priority:** CRITICAL  
  **Why:**  
  `INTENT_ENGLISH_QUERY` at `lib/ai/retrieval.ts:11–18` is a dictionary mapping intent categories  
  to static English FTS query strings (e.g., `battery_charging → "charging battery kWh AC DC..."`).  
  This is the "manual mapping solution" the project explicitly rejected.  
  
  The fallback activates for every Arabic-only query (`!hasLatinOrDigit`), replacing the user's  
  actual question with 9 generic tokens. A query about "emergency road charging" and "full charge  
  duration" both retrieve the same chunks. Query specificity is fully discarded.
  
  Additionally, the entire retrieval test for the soft-narrow path (`retrieval.test.ts:64–73`)  
  passes `query: "شحن"` which triggers this fallback in production — but the test mocks the RPC  
  and never validates whether the translated query was used. The test passes but doesn't cover  
  the actual production path.

  **Files affected:**  
  - `lib/ai/retrieval.ts:11–18` (delete `INTENT_ENGLISH_QUERY` constant)  
  - `lib/ai/retrieval.ts:117–165` (delete `hasLatinOrDigit` / `englishFallbackQuery` block  
    and the three-path fallback — replace with a single primary + soft-narrow structure)  
  - `lib/ai/retrieval.test.ts` (add test asserting the new translation path is called for Arabic)

  **Action:** Implement as part of the same diff as P0.1. They are a single atomic change.  
  **Dependencies:** P0.1 must be in place before P0.2 is safe to remove.  
  **Risks:** None when combined with P0.1. Removing P0.2 alone would leave Arabic queries with  
  no fallback at all.  
  **Estimated effort:** Included in P0.1 (same diff)

---

### P0.3 — Surface Admin Client Failures in Production Logs

* [ ] **Title:** Admin client null → error-level log, not silent degradation  
  **Status:** `[BROKEN]`  
  **Priority:** HIGH  
  **Why:**  
  `lib/ai/retrieval.ts:128–130`:  
  ```typescript
  if (!admin) {
    d("SILENT FAIL: createAdminClient() returned null — SUPABASE_SERVICE_ROLE_KEY missing?");
    return [];
  }
  ```  
  `d()` is gated on `process.env.RAG_DEBUG === "1"`, which is not set in production.  
  If `SUPABASE_SERVICE_ROLE_KEY` is missing or rotated, ALL retrieval silently returns `[]`.  
  The system appears to work (LLM still responds) but every answer is ungrounded.  
  This is a critical operational blind spot — there is no alert, no metric, no log entry.

  **Files affected:**  
  - `lib/ai/retrieval.ts:128–132`

  **Action:**  
  Replace:
  ```typescript
  d("SILENT FAIL: createAdminClient() returned null — SUPABASE_SERVICE_ROLE_KEY missing?");
  ```
  With:
  ```typescript
  console.error(JSON.stringify({
    ts: new Date().toISOString(),
    event: "rag_admin_client_null",
    severity: "CRITICAL",
    detail: "createAdminClient() returned null — all retrieval will fail. Check SUPABASE_SERVICE_ROLE_KEY.",
  }));
  ```
  Apply the same pattern to the RPC error path at line 141–143.

  **Dependencies:** None.  
  **Risks:** Zero.  
  **Estimated effort:** 30 minutes.  
  **Can be done independently in its own commit.**

---

### P0.4 — Multi-Turn Vehicle Memory (lastVehicleIds)

* [ ] **Title:** Thread matched vehicle IDs through conversation turns  
  **Status:** `[PARTIALLY DONE]` — mechanism exists in retrieval layer, never connected  
  **Priority:** HIGH  
  **Why:**  
  The carry-over tier in `detectVehicleIds` (`vehicle-context.ts:143–147`) correctly accepts  
  `lastVehicleIds` and uses them when nothing else matches. However:
  
  1. `buildSystemPrompt(request)` at `prompt.ts:53` calls `buildVehicleContextForPrompt(request.message)`  
     with no options — `lastVehicleIds` is never passed.  
  2. `AiChatResponse.metadata` does NOT include `matchedVehicleIds` — they are returned in  
     `RetrievalResult` but not forwarded to `AiChatResponse.metadata`.  
  3. `app/api/chat/route.ts` saves the assistant message with `message.metadata` (line 265) but  
     since `matchedVehicleIds` isn't in the type, they're never persisted.  
  4. Even if persisted: the route never reads the previous message's vehicle IDs before calling  
     `generateAiChatResponse`.
  
  This is not a 6-hour fix as the previous roadmap estimated — it is a full vertical slice:  
  type → storage → read → thread-through.

  **Files affected:**  
  - `lib/ai/types.ts` — add `matchedVehicleIds?: string[]` to `AiChatResponse.metadata`  
  - `lib/ai/vehicle-context.ts` — return `matchedVehicleIds` is already in `RetrievalResult` ✓  
  - `lib/ai/prompt.ts` — extend `buildSystemPrompt` to accept optional `lastVehicleIds`  
  - `lib/ai/provider.ts` — forward `lastVehicleIds` option from request context into prompt builder  
  - `app/api/chat/route.ts` — before calling `generateAiChatResponse`, load the last assistant  
    message for the conversation and extract `metadata.matchedVehicleIds`; pass through to request

  **Prerequisite:** The conversations DB must store metadata with `matchedVehicleIds`. Check whether  
  the `chat_messages.metadata` JSONB column can accommodate this without a migration.

  **Dependencies:** Requires reading the server-persistence layer (not yet audited in full).  
  **Risks:** Medium — requires touching the API request flow. Regression risk on conversation persistence.  
  **Estimated effort:** 1–2 days (significantly more than prior estimate).  
  **Recommendation:** Implement AFTER P0.1–P0.3 are deployed and stable.

---

## Phase 1 — Major Quality Improvements

### P1.1 — Structured Retrieval Logging (Production Observability)

* [ ] **Title:** Emit one structured JSON log per retrieval attempt  
  **Status:** `[PARTIALLY DONE]` — debug logs exist behind `RAG_DEBUG=1`, invisible in production  
  **Priority:** HIGH  
  **Why:**  
  Currently the only production-visible log is the `logAiRequest` event in `provider.ts`.  
  The retrieval layer has no production logging. If retrieval starts failing (RPC error, wrong  
  confidence, 0 chunks), there is no observable signal until users complain.

  **Files affected:**  
  - `lib/ai/observability.ts` — add `logRetrievalEvent()` function  
  - `lib/ai/vehicle-context.ts` — emit one retrieval log per `buildVehicleContextForPrompt` call

  **Action:**  
  Add to `observability.ts`:
  ```typescript
  export function logRetrievalEvent(event: {
    requestId: string;
    vehicleIds: string[];
    intent: string | null;
    translationUsed: boolean;
    chunksReturned: number;
    confidence: string;
    errorCode?: string;
    latencyMs: number;
  }): void {
    emit({ event: "rag_retrieval", ...event });
  }
  ```
  Call it at the end of `buildVehicleContextForPrompt`. Pass `requestId` from the request  
  context (requires small signature change to thread requestId through).

  **Dependencies:** P0.1 (to get the `translationUsed` field).  
  **Risks:** Low. Pure addition to logging.  
  **Estimated effort:** 2–3 hours.

---

### P1.2 — Hybrid FTS + Multilingual Embeddings (pgvector)

* [ ] **Title:** Add pgvector + text-multilingual-embedding-002 for language-agnostic retrieval  
  **Status:** `[NOT IMPLEMENTED]`  
  **Priority:** HIGH  
  **Why:**  
  The query translation bridge (P0.1) is a pragmatic fix that adds latency and translation-quality  
  risk. The correct long-term architecture is multilingual embeddings where Arabic and English  
  map to the same vector space natively.

  **Prerequisites:**  
  1. Confirm pgvector is available on the current Supabase plan. If not: requires plan upgrade  
     or self-hosted Postgres. **Do not implement until this is verified.**  
  2. Verify `text-multilingual-embedding-002` is accessible via the existing `GOOGLE_AI_API_KEY`.

  **Files/migrations to create:**  
  - `supabase/migrations/015_pgvector_embedding.sql` — `CREATE EXTENSION vector`, add  
    `embedding vector(768)` column to `vehicle_knowledge`, IVFFlat index  
  - `supabase/migrations/016_hybrid_search_rpc.sql` — `search_vehicle_knowledge_hybrid()`  
    with merged FTS + cosine similarity scoring (alpha-weighted)  
  - `lib/ai/embed.ts` (NEW) — `embedText(text: string): Promise<number[]>` wrapper  
  - `scripts/embed-vehicle-knowledge.mjs` (NEW) — embed all existing chunks (one-time)  
  - `lib/ai/retrieval.ts` — add hybrid RPC path alongside existing FTS path  
  - Ingestion script — embed each chunk after upsert

  **After P1.2 is stable:** Remove the translation bridge (P0.1) — it is no longer needed.  
  **Dependencies:** P0.1 must be live first (bridge covers the gap while P1.2 is built).  
  **Risks:** Medium — pgvector requires extension availability; index tuning needed at scale.  
  **Estimated effort:** 2–3 days.  
  **Do NOT start until P0.1 is deployed and pgvector availability is confirmed.**

---

### P1.3 — Calibrate Confidence Thresholds (TAU_LOW / TAU_HIGH)

* [ ] **Title:** Validate and calibrate retrieval confidence thresholds against real queries  
  **Status:** `[NOT IMPLEMENTED]`  
  **Priority:** MEDIUM  
  **Why:**  
  `TAU_LOW = 0.02`, `TAU_HIGH = 0.1` in `lib/ai/retrieval.ts:44–45` are labeled  
  "conservative launch defaults." `ts_rank` is not normalized across documents.  
  Thresholds have never been validated. This causes over-disclaiming on relevant chunks  
  and under-disclaiming on fallback-retrieved chunks.

  **Action:**  
  1. Build a query set of 20–30 questions with known expected sections.  
  2. Run `search_vehicle_knowledge` against them and collect real `rank` values.  
  3. Set `TAU_LOW` and `TAU_HIGH` at natural breakpoints from observed data.  
  4. Separately: modify `computeRetrievalConfidence` to accept a `retrieval_mode` parameter  
     so chunks retrieved via the English keyword fallback (before P0.2) or translation cannot  
     receive HIGH confidence based solely on source label.

  **Files affected:**  
  - `lib/ai/retrieval.ts:44–45`, `lib/ai/retrieval.ts:188–202`  
  - `lib/ai/vehicle-context.ts` — pass retrieval mode to confidence gate

  **Dependencies:** P0.1 + P0.2 must be complete. Calibrate against the improved retrieval, not the broken one.  
  **Estimated effort:** 4–6 hours.

---

### P1.4 — Conversation History in Gemini Request

* [ ] **Title:** Send prior conversation turns to Gemini for genuine multi-turn coherence  
  **Status:** `[NOT IMPLEMENTED]`  
  **Priority:** MEDIUM  
  **Why:**  
  `gemini.ts:buildRequestBody()` at line 49–58 sends:
  ```typescript
  contents: [{ role: "user", parts: [{ text: request.message }] }]
  ```
  Only the current message is sent. Gemini has no memory of prior turns.  
  This is separate from the `lastVehicleIds` problem (P0.4) — even with vehicle memory fixed,  
  Gemini cannot refer back to things it said in prior turns or build on context it established.

  **Note:** This is lower priority than P0.4 because the system prompt already carries vehicle  
  context. The main impact is conversational coherence ("as I mentioned earlier...").

  **Action:**  
  Extend `AiChatRequest` with optional `history?: Array<{role: 'user'|'assistant', content: string}>`.  
  In `gemini.ts:buildRequestBody()`, include history turns in `contents` before the current message.  
  In `app/api/chat/route.ts`, load the last N messages from the conversation and pass as `history`.

  **Dependencies:** Requires the server-persistence layer to be able to load last N messages.  
  **Risks:** Medium — history increases prompt size and thus cost. Cap history to last 6 turns.  
  **Estimated effort:** 1 day.

---

### P1.5 — Remove FOLDER_SLUG Hardcoding from Ingestion Script

* [ ] **Title:** Auto-discover vehicle folders without hardcoded map  
  **Status:** `[PARTIALLY DONE]` — works for current 6 vehicles, breaks silently for any new one  
  **Priority:** MEDIUM  
  **Why:**  
  `scripts/ingest-vehicle-knowledge.mjs:62–69` — adding a new vehicle requires editing  
  this source file and redeploying. A new vehicle's Markdown files will be silently skipped  
  and reported as a "coverage hole."

  **Options:**  
  A. Add a `knowledge_folder` column to `supported_vehicles` and drive discovery from the DB.  
  B. Convention-based: folder name follows `{NN} - {name_en}` pattern; match slugified name_en.  
  C. Add a script flag `--vehicle slug:folder_name` for explicit one-time registration.

  **Recommendation:** Option B is self-service and requires no DB migration. Implement slug  
  tokenization matching as the auto-discovery mechanism, with the current explicit map as a  
  fallback for non-matching folders.

  **Files affected:**  
  - `scripts/ingest-vehicle-knowledge.mjs:62–69` and discovery loop
  - Possibly a new migration if option A is chosen

  **Dependencies:** None.  
  **Risks:** Low. The script runs offline; a misidentified folder simply produces a warning.  
  **Estimated effort:** 3–4 hours.

---

## Phase 2 — Quality Improvements

### P2.1 — Language-Aware Response Instruction

* [ ] **Title:** Detect user language and instruct the model to respond in the same language  
  **Status:** `[NOT IMPLEMENTED]`  
  **Priority:** MEDIUM  
  **Why:**  
  `BASE_SYSTEM_PROMPT` instructs the model to respond in Arabic ("أجب بالعربية الفصحى المبسطة").  
  An English-speaking user will receive an Arabic response. This is not the right behavior.

  **Files affected:**  
  - `lib/ai/prompt.ts` — detect `isPrimaryArabic(request.message)`, inject language instruction

  **Action:**  
  ```typescript
  const languageInstruction = /[؀-ۿ]/.test(request.message) && !/[a-zA-Z]{4,}/.test(request.message)
    ? "أجب بالعربية الفصحى المبسطة."
    : "Answer in clear English. Arabic vehicle names and specs may appear as-is in your answer.";
  ```
  Append to sections in `buildSystemPrompt`.

  **Dependencies:** None.  
  **Risks:** Low. Edge cases: pure English query with Arabic name (e.g., "info about سيلايون") should  
  still respond in English. The heuristic above handles this correctly (Latin chars present).  
  **Estimated effort:** 1–2 hours.

---

### P2.2 — Chunk Size Normalization (### subsection splitting)

* [ ] **Title:** Split `###` subsections when parent chunk exceeds MAX_CHUNK_CHARS  
  **Status:** `[NOT IMPLEMENTED]`  
  **Priority:** MEDIUM  
  **Why:**  
  `chunkMarkdown()` in `ingest-vehicle-knowledge.mjs:157–184` only splits on `## ` (H2).  
  `###` subsections are merged into their parent `##` chunk. A manual section with 5 `###`  
  subsections produces one chunk of 3,000+ chars that `trimToBudget` then truncates at 600  
  chars — the relevant answer may be in the truncated portion.

  **Files affected:**  
  - `scripts/ingest-vehicle-knowledge.mjs:157–184` (chunkMarkdown function)

  **Dependencies:** None.  
  **Risks:** Low — the script is re-runnable. Existing chunks remain until content changes.  
  However: changing the splitting logic changes the section names → triggers re-insert of all  
  affected rows (content_hash will differ since content is now shorter). This is safe (idempotent).  
  **Estimated effort:** 3–4 hours.

---

### P2.3 — Chunk Overlap for Cross-Section Answers

* [ ] **Title:** Generate overlap chunks spanning section boundaries  
  **Status:** `[NOT IMPLEMENTED]`  
  **Priority:** LOW  
  **Why:**  
  A question whose answer spans two consecutive manual sections (e.g., charging speed described  
  at the end of "Battery Overview" and continued at the start of "Charging Ports") will not  
  match either section cleanly with FTS or vector search.

  **Files affected:**  
  - `scripts/ingest-vehicle-knowledge.mjs` (add overlap chunk generation after main split)

  **Dependencies:** P2.2 (chunk size should be normalized first before adding overlap).  
  **Risks:** Low. Increases chunk count by ~50%. At 500 chunks total this is still negligible.  
  **Estimated effort:** 4–6 hours.  
  **Postpone:** Until corpus exceeds 1,000 chunks and overlap gaps become measurable.

---

### P2.4 — Test Coverage: Arabic Translation Path

* [ ] **Title:** Add retrieval tests that exercise the translation path  
  **Status:** `[NOT IMPLEMENTED]`  
  **Priority:** MEDIUM  
  **Why:**  
  `lib/ai/retrieval.test.ts` tests mock the RPC correctly but do NOT cover:  
  - The `INTENT_ENGLISH_QUERY` fallback path (pre-P0.2)  
  - The translation path (post-P0.1)  
  The test at line 64–73 passes `query: "شحن"` — this triggers the Arabic fallback in production  
  but the test mocks don't assert that the fallback/translation was invoked.

  **Files affected:**  
  - `lib/ai/retrieval.test.ts` — add tests for Arabic → translation → FTS path  
  - May need to mock `lib/ai/translation.ts` in the test

  **Action:**  
  After P0.1 is implemented, add:
  ```typescript
  it("calls translation for Arabic-only queries and uses the result for FTS", async () => {
    mockTranslate.mockResolvedValueOnce("sealion charging time hours");
    mockRpc.mockResolvedValueOnce({ data: [rpcRow], error: null });
    const out = await retrieveKnowledgeChunks({ vehicleIds: ["v1"], query: "كم ساعة يحتاج شحن سيلايون", category: "battery_charging", limit: 4 });
    expect(mockTranslate).toHaveBeenCalledWith("كم ساعة يحتاج شحن سيلايون");
    expect(mockRpc.mock.calls[0][1].p_query).toBe("sealion charging time hours");
    expect(out).toHaveLength(1);
  });
  ```

  **Dependencies:** P0.1.  
  **Estimated effort:** 2–3 hours.

---

### P2.5 — Fix `"profile"` Type in KnowledgeCategory

* [ ] **Title:** Correct the type lie — `"profile"` cannot be returned by `detectIntent`  
  **Status:** `[PARTIALLY DONE]` — type exists in public interface, can never be returned  
  **Priority:** LOW  
  **Why:**  
  `KnowledgeCategory` in `lib/ai/intent.ts:12–19` includes `"profile"` but `RULES` intentionally  
  excludes it (it's storage-only). No caller of `detectIntent()` can receive `"profile"`.  
  `INTENT_ENGLISH_QUERY` (pre-P0.2) also excludes `"profile"` with `Exclude<>`.  
  This creates a misleading type surface for future developers.

  **Options:**  
  A. Move `"profile"` to a separate `KnowledgeStorageCategory` type used only by ingestion.  
  B. Keep it in `KnowledgeCategory` but document clearly that `detectIntent` never returns it.

  **Recommendation:** Option A — split types cleanly.

  **Files affected:**  
  - `lib/ai/intent.ts:12–19` (type definition)  
  - `lib/ai/retrieval.ts` (any references to `KnowledgeCategory`)  
  - `scripts/ingest-vehicle-knowledge.mjs` (uses string literals, no import — no change needed)

  **Dependencies:** P0.2 (INTENT_ENGLISH_QUERY uses `Exclude<KnowledgeCategory, "profile">` — this  
  type expression goes away with P0.2).  
  **Risks:** Low. Types-only change.  
  **Estimated effort:** 1 hour.

---

## Phase 3 — Future (Do NOT Implement Yet)

These are validated future work. They are explicitly marked as out-of-scope until Phases 0–2 are stable.

### P3.1 — Retrieval Eval Harness

* [ ] **Title:** Golden query set + precision@k measurement  
  **Status:** `[NOT IMPLEMENTED]`  
  **Priority:** MEDIUM (deferred)  
  **Why deferred:** Building an eval harness now, before the retrieval architecture is stable (P0.1, P1.2  
  not yet done), means calibrating against a retrieval system that will fundamentally change.  
  Build this AFTER Phase 1 is complete.

  **Files:** New `tests/retrieval.eval.ts` or `scripts/eval-retrieval.mjs`  
  **Estimated effort:** 1 day  
  **Prerequisite:** P0.1 deployed, P1.2 deployed, TAU thresholds updated.

---

### P3.2 — Full Owner Manual Ingestion (PDF support)

* [ ] **Title:** Extract and ingest full PDF owner manuals, not just AI Data Markdown  
  **Status:** `[NOT IMPLEMENTED]`  
  **Priority:** HIGH (deferred — major scope)  
  **Why deferred:** Full PDF ingestion is the highest-value capability but requires:  
  - PDF text extraction (Gemini PDF understanding or `pdf-parse`)  
  - Much more granular chunking strategy at scale  
  - Arabic/English dual-language manuals need special handling  
  - Should not be attempted until the retrieval architecture (P1.2) is stable

  **Estimated effort:** 1–2 weeks per vehicle batch  
  **Prerequisite:** P1.2 (pgvector + multilingual embeddings) must be complete.

---

### P3.3 — Reranking Layer

* [ ] **Title:** Cross-encoder or Gemini-based reranking of top-k candidates  
  **Status:** `[NOT IMPLEMENTED]`  
  **Priority:** LOW (deferred)  
  **Why deferred:** Not valuable until corpus exceeds 2,000 chunks. Current corpus is ~200 chunks  
  across 6 vehicles. Return when P3.2 is done and corpus is an order of magnitude larger.

---

## Observations Not Previously Documented

### OBS-1 — `proxy.ts` vs deleted `middleware.ts`

The git status shows `D middleware.ts` (deleted) and `?? proxy.ts` (untracked, new file).  
`proxy.ts` exports a `proxy()` function and a `config` matcher — this looks like the previous  
`middleware.ts` was refactored into a helper module.

**VERIFY:** Is there a new `middleware.ts` that imports from `proxy.ts`? If `middleware.ts`  
is permanently deleted and there is no replacement, auth protection on `/dashboard`, `/account`,  
and `/assistant` routes is broken.  
**Action:** Confirm before anything else. This is outside the RAG scope but if auth is broken  
it supersedes all other work.

---

### OBS-2 — `inferChatCategory` in `conversation-utils.ts` is NOT a duplicate of `detectIntent`

`lib/chat/conversation-utils.ts:13–40` contains `inferChatCategory()` — used in `ChatShell.tsx`  
for UI-side chat category tagging (sidebar labels). This is NOT the same as `detectIntent()`.  
It is a client-side UI concern with simple keyword matching and does not affect retrieval.  
No action needed. Not a duplicate.

---

### OBS-3 — `buildRequestBody` sends single-turn only to Gemini

`lib/ai/providers/gemini.ts:49–58`:
```typescript
contents: [{ role: "user", parts: [{ text: request.message }] }]
```
Only the current message is sent. This is acceptable for the current design (system prompt  
carries grounded context). However it means Gemini cannot reference prior conversational turns.  
Tracked as P1.4.

---

### OBS-4 — `AiChatResponse.metadata.matchedVehicleIds` does not exist

The `RetrievalResult` returns `matchedVehicleIds` but it is never included in the final  
`AiChatResponse.metadata`. This means P0.4 requires adding the field to the type AND  
wiring it through the response → DB save → next-turn read cycle. The previous roadmap  
estimates of "6 hours" significantly underestimated this.

---

## Final Ordered Execution Plan

### Stage 1 — Critical fixes (ship together)
```
P0.3  →  can be done independently at any time (30 min)
P0.1 + P0.2  →  one atomic diff, ship together
```

### Stage 2 — Observability (immediately after Stage 1)
```
P1.1 (retrieval logging)  →  instrument before P1.2 so hybrid retrieval is observable from day 1
```

### Stage 3 — Architecture (requires verification first)
```
VERIFY: pgvector available on Supabase plan?
VERIFY: middleware.ts situation (OBS-1)
P1.2  →  only after verification and after P0.1 is stable in production
```

### Stage 4 — Quality and correctness
```
P0.4 (multi-turn memory)  →  after P1.2 (retrieval stable), 1–2 days
P1.3 (TAU calibration)  →  after P1.2 deployed
P1.4 (Gemini conversation history)  →  concurrent with P0.4
P2.4 (translation path tests)  →  immediately after P0.1 (test coverage for new code)
```

### Stage 5 — Ingestion and content improvements
```
P1.5 (FOLDER_SLUG removal)  →  next vehicle addition is the trigger
P2.1 (language-aware response)  →  any time after Stage 1
P2.2 (chunk size normalization)  →  next content update is the trigger
P2.5 (profile type fix)  →  after P0.2 (removes Exclude<> reference)
```

### Stage 6 — Deferred
```
P2.3 (chunk overlap)  →  postpone until corpus > 1,000 chunks
P3.1 (eval harness)  →  postpone until P1.2 is stable
P3.2 (PDF ingestion)  →  postpone until P1.2 is stable
P3.3 (reranking)  →  postpone until corpus > 2,000 chunks
```

---

## Blockers

| Blocker | Blocks | Must resolve before... |
|---------|--------|----------------------|
| OBS-1: middleware.ts status | Everything | Confirm auth is not broken before any deploy |
| pgvector plan availability | P1.2 | Do not start P1.2 until confirmed |
| `matchedVehicleIds` not in response metadata | P0.4 | Requires type + DB + route changes |

---

## Duplicate / Obsolete Work

| Item | Status |
|------|--------|
| `INTENT_ENGLISH_QUERY` dict | Removed as part of P0.1+P0.2. No separate effort. |
| `hasLatinOrDigit` / `englishFallbackQuery` block | Removed as part of P0.1+P0.2. |
| All prior roadmap latency estimates for Arabic queries | Obsolete once P0.1 ships. |
| P0.2 in prior roadmap listed as separate 2h item | Merged into P0.1 — one diff. |

---

## Features That Should NOT Be Implemented Yet

| Feature | Reason |
|---------|--------|
| P3.1 Eval harness | Retrieval architecture not stable enough to calibrate against |
| P3.2 PDF ingestion | Requires P1.2 (multilingual embeddings) first |
| P3.3 Reranking | No value at current corpus size (~200 chunks) |
| P2.3 Chunk overlap | No evidence of cross-section answer failures yet |
| pgvector (P1.2) | Do not start until plan availability confirmed and P0.1 is live |

---

## Summary Statistics

| Phase | Items | DONE | BROKEN/MISSING | REMOVE |
|-------|-------|------|----------------|--------|
| Verified working (Section 0) | 13 | 13 | 0 | 0 |
| P0 Critical fixes | 4 | 0 | 4 | 1 (P0.2) |
| P1 Major quality | 5 | 0 | 4 | 0 |
| P2 Improvements | 5 | 0 | 5 | 0 |
| P3 Deferred | 3 | 0 | 3 | 0 |
| **Total** | **30** | **13** | **16** | **1** |
