# Auth Email + Resend/Supabase SMTP Readiness

## Goal

Prepare production-quality Supabase Auth email delivery without adding secrets or runtime code prematurely.

## Scope

- Supabase Auth email confirmation decision.
- Password reset email behavior.
- Branded sender identity.
- Resend or custom SMTP planning.
- Arabic email copy review.

## Out Of Scope

- Adding Resend SDK or SMTP secrets to the repo.
- Sending production email from local dev.
- Changing auth UX unless a concrete staging issue is found.

## Files Likely Involved

- `.env.example`
- `README.md`
- `docs/auth-email-branding.md`
- `docs/staging-smoke-tests.md`
- `lib/auth/actions.ts`
- `app/auth/callback/route.ts`
- `app/auth/update-password/page.tsx`

## Safety Rules

- Store SMTP/API credentials only in Supabase/provider dashboards or hosting secrets.
- Do not commit secrets.
- Keep Arabic onboarding clear if confirmation is enabled.
- Verify reset links use `NEXT_PUBLIC_SITE_URL`.

## Acceptance Criteria

- Team decision recorded: confirmation on/off for staging and production.
- Sender domain and SMTP provider chosen.
- Supabase dashboard setup steps documented.
- Signup, login, confirmation, and reset-password smoke tests pass.

## Commands To Run

```bash
npm test
npm run lint
npm run build
git status --short
```

## Final Report Requirements

- Dashboard settings required.
- Email templates reviewed.
- SMTP/Resend readiness status.
- Auth flow smoke-test results.
- Remaining manual setup.
