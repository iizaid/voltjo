# VoltJo — Production AI Knowledge Architecture & Roadmap

> **Role:** Lead Architect / Product Owner
> **Date:** 2026-06-25
> **Status:** Design + roadmap only. **No code implemented.**
> **Verified against:** `lib/ai/*`, `app/api/chat/route.ts`, `lib/vehicles/*`,
> `supabase/migrations/005,010,011`, `public/cars/**`, `package.json`.
> **Companion docs:** `plans/vehicle-intelligence-architecture.md`,
> `plans/vehicle-data-gap-analysis.md`. This file is the **build spec**; those are background.

---

## Part A — Current State (Audit Summary)

### A.1 Current AI architecture (one paragraph)

VoltJo runs a **single-call, stateless, structured-lookup assistant.** Each user
message triggers one Gemini 2.5 Flash REST call. The system prompt is a fixed
Arabic persona plus — when the message happens to contain a known vehicle name —
a fenced block of **structured database columns** for up to **2** vehicles. There
is a clean provider-abstraction with fallback chains (`lib/ai/registry.ts`), cost
breakers (`lib/ai/cost-control.ts`), rate limiting, and abortable timeouts, but
**only Gemini is registered**, there is **no streaming**, **no retrieval over
documents**, and **no conversation memory sent to the model.**

### A.2 How the chat system works end-to-end (ground truth)

```
POST /api/chat                                         app/api/chat/route.ts
  1. getClientIp + requestId
  2. content-length cap (12 KB)                         route.ts:75-88
  3. rate limit "chat-preparse" (IP, 60/10min)          route.ts:90-115
  4. read body (byte-limited) + validate                route.ts:117-151
  5. getCurrentUser → rate limit "chat" (user 30 / anon 10)  route.ts:153-174
  6. checkAiBudget (daily budget + circuit breaker)     route.ts:178-190
  7. if user: create/find conversation, persist USER msg  route.ts:196-236
  8. generateAiChatResponse(validation.data, {actor, requestId, signal})
        a. assertAiConfigured + resolveProviderChain()   provider.ts:24-25
        b. buildSystemPrompt(request)                    prompt.ts:25
              - buildVehicleContextForPrompt(message)    vehicle-context.ts:82
                  · normalize message
                  · getCachedVehicleCatalog() (6 rows)
                  · substring token match → top 2        vehicle-context.ts:87-97
                  · stringify STRUCTURED columns only     vehicle-context.ts:15-73
              - fence context as «بيانات سيارات موثّقة»   prompt.ts:35-39
              - append attachment note + mode hint        prompt.ts:41-51
        c. walk provider chain (Gemini only)             provider.ts:38-86
              - gemini.generateChatResponse()
                  · buildRequestBody:
                      contents = [{role:"user", parts:[message]}]  gemini.ts:49-58
                      ❗ NO history, NO prior turns
                  · fetch generateContent (retries+backoff)  gemini.ts:101
                  · extract text + usage                    gemini.ts:60-78
  9. recordAiUsage(tokens)                                route.ts:253-258
 10. if user: persist ASSISTANT msg                       route.ts:260-269
 11. return { message, conversationId } (whole, NOT streamed)  route.ts:271-276
```

**Three structural limits, each verified in code:**
- `buildSystemPrompt` only sees `request.message` (`prompt.ts:25-28`) — no profile, no history.
- Gemini payload is a **single user turn** (`gemini.ts:49-58`) — multi-turn memory is persisted to Postgres but **never sent to the model**.
- Retrieval is **substring containment**, top-2, **structured columns only** (`vehicle-context.ts:87-99`).

### A.3 Knowledge assets — used vs ignored

| Asset | Location | Reaches the model? |
|---|---|---|
| `supported_vehicles` structured columns | DB (6 rows) | ✅ Used (top-2) |
| `vehicle_cost_profiles` | DB | ✅ Used |
| `summary_ar`, `jordan_notes_ar`, strengths/weaknesses, tags | DB | ✅ Used |
| **Manuals analysis** (`01 - Manuals/*.md`) | `public/cars/**` | ❌ Ignored |
| **Specs analysis** (`02 - Specs/*.md`) | `public/cars/**` | ❌ Ignored |
| **Jordan Market notes + sources** (`03 -*`) | `public/cars/**` | ❌ Ignored |
| **AI Data**: battery-and-charging, engine-and-fuel, **maintenance**, **safety-and-warnings**, vehicle-profile, ai-context-summary, unresolved-questions (`04 -*`) | `public/cars/**` | ❌ Ignored |
| **Trims**: trim-matrix, trim-equivalence, trims (`05 -*`) | `public/cars/**` | ❌ Ignored |
| 2 PDFs (`*-source-alias.pdf`) | `public/cars/01/**` | ❌ Ignored |
| Conversation history | DB (chat_messages) | ❌ Not sent |
| User profile / onboarding answers | DB | ❌ Not used |
| `charging_locations` | DB (**likely empty — no seed migration**) | Map page only |

