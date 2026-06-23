# Plan: Monitoring & Analytics

**Priority:** P1 · **Effort:** S–M · **Risk:** Medium (blind in production)

## Feature overview
Install real error tracking, uptime/alerting, and privacy-respecting product
analytics. `docs/monitoring.md` exists but no vendor is wired.

## Business goal
Detect incidents and understand usage from day one instead of flying blind.

## User stories
- As the operator, I'm alerted within minutes of a spike in 5xx errors.
- As the operator, I see which features (assistant, map, catalog) are used.

## Functional requirements
- Error tracking (e.g. Sentry) for client + Worker server errors.
- Uptime monitor + alert channel (email/Slack) on `/api/health/auth`.
- Product analytics for key events (privacy-compliant, consent-aware).

## Non-functional requirements
- Respect `CookieConsentBanner` consent before analytics fires.
- No PII in error payloads; scrub tokens.

## Database requirements
- None (external vendors).

## API requirements
- Health endpoint exists; ensure it reflects Supabase + Redis reachability.

## UI requirements
- Analytics loads only after consent; no layout shift.

## UX flow
Invisible to users except the existing consent banner.

## Validation rules
- Analytics disabled until consent === accepted.

## Security considerations
- Secrets in Cloudflare env, not committed; sanitize breadcrumbs.

## Edge cases
- Consent declined → no analytics, error tracking still allowed (no PII).
- Vendor outage → must not break the app.

## Error handling
- Monitoring init failure is non-fatal.

## Loading states
- N/A.

## Empty states
- N/A.

## Acceptance criteria
- A forced test error appears in the dashboard; an alert fires on downtime.
- No analytics network calls before consent.

## Testing requirements
- Trigger test error; simulate downtime alert; verify consent gating.

## Rollout checklist
- [ ] Choose vendors; add secrets to Cloudflare.
- [ ] Wire error tracking (client + Worker).
- [ ] Uptime monitor + alert channel on health endpoint.
- [ ] Consent-gated analytics + key events.
- [ ] Verify end to end in staging.
