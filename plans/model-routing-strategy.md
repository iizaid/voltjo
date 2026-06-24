# VoltJo — Model Orchestration & Routing Strategy

> Verified against `lib/ai/registry.ts`, `lib/ai/config.ts`,
> `lib/ai/model-config.ts`, `lib/ai/model-display.ts` on 2026-06-24/25.

## Current state (ground truth) — and the gap

- **UI** offers 5 models (`model-display.ts`): VoltJo Max (recommended),
  Gemini 2.5 Pro, DeepSeek R1 — all `comingSoon:false` (selectable) — plus Kimi
  and NVIDIA (`comingSoon:true`).
- **Branding map** `MODEL_PROVIDER_MAP` (`model-config.ts:17`) maps voltjo→qwen,
  deepseek→deepseek, etc.
- **Registry** (`registry.ts:18`) registers **only Gemini**. Others are commented
  out.
- **Generation** (`provider.ts` + `route.ts`) selects the provider from
  **`getAiConfig()`** (env), **ignoring `modelId` entirely**.
  `resolveProviderForModel` is **never called** (dead code).

**Net effect:** whatever the user picks — VoltJo Max, Gemini, or DeepSeek — the
backend runs Gemini. This is a **truthfulness defect**, not just missing
features.

## Two honest paths for launch

### Path A (recommended for week-1): "VoltJo Max" only, truthfully
- Keep **one** selectable model, "VoltJo Max", powered by Gemini under the hood
  (branding is legitimate as long as we don't *name* a different model the user
  isn't getting).
- Mark Gemini/DeepSeek/Kimi/NVIDIA as `comingSoon:true` so the selector never
  promises an engine that routes elsewhere.
- Zero backend risk; closes P0-2 immediately. (This is the fix implemented now.)

### Path B (post-launch): real multi-model routing
Wire `resolveProviderForModel` into the generation path and register real
providers. Strategy below.

## Intelligent routing strategy (Path B design)

### Routing signals
1. **Explicit user choice** (model selector) — honored first when that provider
   is registered + configured.
2. **Task class** (from the intent layer in vehicle-intelligence-architecture):
   - `quick_fact` / `general` → **Gemini Flash** (fast, cheap, good Arabic).
   - `deep_analysis` / `comparison` / `ownership ROI` / `thinkingMode=true` →
     **DeepSeek R1** (strong reasoning) — fall back to Gemini Pro.
   - `long_context` (big attachments, long threads) → **Kimi** (extended context).
3. **Health + budget**: skip any provider that's unhealthy
   (`healthCheckAll`) or whose budget bucket is exhausted (cost-control).
4. **Fallback chain**: already implemented in `provider.ts` — selective fallback
   on UPSTREAM/RATE_LIMIT/QUOTA/TIMEOUT/EMPTY. Reuse as-is.

### Decision table

| Condition | Primary | Fallback |
|---|---|---|
| `thinkingMode` OR comparison/ROI intent | DeepSeek R1 | Gemini Pro → Gemini Flash |
| Long context / large attachment | Kimi K2 | Gemini Pro |
| Default / quick question | Gemini Flash | Gemini Pro |
| User explicitly picked model X (configured) | X | task-default chain |
| Provider unhealthy or over budget | next in chain | … |

### "VoltJo Max" semantics (Path B)
VoltJo Max becomes a **meta-router**, not a fixed model: it applies the decision
table automatically (best engine per task). Users never see the underlying model
— consistent with the `server-only` branding boundary already enforced
(`model-config.ts` is `server-only`).

## Implementation requirements for Path B

1. Register real providers in `registry.ts` (DeepSeek, Kimi, …) implementing the
   `AiProvider` interface (the Gemini provider is the template).
2. Set their env keys (already named in `config.ts:PROVIDER_ENV_KEYS`).
3. In `generateAiChatResponse`, build the chain from
   `resolveProviderForModel(request.modelId)` (+ task class) **instead of** pure
   env config — *or* keep env as the override and add a model-aware selection
   helper. This is the one wiring change that activates routing.
4. Per-provider cost weights in cost-control (token prices differ).
5. Streaming parity: each provider needs `generateChatStream` (see perf doc).

## Cost & latency guardrails (carry over)

- Daily budget + global circuit breaker already exist (`cost-control.ts`) — make
  the ceiling **per-provider** in Path B.
- Per-request deadline (45s route / 30s provider) already combines client
  disconnect + timeout — keep.

## Recommendation

Ship **Path A** now (truthful single model), design **Path B** behind it. The
routing table above is the target once ≥2 providers are funded and registered.