> **The orphaned-knowledge problem:** ~76 Markdown files of cited, page-referenced,
> confidence-graded EV knowledge exist on disk and are **100% invisible at inference.**
> Fixing this is the entire thesis of this roadmap.

### A.4 Files vs Supabase — coverage matrix & missing data

**Corpus:** 12 vehicle folders. Only **3 are deeply built** (full 5-folder structure):
`01 BYD Song Plus DM-i`, `02 BYD Song Pro DM-i`, `03 BYD Sealion 05 DM-i`. The other
**9 are README + trims stubs**. **Database:** 6 vehicles, all `data_confidence='estimate'`.

| Vehicle | Deep docs | In DB | DB specs | Note |
|---|---|---|---|---|
| BYD Song Plus DM-i 2025 | ✅ | ✅ | battery/range/price filled | Best overlap; docs still unused |
| BYD Song Pro DM-i 2025 | ✅ | ✅ | price NULL | Rich docs, thin DB |
| BYD Sealion 05 DM-i 2025 | ✅ | ✅ | most NULL | Rich docs, near-empty DB |
| Tesla Model 3 2025 | ❌ stub | ✅ | filled (estimate) | DB-only, uncited |
| Toyota RAV4 Hybrid 2025 | ❌ stub | ✅ | sparse (HEV) | DB-only |
| Dongfeng Mage PHEV 2026 | ❌ stub | ✅ | low-conf NULL | Weakest |
| Tesla Model Y, Qin Plus, Yuan Plus/Atto 3, Changan Eado, Deepal S07, Hyundai Kona | ❌ stub | ❌ | — | Neither |

**Missing data classes (in files but NOT in DB → unreachable):** charging curve/behavior,
maintenance intervals (page-cited), HV-safety/warnings, trim differences, trim equivalence
(China↔EU↔AU↔Jordan), tire specs/pressure, per-fact source citations & confidence.
**Missing everywhere:** Jordan warranty terms, equipment packages, fault/error codes,
maintenance how-to procedures, charging-station rows.
**Inversion to fix first:** the two richest-documented cars (Song Pro, Sealion 05) have the
emptiest DB rows; the DB-only cars (Tesla, RAV4, Dongfeng) have no source docs.

---

## Part B — Target Architecture (Solo-Developer, Production-Ready)

**Design constraint:** this is a **one-person Jordan EV platform**, not Perplexity.
Every decision optimizes for *low fixed cost, low operational burden, runs unchanged
on Cloudflare Workers, and reuses the already-collected corpus.* No microservices, no
vector DB cluster, no scraping pipeline, no fine-tuning.

### B.1 The eleven required design decisions

