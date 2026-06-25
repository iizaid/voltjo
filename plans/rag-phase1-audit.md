# VoltJo — RAG Phase 1 Audit Report

> **Audited by:** Code inspection (read-only, no changes made)
> **Date:** 2026-06-25
> **Reference plan:** `plans/rag-integration-plan.md` §10 Phase 1 (items 1–8)
> **Reference report:** `plans/rag-phase1-implementation-report.md`
> **Verdict:** Code is **100 % complete**. Production RAG is **not yet active** — migrations 013 + 014 have not been applied to the hosted DB.

---

## 1. Phase 1 task status

Phase 1 lists 8 tasks (plan §10). All 8 are COMPLETE in code.

### COMPLETE tasks

| # | Plan task | Verdict | Key evidence |
|---|---|---|---|
| 1 | Migration 013 `vehicle_aliases` + idempotent seed | **COMPLETE** | `supabase/migrations/013_vehicle_aliases.sql` — DDL, RLS (`to authenticated`), `vehicle_aliases_norm_idx`, 31 seeded aliases for 6 vehicles, `ON CONFLICT DO NOTHING`. |
| 2 | Migration 014 `search_vehicle_knowledge` RPC | **COMPLETE** | `supabase/migrations/014_search_vehicle_knowledge.sql` — `SECURITY DEFINER`, `stable`, `ts_rank` + `websearch_to_tsquery('simple')`, `revoke … from public; grant … to service_role`. |
| 3 | Types — `vehicle_knowledge`, `vehicle_aliases`, RPC signature | **COMPLETE** | `lib/supabase/database.types.ts` lines 469–584 — hand-authored `Row`/`Insert`/`Update` for both tables and `search_vehicle_knowledge` `Args`/`Returns`. Matches migrations exactly. |
| 4 | `normalizeArabic()` + `normalizedContains()` (C-3) | **COMPLETE** | `lib/ai/normalize-arabic.ts` — NFKC, diacritics/tatweel strip, alef/ta-marbuta/alef-maqsura/waw-hamza/ya-hamza/bare-hamza folding, Arabic-Indic + extended digit fold, Latin lowercase, whitespace collapse. `normalizedContains` enforces word-boundary containment. |
| 5 | `detectIntent()` rule-based classifier (C-4) | **COMPLETE** | `lib/ai/intent.ts` — 6 categories (`battery_charging`, `engine_fuel`, `maintenance`, `safety`, `trims`, `market`), keywords normalized at module load, tie-break priority array, short-token word-boundary guard, Arabic substring allowance for prefixed words. |
| 6 | Extend `buildVehicleContextForPrompt` — alias cache, RPC retrieval via `createAdminClient`, confidence gate, token-budgeted assembly + inline citations (C-1, C-5) | **COMPLETE** | `lib/ai/vehicle-context.ts` — alias-cache → catalog-fallback → carry-over detection; comparison fan-out (2 chunks/vehicle via `Promise.all`); delegates to `retrieveKnowledgeChunks` + `computeRetrievalConfidence` + `assembleGroundedContext`. `lib/ai/retrieval.ts` — service-role RPC call, soft-narrow retry, `TAU_LOW`/`TAU_HIGH` gating, `MAX_CONTEXT_CHARS`/`MAX_CHUNK_CHARS` budget, `citationTag()` inline rendering. `lib/ai/vehicle-alias-cache.ts` — 1-hour TTL, single-flight stampede collapse, service-role load, `invalidateVehicleAliasCache()` test hook. |
| 7 | Harden `prompt.ts` grounding rules (C-7) + thread `citations`/`retrievalConfidence` into `AiChatResponse.metadata` (C-6) | **COMPLETE** | `lib/ai/prompt.ts` — Arabic grounding contract (answer-from-evidence-only, no invented specs, fact/estimate separation, export→Jordan honesty, preserve citation tags, no-verified-data disclaimer branch). Returns `{ systemPrompt, citations, retrievalConfidence }`. `lib/ai/types.ts` — `Citation` and `RetrievalConfidence` exported types; `AiChatResponse.metadata` extended with optional `citations?` and `retrievalConfidence?`. `lib/ai/provider.ts` — spreads `{ citations, retrievalConfidence }` onto success response. |
| 8 | Unit tests for all Phase 1 modules | **COMPLETE** | 4 test files, 61 tests total: `normalize-arabic.test.ts` (9 tests), `intent.test.ts` (7 tests), `retrieval.test.ts` (14 tests — RPC mapping, soft-narrow, error degradation, confidence gating, assembly), `vehicle-aliases-seed.test.ts` (31 tests — drift guard asserting `normalizeArabic(alias) === alias_norm` for every seed row). |

