# VoltJo — Vehicle Intelligence Architecture

> How the assistant gets expert-level, **factual, citable** access to Jordan
> EV/PHEV knowledge. Builds on the existing `lib/ai/vehicle-context.ts` and
> `supported_vehicles` schema.

## Current state (ground truth)

`lib/ai/vehicle-context.ts` = lexical retrieval:
1. Normalize the user message.
2. `listSupportedVehicles()` — load the **whole** catalog (per request, no cache).
3. Token-containment filter on `slug + nameAr + nameEn + brand`.
4. Take top **2** matches, stringify all fields, inject into the system prompt
   between `<<< >>>` fences (`lib/ai/prompt.ts:35-39`).

Strengths: simple, deterministic, no embedding cost. Weaknesses: brittle matching
(misses synonyms/typos/Arabic morphology), no ranking by relevance, no confidence
exposure, no citations, and a DB hit on every message.

## Target architecture (layered)

```
User message
   │
   ▼
[1] Intent + entity extraction  (cheap, rule-based first; LLM-assisted later)
   │   → vehicle mentions, comparison?, cost?, charging?, spec?, buy-advice?
   ▼
[2] Retrieval layer
   │   Tier A: exact/slug/alias match (deterministic)        ← highest confidence
   │   Tier B: lexical token match (current logic, improved alias table)
   │   Tier C: pgvector semantic search (future)             ← recall for fuzzy Qs
   │   → ranked candidates with a relevance score
   ▼
[3] Confidence gate
   │   if top score < threshold AND no exact match → "low confidence" path
   │   → instruct model to answer generally + state data isn't verified
   ▼
[4] Context assembly
   │   structured facts (not prose) + per-fact confidence + source ref
   │   + cost profiles + Jordan notes, capped to a token budget
   ▼
[5] Prompt injection (fenced, untrusted-user-content separated)
   ▼
[6] Generation (streaming) → answer
   ▼
[7] Citation surfacing  → UI shows "المصدر: …" chips + confidence badge
```

## Guarantees and how each is met

### Factual answers
- Prompt already forbids inventing numbers when context is present
  (`prompt.ts:16`). Strengthen: when context confidence is `estimate`, the
  assembled block must **label** each figure as تقديري so the model echoes the
  caveat. Add a hard rule: "إذا لم يرد رقم في السياق، قل إنه غير متوفر."

### Citation support
- Add `vehicle_sources(vehicle_id, field, value, source_url, source_date,
  confidence)` (see gap analysis). The context builder emits, per fact, a compact
  ref id; the route returns a `sources[]` array alongside the message; the UI
  renders source chips. Minimal v1: cite at the **row** level
  (`data_confidence` + a single `source_url`) before per-field.

### Retrieval confidence
- The retrieval layer returns `{score, matchType: exact|lexical|semantic|none}`.
- Map to a user-facing badge: exact/official → "موثّق", dealer → "من الوكيل",
  lexical+estimate → "تقديري", none → no claim.

### Fallback behaviour
- `matchType==='none'` → do **not** inject fabricated context; switch the prompt
  to "general guidance, recommend verifying with the dealer" and optionally
  suggest the closest known vehicles ("لا أملك بيانات موثّقة عن هذه السيارة، لكن…").
- Retrieval errors already fail open (`prompt.ts:28-30`) — keep that, but log it.

## Concrete module plan

| Module | Responsibility | Status |
|---|---|---|
| `lib/ai/retrieval/aliases.ts` | brand/model alias + common Arabic spellings → slug | NEW (S) |
| `lib/ai/retrieval/match.ts` | tiered match (exact → lexical → semantic), returns scored candidates | refactor of `vehicle-context.ts` (M) |
| `lib/ai/retrieval/context.ts` | assemble token-budgeted, confidence-labeled fact block + refs | refactor (S) |
| `lib/vehicles/catalog-cache.ts` | cached `listSupportedVehicles()` (TTL/`unstable_cache`) | NEW (S) — also a perf fix |
| `vehicle_sources` table + query | per-row/-fact citations | NEW (schema S + data) |
| Route `sources[]` passthrough | return citations with the message | S |
| UI source chips + confidence badge | surface provenance | S |

## Phased delivery

- **Phase 1 (launch week):** catalog cache + alias table + confidence labeling in
  the assembled context + row-level `source_url`/confidence chip in UI +
  no-match fallback. **No embeddings.** Closes the truthfulness gap cheaply.
- **Phase 2:** `vehicle_sources` per-fact citations; comparison-aware assembly
  (when 2 vehicles matched, emit a side-by-side fact table for the model).
- **Phase 3:** pgvector semantic retrieval for recall on fuzzy/long questions;
  embed vehicle fact-sheets + FAQ; hybrid rank (lexical + vector).

## Token-budget discipline

Cap injected context (e.g. ≤ ~1,200 tokens): 2 vehicles × structured facts is
fine; a comparison table for 2 is fine; never dump the whole catalog. The current
`.slice(0,2)` is a reasonable v1 ceiling — keep it, but rank before slicing.
