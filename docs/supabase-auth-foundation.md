# VoltJo Supabase Auth Foundation

This document describes Phase 1 of the VoltJo backend foundation: Supabase Auth plus the VoltJo Smart Profile.

## What Was Implemented

- Supabase SSR client setup for Next.js App Router.
- Email/password auth actions for signup, login, and logout.
- A `public.profiles` table schema for one smart profile per Supabase user.
- Server-side validation for onboarding answers from `lib/onboarding/questions.ts`.
- Protected `/dashboard` route that reads the authenticated user and their profile.
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
- User-facing errors avoid raw Supabase error details.
- Profile fields are rendered as React text nodes, not raw HTML.

## Intentionally Not Implemented Yet

- AI provider integration
- OpenAI or paid AI APIs
- chat database persistence
- vehicle database
- Stripe or payments
- production rate limiting
- password reset UI

Rate limiting is required before public launch.

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
