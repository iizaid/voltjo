# VoltJo — RAG Phase 1 Implementation Report

> **Date:** 2026-06-25
> **Scope delivered:** Phase 1 of `plans/rag-integration-plan.md` (roadmap P0 #3–#6).
> **Status:** Code complete. Type-check clean (`tsc --noEmit`), lint clean
> (`eslint`), **119/119 unit tests pass** (61 new). **Migrations NOT yet applied to
> the hosted DB** — see §3 (manual steps).
> **Explicitly deferred (untouched):** streaming, embeddings/pgvector, feedback,
> analytics, conversation memory.

---

## 1. What changed

### 1.1 New files

| File | Purpose |
|---|---|
| `supabase/migrations/013_vehicle_aliases.sql` | `vehicle_aliases` table + RLS + index + **idempotent seed** for all 6 supported vehicles. |
| `supabase/migrations/014_search_vehicle_knowledge.sql` | `search_vehicle_knowledge(uuid[], text, text, int)` **SECURITY DEFINER** RPC — parameterized FTS + `ts_rank`, granted to `service_role` only. |
| `lib/ai/normalize-arabic.ts` | `normalizeArabic()` + `normalizedContains()` — the single source of truth for Arabic-aware matching. Pure, no `server-only`. |
| `lib/ai/intent.ts` | `detectIntent()` — rule-based message → `KnowledgeCategory` classifier. Pure. |
| `lib/ai/retrieval.ts` | `retrieveKnowledgeChunks()` (RPC via service-role + soft-narrow), `computeRetrievalConfidence()` (gating), `assembleGroundedContext()` (token-budgeted context + inline citations). `server-only`. |
| `lib/ai/vehicle-alias-cache.ts` | In-process TTL cache of aliases (mirrors `catalog-cache.ts`), loaded via the **service-role** client. |
| `lib/ai/normalize-arabic.test.ts` | 9 tests — diacritics, digit folding, alef/ta-marbuta unification, boundary containment. |
| `lib/ai/intent.test.ts` | 7 tests — each category + priority tie-break + null. |
| `lib/ai/retrieval.test.ts` | 14 tests — RPC mapping, **soft-narrow retry**, error degradation, confidence gating, assembly + citations. |
| `lib/ai/vehicle-aliases-seed.test.ts` | 31 tests — **drift guard**: asserts `normalizeArabic(alias) === seeded alias_norm` for every seed row. |

### 1.2 Modified files

| File | Change |
|---|---|
| `lib/ai/types.ts` | Added public `Citation` and `RetrievalConfidence` types; extended `AiChatResponse.metadata` with optional `citations` + `retrievalConfidence` (additive, backward-compatible). |
| `lib/ai/vehicle-context.ts` | `buildVehicleContextForPrompt(message, options?)` now returns a `RetrievalResult` (was `string \| null`). Added `detectVehicleIds()` (alias → catalog-fallback → carry-over), retrieval orchestration, comparison fan-out (2 chunks/vehicle), confidence gate. `buildVehicleSummaryText()` and `getVehicleContextBySlug()` unchanged. Old brittle `normalizeText()` replaced by shared `normalizeArabic()`. Exports `RetrievalResult`, `RetrievalOptions`, `EMPTY_RETRIEVAL`. |
| `lib/ai/prompt.ts` | `buildSystemPrompt()` now returns `{ systemPrompt, citations, retrievalConfidence }`. **Hardened grounding rules** added to the persona (answer-from-evidence-only, never invent specs, fact/estimate separation, export→Jordan honesty, preserve citation tags). Adds an explicit "no verified data" disclaimer branch when retrieval is empty. |
| `lib/ai/provider.ts` | Consumes the new `buildSystemPrompt` shape and attaches `citations` + `retrievalConfidence` to the success response metadata. No change to the fallback/timeout/logging logic. |
| `lib/supabase/database.types.ts` | Added `vehicle_knowledge` + `vehicle_aliases` table types and the `search_vehicle_knowledge` function signature so all `.from()`/`.rpc()` calls are typed. |

### 1.3 Key design decisions (and why)

- **Retrieval uses the service-role client** (`createAdminClient`), closing the
  plan's C-1 launch blocker: `vehicle_knowledge`/`vehicle_aliases` RLS is
  `to authenticated`, so the anon-key path returns nothing for logged-out chats.
  This is a trusted, parameterized, read-only server call.
- **Soft-narrow lives in `retrieveKnowledgeChunks`**: it first queries with the
  detected category, and retries **once** with `category = null` if that returns
  nothing — so a wrong intent guess can never starve an answerable question. All
  retrieval paths inherit it.
- **The Arabic normalizer is the single source of truth.** The seed's `alias_norm`
  literals were produced by it, and `vehicle-aliases-seed.test.ts` re-normalizes
  every alias to fail CI if the normalizer ever drifts from the seeded data.
- **Two-dimensional confidence** kept honest: `HIGH` requires official/dealer
  evidence above a rank floor (rare today by design — `official = 0` for Jordan);
  estimates/needs_review → `MEDIUM`; unknown/no-evidence/weak-rank → `LOW`.

---

## 2. Architecture after Phase 1

```
POST /api/chat → generateAiChatResponse (provider.ts)
   └─ buildSystemPrompt (prompt.ts)  → { systemPrompt, citations, retrievalConfidence }
        └─ buildVehicleContextForPrompt (vehicle-context.ts)
             1 normalizeArabic(message)
             2 detectVehicleIds: alias-cache → catalog-fallback → carry-over   (≤2)
             3 detectIntent(message) → category | null
             4 structured facts (buildVehicleSummaryText)
             5 retrieveKnowledgeChunks → search_vehicle_knowledge RPC (admin)
                  · soft-narrow on category
                  · single-vehicle: limit 4 · comparison: 2 per vehicle
             6 computeRetrievalConfidence(chunks) → HIGH | MEDIUM | LOW
             7 assembleGroundedContext → contextText + citations[]
   └─ gemini.generateChatResponse(systemPrompt, …)   (unchanged)
   └─ response.metadata += { citations, retrievalConfidence }
```

Failure isolation preserved: any retrieval error → `EMPTY_RETRIEVAL` → the model
answers generally with a disclaimer; the reply is never blocked.

---

## 3. Migrations you must run in Supabase (in order)

> Prereq from the plan's Phase 0: migration **012** must already be applied and the
> 274 chunks ingested. If not, do that first.

**Apply via the Supabase SQL editor (or CLI), in this order:**

1. **`supabase/migrations/013_vehicle_aliases.sql`**
   Creates `vehicle_aliases`, its RLS read policy, the norm index, and seeds ~31
   aliases (idempotent — `ON CONFLICT DO NOTHING`, joined by slug so unknown slugs
   are skipped). Safe to re-run.

2. **`supabase/migrations/014_search_vehicle_knowledge.sql`**
   Creates the `search_vehicle_knowledge` RPC (`create or replace`), revokes public
   execute, grants execute to `service_role`. Safe to re-run.

**No application env changes are required** — `SUPABASE_SERVICE_ROLE_KEY` is already
configured (used by the existing ingestion script and `lib/supabase/admin.ts`).

> ⚠️ If you regenerate `database.types.ts` from the live schema later, it will now
> match — the hand-authored additions mirror these migrations exactly.

---

## 4. Manual verification steps

### 4.1 In Supabase SQL editor (after applying 013 + 014)

```sql
-- Aliases seeded (expect ~31, fewer if some of the 6 vehicles are absent):
select count(*) from public.vehicle_aliases;
select sv.slug, count(*) from public.vehicle_aliases va
  join public.supported_vehicles sv on sv.id = va.vehicle_id
  group by sv.slug order by sv.slug;

-- RPC returns ranked rows for a known vehicle (replace the uuid with a real id):
select section, confidence, rank
from public.search_vehicle_knowledge(
  array['<a real supported_vehicles.id>']::uuid[], 'شحن البطارية', 'battery_charging', 4
);

-- Soft-narrow sanity: a deliberately wrong category should still return rows
-- when called with null (the app does this automatically):
select count(*) from public.search_vehicle_knowledge(
  array['<same id>']::uuid[], 'شحن', null, 4
);

-- Idempotency: re-run 013; this must stay flat (no new rows):
select count(*) from public.vehicle_aliases;
```

### 4.2 Locally (no DB needed)

```bash
npm test                       # 119/119 pass (61 new RAG tests)
npx tsc --noEmit               # clean
npx eslint lib/ai/*.ts         # clean
```

### 4.3 End-to-end (after migrations are live) — the C-1 proof

The single most important manual check: confirm an **anonymous** chat receives
grounded, cited context (this is what the service-role retrieval fixes).

1. Open the chat **logged out**.
2. Ask a grounded, vehicle-specific question, e.g.
   `كم ساعة يحتاج شحن بطارية سيلايون 05؟` or `ما سعر تويوتا راف4 في الأردن؟`
3. Expect: an answer that cites document evidence and/or structured facts, with
   uncertainty stated where evidence is `estimate`/`needs_review`/`unknown`.
4. Inspect the response metadata (network tab / server logs): `retrievalConfidence`
   set and `citations[]` populated for grounded answers.
5. Negative control: ask an off-topic question (`ما الطقس اليوم؟`) → no invented
   specs, general answer, `retrievalConfidence: "LOW"`, empty citations.
6. Alias robustness: try diacritics/variants (`سِيلايون`, `راف ٤`, `seal u`) — all
   should still resolve to the right vehicle.

> If step 3 returns ungrounded answers while authenticated chats work, the
> service-role key isn't reaching `createAdminClient` in that environment — check
> `SUPABASE_SERVICE_ROLE_KEY` on the server runtime.

---

## 5. What is intentionally NOT done (deferred)

Streaming, embeddings/pgvector, `message_feedback`, `ai_request_analytics`,
conversation memory (last-N turns to Gemini). The seam is forward-compatible:
`RetrievalOptions.lastVehicleIds` already exists for the memory phase, and
`citations`/`retrievalConfidence` already flow to metadata for the citation-chip UI.

---

## 6. Risks / follow-ups

| Item | Note |
|---|---|
| `ts_rank` thresholds (`TAU_LOW=0.02`, `TAU_HIGH=0.10`) | Launch defaults; calibrate against the P1 golden eval set. Exported from `retrieval.ts` for easy tuning. |
| `HIGH` confidence rare | Expected — `official = 0` for Jordan (export-sourced). Backfilling citations on hot `unknown` chunks lifts coverage legitimately. |
| Alias coverage | 31 seeded aliases for 6 vehicles. Add rows (and re-run 013) as the catalog grows; the drift test keeps `alias_norm` honest. |
| Added latency | One indexed RPC (rarely two via soft-narrow), service-role client (no cookie parsing), alias+catalog caches. Add a `retrievalMs` log field when wiring observability (P1). |
| `database.types.ts` hand-edit | Mirrors 012–014 exactly; a future `supabase gen types` will reconcile cleanly. |
