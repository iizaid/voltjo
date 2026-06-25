# Auth Protection Audit — OBS-1 Verification

**Date**: 2026-06-25  
**Status**: AUDIT ONLY — no files modified  
**Verdict**: PARTIALLY BROKEN — HIGH RISK

---

## 1. middleware.ts Status

**Does `middleware.ts` exist at a valid Next.js location?** **NO — CRITICAL**

- No `middleware.ts` at project root (`./middleware.ts`)
- No `src/` directory, so `./src/middleware.ts` is also absent
- The file was deleted (visible in `git status` as `D middleware.ts`)
- Next.js 14/15 only recognises middleware at exactly `./middleware.ts` or `./src/middleware.ts`
- **The application has zero middleware-level auth enforcement**

---

## 2. What the Deleted middleware.ts Did

The original `middleware.ts` performed the following on every incoming request:

1. **Protected paths**: `/dashboard`, `/account`, `/assistant`
2. **Fast cookie check**: Looked for `sb-*` Supabase session cookies to short-circuit unnecessary network calls
3. **User verification**: Called `supabase.auth.getUser()` to confirm session validity
4. **Redirect on failure**: Sent unauthenticated users to `/start?next={original_path}`
5. **Cookie lifecycle management**: Properly handled Supabase SSR cookie refresh
6. **Cache-Control headers**: Prevented CDN/proxy caching of auth-sensitive responses

This was the first and most reliable line of defence.

---

## 3. proxy.ts Analysis

**Location**: `./proxy.ts` (project root, **untracked in git**)

**What it is**: An exact copy of the deleted `middleware.ts` with one change — the exported function is named `proxy()` instead of `middleware()`.

**Is it active at Next.js runtime?** **NO — completely inactive.**

Evidence:
- Not imported or referenced anywhere in the codebase
- Not listed in `package.json` scripts
- Not configured in `next.config.ts`
- Not tracked by git
- Function name `proxy` does not match the Next.js convention (`middleware`)
- Even if renamed, its location at `./proxy.ts` is not a valid middleware path

**Interpretation**: This appears to be an incomplete attempt to restore auth protection. The author copied the middleware logic but failed to:
1. Place it at `./middleware.ts`
2. Export it as `middleware()`
3. Add it to version control

---

## 4. Route-by-Route Auth Status

### `/dashboard`
- **File**: `app/dashboard/page.tsx` (lines 21–23)
- **Protection**: YES — server-side page redirect
- **Mechanism**: `if (!user) redirect("/start")`
- **Status**: PROTECTED ✓ (but fragile — no middleware fallback)

### `/account`
- **File**: `app/account/page.tsx` (lines 604–607)
- **Protection**: YES — server-side page redirect
- **Mechanism**: Same `getCurrentUserAndProfile()` + redirect pattern
- **Status**: PROTECTED ✓ (but fragile)

### `/assistant`
- **File**: `app/assistant/page.tsx` (lines 31–50)
- **Protection**: NO — **VULNERABILITY**
- **Mechanism**: Calls `getCurrentUserAndProfile()` but never checks the result. If `user` is null the component still renders with `account: null`. No redirect occurs.
- **Status**: UNPROTECTED ✗ — **CRITICAL**

### `/start`
- Intentionally public — no auth needed.

### `/charging-map`
- **File**: `app/charging-map/page.tsx`
- **Protection**: None — appears intentionally public
- **Status**: PUBLIC (intentional)

### API routes

| Route | Auth Enforcement | Verdict |
|-------|-----------------|---------|
| `POST /api/chat` | Rate-limited; anonymous allowed | Intentional |
| `POST /api/account/delete` | `getUser()` → 401 if absent | PROTECTED ✓ |
| `GET /api/account/export` | `getUser()` → 401 if absent | PROTECTED ✓ |

---

## 5. Auth Helper Locations

