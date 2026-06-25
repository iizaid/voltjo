# VoltJo — RAG Integration Plan (chat ↔ `vehicle_knowledge`)

> **Role:** Senior AI architect — final pre-launch review.
> **Date:** 2026-06-25
> **Status:** Audit + design only. **No code implemented.**
> **Scope:** Wire the already-built, already-ingested `vehicle_knowledge` corpus
> (274 chunks, FTS-ready) into the live chat pipeline as grounded, cited retrieval.
> **Verified against (read in full):** `app/api/chat/route.ts`,
> `lib/ai/{provider,prompt,vehicle-context,config,types}.ts`,
> `lib/ai/providers/gemini.ts`, `lib/vehicles/{queries,catalog-cache}.ts`,
> `lib/chat/server-persistence.ts`, `lib/supabase/{server,admin}.ts`,
> `supabase/migrations/012_vehicle_knowledge.sql`,
> `scripts/ingest-vehicle-knowledge.mjs`, `lib/supabase/database.types.ts`.
> **Companion docs (do not duplicate):** `plans/production-ai-roadmap.md` (build
> spec), `plans/vehicle-knowledge-architecture.md` (the bridge),
> `plans/vehicle-knowledge-validation-report.md` (ingestion proof). This document
> is the **integration spec** that closes roadmap P0 #3–#6.

---

## 0. Executive summary

The knowledge base exists and is validated (274 chunks, GIN FTS, RLS, idempotent
ingest). The chat assistant **does not read it**. Today's assistant grounds only
on **structured columns** for up to 2 vehicles, matched by naïve substring
containment, with **no document retrieval, no conversation memory sent to the
model, and no streaming**.

This plan turns `buildVehicleContextForPrompt()` — the one isolated, best-effort
injection seam — into a **RAG-lite retriever**: detect vehicle(s), normalize
aliases, FTS-rank chunks (intent-narrowed), gate on confidence, and inject a
token-budgeted, **cited** evidence block. Target added latency **< 300 ms** via a
single service-role query against existing indexes plus an in-process query cache.

**Three findings that change the build order vs. the roadmap:**

1. **RLS/key mismatch (launch blocker).** `vehicle_knowledge` is readable only
   `to authenticated`, but chat serves anonymous users through the **anon-key**
   `createPublicClient`. Retrieval **must** use `createAdminClient` (service role)
   as a trusted server read. → §3 (C-1).
2. **Types gap.** `database.types.ts` has no `vehicle_knowledge` / `vehicle_aliases`
   row types. → §3 (C-2).
3. **Retrieval ≠ prompt rules.** Injecting evidence without hardening the system
   prompt (fact/estimate separation, "if-not-in-context-say-unknown") buys
   grounding **and** new hallucination surface. The two ship together. → §6, §7.

---

## Part 1 — Current state audit (ground truth, with file references)

### 1.1 The end-to-end flow today

```
User (browser, ChatSidebar)
  │  POST /api/chat  { message, modelId, thinkingMode, conversationId?, attachment? }
  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ app/api/chat/route.ts :: POST                                                 │
│  1  getClientIp + requestId                              route.ts:73-74       │
│  2  content-length cap 12 KB                             route.ts:75-88       │
│  3  rate-limit "chat-preparse" (IP 60 / 10min)          route.ts:90-115      │
│  4  read body (byte-limited) → validateAiChatRequest     route.ts:117-151     │
│  5  getCurrentUser → rate-limit "chat" (user 30/anon 10) route.ts:153-174     │
│  6  checkAiBudget (daily budget + circuit breaker)       route.ts:178-190     │
│  7  if user: create/find conversation + persist USER msg route.ts:196-236     │
│  8  runWithAbortableTimeout(45s) → generateAiChatResponse route.ts:238-249    │
│  9  recordAiUsage(totalTokens)                           route.ts:253-258     │
│ 10  if user: persist ASSISTANT msg                       route.ts:260-269     │
│ 11  return { message, conversationId }  (WHOLE, not streamed) route.ts:271-276│
└─────────────────────────────────────────────────────────────────────────────┘
  │
  ▼  generateAiChatResponse()                              lib/ai/provider.ts:17
┌─────────────────────────────────────────────────────────────────────────────┐
│  a  assertAiConfigured + assertResolvableProvider()      provider.ts:21-22    │
│  b  systemPrompt = await buildSystemPrompt(request)      provider.ts:24       │
│         └─ buildVehicleContextForPrompt(request.message) prompt.ts:26  ◄─ SEAM │
│              · normalizeText(message)                    vehicle-context.ts:7  │
│              · getCachedVehicleCatalog() (≤6 rows, 1h TTL) catalog-cache.ts:28 │
│              · substring token match → top 2 vehicles    vehicle-context.ts:87 │
│              · buildVehicleSummaryText(): STRUCTURED cols vehicle-context.ts:15│
│         └─ fence as «بيانات سيارات موثّقة» + mode hint    prompt.ts:35-51      │
│  c  walk provider chain (Gemini only registered)         provider.ts:35-86    │
│         └─ gemini.generateChatResponse()                 providers/gemini.ts  │
│              · buildRequestBody: contents=[ONE user turn] gemini.ts:49-58 ❗   │
│              · fetch :generateContent (retry+backoff)    gemini.ts:98-162     │
│              · extract text + usage                      gemini.ts:61-77      │
│  d  log latency/attempts/usage                           provider.ts:44-55    │
└─────────────────────────────────────────────────────────────────────────────┘
  │
  ▼  AiChatResponse { content, metadata{ usage, latencyMs, model } }  (returned whole)
```

