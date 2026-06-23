# Plan: AI Provider Integration

**Priority:** P0 (if a working assistant is in launch scope) · **Effort:** M (3–5 days) · **Risk:** High

## Feature overview
Replace the mock AI provider with a real LLM provider behind the existing
`AiProvider` abstraction. Today `lib/ai/provider.ts` returns `mockProvider` for
every `AI_PROVIDER` value; `lib/ai/providers/mock.ts` emits canned Arabic text.

## Business goal
Make "المساعد الذكي" genuinely useful so it can be the product's differentiator,
without exposing VoltJo to runaway cost, abuse, or unsafe answers.

## User stories
- As a buyer, I ask about a specific EV and get an accurate, Jordan-aware answer.
- As a buyer, I attach a spec sheet and the assistant reasons over it.
- As the operator, I cap spend per user/day and disable the feature instantly.

## Functional requirements
- Implement a real provider (recommended default: latest Claude model) conforming
  to `AiProvider.generateChatResponse`.
- Route by `AI_PROVIDER`; keep `mock` as an explicit fallback for previews.
- Inject vehicle context from `lib/ai/vehicle-context.ts` into the system prompt.
- Support thinking vs fast mode mapping to model params.
- Stream tokens to the client (progressive render in `ChatShell`).

## Non-functional requirements
- p95 first-token < 2s; full answer < 12s.
- Per-user and per-IP rate limits (reuse `lib/server/rate-limit.ts`).
- Hard per-request token cap and per-user daily budget.
- Graceful degradation to a typed error (never a crash) on provider failure.

## Database requirements
- Reuse `chat_conversations` / `chat_messages` (already present).
- Add `token_usage` columns or a `chat_usage` table for cost accounting.

## API requirements
- `POST /api/chat` already exists and validates input — extend to:
  - call the real provider, stream the response,
  - record token usage, enforce budget, return typed errors.

## UI requirements
- Streaming message rendering, stop button, retry on failure (placeholder/fail
  states already exist in `conversation-utils.ts`).
- Clear model/provider label in message metadata.

## UX flow
1. User sends message → optimistic placeholder.
2. Server validates → checks budget/rate limit → streams tokens.
3. Client renders incrementally → marks done; persists server-side.
4. On error → failed state + retry.

## Validation rules
- Reject empty/over-length messages (existing `lib/ai/validation.ts`).
- Validate attachment type/size before forwarding.

## Security considerations
- API keys server-only (never `NEXT_PUBLIC_*`).
- Prompt-injection hardening on attachment/user content.
- Output safety guardrails; no medical/legal/financial guarantees.
- Log without storing secrets or full PII.

## Edge cases
- Provider timeout/5xx → retry-once then typed error.
- Budget exhausted → friendly "limit reached" message.
- Attachment unparseable → answer without it, note the limitation.

## Error handling
- Centralize via `lib/server/api-response.ts`; map provider errors to safe codes.

## Loading states
- Streaming indicator; thinking-mode skeleton.

## Empty states
- First-visit assistant intro (exists) retained.

## Acceptance criteria
- With a real key set, two different questions yield two different, on-topic answers.
- Budget cap blocks the N+1 request with a clear message.
- With `AI_PROVIDER=mock`, behavior is unchanged (preview safety).

## Testing requirements
- Unit: provider selection, budget math, validation.
- Integration: `/api/chat` happy path + timeout + budget-exceeded.
- Manual: Arabic answer quality review by a human.

## Rollout checklist
- [ ] Decide scope: real AI **or** relabel as "demo assistant" for launch.
- [ ] Add provider key to Cloudflare secrets (not committed).
- [ ] Ship behind `AI_PROVIDER` flag; default stays `mock` until approved.
- [ ] Verify rate limit + budget in staging.
- [ ] Human Arabic-quality review.
- [ ] Enable for a small % → monitor cost/errors → full enable.