| Question | Decision | Why (solo-dev lens) |
|---|---|---|
| **Give AI the full manuals?** | **Yes — but via distilled, chunked Markdown, not raw PDFs.** Ingest `04 - AI Data` + `05 - Trims` (and later `01/02`) into a `vehicle_knowledge` table; retrieve top-K chunks per query. | The corpus already distills the manuals with page citations. Feeding raw manuals = huge tokens + parsing pain for near-zero extra accuracy. |
| **Implement RAG?** | **Yes — "RAG-lite" (keyword/FTS first).** Retrieve cited chunks and inject them. | RAG is the only way the document knowledge reaches the model. But start with Postgres full-text search, not embeddings. |
| **Use pgvector?** | **Not at launch (P2).** Add it later for fuzzy recall once FTS proves the loop. | Supabase supports pgvector natively (low infra), but it adds an embed pipeline + per-doc cost + ongoing API dependency. Earn it with eval data. |
| **PDF ingestion?** | **Deferred (P2).** Only 2 placeholder PDFs exist and Markdown already covers them with page refs. | Parse PDFs only when a manual has no Markdown digest. Avoid the parsing/OCR rabbit hole pre-launch. |
| **Document chunking?** | **Heading-based (`##` sections), 1 chunk per section, ~200–500 tokens.** Carry `section`, `source_ref`, `page`, `confidence`. | The Markdown is already authored as labeled sections with source lines — chunking is essentially free and citation-preserving. |
| **Generate embeddings?** | **P2 only**, batch via Gemini `text-embedding-004` (free tier-friendly) → `vector(768)`. Embed once at ingest, store in DB. | Zero per-query embed cost for documents; only embed the user query at request time. Batch + idempotent. |
| **Citations?** | **Yes (P1).** Each chunk row stores `source_ref`/`page`/`confidence`; the context builder emits `[المصدر: S5 ص.209 — ثقة: official(EU)→needs_review]`; the API returns a `citations[]`; UI renders chips. | The data is already structured for this. It's the #1 differentiator vs ChatGPT. |
| **Confidence scoring?** | **Two layers:** (1) **data confidence** from existing `confidence` grades, surfaced as a badge; (2) **retrieval confidence** = match score; below threshold → "answer generally + say data unverified." | Reuses existing grades; cheap; directly attacks hallucination. |
| **Keep responses fast?** | **Stream tokens** (Gemini supports it), **cache the catalog** (already done), **semantic/answer cache for common Qs (P2)**, **token-budget the context** so prompts stay small. | Perceived latency is dominated by no-streaming today. Streaming is the biggest single UX win. |
| **Keep infra cost low?** | **Postgres-only retrieval (no vector infra at launch)**, Gemini Flash (cheap), cost breaker already in place, embeddings deferred + free-tier, answer cache later. | Marginal query cost ≈ one Flash call. No new paid infra to launch. |
| **Avoid hallucinations?** | **Grounding + gating + labeling:** inject only retrieved facts; label `estimate` facts `تقديري`; hard rule "if not in context, say unknown"; retrieval-confidence gate; surface citations so gaps are visible. | Defense in depth. The prompt already forbids invention (`prompt.ts:16-17`); grounding makes that enforceable. |

### B.2 Exact database tables to add

```sql
-- Migration 012: document knowledge base (the bridge)
create table public.vehicle_knowledge (
  id            uuid primary key default gen_random_uuid(),
  vehicle_id    uuid not null references public.supported_vehicles(id) on delete cascade,
  category      text not null,        -- 'battery_charging'|'maintenance'|'safety'|'engine_fuel'|'trims'|'profile'|'market'
  section       text not null,        -- the '##' heading, e.g. 'Engine oil & oil filter'
  content       text not null,        -- the chunk body (Arabic/English mix as authored)
  source_ref    text,                 -- e.g. 'S5'
  source_file   text,                 -- e.g. 'BYD-Seal-U-DMi-Owner-Manual-EU-source-alias.pdf'
  page_ref      text,                 -- e.g. '209' or '208,210'
  market        text default 'jordan',
  confidence    text not null default 'estimate'
                  check (confidence in ('official','dealer','owner_reported','estimate','needs_review','unknown')),
  content_hash  text not null,        -- sha256(content) → idempotent upsert + change detection
  tsv           tsvector,             -- generated; see index below
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (vehicle_id, category, section)
);

-- Full-text search index (Arabic-friendly: 'simple' avoids English stemming pitfalls)
create index vehicle_knowledge_tsv_idx on public.vehicle_knowledge using gin (tsv);
create index vehicle_knowledge_vehicle_idx on public.vehicle_knowledge (vehicle_id);
create index vehicle_knowledge_category_idx on public.vehicle_knowledge (category);
-- tsv maintained by trigger: to_tsvector('simple', coalesce(section,'')||' '||content)

-- Migration 013: alias resolution (fix brittle matching without ML)
create table public.vehicle_aliases (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references public.supported_vehicles(id) on delete cascade,
  alias       text not null,          -- 'atto 3','يوان بلس','seal u','سيل يو','song plus'
  alias_norm  text not null,          -- normalized (lowercase, diacritics stripped, alef/ta-marbuta unified)
  lang        text not null default 'ar' check (lang in ('ar','en')),
  unique (vehicle_id, alias_norm)
);
create index vehicle_aliases_norm_idx on public.vehicle_aliases (alias_norm);

-- Migration 014: answer-quality feedback loop
create table public.message_feedback (
  id              uuid primary key default gen_random_uuid(),
  message_id      uuid references public.chat_messages(id) on delete cascade,
  conversation_id uuid references public.chat_conversations(id) on delete cascade,
  user_id         uuid references auth.users(id) on delete set null,
  rating          smallint not null check (rating in (-1, 1)),
  reason          text,
  injected_context jsonb,             -- what facts/citations were shown (for offline eval)
  created_at      timestamptz not null default now()
);
-- RLS: a user may insert/select only their own feedback (mirror chat_messages policies).

-- Migration 015 (P1): AI request analytics (coverage-miss detection)
create table public.ai_request_analytics (
  id             uuid primary key default gen_random_uuid(),
  request_id     uuid not null,
  user_id        uuid references auth.users(id) on delete set null,
  matched_vehicle_slugs text[] not null default '{}',
  retrieved_chunk_ids   uuid[] not null default '{}',
  had_context    boolean not null,    -- false ⇒ a coverage hole to fill
  intent         text,                -- 'spec'|'cost'|'charging'|'maintenance'|'safety'|'compare'|'buy'|'other'
  latency_ms     integer,
  token_total    integer,
  created_at     timestamptz not null default now()
);

-- Migration 016 (P2, optional): semantic search
-- create extension if not exists vector;
-- alter table public.vehicle_knowledge add column embedding vector(768);
-- create index vehicle_knowledge_embedding_idx on public.vehicle_knowledge
--   using hnsw (embedding vector_cosine_ops);
```

