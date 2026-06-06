# VoltJo Monitoring & Production-Ops Plan

## Current State

Monitoring is not wired to a vendor yet. There is no Sentry setup, no Vercel
Observability setup, and no monitoring-specific environment variable should be
added until that integration is intentionally installed.

For staging, use Vercel deployment logs and runtime function logs as the first
line of visibility. The app should continue returning safe Arabic UI/API
messages while operational details stay in logs.

## Recommended Monitoring Path

### 1. Staging baseline: Vercel logs

- Review build logs for TypeScript, lint, route generation, and environment
  warnings after every staging deploy.
- Review runtime function logs for API errors, auth callback failures, avatar
  upload failures, rate-limit denials, and location-save failures.
- Confirm server logs never include secrets, tokens, service-role keys, full
  export payloads, chat content, or raw uploaded files.

### 2. Later upgrade: Sentry or Vercel Observability

Install a monitoring vendor only when the team is ready to configure it
properly. Recommended goals:

- Capture server errors from route handlers and server-rendered pages.
- Capture client-side JavaScript errors.
- Track release/deployment versions so regressions can be tied to a deploy.
- Keep source-map upload tokens server-only and never expose them in
  `NEXT_PUBLIC_*`.
- Upload source maps only through the intended build-time mechanism; do not
  publish token-bearing config or private artifacts.

Do not add fake `SENTRY_*` values. Do not claim Sentry is installed until the
package, config, and dashboard are actually in place.

## CSP Report-Only

VoltJo sends a conservative `Content-Security-Policy-Report-Only` header from
`next.config.ts`. It is intentionally report-only for staging observation and
should not be treated as final enforcement.

Current policy goals:

- Block unsafe embedding with `frame-ancestors 'none'`.
- Keep objects disabled with `object-src 'none'`.
- Allow practical Next.js runtime needs while staging reports are reviewed.
- Preserve app geolocation through the separate `Permissions-Policy` header.

Before enforcing CSP, review browser console reports and production domains for
images, fonts, APIs, analytics, maps, and future monitoring endpoints. Tighten
`script-src` and remove temporary allowances only after staging proves it is
safe.

## Staging Verification Checklist

Before promoting a staging build, verify:

- [ ] Vercel build logs show no unexpected build, lint, or TypeScript failures.
- [ ] Runtime function logs are checked after exercising auth, chat, avatar,
  account export, and location-save flows.
- [ ] No raw stack traces are visible in UI pages or API responses.
- [ ] Rate-limit failures are visible enough to diagnose abuse patterns, but do
  not log secrets, message contents, full payloads, or private files.
- [ ] Auth callback errors redirect to `/start?auth_error=callback`, not a blank
  500 page.
- [ ] CSP report-only header is present on public pages.

## Bot Protection Plan

Current protection is rate limiting. Chat, avatar upload, account export, and
location-preference routes should keep their server-side limits in place.

Do not add CAPTCHA widgets in this phase. Future layers, if abuse requires them:

- Vercel WAF / firewall rules for obvious automated traffic patterns.
- Turnstile or hCaptcha on signup/login only after product review.
- Continued API rate limits for chat, avatar upload, account export, and
  location saving.
- Clear Arabic error states so protection does not break Arabic onboarding or
  confuse legitimate users.

Any bot protection rollout should be tested with Arabic-first onboarding, OAuth,
email/password auth, and mobile browsers before public launch.

## Safe Test Errors

Do not add permanent test-error routes. If a monitoring vendor is installed
later, use that vendor's dashboard test event or a temporary staging-only check
that is removed before merge.
