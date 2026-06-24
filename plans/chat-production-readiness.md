# VoltJo Chat — Production Readiness Audit

> Repository-verified audit of the chat subsystem performed against the live
> code on 2026-06-24/25. Supersedes the chat sections of
> `plans/18-final-delivery-audit-2026-06-22.md`, which is stale: the AI is **no
> longer mock** — there is a real Gemini provider chain
> (`lib/ai/provider.ts`, `lib/ai/providers/gemini.ts`).

## Scope reviewed

`app/assistant/page.tsx`, `app/api/chat/*`, `components/chat/*`,
`lib/ai/*`, `lib/chat/*`, `lib/vehicles/*`, `supabase/migrations/001,009,010,011`.

## Architecture as built (ground truth)

```
/assistant (RSC) ──> <ChatShell> (client, localStorage source of truth)
      │                    │
      │                    ├─ sendChatMessage() ── POST /api/chat (single buffered JSON)
      │                    │         │
      │                    │         ├─ rate limit (Upstash) + body cap + validation
      │                    │         ├─ AI budget / circuit breaker (cost-control)
      │                    │         ├─ write user msg (Supabase, if signed in)
      │                    │         ├─ generateAiChatResponse()
      │                    │         │     └─ buildSystemPrompt() ── buildVehicleContextForPrompt()
      │                    │         │            └─ listSupportedVehicles()  ← DB read PER message
      │                    │         │     └─ Gemini generateContent (NON-streaming)
      │                    │         └─ write assistant msg (Supabase)
      │                    │
      │                    └─ AssistantTypingText  ← fake typewriter AFTER full response
      │
      └─ GET /api/chat/conversations[/id]  ← server CRUD EXISTS but UI never calls it
```

## Findings by priority

Legend: 🔴 P0 launch blocker · 🟠 P1 must-fix · 🟡 P2 important · 🔵 P3 future

### 🔴 P0 — Launch blockers

| ID | Finding | Evidence | Impact |
|----|---------|----------|--------|
| P0-1 | **No streaming.** Route returns one buffered JSON; Gemini uses `generateContent` not `streamGenerateContent`. The "streaming" the user sees is a cosmetic client typewriter that runs *after* the whole answer arrives. | `app/api/chat/route.ts:238`, `lib/ai/providers/gemini.ts:117`, `components/chat/AssistantTypingText.tsx` | TTFT is effectively full generation time (often 3–8s) + animation. Fails the < 1.5s target by a wide margin. Headline UX feels broken. |
| P0-2 | **Model selector is cosmetic / misleading.** UI offers "VoltJo Max", "Gemini 2.5 Pro", "DeepSeek R1" as selectable, but generation ignores `modelId` and always runs the env primary (Gemini). `resolveProviderForModel` is dead code; registry only registers Gemini. | `lib/ai/model-config.ts:29` (uncalled), `lib/ai/registry.ts:18-24`, `lib/ai/model-display.ts:62` (deepseek `comingSoon:false`) | Truthfulness risk at launch: user picks DeepSeek, silently gets Gemini. Either wire routing or mark unbuilt models "قريباً". |
| P0-3 | **Vehicle knowledge is 6 cars, mostly `estimate` confidence.** The assistant's specialization rests on `supported_vehicles`; migrations 010/011 backfilled only 6 vehicles, most with `data_confidence='estimate'` and wide price ranges. | `supabase/migrations/005,010,011`, `lib/vehicles/types.ts:91` | The product promise ("أفضل مساعد للسيارات الكهربائية في الأردن") is thin. See `vehicle-data-gap-analysis.md`. |

### 🟠 P1 — Must fix before launch

