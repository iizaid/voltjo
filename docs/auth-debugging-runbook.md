# Auth Debugging Runbook

Temporary diagnostic system for OAuth failures.
**Disable `NEXT_PUBLIC_AUTH_DEBUG` before production launch.**

---

## 1. How to Enable

### Local development

Add to `.env.local`:

```
NEXT_PUBLIC_AUTH_DEBUG=true
```

Restart the dev server (`npm run dev`).

### Cloudflare production / staging

1. Go to **Cloudflare Dashboard → Workers & Pages → voltjo → Settings → Variables and Secrets**
2. Add a plaintext variable:
   - Name: `NEXT_PUBLIC_AUTH_DEBUG`
   - Value: `true`
3. Save and click **Redeploy** (or run `npm run deploy`).

> NEXT_PUBLIC_ variables are baked into the JS bundle at build time.
> A redeploy is required for the change to take effect.

---

## 2. Debug URLs

| Purpose | URL |
|---|---|
| Health check (JSON) | `/api/health/auth` |
| Debug UI | `/debug/auth` |

---

## 3. Testing Google OAuth

1. Open an **incognito / private window**.
2. Navigate to `/debug/auth` and click **Clear debug events**.
3. Navigate to `/start`.
4. Complete the onboarding questions.
5. Click **المتابعة باستخدام Google** (Continue with Google).
6. Complete the Google sign-in (or trigger a cancellation).
7. After the redirect / failure, navigate to `/debug/auth`.
8. Click **Copy debug report**.
9. Share the copied text — it contains no secrets, tokens, or PII.

---

## 4. Testing GitHub OAuth

Same steps as Google, but click **المتابعة باستخدام GitHub** in step 5.

---

## 5. Interpreting Results

### `provider_error`
The OAuth provider returned an error before the code exchange.
Check `oauthError` in the event:
- `access_denied` — user cancelled, or Google app is unverified / restricted.
- `redirect_uri_mismatch` — Supabase redirect URL not listed in Google/GitHub OAuth app settings.
- `invalid_client` — client ID or secret is wrong/expired.

### `missing_code`
The callback URL had no `code` parameter and no session was detected.
Likely causes:
- Provider redirect URL does not match Supabase callback URL.
- PKCE code verifier cookie was not sent (third-party cookie blocked).

### `exchange_failed`
Supabase rejected the code exchange. Check `exchangeErrorName` and `exchangeErrorStatus`.
Likely causes:
- Code already consumed (page reloaded mid-exchange).
- PKCE verifier cookie missing or expired.
- Supabase project URL or anon key is wrong.

### `no_session_after_exchange`
Exchange reported success but no session was found immediately after.
Likely causes:
- Cookie not persisted (SameSite/Secure issue on Cloudflare).
- Session cookie domain mismatch.

### `hasSupabaseCodeVerifierCookie: true` but `hasSupabaseAuthTokenCookie: false`
The PKCE flow started (verifier was set) but the session was never established.
Exchange likely failed silently.

### `hasSupabaseAuthTokenCookie: true` but `authenticated: false`
A session cookie exists but the server-side `getUser()` call returned null.
Likely a cookie domain/path mismatch, or the JWT is expired and refresh failed.

---

## 6. What Is NOT Logged

The debug system deliberately omits:

- OAuth `code` parameter value
- Access tokens, refresh tokens, provider tokens
- Cookie names and values
- User email address
- User ID (UUID)
- Raw `error_description` from the provider
- Supabase service role key
- Google / GitHub client secrets
- Turnstile secret

Only safe booleans, counts, sanitized error codes, and stage names are stored.

---

## 7. Before Production Launch

Remove or set to `false`:

```
NEXT_PUBLIC_AUTH_DEBUG=false
```

Redeploy. The debug UI at `/debug/auth` will show "Auth debug is disabled."
and no events will be collected.
