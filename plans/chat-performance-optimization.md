# VoltJo Chat — Performance Optimization Plan

> Target: **TTFT < 1.5s**. Verified against live code 2026-06-24/25.

## The core problem (one sentence)

The user waits the **entire** Gemini generation with zero visible output, then
watches a **cosmetic typewriter replay** the already-complete text — so both
real and perceived latency are maximised instead of minimised.

## Latency budget — current vs target

| Stage | Current | Cause | Target |
|---|---|---|---|
| Auth (`getCurrentUser`) | ~50–150ms | Supabase auth per request | keep |
| Vehicle context DB read | **per-message** `listSupportedVehicles()` | `vehicle-context.ts:85` runs on every message | cache → ~0ms warm |
| Gemini generation (full) | **3–8s** (1024–2048 max tokens) | `generateContent` buffered | first token in 0.5–1.5s via stream |
| Network return | one big JSON | `apiSuccess({message})` | SSE/chunked |
| Client "typing" | **+ up to ~8s** | fake typewriter at 12ms/char on 700+ chars | 0 — render real tokens |
| **Time to first token (perceived)** | **= full gen (3–8s)** | no streaming | **< 1.5s** |

## Root causes (file-referenced)

1. **No server streaming.** `app/api/chat/route.ts:238-276` awaits the whole
   `generateAiChatResponse` then returns one JSON. `lib/ai/providers/gemini.ts:117`
   calls `…:generateContent`, not `…:streamGenerateContent` (Gemini supports SSE).
   `metadata.supportsStreaming:true` is declared but unused (`gemini.ts:29`).
2. **Fake client typewriter.** `components/chat/AssistantTypingText.tsx` +
   `lib/chat/api-client.ts` (awaits full JSON). The animation is pure
   perceived-latency *cost*, not benefit.
3. **Per-message catalog fetch on the hot path.** `lib/ai/prompt.ts:27` →
   `vehicle-context.ts:85` `listSupportedVehicles()` — a DB round-trip before
   generation even for "hi". Small, slow-changing data on the critical path.
4. **Auth + persistence are pre-generation and serial.** Route writes the user
   message to Supabase *before* starting generation (`route.ts:216-235`). Adds a
   DB write to TTFT.

## Optimization plan (ordered by leverage)

### 1. Real streaming end-to-end  ⭐ biggest win — P0
- **Provider**: add `generateChatStream()` to the Gemini provider using
  `streamGenerateContent?alt=sse`, yielding text deltas + a final usage frame.
  Keep `generateChatResponse` for non-streaming callers/health.
- **Route**: add a streaming branch returning a `ReadableStream`
  (`text/event-stream` or NDJSON). Emit: `meta` (conversationId) → `delta`* →
  `done` (usage, status). Preserve all existing guards (rate limit, budget,
  body cap, abort) — they run *before* the stream opens.
- **Persistence**: accumulate deltas server-side; write the assistant row in the
  stream's `flush`/`finally` so DB writes leave the TTFT path.
- **Client**: replace `sendChatMessage` with a streaming reader that appends
  deltas to the placeholder message; **delete the fake typewriter** (render
  tokens as they land). Keep reduced-motion = instant.
- **Expected**: TTFT ≈ Gemini first-token (~0.5–1.2s warm) — meets < 1.5s.

### 2. Cache the vehicle catalog — P1
- Wrap `listSupportedVehicles()` in Next `unstable_cache`/`revalidate` (e.g. 1h)
  or an in-process LRU with TTL. The catalog is ~6 rows and changes rarely.
- Removes a DB round-trip from every message. Warm-path context build → ~0ms.

### 3. Move persistence off the critical path — P1
- Write the **user** message fire-and-forget (don't block generation start) or
  after the stream opens. Write the **assistant** message in stream finalize.
- Conversation creation can return its id in the first `meta` frame.

### 4. Client rendering hygiene — P2
- Memoize `ChatMessage` (`React.memo`) so streaming the last message doesn't
  re-render the whole thread.
- During streaming, append to a string buffer and flush on `requestAnimationFrame`
  to avoid a setState per token.
- Fix auto-scroll (see mobile audit P2-M4): `behavior:"auto"` while streaming,
  pin-to-bottom only when user is near bottom.

### 5. Edge/runtime considerations — P2
- App deploys via OpenNext → Cloudflare Workers. Ensure the streaming route runs
  on an environment that supports `ReadableStream` passthrough (Workers do).
  Confirm Supabase calls in the stream tail don't hold the response open.

## Measurement plan

- Add `requestId` + server timing logs already exist (`lib/ai/observability.ts`);
  extend with `firstTokenMs` once streaming lands.
- Client: mark `performance.now()` at submit and at first delta; log TTFT.
- Manual: throttle to Fast 3G in devtools, confirm first token < 1.5s warm.

## Non-goals for launch

- pgvector RAG (separate; see vehicle-intelligence-architecture.md).
- Multi-provider parallel racing.
- Response caching across users (privacy + low hit rate for personalized advice).
