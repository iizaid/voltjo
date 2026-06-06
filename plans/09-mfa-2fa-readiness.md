# MFA / 2FA Readiness

## Goal

Plan whether VoltJo needs MFA/2FA for the MVP and how to introduce it without hurting Arabic onboarding.

## Scope

- Supabase Auth MFA capability review.
- Account security UX requirements.
- Recovery and support policy.
- Admin/operator account recommendations if admin tools are added later.

## Out Of Scope

- Implementing MFA in this phase.
- Adding new packages.
- Changing current login/signup flows before a product decision.

## Files Likely Involved

- `README.md`
- `docs/staging-smoke-tests.md`
- `docs/supabase-auth-foundation.md`
- `app/account/page.tsx`
- `lib/auth/actions.ts`
- `components/onboarding/OnboardingAuthPanel.tsx`

## Safety Rules

- Do not lock users out in staging.
- Avoid adding MFA requirements before email delivery is reliable.
- Keep Arabic copy direct and non-technical.
- Document recovery flows before enabling enforcement.

## Acceptance Criteria

- Product decision recorded: no MFA, optional MFA, or required MFA for specific roles.
- Supabase dashboard requirements documented.
- UX copy and recovery policy drafted.
- No code changes until an implementation phase is approved.

## Commands To Run

```bash
npm test
npm run lint
npm run build
git status --short
```

## Final Report Requirements

- Recommendation.
- Security tradeoffs.
- Supabase setup implications.
- UX/recovery requirements.
- Implementation phase proposal if approved.