```
DELETED:
  ./middleware.ts                    ← was the primary auth gate

ABANDONED (untracked, not active):
  ./proxy.ts                         ← dead copy of middleware, wrong name, wrong path

ACTIVE auth checks (page-level):
  app/dashboard/page.tsx (L21-23)    ← redirect if !user
  app/account/page.tsx (L604-607)    ← redirect if !user
  app/api/account/delete/route.ts    ← 401 if !user
  app/api/account/export/route.ts    ← 401 if !user

NO auth check (vulnerability):
  app/assistant/page.tsx (L31-50)    ← renders for anonymous users

Session helpers:
  lib/auth/session.ts                ← getCurrentUser(), getCurrentUserAndProfile()
  lib/server/auth.ts                 ← getCurrentUser() wrapper
  lib/supabase/server.ts             ← Supabase SSR client factory
```

---

## 6. Security Verdict

**PARTIALLY BROKEN — HIGH RISK**

- `/dashboard` and `/account` retain page-level auth checks and will redirect unauthenticated users, but only after the server component begins rendering — no request-level gate exists.
- `/assistant` has **no auth check at all**. Unauthenticated users can access it directly.
- **All middleware-level protection is gone.** No request is gated before reaching the app layer.
- The abandoned `proxy.ts` confirms the middleware deletion was not an intentional architectural change — it was a failed migration.

---

## 7. Issues Found

### ISSUE 1 — Missing Middleware
- **Severity**: CRITICAL
- **Location**: `./middleware.ts` (deleted)
- **Impact**: No request-level auth enforcement exists. All routes require per-page checks, which are absent on `/assistant`.
- **Detail**: `git status` confirms `deleted: middleware.ts`. No replacement exists at any valid Next.js middleware path.

### ISSUE 2 — Unprotected `/assistant` Route
- **Severity**: HIGH
- **Location**: `app/assistant/page.tsx` (lines 31–50)
- **Impact**: Unauthenticated users can access the AI assistant without being redirected. The component renders with `account: null`.
- **Detail**: `getCurrentUserAndProfile()` is called but its return value is only used for UI display, not for access control.

### ISSUE 3 — Abandoned `proxy.ts`
- **Severity**: MEDIUM
- **Location**: `./proxy.ts` (untracked)
- **Impact**: Dead code; indicates an incomplete security fix. Creates confusion about the intended auth architecture.
- **Detail**: Contains all the correct logic but is unreachable. Was never committed to git.

### ISSUE 4 — Inconsistent Auth Patterns
- **Severity**: MEDIUM
- **Location**: Page components across `app/`
- **Impact**: Easy to accidentally create unprotected routes. No single enforcement point.
- **Detail**: `/dashboard` and `/account` explicitly redirect on `!user`. `/assistant` does not. No shared protected layout or route group enforces a consistent pattern.

---

## 8. Minimal Fix Required (do not implement yet)

**Step 1 — Critical (restores middleware gate):**
- Rename `proxy.ts` → `middleware.ts` at project root
- Change the exported function name from `proxy` to `middleware`
- Add the file to git tracking

**Step 2 — High (closes `/assistant` hole):**
- In `app/assistant/page.tsx`, after `getCurrentUserAndProfile()`, add:
  ```typescript
  if (!user) redirect("/start?next=/assistant");
  ```

**Step 3 — Medium (prevents recurrence):**
- Move `/dashboard`, `/account`, `/assistant` into an `app/(protected)/` route group
- Add a shared `layout.tsx` that performs the auth check once for all protected routes

---

## 9. Summary Table

| Route | Middleware Gate | Page Redirect | Overall |
|-------|----------------|---------------|---------|
| `/dashboard` | ✗ MISSING | ✓ Present | Fragile |
| `/account` | ✗ MISSING | ✓ Present | Fragile |
| `/assistant` | ✗ MISSING | ✗ MISSING | **BROKEN** |
| `/api/account/*` | ✗ MISSING | N/A (401) | Acceptable |
| `/api/chat` | ✗ MISSING | N/A (anon OK) | Intentional |