### PARTIALLY complete tasks

None. All 8 Phase 1 tasks are code-complete.

### MISSING tasks (Phase 1 scope)

None. The plan §10 Phase 1 scope is fully covered in code.

**Out-of-scope items that are also not done (Phase 2 / Phase 3 — correct):**

- Citation chips + confidence badge in `ChatSidebar` (Phase 2, item 11) — not rendered in any component.
- Conversation memory / last-N turns to Gemini (Phase 2, item 9).
- `message_feedback` migration + UI (Phase 2, item 10).
- Streaming (Phase 3, item 13).
- `ai_request_analytics` migration (Phase 3, item 14).

---

## 2. Does real retrieval execute against `vehicle_knowledge` in production?

**No.**

The retrieval pipeline is fully wired in code and would execute real FTS queries if the DB schema were present. However, **migrations 013 and 014 have not been applied to the hosted Supabase DB** (confirmed by the implementation report §3 and the fact that they appear as untracked new files in `git status`).

Consequence at runtime:

- **Migration 013 missing** — `vehicle_aliases` table does not exist. The alias cache load in `getCachedVehicleAliases()` returns an RPC/table-not-found error, which the `catch` block demotes to `cached ?? []`. Vehicle matching falls back to the catalog token matcher. No alias precision. No blocking error.

- **Migration 014 missing** — `search_vehicle_knowledge` RPC does not exist. The `.rpc(...)` call in `retrieveKnowledgeChunks` returns an error; the `try/catch` demotes to `[]`. No chunks retrieved. `computeRetrievalConfidence([])` returns `"LOW"`. `assembleGroundedContext(structuredText, [])` emits structured-column facts only (if a vehicle was matched) or `contextText: null`.

- **Migration 012 + ingestion** — `vehicle_knowledge` table file exists (`supabase/migrations/012_vehicle_knowledge.sql`) but its applied status cannot be determined from a code audit alone. The implementation report treats it as a prerequisite Phase 0 step requiring owner authorization.

**Net production behaviour (today):** identical to pre-Phase-1. Structured column context for matched vehicles, no cited chunks, `retrievalConfidence: "LOW"`, empty `citations[]`. The degradation path is graceful — no 500s, no blocked replies.

---

## 3. Are `citations` and `retrievalConfidence` returned to the frontend?

**Partially.**

| Layer | Status |
|---|---|
| `AiChatResponse.metadata` type definition | ✅ `citations?: Citation[]` and `retrievalConfidence?: RetrievalConfidence` are in `lib/ai/types.ts` |
| Attachment in `provider.ts` | ✅ `{ ...response.metadata, latencyMs, citations, retrievalConfidence }` — always present in the success response |
| Persistence in `route.ts` | ✅ `message.metadata` is persisted for authenticated users (route.ts:264–268); metadata includes citations when populated |
| JSON response to the browser | ✅ The full `message` object (including metadata) is returned at `route.ts:271–276` via `apiSuccess({ message, conversationId })` |
| UI rendering in `ChatSidebar` / any component | ❌ **Not rendered.** No component in `components/chat/` reads `metadata.citations` or `metadata.retrievalConfidence`. No citation chips, no confidence badge. (Phase 2, item 11.) |

**Bottom line:** `citations` and `retrievalConfidence` flow to the API JSON response and are persisted in message metadata, but they are not displayed to users. The data contract is ready for the Phase 2 UI work.

---

## 4. Is the current production build expected to use RAG?

**No.** The expected production behaviour right now is:

1. Every chat request calls `buildVehicleContextForPrompt` → alias cache miss (graceful `[]`) → catalog fallback matching → `retrieveKnowledgeChunks` RPC error (graceful `[]`) → `contextText` = structured columns only (or `null` if no vehicle matched).
2. The system prompt includes grounding rules but no document-chunk evidence block.
3. `retrievalConfidence` is always `"LOW"` and `citations` is always `[]` in every response.
4. Gemini answers from structured column data + its own priors, with hardened "no invented specs" rules in the prompt.

RAG will activate as soon as migrations 013 + 014 are applied (and Phase 0 migration 012 + 274-chunk ingestion is confirmed complete on the hosted DB).

---

## 5. File inventory — Phase 1 changes and status

### New files (untracked in git, code-complete)

