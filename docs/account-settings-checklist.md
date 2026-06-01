# Account Settings Checklist

This page tracks the current `/account` requirements for VoltJo.

## Required migrations

Apply these SQL files in order:

1. `supabase/migrations/002_account_settings.sql`
   - adds `profiles.avatar_config`
   - adds `profiles.privacy_settings`
2. `supabase/migrations/003_profile_avatar_path.sql`
   - adds `profiles.avatar_path`
3. `supabase/migrations/004_avatar_storage_policies.sql`
   - adds authenticated storage policies for user avatar files
   - must use corrected syntax:
     `(storage.foldername(name))[1] = auth.uid()::text`

## Supabase Storage manual step

The current avatar display flow uses `getPublicUrl(...)`.

Manual setup required:

1. Open **Supabase Dashboard -> Storage**
2. Create a bucket named `avatars`
3. Make the bucket **public** for the current implementation
4. Confirm Supabase Auth redirect URLs include:
   - `/auth/update-password`

Notes:

- The current code expects the path format: `{user-id}/avatar.webp`
- If you want a private bucket later, replace public URLs with signed URLs
- The uploaded avatar should now appear in:
  - `/account`
  - marketing header account control
  - assistant account chip

## Avatar storage policies

`004_avatar_storage_policies.sql` restricts access so authenticated users can:

- view their own avatar object
- insert their own avatar object
- update their own avatar object
- delete their own avatar object

Policies are scoped by:

- `bucket_id = 'avatars'`
- `(storage.foldername(name))[1] = auth.uid()::text`

## Password reset requirements

Password reset depends on Supabase Auth email configuration.

Recommended checks:

1. Set the project Site URL correctly in Supabase Auth
2. Add the reset redirect URL for:
   - `/auth/update-password`
3. Optionally set `NEXT_PUBLIC_SITE_URL` in the app environment for a canonical redirect origin

## Performance notes

- localhost in Next.js dev mode can feel slower than production, especially with:
  - server rendering
  - TypeScript checks
  - Supabase SSR auth/session reads
- Test the production build as the reference for realistic speed
- Keep avatar upload UI isolated to the account page only

## Privacy settings

Privacy settings are stored in:

- `profiles.privacy_settings`

They are persisted now even if some product areas still enforce them gradually.

## Account deletion

Account deletion is **request-only** in this phase.

- No destructive deletion API is implemented
- Users are routed to support through a mailto flow

## Security notes

- No `service_role` key is used
- Public avatar bucket is acceptable for MVP
- Before production hardening, consider moving avatar delivery to signed URLs if private storage is required
