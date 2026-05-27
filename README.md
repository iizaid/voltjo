# VoltJo

Arabic-first Jordan-focused EV and hybrid vehicle intelligence platform.

## Setup

Install dependencies:

```bash
npm install
```

Create local environment file:

```bash
cp .env.example .env.local
```

Fill:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Never place a Supabase service role key in client code.

## Supabase

Run the initial database schema:

```txt
supabase/schema.sql
```

This creates the `public.profiles` smart profile table and RLS policies.

## Development

```bash
npm run dev
npm run lint
npm run build
```

## Current Backend Scope

Implemented:

- Supabase email/password auth foundation
- profile-aware onboarding persistence
- protected dashboard
- RLS schema for `public.profiles`
- protected account/security page
- auth callback redirect hardening
- basic in-memory auth rate limiting

Not implemented yet:

- AI provider integration
- chat database persistence
- vehicle database
- payments
- distributed production rate limiting
- CAPTCHA/bot protection
- monitoring/audit logs
- final Content-Security-Policy

## Production Security Checklist

- Run `supabase/schema.sql` in Supabase.
- Configure Supabase Site URL and Redirect URLs, including `/auth/callback`.
- Decide whether email confirmation is enabled.
- Use a production SMTP provider for auth email.
- Verify RLS with two separate users.
- Keep service role keys out of frontend code and `NEXT_PUBLIC_*`.
- Replace the in-memory rate limiter before public launch.
- Add monitoring/logging and bot protection before public launch.
- Review Next.js `middleware.ts` to `proxy.ts` migration before deployment.
- Add and test CSP once production domains are final.
- Deploy over HTTPS only.

More details are in `docs/supabase-auth-foundation.md`.