### B.3 Exact migration plan (sequence & safety)

| # | Migration | Type | Safe? | Notes |
|---|---|---|---|---|
| 012 | `vehicle_knowledge` + GIN/tsv | additive | ✅ | New table, no touch to existing data. Populated by build script, not SQL. |
| 013 | `vehicle_aliases` | additive | ✅ | Seed with an idempotent INSERT block per vehicle. |
| 014 | `message_feedback` + RLS | additive | ✅ | FK to existing `chat_messages`; mirror existing RLS. |
| 015 | `ai_request_analytics` | additive | ✅ | Write-only from server; no RLS needed if service-role-only. |
| 016 | pgvector + `embedding` col | additive | ✅ (P2) | `create extension vector` first; HNSW index. Backfill via batch embed script. |

**Ingestion is a build script, not a migration** —
`scripts/ingest-vehicle-knowledge.mjs` (idempotent, run on deploy):
1. Walk `public/cars/*/04 - AI Data/*.md` and `*/05 - Trims/*.md`.
2. Map folder→`vehicle_id` (via slug match), filename→`category`.
3. Split each file on `##` headings → one chunk per section.
4. Parse the existing `- source: … · page: … · confidence: …` lines into columns.
5. Compute `content_hash`; **upsert** on `(vehicle_id, category, section)`; skip unchanged.

### B.4 Exact retrieval flow

```
buildVehicleContextForPrompt(message, history?)        lib/ai/vehicle-context.ts (extended)
 1. normalizeArabic(message)         ← strip diacritics, unify ا/أ/إ/آ and ة/ه, lowercase
 2. Entity resolution:
      a. exact alias match (vehicle_aliases.alias_norm contained in message)  ← high conf
      b. fallback token match on catalog name (current logic)
      c. carry-over: if none, reuse last vehicle from `history` (multi-turn subject)
 3. Intent tag (rule-based keywords):
      'صيانة|زيت|فلتر' → maintenance ; 'شحن|كم ساعة|بطارية' → charging/battery ;
      'سلامة|تحذير' → safety ; 'سعر|كم سعرها' → cost ; 'مقارنة|أفضل' → compare ; else → general
 4. Structured facts: getSupportedVehicleBySlug(matched) → existing summary (cols + cost profiles)
 5. Document chunks (NEW):
      SELECT id, section, content, source_ref, page_ref, confidence
      FROM vehicle_knowledge
      WHERE vehicle_id = ANY(matched)
        AND (intent IS NULL OR category = intent)        -- narrow by intent when known
        AND tsv @@ websearch_to_tsquery('simple', :query)
      ORDER BY ts_rank(tsv, query) DESC
      LIMIT K   (K = 4 single-vehicle, 2 per vehicle when comparing)
 6. Confidence gate:
      if NO structured match AND NO chunks → mark context = null (model answers generally + disclaims)
 7. Assemble context block (token-budgeted, ~1.5–2K tokens max):
      «بيانات موثّقة» → structured facts (estimate facts tagged تقديري)
      «تفاصيل» → each chunk + inline citation [المصدر: S5 ص.209 — ثقة: official(EU)→needs_review]
 8. Return { contextText, citations[], retrievalConfidence }
```

### B.5 Exact AI request flow (target)

```
POST /api/chat
  (steps 1–7 unchanged: limits, validation, auth, budget, persist user msg)
  8. Load last N turns (e.g. 6) for the conversation                ← NEW (memory)
  9. ctx = buildVehicleContextForPrompt(message, history)           ← NEW (RAG-lite)
 10. systemPrompt = persona + ctx.contextText + confidence/disclaim rules
 11. gemini.streamChatResponse({                                    ← NEW (streaming)
        systemInstruction: systemPrompt,
        contents: mapHistory(history) ++ [currentUserTurn]          ← NEW (history sent)
     })
 12. stream tokens to client (SSE / ReadableStream)
 13. on completion: recordAiUsage, persist assistant msg (+ ctx.citations in metadata),
     write ai_request_analytics row (had_context, intent, matched slugs, chunk ids)
 14. client renders answer + citation chips + confidence badge + 👍/👎 → message_feedback
```

