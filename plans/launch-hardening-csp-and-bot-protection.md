# Plan: Launch Hardening — CSP Enforcement & Bot Protection

**Priority:** P1 · **Effort:** S · **Risk:** Medium

## Feature overview
Two pre-launch security hardening items: (1) move CSP from report-only to
enforced after reviewing reports; (2) activate Turnstile bot protection
end-to-end (it's wired in `TurnstileWidget` but key-gated, and server-side token
verification must be confirmed).

## Business goal
Reduce XSS blast radius and block automated abuse of auth/chat endpoints before
exposing the product publicly.

## User stories
- As the operator, production blocks injected scripts not on the allowlist.
- As the operator, auth/chat are protected from bot floods.

## Functional requirements
- Review report-only CSP findings; remove `unsafe-eval`/tighten `script-src`
  where possible; switch header to enforced `Content-Security-Policy`.
- Provision Turnstile site + secret keys; render widget on auth flows;
  **verify the token server-side** before accepting auth/sensitive actions.

## Non-functional requirements
- CSP must not break maplibre, fonts, Supabase, Turnstile, analytics origins.
- Turnstile degraded mode messaging already exists for missing key.

## Database requirements
- None.

## API requirements
- Server-side Turnstile verification call (siteverify) in the relevant auth/server
  actions; reject on failure.

## UI requirements
- Existing widget; ensure error/expiry states surface to the user.

## UX flow
User reaches auth → solves Turnstile → server verifies → proceeds.

## Validation rules
- Reject requests with missing/invalid Turnstile token where required.

## Security considerations
- Keep `CSP report-only` in staging in parallel for one cycle before enforcing.
- Secret key server-only; never log tokens.

## Edge cases
- Turnstile script blocked/offline → graceful failure + retry.
- CSP regression → temporary rollback to report-only.

## Error handling
- Verification failure → typed error, no auth state change.

## Loading states
- Widget loading state (exists).

## Empty states
- N/A.

## Acceptance criteria
- Enforced CSP with no console violations across all pages.
- Auth with an invalid/absent Turnstile token is rejected server-side.

## Testing requirements
- CSP violation sweep across routes; bot-token rejection test; load smoke
  (`tests/load/*`) still passes.

## Rollout checklist
- [ ] Review report-only CSP data from staging.
- [ ] Tighten + switch to enforced CSP.
- [ ] Provision Turnstile keys (Cloudflare secrets).
- [ ] Confirm/implement server-side token verification.
- [ ] Verify no CSP breakage; rollback path ready.
