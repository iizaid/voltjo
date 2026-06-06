# AI Chat Backend Architecture

## Current phase

VoltJo now uses a server-side mock provider behind `POST /api/chat`.
The frontend chat UI no longer generates assistant replies directly in the browser.

## Request flow

`ChatShell` sends a JSON request to `/api/chat` containing:

- `message`
- `modelId`
- `thinkingMode`
- `attachment` metadata when present

The API route:

1. parses JSON safely
2. applies a content-length guard before JSON parsing when the header is present
3. validates the payload server-side
4. resolves the current Supabase user when available
5. applies Upstash Redis-backed rate limiting
6. wraps provider calls with a timeout
7. returns a structured JSON response

## Current provider

The only implemented provider in this phase is:

- `mock`

Provider selection lives in:

- `lib/ai/provider.ts`

The actual mock implementation lives in:

- `lib/ai/providers/mock.ts`

## Future providers

Planned later:

- OpenAI
- Gemini
- Kimi

They should be added server-side only, behind the same provider abstraction.

## Environment variables

Add these to `.env.local` when future providers are implemented:

- `AI_PROVIDER`
- `OPENAI_API_KEY`
- `GEMINI_API_KEY`
- `KIMI_API_KEY`

Current default:

- `AI_PROVIDER=mock`

## Security notes

- No AI API keys are exposed to the client.
- Client components must never import server env helpers.
- Provider errors should be sanitized before returning to the UI.
- `/api/chat` rejects oversized request bodies when `Content-Length` exceeds the configured limit.
- `/api/chat` includes Upstash Redis-backed rate limiting in this phase.
- `/api/chat` returns rate limit headers:
  - `X-RateLimit-Limit`
  - `X-RateLimit-Remaining`
  - `X-RateLimit-Reset`
  - `Retry-After` when blocked
- Client requests use a timeout.
- Provider execution uses a server-side timeout.
- Production requires the Upstash Redis REST env vars. The limiter fails closed if the shared store is missing or unreachable.

## Current limitations

- Real AI providers are not implemented yet.
- `AI_PROVIDER` can be configured, but non-mock providers still safely fall back to `mock`.
- Real API keys will be added later server-side only.
- Chat persistence is still localStorage only.
- Attachments are still metadata/demo only.
- `/api/chat` rate limiting is backed by Upstash Redis and should be smoke-tested with real staging Worker secrets.
- No streaming yet.
