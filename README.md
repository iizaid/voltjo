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

Not implemented yet:

- AI provider integration
- chat database persistence
- vehicle database
- payments
- rate limiting
