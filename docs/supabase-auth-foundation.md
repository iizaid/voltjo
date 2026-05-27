# VoltJo Supabase Auth Foundation

This document describes Phase 1 of the VoltJo backend foundation: Supabase Auth plus the VoltJo Smart Profile.

## What Was Implemented

- Supabase SSR client setup for Next.js App Router.
- Email/password auth actions for signup, login, and logout.
- A `public.profiles` table schema for one smart profile per Supabase user.
- Centralized server-side validation for onboarding answers from `lib/onboarding/questions.ts`.
- Basic in-memory auth rate limiting for signup/login attempts.
- Safe auth callback redirects that only allow internal relative paths.
- Protected `/dashboard` route that reads the authenticated user and their profile.
- Protected `/account` route for account/security status.
- Middleware that refreshes Supabase auth cookies and protects `/dashboard` and `/account`.
- `/assistant` remains public in this phase, but it can display the authenticated account/profile label when available.

## Required Environment Variables

Create `.env.local` from `.env.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Do not add a service role key to client code or any `NEXT_PUBLIC_*` variable.

## Database Schema

Run the SQL in:

```txt
supabase/schema.sql
```

The schema creates `public.profiles` with:

- `id` referencing `auth.users(id)`
- onboarding answer fields
- `onboarding_completed`
- `onboarding_completed_at`
- `profile_version`
- timestamps and an `updated_at` trigger

## RLS Policies

RLS is enabled on `public.profiles`.

Policies allow authenticated users to:

- select only their own profile
- insert only their own profile
- update only their own profile

There is intentionally no delete policy in Phase 1. Account deletion should be added later with a confirmed, explicit account-deletion flow.

## Public And Protected Routes

Public routes:

- `/`
- `/start`
- `/assistant`
- `/cars`
- `/compare`
- `/calculators`
- `/resources`
- `/pricing`

Protected routes:

- `/dashboard`
- `/account`

Unauthenticated users are redirected to `/start`.

## Auth And Profile Flow

Signup from `/start`:

1. Server validates name, email, password, and onboarding answers.
2. Supabase creates the auth user.
3. If a session exists immediately, VoltJo writes `public.profiles`.
4. If email confirmation is required, the profile is not claimed as saved. The local draft remains until login.

Login from `/start`:

1. Server validates credentials.
2. Supabase signs in the user.
3. If onboarding answers are present, they are validated and saved to the current user's profile.
4. If no profile exists or onboarding is incomplete, the user is sent back to `/start`.

## Security Notes

- Passwords are never stored in `public.profiles`.
- The user id is never accepted from the client. It always comes from Supabase Auth.
- Profile writes use Supabase query builder methods, not raw SQL.
- Onboarding values are validated against `lib/onboarding/questions.ts`.
- Duplicate priorities, invalid city/country combinations, oversized payloads, and invalid option slugs are rejected server-side.
- If the user already owns an EV or hybrid, `has_driven_ev_or_hybrid` is normalized to `yes` server-side.
- User-facing errors avoid raw Supabase error details.
- Profile fields are rendered as React text nodes, not raw HTML.
- Basic security headers are configured in `next.config.ts`.
- CSP is intentionally left as a deployment TODO until the production app, Supabase, font, and image domains are final.
- Next.js 16 deprecates `middleware.ts` in favor of `proxy.ts`; this project keeps `middleware.ts` for the current Supabase session-refresh flow and should review the proxy migration before final deployment.

## Intentionally Not Implemented Yet

- AI provider integration
- OpenAI or paid AI APIs
- chat database persistence
- vehicle database
- Stripe or payments
- distributed production rate limiting
- password reset UI
- monitoring/audit logs
- CAPTCHA/bot protection

The current in-memory rate limiter is a Phase 1 safety guard only. Replace it with Redis/Upstash, Supabase Edge rate limiting, or platform/WAF protection before public launch.

## Production Security Checklist

- Run `supabase/schema.sql` in the Supabase SQL editor.
- Enable RLS and verify the three ownership policies on `public.profiles`.
- Test that user A cannot select or update user B's profile.
- Decide intentionally whether email confirmation is enabled.
- Set the production Site URL in Supabase Auth settings.
- Add all production auth redirect URLs, including `/auth/callback`.
- Use a production SMTP provider for auth email before launch.
- Keep the Supabase service role key out of frontend code and out of `NEXT_PUBLIC_*`.
- Add production-grade distributed rate limiting before launch.
- Add monitoring and logging before public launch.
- Consider bot protection or CAPTCHA if abuse appears.
- Review the Next.js middleware/proxy convention before final deployment.
- Add a CSP once production domains are final and tested.
- Deploy only over HTTPS.
- Rotate keys immediately if any key is exposed.

## Manual QA Checklist

- Add Supabase env vars to `.env.local`.
- Run `supabase/schema.sql` in the Supabase SQL editor.
- Open `/start`, complete onboarding, create account.
- If email confirmation is disabled, verify redirect to `/assistant` and profile row creation.
- If email confirmation is enabled, verify the confirmation message appears and the draft remains local.
- Log in after confirming email and verify profile save.
- Open `/dashboard` while signed in and verify profile data is displayed.
- Open `/dashboard` while signed out and verify redirect to `/start`.
- Open `/assistant` signed out and verify demo mode still works.
- Open `/assistant` signed in and verify account label appears.

## Manual Security QA

1. Visit `/dashboard` signed out and confirm redirect to `/start`.
2. Visit `/account` signed out and confirm redirect to `/start`.
3. Complete onboarding and sign up with a weak password; it must be rejected.
4. Sign up with an invalid email; it must be rejected.
5. Sign up with valid data; Supabase should create a user.
6. If email confirmation is disabled, verify the profile row is created.
7. If email confirmation is enabled, verify the confirmation message appears and VoltJo does not claim the profile was saved.
8. Log in with a wrong password repeatedly and confirm the rate limit message appears.
9. Log in with a valid user after onboarding and verify profile save.
10. Submit invalid onboarding JSON in the hidden field and confirm it is rejected.
11. Submit duplicated priorities and confirm they are rejected.
12. Try adding or editing a client-side profile id; it must be ignored because the server uses Supabase Auth only.
13. In Supabase SQL/editor or a client test, verify user A cannot select or update user B's profile.
14. Open `/assistant` signed out and verify demo mode still works.
15. Open `/assistant` signed in and verify profile/account label appears.
16. Confirm no raw Supabase errors are shown to users.

## Current Public/Private Scope

- `/assistant` remains public in this phase so users can try the demo assistant before account creation.
- Chat history is still localStorage-only and is not written to Supabase.
- Auth/profile becomes real only after `.env.local` is configured and `supabase/schema.sql` is applied.
- This phase does not include AI providers, payments, vehicle data, or chat database persistence.
