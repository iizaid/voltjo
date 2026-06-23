# VoltJo AI Provider Architecture

Production multi-provider AI subsystem. The mock provider has been fully removed;
every request is served by a real provider (Gemini today).

## Architecture

```
POST /api/chat
  → rate limit (Upstash) → validate → persist user message (RLS)
  → generateAiChatResponse(request, { actor, requestId })       [lib/ai/provider.ts]
       ├─ assertAiConfigured()        fail-fast if key missing   [lib/ai/config.ts]
       ├─ buildSystemPrompt()         Jordan persona + vehicle context + injection guard
       │                                                          [lib/ai/prompt.ts]
       ├─ assertResolvableProvider()  primary + fallbacks         [lib/ai/registry.ts]
       └─ for each provider in chain:
              provider.generateChatResponse()  ── REST fetch ──▶ Gemini API
                 timeout (AbortController) · retries w/ backoff · error classify
                                                                  [lib/ai/providers/gemini.ts]
       └─ logAiRequest()  structured JSON: latency, attempts, usage
                                                                  [lib/ai/observability.ts]
  → persist assistant message (RLS) → return

GET /api/health/ai            → provider config + health snapshot (no secrets)
GET /api/chat/conversations   → list user conversations (RLS)
GET/PATCH/DELETE /api/chat/conversations/[id] → messages / rename / delete (RLS)
```

Error taxonomy lives in `lib/ai/errors.ts` (`AiError` + `AiErrorCode`): provider
failures normalize to `AUTH | RATE_LIMIT | QUOTA | TIMEOUT | UPSTREAM | BAD_REQUEST
| SAFETY | EMPTY | CONFIG_MISSING | UNKNOWN`, each mapped to a user-safe Arabic
message and an HTTP status. Fallback only triggers on provider-side codes.

## Adding a new provider (4 steps)

1. **Add the key mapping** in `lib/ai/config.ts` → `PROVIDER_ENV_KEYS`
   (the id already exists in `AiProviderId` for openai/kimi/deepseek/anthropic).
2. **Create** `lib/ai/providers/<name>.ts` implementing the `AiProvider` interface
   (`metadata`, `isConfigured`, `generateChatResponse`, `healthCheck`). Copy
   `gemini.ts` as the template — timeout/retry/error-classification included.
3. **Register** it: add one line to `REGISTRY` in `lib/ai/registry.ts`.
4. **Set the key** (e.g. `OPENAI_API_KEY`). Done — selection, fallback, health,
   and logging all pick it up automatically.

To make it the primary: set `AI_PROVIDER=<id>`. Any other configured providers
become automatic fallbacks.

## Environment variables (all server-only — never NEXT_PUBLIC_*)

| Var | Required | Purpose |
|---|---|---|
| `AI_PROVIDER` | no (default `gemini`) | Primary provider id |
| `GOOGLE_AI_API_KEY` | **yes** (for Gemini) | Gemini key (`AIza...` from aistudio.google.com) |
| `OPENAI_API_KEY` / `KIMI_API_KEY` / `DEEPSEEK_API_KEY` / `ANTHROPIC_API_KEY` | optional | Enable as fallbacks once a provider file is registered |
| `AI_MODEL` | optional | Override the provider default model |
| `AI_TIMEOUT_MS` | optional (30000) | Per-request upstream deadline |
| `AI_MAX_RETRIES` | optional (2) | Retries on retryable upstream errors |

In production, set keys as **Cloudflare Runtime secrets**, not in the repo.

## Design choices

- **REST fetch, no SDK** — runs unchanged on Cloudflare Workers / Node / edge,
  no bundle bloat, no vendor lock-in (Phase 7 requirement), full control of
  timeout/retry/error semantics.
- **Non-streaming** to match the current client contract (`ChatShell` replaces an
  optimistic placeholder with the full reply). `metadata.supportsStreaming` is
  declared per provider so streaming can be added without an interface change.