| ID | Finding | Evidence | Impact |
|----|---------|----------|--------|
| P1-1 | **Per-message DB round-trip before generation.** `buildVehicleContextForPrompt` calls `listSupportedVehicles()` on every message and filters in memory. Adds DB latency to the critical path of *every* request, even off-topic ones. | `lib/ai/vehicle-context.ts:85`, `lib/ai/prompt.ts:27` | Direct TTFT tax; unnecessary DB load. Cache the catalog (small, slow-changing). |
| P1-2 | **No retry affordance.** A failed assistant message renders red text with no retry button; user must retype. `api-client.ts` does no retry. | `components/chat/ChatMessage.tsx:57-68`, `lib/chat/api-client.ts` | Transient Gemini 503/timeout = dead-end for the user. |
| P1-3 | **Cross-device history not wired.** Full server CRUD exists (`/api/chat/conversations[/id]`) but `ChatShell` reads only `localStorage` and never fetches it. Signed-in users lose history across devices/clears. | `components/chat/ChatShell.tsx:70-83`, `app/api/chat/conversations/route.ts` | Promised feature half-built; data written, never restored. |
| P1-4 | **No markdown rendering.** Assistant text is rendered raw (`whitespace-pre-wrap`); `**bold**`, lists, tables, `#` headings show as literal characters. | `components/chat/ChatMessage.tsx:118-130`, `AssistantTypingText.tsx:28-35` | EV comparisons/spec tables look broken. |
| P1-5 | **Rename uses `window.prompt`.** Blocking native prompt; poor on mobile, not styled, no validation surface. | `components/chat/ChatShell.tsx:148` | Low-quality UX on a core action. |
| P1-6 | **Mobile: conversation delete is hover-only.** Delete trigger is `hidden group-hover:block` — touch devices have no hover, so users cannot delete a single conversation on mobile (only "clear all"). | `components/chat/ChatSidebar.tsx:275` | Functional gap on the primary platform. |

### 🟡 P2 — Important improvements

| ID | Finding | Evidence |
|----|---------|----------|
| P2-1 | Auto-scroll fires `scrollIntoView({behavior:"smooth"})` on every `messages` change incl. each typewriter tick — jank on long answers. | `components/chat/ChatThread.tsx:51-55` |
| P2-2 | No retrieval confidence / citations surfaced. Vehicle context is injected silently; user can't see *which* car data grounded the answer. | `lib/ai/prompt.ts:35-39` |
| P2-3 | Attachments are decorative (`ATTACHMENT_DEMO_NOTICE`) — upload UI exists but file content is never sent to the model. | `lib/chat/constants.ts`, `lib/ai/prompt.ts:41` |
| P2-4 | No empty/error state for "AI not configured" distinct from generic failure; `CONFIG_MISSING` maps to a generic message. | `app/api/chat/route.ts:287` |
| P2-5 | `messages`/`conversations` not virtualized; very long threads re-render fully. | `components/chat/ChatThread.tsx:82` |

### 🔵 P3 — Future

- Streaming token-level cost accounting; per-model usage analytics.
- Server-side RAG via pgvector embeddings (replace substring match).
- Multi-provider routing (DeepSeek for deep analysis, etc.) once keys exist.
- Message-level feedback (👍/👎) to tune prompt/data.

## What is already solid (do not regress)

- **API hardening**: byte caps, pre-parse + per-actor rate limits, AI budget +
  circuit breaker, abortable timeouts combining client disconnect + deadline
  (`app/api/chat/route.ts`, `lib/ai/cost-control.ts`, `lib/server/timeout.ts`).
- **Provider fallback chain** with correct error classification and selective
  fallback (`lib/ai/provider.ts`).
- **Prompt-injection hygiene** — user content fenced and marked untrusted
  (`lib/ai/prompt.ts:20-22`).
- **Sidebar is already a proper mobile slide-drawer** with safe-area insets
  (`components/chat/ChatSidebar.tsx:147-153`).
- **iOS zoom-safe composer** (16px input font), bottom-sheet model selector with
  safe-area padding (`components/chat/ChatComposer.tsx:278,422`).
- **Reduced-motion respected** in the typewriter.

## Production readiness score (chat subsystem)

| Dimension | Score | Note |
|---|---|---|
| Functionality | 6/10 | Works end-to-end; streaming + model truthfulness + history retrieval missing |
| Performance (perceived) | 4/10 | Buffered + fake typewriter defeats TTFT |
| Mobile UX | 7/10 | Strong drawer/composer; touch-delete + rename gaps |
| Reliability / error handling | 7/10 | Great server guards; no client retry |
| Knowledge depth | 5/10 | 6 vehicles, estimate-grade |
| Security / abuse | 9/10 | Best-in-class for this stage |
| **Overall** | **6.0/10** | Solid foundation; 3 P0s gate a confident launch |

See companion docs: `chat-performance-optimization.md`,
`chat-mobile-ux-audit.md`, `model-routing-strategy.md`,
`vehicle-intelligence-architecture.md`, `vehicle-data-gap-analysis.md`.