---

## Part C — Prioritized Roadmap

### P0 — Mandatory before launch
1. **Verify/seed `charging_locations`** (no seed migration exists) — or hide the map.
2. **Migration 012 `vehicle_knowledge`** + `scripts/ingest-vehicle-knowledge.mjs`
   (chunk `04 - AI Data` + `05 - Trims`, carry source/page/confidence).
3. **Migration 013 `vehicle_aliases`** + Arabic-normalizing matcher in `vehicle-context.ts`.
4. **Keyword (FTS) retrieval** of chunks merged into the context block, intent-filtered.
5. **Send conversation history to Gemini** (fix `gemini.ts` `contents`; token-budget it).
6. **Per-fact confidence labeling** (`تقديري`) + hardened "if-not-in-context-say-unknown".
7. **Seed top-8 Jordan vehicles**; promote Song Pro / Sealion 05 specs from their AI Data files.

### P1 — High value (week 1–2)
8. **Streaming responses** end-to-end (Gemini `streamGenerateContent`).
9. **Citations in UI** (source/page chips) + **confidence badges** from response metadata.
10. **Migration 014 `message_feedback`** + 👍/👎 UI + endpoint.
11. **Golden eval harness** (30–50 Jordan questions; assert on injected context, run in `vitest`/CI).
12. **Migration 015 `ai_request_analytics`** + a tiny coverage-miss report.

### P2 — Future improvements
13. **TCO / ownership-cost simulator** (reuses maintenance intervals + cost profiles).
14. **Migration 016 pgvector** + batch Gemini embeddings for fuzzy recall.
15. **Personalization**: inject onboarding/profile into the prompt.
16. **Semantic answer cache** for common questions.
17. **Register a 2nd live provider** for real fallback.
18. **PDF ingestion** for any manual lacking a Markdown digest.

---

## Part D — Risks & Tradeoffs

| Risk / tradeoff | Likelihood | Impact | Mitigation / decision |
|---|---|---|---|
| Corpus is EU-manual-derived (`needs_review (Jordan)`) | High | Med | Surface confidence honestly; the badge *is* the feature. Never present `needs_review` as Jordan-official. |
| FTS misses Arabic morphology / synonyms | Med | Med | `vehicle_aliases` + `'simple'` config + query normalization; pgvector (P2) closes the long tail. |
| Sending history inflates tokens/cost | Med | Med | Cap to N turns + token budget; cost breaker backstops spend. |
| Adding pgvector now = premature infra + embed cost | — | — | **Tradeoff taken: defer to P2.** FTS first; earn vectors with eval data. |
| Raw-PDF ingestion = parsing/OCR sink | Med | Med | **Tradeoff taken: defer.** Use the existing Markdown digests; PDFs only when no digest exists. |
| Charging map empty at launch | Med | High | Day-1 verify; seed curated set or hide the feature. |
| Streaming on Cloudflare Workers edge cases | Med | Med | Test on the Cloudflare preview, not just `next dev`. |
| Scope creep into "full RAG" before launch | High | High | Hold the line: keyword RAG-lite is the launch bar; vectors/PDFs/personalization are fast-follows. |
| Solo-dev bandwidth over the week | High | High | P0 = launch line; P1/P2 = post-launch. |
| Stale chunks after corpus edits | Low | Med | `content_hash` upsert + re-run ingest on deploy detects changes idempotently. |

---

## Part E — Final Recommendation

Ship the **RAG-lite bridge**: one ingestion migration + one chunking script + a
keyword-retrieval extension turns the orphaned, already-cited corpus into a
grounded, confidence-graded knowledge base — at **zero new paid infrastructure**
and on a one-week, single-developer budget. Add conversation memory and streaming
for trust and speed; defer pgvector, PDFs, and personalization to P2 without guilt.

> **Bottom line:** VoltJo's knowledge already exists in `public/cars/**`; it just
> never reaches the model. Build the bridge (tables 012–014 + retrieval flow B.4 +
> request flow B.5), and VoltJo becomes a cited, Jordan-specific EV expert that
> ChatGPT cannot replicate — instead of a 6-row lookup table behind an Arabic persona.