### 1.2 The three structural limits (each verified in code)

| # | Limit | Evidence | Consequence |
|---|---|---|---|
| L1 | **No document retrieval.** Only structured columns reach the model. | `buildVehicleSummaryText` reads DB columns only ([vehicle-context.ts:15-73](lib/ai/vehicle-context.ts#L15-L73)) | 274 cited chunks are invisible at inference. |
| L2 | **Naïve vehicle matching.** Lowercase substring token containment, top-2, no alias/diacritic handling. | [vehicle-context.ts:87-97](lib/ai/vehicle-context.ts#L87-L97) | "أتو 3", "seal u", typos, Arabic morphology all miss. |
| L3 | **No memory, no streaming.** Single user turn sent; full response buffered. | `contents:[{role:"user"...}]` ([gemini.ts:49-58](lib/ai/providers/gemini.ts#L49-L58)); whole-object return ([route.ts:271](app/api/chat/route.ts#L271)) | No follow-up context; TTFB = full generation. |

### 1.3 What is already strong (reuse, don't rebuild)

- **Clean injection seam.** `buildVehicleContextForPrompt` is isolated and wrapped
  in try/catch — "context is best-effort; never block a reply" ([prompt.ts:27-31](lib/ai/prompt.ts#L27-L31)). RAG drops in here with zero lifecycle blast radius.
- **Catalog cache.** In-process TTL cache with single-flight stampede collapse
  ([catalog-cache.ts](lib/vehicles/catalog-cache.ts)) — vehicle detection pays ~0 ms warm.
- **Cost + safety rails.** Budget breaker ([cost-control.ts]), abortable 45 s
  deadline with client-disconnect propagation ([route.ts:238-249](app/api/chat/route.ts#L238-L249)),
  provider fallback chain, structured per-request logging ([provider.ts:44-74](lib/ai/provider.ts#L44-L74)).
- **Service-role admin client** already exists ([admin.ts](lib/supabase/admin.ts)) —
  the correct tool for trusted server reads of an authenticated-only table.
- **Validated retrieval primitive.** `tsv @@ websearch_to_tsquery('simple', …)` +
  `ts_rank` is proven to use the GIN index (validation report §1).

### 1.4 Database access layer — the RLS/key trap

| Client | Key | Used by | Can read `vehicle_knowledge`? |
|---|---|---|---|
| `createClient()` (SSR, cookies) | anon + session | auth'd persistence ([server-persistence.ts]) | Only if a logged-in session ⇒ **not for anon chat** |
| `createPublicClient()` | **anon** | all vehicle reads ([queries.ts:87](lib/vehicles/queries.ts#L87)) | **NO** — policy is `to authenticated` |
| `createAdminClient()` | **service role** | ingest, server-trusted reads | **YES** — bypasses RLS |

> **Conclusion:** the existing vehicle read path (anon key) **cannot** read
> `vehicle_knowledge`. Retrieval is a server-trusted operation and must use
> `createAdminClient()`. See §3 C-1.

---

## Part 2 — Target architecture

### 2.1 Where retrieval happens

**Inside `buildVehicleContextForPrompt(message, options)`** — extended, not
replaced. This keeps RAG behind the existing best-effort boundary: a retrieval
failure degrades to "structured-only" or "no context", never a 500.

```
                          ┌────────────────────────────────────────────┐
                          │  buildVehicleContextForPrompt(message,opts) │
                          │            lib/ai/vehicle-context.ts        │
 message ───────────────► │                                            │
 (+ history, opts)        │  1 normalizeArabic(message)                │
                          │  2 detectVehicles()  ── alias + catalog     │──► matchedVehicleIds[]
                          │  3 detectIntent()    ── keyword rules       │──► category | null
                          │  4 structured facts  ── getCachedCatalog    │──► summaryText (cols)
                          │  5 retrieveChunks()  ── FTS via ADMIN client│──► chunks[] + citations[]
                          │  6 confidenceGate()                         │
                          │  7 assembleContext() ── token-budgeted      │
                          └───────────────┬────────────────────────────┘
                                          ▼
                       { contextText, citations[], retrievalConfidence }
                                          ▼
   buildSystemPrompt(): persona  +  «بيانات موثّقة» (structured)
                                  +  «أدلة من الوثائق» (chunks + inline citations)
                                  +  grounding/labeling rules (HIGH/MED/LOW)
                                          ▼
                       gemini.generateChatResponse(...)  (unchanged this phase)
```

### 2.2 Retrieval data-flow diagram

```
   user message
        │
        ▼
 normalizeArabic ──► strip diacritics (ً ٌ ٍ َ ُ ِ ّ ْ), unify ا/أ/إ/آ→ا , ة→ه ,
        │            ى→ي , ؤ→و , ئ→ي , Arabic-Indic digits→ASCII , lowercase, collapse ws
        ▼
 ┌─ detectVehicles ──────────────────────────────────────────────┐
 │  a. exact alias hit   (vehicle_aliases.alias_norm ⊂ norm-msg)  │ high-precision
 │  b. catalog token hit (current logic, on normalized strings)   │ fallback
 │  c. carry-over        (opts.lastVehicleIds from history)       │ multi-turn subject
 └────────────────────────────┬───────────────────────────────────┘
                              │  matchedVehicleIds[]  (∅ ⇒ general answer)
        ▼
 detectIntent (rule keywords) ──► category ∈ {battery_charging, engine_fuel,
        │                          maintenance, safety, trims, market, profile} | null
        ▼
 ┌─ retrieveChunks  (ONE query, createAdminClient, RPC search_vehicle_knowledge) ─┐
 │  WHERE vehicle_id = ANY(matched)                                               │
 │    AND (category = :intent OR :intent IS NULL)        ← soft-narrow (see §5.4)  │
 │    AND tsv @@ websearch_to_tsquery('simple', :q)                               │
 │  ORDER BY ts_rank(tsv, :q) DESC                                                │
 │  LIMIT K   (4 single-vehicle · 2-per-vehicle when comparing)                   │
 └────────────────────────────┬───────────────────────────────────────────────────┘
        ▼
 confidenceGate ──► retrievalConfidence ∈ {HIGH, MEDIUM, LOW}  (§6)
        ▼
 assembleContext (token budget ≈ 1.5–2K) ──► contextText + citations[]
```

---

## Part 3 — Missing components (gap analysis)

### 3.1 Code/infra gaps — **C = critical (blocks correct launch)**

| ID | Gap | Why it matters | Fix |
|---|---|---|---|
| **C-1** | Retrieval would run on the **anon key** and hit the `to authenticated` RLS policy → **0 rows for anonymous chat**. | Anon users are a first-class chat audience ([route.ts:159](app/api/chat/route.ts#L159)). Silent empty retrieval = "RAG looks built but never fires." | Use `createAdminClient()` for retrieval (trusted server read). **Do not** loosen RLS to anon. |
| **C-2** | `database.types.ts` has **no** `vehicle_knowledge` / `vehicle_aliases` types. | `.from("vehicle_knowledge")` is untyped; the SECURITY DEFINER RPC has no generated signature. | Regenerate types after migrations land, **or** hand-author a narrow `KnowledgeRow` type + typed RPC wrapper. |
| **C-3** | No **Arabic normalizer**. `normalizeText` only lowercases + strips punctuation ([vehicle-context.ts:7-13](lib/ai/vehicle-context.ts#L7-L13)). | Alias matching and `websearch_to_tsquery` quality both depend on it. | Add `normalizeArabic()` (diacritics, alef/ya/ta-marbuta unification, digit folding). Shared by matcher + query builder. |
| **C-4** | No **intent classifier**. | Category narrowing is what keeps the FTS query precise and fast. | Rule-based keyword map (§5.3). No ML. |
| **C-5** | No **chunk retrieval function**. | The core of RAG. | `retrieveVehicleKnowledge()` + a `search_vehicle_knowledge` SQL RPC (§5). |
| **C-6** | No **citation contract** end-to-end. | Citations are the #1 differentiator and the honesty mechanism. | Add `citations[]` to `AiChatResponse.metadata` (§8); persist in message metadata; UI chips (P1). |
| **C-7** | **Prompt not hardened** for evidence-grounded answering. | Injecting evidence without rules adds hallucination surface. | Rewrite grounding rules in `prompt.ts` (§7). |

### 3.2 Database gaps

| ID | Missing structure | Status | Priority |
|---|---|---|---|
| D-1 | `vehicle_aliases` (alias → vehicle, normalized) | designed (roadmap §B.2, migration 013) — **not created** | **P0** (matching quality) |
| D-2 | `search_vehicle_knowledge` RPC (SECURITY DEFINER) | not designed yet | **P0** (typed, parameterized, RLS-clean retrieval) |
| D-3 | `message_feedback` (👍/👎 + injected context) | designed (migration 014) — not created | P1 |
| D-4 | `ai_request_analytics` (had_context, intent, chunk ids) | designed (migration 015) — not created | P1 (coverage-miss detection) |
| D-5 | `query_cache` / semantic answer cache | mentioned (roadmap P2) | P2 |
| D-6 | `embedding vector(768)` column + HNSW | designed (migration 016) | P2 |
| D-7 | **Evaluation dataset** (30–50 golden Jordan Qs) | roadmap P1 #11 — not built | P1 (the only objective regression guard) |

> **D-2 rationale:** a SECURITY DEFINER RPC is preferable to inline
> `.from(...).textSearch(...)` because (a) it keeps `ts_rank`/`websearch_to_tsquery`
> server-side and parameterized (injection-safe), (b) it returns exactly the
> projected citation columns, (c) it gives a stable typed surface for `database.types.ts`,
> and (d) it can be granted to `authenticated` for a future direct-from-client path
> without re-opening table RLS.

### 3.3 What is **not** missing (explicitly de-scoped for launch)

pgvector/embeddings (P2), PDF ingestion (P2), personalization (P2), 2nd live
provider (P2), semantic answer cache (P2). Rationale unchanged from roadmap §B.1 /
Part C — **earn vectors with eval data; FTS-first keeps launch at zero new paid infra.**

---

## Part 4 — Database additions (exact DDL)

### 4.1 Migration 013 — `vehicle_aliases` (P0)

```sql
-- supabase/migrations/013_vehicle_aliases.sql
create table if not exists public.vehicle_aliases (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references public.supported_vehicles(id) on delete cascade,
  alias       text not null,            -- human form: 'atto 3','يوان بلس','seal u'
  alias_norm  text not null,            -- normalizeArabic(alias) — MUST match the runtime normalizer
  lang        text not null default 'ar' check (lang in ('ar','en')),
  created_at  timestamptz not null default now(),
  unique (vehicle_id, alias_norm)
);
create index if not exists vehicle_aliases_norm_idx on public.vehicle_aliases (alias_norm);

alter table public.vehicle_aliases enable row level security;
drop policy if exists "Authenticated can read vehicle aliases" on public.vehicle_aliases;
create policy "Authenticated can read vehicle aliases"
  on public.vehicle_aliases for select to authenticated using (true);
-- Writes: service-role only (no anon/authenticated write policy). Seeded by an
-- idempotent INSERT … ON CONFLICT (vehicle_id, alias_norm) DO NOTHING block.
```

> **Invariant:** `alias_norm` is computed by the **same** `normalizeArabic()` used
> at request time. Seed it from JS (or a SQL function that mirrors the JS exactly).
> Drift here silently breaks matching — make the normalizer the single source of truth.

### 4.2 Migration 014 — `search_vehicle_knowledge` RPC (P0)

```sql
-- supabase/migrations/014_search_vehicle_knowledge.sql
create or replace function public.search_vehicle_knowledge(
  p_vehicle_ids uuid[],
  p_query       text,
  p_category    text default null,   -- null ⇒ no category filter (soft-narrow handled in app)
  p_limit       int  default 6
)
returns table (
  id uuid, vehicle_id uuid, category text, section text, content text,
  source_ref text, source_file text, page_ref text,
  confidence text, confidence_raw text, rank real
)
language sql stable
security definer                      -- trusted read; callable without table RLS grants
set search_path = public
as $$
  select k.id, k.vehicle_id, k.category, k.section, k.content,
         k.source_ref, k.source_file, k.page_ref,
         k.confidence, k.confidence_raw,
         ts_rank(k.tsv, websearch_to_tsquery('simple', p_query)) as rank
  from public.vehicle_knowledge k
  where k.vehicle_id = any(p_vehicle_ids)
    and (p_category is null or k.category = p_category)
    and k.tsv @@ websearch_to_tsquery('simple', p_query)
  order by rank desc
  limit greatest(1, least(p_limit, 24));
$$;

revoke all on function public.search_vehicle_knowledge(uuid[], text, text, int) from public;
grant execute on function public.search_vehicle_knowledge(uuid[], text, text, int) to service_role;
-- Optional future: grant execute … to authenticated;  (for a direct client path)
```

### 4.3 Migrations 015–016 (P1) — feedback + analytics

`message_feedback` and `ai_request_analytics` exactly as roadmap §B.2 (migrations
renumbered to follow 013/014 above). Both additive; analytics is service-role
write-only (no RLS needed); feedback mirrors `chat_messages` RLS.

---

## Part 5 — The exact retrieval algorithm

### 5.1 Signature (extended seam)

```ts
type RetrievalOptions = {
  lastVehicleIds?: string[];   // carry-over subject from prior turns (memory)
  maxChunks?: number;          // default 4 single-vehicle, 2/vehicle when comparing
};
type Citation = {
  section: string; sourceRef: string | null; sourceFile: string | null;
  pageRef: string | null; confidence: string; confidenceRaw: string | null;
};
type RetrievalResult = {
  contextText: string | null;        // null ⇒ no grounded context (model disclaims)
  citations: Citation[];
  retrievalConfidence: "HIGH" | "MEDIUM" | "LOW";
  matchedVehicleIds: string[];
  intent: string | null;
};
async function buildVehicleContextForPrompt(
  message: string, options?: RetrievalOptions
): Promise<RetrievalResult>;
```

### 5.2 Step 1 — vehicle detection + alias normalization

```
norm = normalizeArabic(message)
matched = []

// (a) alias match — high precision. Load aliases once, cache in-process (like catalog).
for each alias in cachedAliases:
    if norm contains alias.alias_norm (word-boundary aware): matched += alias.vehicle_id

// (b) catalog fallback — current token logic, but run on NORMALIZED strings
if matched is empty:
    matched = catalogTokenMatch(norm, getCachedVehicleCatalog())   // top-2

// (c) carry-over — multi-turn subject ("وكم سعرها؟" after naming a car)
if matched is empty and options.lastVehicleIds: matched = options.lastVehicleIds

matched = dedupe(matched).slice(0, 2)        // cap comparison at 2 vehicles
```

### 5.3 Step 2 — intent classification (rule-based, Arabic + English)

| Intent → `category` | Trigger keywords (normalized, illustrative) |
|---|---|
| `battery_charging` | شحن، يشحن، بطاريه، كيلوواط، قابس، منفذ، charger, kwh, ac, dc, fast |
| `engine_fuel` | محرك، بنزين، وقود، استهلاك، عزم، حصان، engine, fuel, hybrid, range |
| `maintenance` | صيانه، زيت، فلتر، خدمه، كم كيلومتر، service, oil, filter, interval |
| `safety` | سلامه، تحذير، حادث، وساده هوائيه، فرامل، safety, airbag, warning, abs |
| `trims` | فئه، فئات، مواصفات، اصدار، trim, package, equipment, variant |
| `market` | سعر، الاردن، ضمان، وكيل، توفر، price, jordan, warranty, dealer |
| `profile` / `null` | (no strong signal ⇒ no category filter) |

> Multiple intent hits → keep the highest-priority one for the **hard** filter, but
> prefer the **soft-narrow** fallback (§5.4) so a mis-tagged intent never zeroes out
> retrieval.

### 5.4 Step 3 — chunk retrieval (the query)

- **Query string** `p_query` = `normalizeArabic(message)` (or the top salient
  tokens; full message is fine — `websearch_to_tsquery` tolerates it).
- **Soft-narrow, not hard-filter.** First attempt **with** `p_category`; if it
  returns `0` rows, **retry once with `p_category = null`**. This prevents a wrong
  intent guess from starving an otherwise-answerable question. (Two cheap indexed
  queries worst-case; usually one.)
- **K:** `maxChunks` default 4 for a single vehicle; when `matched.length === 2`,
  request `2` per vehicle (issue per-vehicle or `limit 4` then balance in app).

### 5.5 Step 4 — fallback & no-result behavior (decision table)

| matched vehicles | chunks found | structured cols | → behavior |
|---|---|---|---|
| ≥1 | ≥1 | yes | Full grounded context (structured + chunks + citations). **Best path.** |
| ≥1 | 0 (after soft-narrow) | yes | Structured-only context; note "تفاصيل الوثائق غير متوفرة لهذا السؤال". |
| ≥1 | 0 | no usable cols | `contextText=null`; model answers generally + explicit "غير مؤكد للأردن". |
| 0 (no vehicle) | — | — | `contextText=null`; general EV guidance, no invented specs. |
| (retrieval throws) | — | — | try/catch in `prompt.ts` ⇒ `null`; reply never blocked ([prompt.ts:27-31](lib/ai/prompt.ts#L27-L31)). |

### 5.6 Step 5 — context assembly (token-budgeted)

```
budget ≈ 1.5–2K tokens. Order by ts_rank desc, then:
  «بيانات موثّقة»  → structured summary (estimate facts tagged تقديري)
  «أدلة من الوثائق» → for each chunk (until budget):
       <content, trimmed to ~120 tokens on a sentence boundary>
       [المصدر: {source_ref} ص.{page_ref} — ثقة: {confidence_raw ?? confidence}]
  drop lowest-ranked chunks first when over budget; never split a citation from its text.
```

---

## Part 6 — Confidence rules

Two independent dimensions, surfaced separately so they never get conflated:

### 6.1 Data confidence (per chunk — from the corpus)

Already on every row (`confidence` enum + `confidence_raw` chain). Distribution
today (validation §4.2): `unknown 163 · needs_review 60 · estimate 40 · dealer 10
· owner_reported 1 · official 0`.

### 6.2 Retrieval confidence (per answer — drives the badge + prompt rules)

```
HIGH   : ≥1 retrieved chunk whose confidence ∈ {official, dealer}
         AND ts_rank ≥ τ_high            → "معلومة موثّقة"
MEDIUM : best evidence confidence ∈ {owner_reported, estimate, needs_review}
         OR (chunks found but rank in [τ_low, τ_high))   → "تقديري / يحتاج تحقق"
LOW    : confidence = unknown for all chunks, OR no chunks, OR rank < τ_low
                                          → "غير مؤكد — استشر الوكيل"
```

- Start with `τ_low ≈ 0.02`, `τ_high ≈ 0.10` (tune against the eval set §3.3 D-7;
  `ts_rank` is unbounded-ish but small — calibrate empirically, don't hardcode blindly).
- **Honesty constraint (roadmap §D):** `needs_review` and `official(export)` must
  **never** be presented as Jordan-official. `confidence_raw` is shown verbatim so the
  export→Jordan degradation is visible. Given `official = 0` for Jordan today, **HIGH
  will be rare** — that is correct, not a bug.

---

## Part 7 — Prompt hardening (grounding contract)

Extend `BASE_SYSTEM_PROMPT` ([prompt.ts:11-22](lib/ai/prompt.ts#L11-L22)) with an
explicit, enforceable evidence contract. The model **must**:

1. **Answer primarily from injected evidence.** If the answer isn't in
   «بيانات موثّقة» or «أدلة من الوثائق», say so — do not fill the gap from priors.
2. **Never invent specifications** (numbers, intervals, prices, page refs).
3. **State uncertainty explicitly** when evidence is `estimate`/`needs_review`/absent
   ("هذه القيمة تقديرية" / "غير مؤكدة للسوق الأردني").
4. **Separate fact from estimate** visually: verified facts plainly; estimates
   tagged `تقديري`; missing data named as missing.
5. **Preserve citations** inline exactly as injected — do not fabricate or alter
   `[المصدر: …]` tags.

> These rules are inert without retrieval, and retrieval is dangerous without these
> rules. **Ship §5 and §7 in the same change.**

---

## Part 8 — Citations support (end-to-end contract)

```
Chunk row ──► Citation{ section, sourceRef, sourceFile, pageRef, confidence, confidenceRaw }
   │            (projected by the search RPC, §4.2)
   ▼
RetrievalResult.citations[]  ──► (a) rendered inline in contextText for the model
   │                             (b) attached to AiChatResponse.metadata.citations[]
   ▼
route.ts: persist assistant msg with metadata.citations  (already persists metadata, route.ts:260-269)
   ▼
ChatSidebar: render citation chips + confidence badge  (P1 UI)
```

**Type changes (additive, backward-compatible):** add `citations?: Citation[]` and
`retrievalConfidence?: "HIGH"|"MEDIUM"|"LOW"` to `AiChatResponse.metadata`
([types.ts:55-63](lib/ai/types.ts#L55-L63)). The provider passes them through from
context; no provider-API change.

---

## Part 9 — Performance: hitting added latency < 300 ms

### 9.1 Current latency profile (where time goes today)

| Stage | Typical | Notes |
|---|---|---|
| Pre-flight (rate-limit, validate, budget) | ~5–30 ms | Redis/in-memory ([rate-limit], [cost-control]) |
| Vehicle detection | ~0 ms warm | catalog cached in-process ([catalog-cache.ts:30](lib/vehicles/catalog-cache.ts#L30)) |
| Persist user msg (auth only) | ~30–80 ms | Supabase round-trip; off the anon path |
| **Gemini generation** | **~1.5–6 s** | **Dominant.** Whole response buffered — no streaming ([route.ts:271](app/api/chat/route.ts#L271)). |
| Persist assistant msg | ~30–80 ms | after generation |

> **The real latency story is L3 (no streaming), not retrieval.** Retrieval adds a
> bounded, parallelizable DB hop; streaming is the order-of-magnitude perceived-latency win.

### 9.2 Added-retrieval budget (target < 300 ms, design for < 120 ms warm)

| Cost | Estimate | Mitigation |
|---|---|---|
| Alias load | ~0 ms warm | In-process TTL cache (mirror `catalog-cache.ts`); ~tens of rows. |
| Normalize + intent | < 1 ms | Pure JS, no I/O. |
| FTS RPC round-trip | **~30–120 ms** | GIN index (exists); service-role client = **no cookie parsing**; soft-narrow keeps it usually one query; `LIMIT K` small. |
| Soft-narrow retry | +1 query only on category miss | Bounded to one extra indexed hop. |
| Assembly/trim | < 2 ms | Pure JS. |

**Optimizations (in priority order):**

1. **Service-role direct client** for retrieval — avoids the SSR cookie/session
   path entirely. (Also the C-1 correctness fix — one change, two wins.)
2. **In-process alias cache** (single-flight, TTL) — same pattern already proven for
   the catalog.
3. **Single RPC** returning ranked, projected rows — no N+1, no over-fetch.
4. **Run retrieval concurrently with user-message persistence** where ordering
   allows (`Promise.all`), so the DB hops overlap instead of serialize.
5. **Short-TTL query cache (P2):** key = `hash(normMessage + matchedIds + intent)`
   → cached `RetrievalResult`. Common questions ("كم ساعة شحن السيارة؟") pay ~0 ms.
6. **Co-region** the app and Supabase project to keep the RPC RTT low (verify region
   parity before launch).

### 9.3 Streaming (P1, separate change — biggest perceived win)

Switch `gemini.ts` to `streamGenerateContent` + return a `ReadableStream`/SSE from
the route. Out of scope for the retrieval change itself, but it is the dominant
latency lever and is tracked here so retrieval isn't blamed for perceived slowness.
**Test on the Cloudflare preview, not just `next dev`** (roadmap Part D).

---

## Part 10 — Implementation phases (one-week, single-developer)

### Phase 0 — Load + unblock (½ day) — **prerequisite**
- Apply migration 012 to hosted DB; run `node scripts/ingest-vehicle-knowledge.mjs`;
  verify 274 rows + idempotent re-run (validation §7). **Gated on owner authorization.**

### Phase 1 — Retrieval core (P0, ~2 days) — closes roadmap P0 #3–#6
1. Migration 013 (`vehicle_aliases`) + idempotent seed for the 6 live vehicles.
2. Migration 014 (`search_vehicle_knowledge` RPC).
3. Regenerate / hand-author `vehicle_knowledge` + RPC types (C-2).
4. `normalizeArabic()` (C-3) — shared by matcher, seeder, query builder.
5. `detectIntent()` (C-4).
6. Extend `buildVehicleContextForPrompt` with alias cache + RPC retrieval via
   `createAdminClient` (C-1, C-5); confidence gate; token-budgeted assembly + inline
   citations.
7. Harden `prompt.ts` grounding rules (C-7); thread `citations` into
   `AiChatResponse.metadata` (C-6, §8).
8. Unit tests: normalizer, intent, gate, assembly truncation, fallback table (§5.5).

### Phase 2 — Memory + trust surfacing (P1, ~2 days)
9. Send last N turns to Gemini (fix L3 `contents`); token-budget history; carry-over
   `lastVehicleIds` into retrieval options.
10. Migration 015 `message_feedback` + 👍/👎 UI/endpoint.
11. Citation chips + confidence badge in `ChatSidebar`.
12. Golden eval harness (30–50 Jordan Qs; assert on injected context + confidence
    label; run in vitest/CI) — calibrate `τ_low`/`τ_high` here.

### Phase 3 — Speed + observability (P1→P2, ~1 day)
13. Streaming end-to-end (§9.3).
14. Migration 016 `ai_request_analytics` + coverage-miss report.
15. (P2) query cache, pgvector, personalization — **deferred**.

---

## Part 11 — Risks & tradeoffs

| Risk | Likelihood | Impact | Mitigation / decision |
|---|---|---|---|
| **Anon retrieval silently empty (C-1)** | High if missed | High | Service-role client for retrieval; integration test that asserts non-empty chunks for an **anonymous** request. |
| `alias_norm` drift between JS normalizer and seeded data | Med | High | Single normalizer is source of truth; seed via JS; add a test that re-normalizes every seeded alias and asserts equality. |
| Wrong intent guess starves retrieval | Med | Med | **Soft-narrow** (retry with `category=null`) instead of hard filter (§5.4). |
| FTS misses Arabic morphology/synonyms | Med | Med | `normalizeArabic` + `vehicle_aliases` + `'simple'` config; pgvector closes the long tail (P2). |
| HIGH confidence almost never fires (`official=0`) | High | Low | Expected/honest; badge is the feature. Backfill citations for hot `unknown` chunks (validation §8.3) to lift MEDIUM→HIGH where legitimately Jordan-sourced. |
| Added latency creeps > 300 ms | Low | Med | Single indexed RPC + caches + concurrency; measure with the per-request logger ([provider.ts:44](lib/ai/provider.ts#L44)) — add a `retrievalMs` field. |
| Untyped `.from`/RPC calls rot silently | Med | Med | Regenerate types (C-2); typed RPC wrapper; CI typecheck. |
| Prompt grounding without rules → new hallucinations | Med | High | Ship §5 + §7 together; eval harness (D-7) as the regression guard. |
| Scope creep into "full RAG" before launch | High | High | Hold the line: FTS RAG-lite is the launch bar; vectors/PDFs/personalization are fast-follows (roadmap Part C). |

---

## Part 12 — Final recommendations

1. **Fix C-1 first and prove it.** Retrieval through `createAdminClient`, guarded by
   an integration test that asserts an **anonymous** chat receives grounded chunks.
   Everything else is wasted if anon retrieval returns nothing.
2. **Ship retrieval and prompt-hardening as one change** (§5 + §7). Evidence without
   rules, or rules without evidence, each make the assistant worse.
3. **Make the Arabic normalizer the single source of truth** and back it with a
   normalize-equality test against seeded aliases — this is the quietest, highest-leverage
   correctness risk.
4. **Prefer the SECURITY DEFINER RPC** over inline text-search: parameterized,
   injection-safe, typed, RLS-clean, and forward-compatible with a direct client path.
5. **Soft-narrow on intent** — never let a keyword guess zero out an answerable query.
6. **Treat the eval set (D-7) as a launch dependency, not a nicety** — it is the only
   objective way to calibrate `τ_low/τ_high` and catch grounding regressions.
7. **Streaming is the latency story, not retrieval.** Budget retrieval at < 300 ms
   (achievable < 120 ms warm), then invest the real latency work in streaming (P1).
8. **Defer pgvector/PDF/personalization without guilt** — earn them with the analytics
   and eval data this plan produces.

> **Bottom line:** the corpus is loaded, indexed, and validated; the chat seam is
> clean and isolated. The remaining work is a **bounded, well-scoped bridge** —
> one alias table, one search RPC, an Arabic normalizer, an intent rule-set, a
> retrieval+gate+assembly extension to a single existing function, and a hardened
> prompt — that converts VoltJo from a 6-row lookup behind an Arabic persona into a
> **cited, confidence-graded Jordan EV specialist**, at zero new paid infrastructure
> and within the one-week budget.
