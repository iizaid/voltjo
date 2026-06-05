# VoltJo Monitoring Plan (MVP)

## Status

No monitoring vendor is wired yet. This document describes the recommended approach for the MVP launch.

## Recommended Option

**Vercel Logs + Analytics** (zero config, no extra dependency):
- Server-side errors and 500s appear automatically in the Vercel dashboard under **Functions** logs.
- Client-side errors are not captured without additional setup.
- Suitable for early MVP.

**Sentry free tier** (recommended upgrade before public launch):
- Captures both server-side and client-side errors.
- Source-map support for readable stack traces.
- Free tier covers typical MVP traffic.

## Adding Sentry Later

Install only when ready:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Required env vars (server-only — never in `NEXT_PUBLIC_*`):

```
SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=...   # for source map uploads at build time only
SENTRY_ORG=your-org
SENTRY_PROJECT=voltjo
```

Optional public DSN for client-side reporting (safe to expose):

```
NEXT_PUBLIC_SENTRY_DSN=https://...
```

**Rule:** Never place `SENTRY_AUTH_TOKEN` or any service role key in a `NEXT_PUBLIC_*` variable. Auth tokens and service keys bypass security controls and must remain server-only.

## Staging Verification Checklist

Before promoting to production, verify the following:

- [ ] Server errors (5xx) appear in Vercel function logs or Sentry.
- [ ] Client-side JS errors are captured (requires Sentry or similar).
- [ ] `/api/*` routes return structured error responses; no raw stack traces leak to clients.
- [ ] Auth callback errors redirect to `/start?auth_error=callback`, not a blank 500.
- [ ] AI chat API returns 400/429 with Arabic error messages on invalid input, not 500.

## Triggering a Safe Test Error (Non-Production)

To confirm monitoring is wired, trigger a controlled error in a staging environment only:

1. Add a temporary route `/api/health-check` that throws intentionally.
2. Call it once, confirm the error appears in Vercel logs or Sentry.
3. Remove the route before merging to production.

Never trigger test errors in the production environment. Use Sentry's **send-test-event** button in the project dashboard instead.