| File | Purpose | Code status |
|---|---|---|
| `supabase/migrations/013_vehicle_aliases.sql` | `vehicle_aliases` table + RLS + seed | Complete |
| `supabase/migrations/014_search_vehicle_knowledge.sql` | `search_vehicle_knowledge` SECURITY DEFINER RPC | Complete |
| `lib/ai/normalize-arabic.ts` | `normalizeArabic()` + `normalizedContains()` — shared normalizer | Complete |
| `lib/ai/intent.ts` | `detectIntent()` rule-based classifier | Complete |
| `lib/ai/retrieval.ts` | `retrieveKnowledgeChunks`, `computeRetrievalConfidence`, `assembleGroundedContext`, `toCitation` | Complete |
| `lib/ai/vehicle-alias-cache.ts` | In-process TTL alias cache (service-role, stampede-safe) | Complete |
| `lib/ai/normalize-arabic.test.ts` | 9 unit tests for the normalizer | Complete |
| `lib/ai/intent.test.ts` | 7 unit tests for intent classification | Complete |
| `lib/ai/retrieval.test.ts` | 14 unit tests for retrieval, confidence, assembly | Complete |
| `lib/ai/vehicle-aliases-seed.test.ts` | 31 drift-guard tests (normalizeArabic(alias) === alias_norm) | Complete |

### Modified files (staged, code-complete)

| File | Change summary | Code status |
|---|---|---|
| `lib/ai/types.ts` | Added `Citation`, `RetrievalConfidence` types; extended `AiChatResponse.metadata` with `citations?` + `retrievalConfidence?` | Complete |
| `lib/ai/vehicle-context.ts` | Full rewrite: `buildVehicleContextForPrompt` now returns `RetrievalResult`; added `detectVehicleIds` (alias→catalog→carry-over); retrieval orchestration; comparison fan-out; `EMPTY_RETRIEVAL` sentinel | Complete |
| `lib/ai/prompt.ts` | Arabic grounding contract added to `BASE_SYSTEM_PROMPT`; `buildSystemPrompt` now returns `SystemPromptResult { systemPrompt, citations, retrievalConfidence }` | Complete |
| `lib/ai/provider.ts` | Destructures `{ systemPrompt, citations, retrievalConfidence }` from `buildSystemPrompt`; attaches them to success response metadata | Complete |
| `lib/supabase/database.types.ts` | Hand-authored `vehicle_knowledge` + `vehicle_aliases` table types; `search_vehicle_knowledge` function signature | Complete |

### Other new files (not part of Phase 1 scope)

| File | Status |
|---|---|
| `plans/production-ai-roadmap.md` | Companion planning doc |
| `plans/rag-integration-plan.md` | This plan (spec) |
| `plans/rag-phase1-implementation-report.md` | Implementation summary |
| `plans/vehicle-knowledge-architecture.md` | Architecture doc |
| `plans/vehicle-knowledge-ingestion-audit.md` | Ingestion audit doc |
| `plans/vehicle-knowledge-validation-report.md` | Validation doc |
| `proxy.ts` | Unrelated to Phase 1 |
| `scripts/ingest-vehicle-knowledge.mjs` | Phase 0 ingestion script |
| `supabase/migrations/012_vehicle_knowledge.sql` | Phase 0 table (prerequisite) |
| `public/ai models icons/` | UI assets |

---

## 6. Actions required to activate RAG in production

1. **Confirm Phase 0 is done** — verify migration 012 is applied and 274 chunks are ingested (`select count(*) from vehicle_knowledge;` → expect 274).
2. **Apply migration 013** — creates `vehicle_aliases`, seeds 31 aliases. Safe to re-run.
3. **Apply migration 014** — creates `search_vehicle_knowledge` RPC, grants to `service_role`. Safe to re-run.
4. **Smoke-test** per `plans/rag-phase1-implementation-report.md §4.3` — log out, ask a vehicle-specific question, inspect network response for non-empty `citations[]` and `retrievalConfidence !== "LOW"`.
5. **Run unit tests** locally (`npm test`) to confirm 119/119 pass before deploying.

No environment variable changes are required — `SUPABASE_SERVICE_ROLE_KEY` is already configured.

---

## 7. Summary verdict

| Dimension | Status |
|---|---|
| Phase 1 code completeness | ✅ 100 % — all 8 plan tasks implemented |
| DB migrations applied to hosted DB | ❌ Not applied (013, 014, and likely 012) |
| Real retrieval executing in production | ❌ No — graceful degradation to structured-only |
| `citations` + `retrievalConfidence` in API response | ✅ Yes — in response JSON and persisted to DB |
| `citations` + `retrievalConfidence` rendered in UI | ❌ No — Phase 2 item, not yet built |
| Production build expected to use RAG | ❌ No — awaiting migration apply |
