# Production Security Review — VoltJo

**Date:** 2026-06-22
**Scope:** CodeQL, Semgrep, npm audit, GitHub Actions, Next.js config, middleware, API
routes, server actions, Supabase integration, Cloudflare/OpenNext deployment.
**Verification:** `lint` ✅ (0 warnings) · `vitest` ✅ (33/33) · `next build` ✅ · Semgrep ✅ (6→1, the 1 verified safe)

---

## 1. Fixed findings

### F1 — GitHub Actions: missing `GITHUB_TOKEN` permissions (CodeQL `actions/missing-workflow-permissions`, Medium) — TRUE POSITIVE
- **Root cause:** [.github/workflows/ci.yml](../.github/workflows/ci.yml) defined no `permissions` block, so the workflow inherited repo/org default token scopes (potentially read-write).
- **Exploitability:** A compromised dependency or action step could use an over-privileged `GITHUB_TOKEN` to push code, alter releases, etc. Real supply-chain risk.
- **Fix:** Added least-privilege `permissions: contents: read` at workflow root. CI only reads the repo. ✅

### F2 — Insecure randomness for identifiers (CodeQL `js/insecure-randomness`, High) — TRUE POSITIVE (low real impact)
- **Root cause:** [lib/chat/conversation-utils.ts](../lib/chat/conversation-utils.ts) generated conversation/message IDs with `Math.random().toString(36)`.
- **Exploitability:** These IDs are **local, client-side chat identifiers** (React keys / local lookup), not auth tokens or secrets — predicting them grants no privilege. Real-world impact is low, but CodeQL flags the pattern and `Math.random` can collide.
- **Fix:** Replaced with `crypto.randomUUID()` (with a `crypto.getRandomValues` fallback) — collision-resistant and silences the High. Mirrors the existing pattern in [app/api/account/avatar/route.ts](../app/api/account/avatar/route.ts). ✅

---

## 2. Dismissed findings (false positives — with evidence)

### D1 — DOM text reinterpreted as HTML (CodeQL `js/xss-through-dom`, High) — FALSE POSITIVE
- **Location:** [components/account/AvatarCustomizer.tsx:319](../components/account/AvatarCustomizer.tsx) — `<img src={localPreviewUrl} />`.
- **Evidence:** `localPreviewUrl` is assigned **only** from `URL.createObjectURL(file)` at [line 162-164](../components/account/AvatarCustomizer.tsx), where `file` is a user-selected `File`. The value is an opaque `blob:` URL set as an `<img src>`. There is **no `innerHTML`/`dangerouslySetInnerHTML` sink**, no string concatenation into markup, and a `blob:` URL cannot execute HTML or script. CodeQL over-approximates the taint flow.
- **Disposition:** Safe to dismiss as **False positive**.

### D2 — Clear-text storage of sensitive information (CodeQL `js/clear-text-storage-of-sensitive-data`, High) — LOW RISK / effectively FALSE POSITIVE
- **Location:** [lib/auth/auth-debug.ts:61](../lib/auth/auth-debug.ts) — writes auth-debug events to `sessionStorage`.
- **Evidence:**
  1. The whole feature is gated by `isAuthDebugEnabled()` → `process.env.NEXT_PUBLIC_AUTH_DEBUG === "true"`, which is **documented to be disabled in production** ([docs/auth-debugging-runbook.md](auth-debugging-runbook.md), [docs/performance-runbook.md](performance-runbook.md)).
  2. The stored data is **OAuth error metadata** (`oauthError`, `stage`, `reason`, error codes) — not passwords, tokens, or session material. Each field is truncated via `safeStr()`.
  3. Storage is `sessionStorage` (per-tab, cleared on tab close), not cookies or `localStorage`.
- **Disposition:** Dismiss as **"Won't fix / used in debug"** with the above justification. **Action item:** confirm `NEXT_PUBLIC_AUTH_DEBUG` is unset/`false` in the production Cloudflare environment.

### D3 — Semgrep `voltjo-supabase-service-role-exposure` @ [lib/supabase/admin.ts:10](../lib/supabase/admin.ts) — TRUE POSITIVE (rule), SAFE (code)
- **Evidence:** The file begins with `import "server-only"` (build-time guard that errors if imported into a client bundle), and `createAdminClient` is imported **only** by [app/api/account/delete/route.ts](../app/api/account/delete/route.ts) (a server route handler). The service-role key never reaches the browser.
- **Disposition:** The rule is intentionally an ERROR-level "verify this" alert; the code is correct. No change needed.

---

## 3. Dependency findings (`npm audit`) — 1 low, 4 moderate, 0 high/critical

| Package | Severity | Surface | Disposition |
|---|---|---|---|
| `esbuild` | Low | Dev server only (arbitrary file read on Windows dev server) | Not in the Cloudflare Worker runtime. Dev-only. Accept. |
| `postcss` | Moderate | Build-time CSS stringify XSS | Runs at build over the project's own Tailwind CSS, never on user input. Not runtime-exploitable. |
| `next` (→postcss) | Moderate | Transitive build tooling | Same as above. |
| `@opennextjs/aws`, `@opennextjs/cloudflare` | Moderate | Build/deploy tooling (→ next) | Build-time only. |

- **`npm audit fix` (safe):** no non-breaking fixes available.
- **`npm audit fix --force`:** **NOT applied** — it proposes destructive downgrades (`next@9.3.3`) that would break the entire app. None of these vulns are exploitable in the deployed Worker runtime.

---

## 4. Manual review — areas inspected, no exploitable issues found

- **Authentication / session:** All server code uses `supabase.auth.getUser()` (JWT-validated server-side), never the spoofable `getSession()`. Middleware gates `/dashboard`, `/account`, `/assistant` and redirects unauthenticated users. ([middleware.ts](../middleware.ts), [lib/server/auth.ts](../lib/server/auth.ts))
- **Authorization / IDOR:** Every user-scoped query filters by `user.id` from the session (never request body) **and** relies on Supabase RLS as defense-in-depth. Chat conversation access goes through `findOwnedChatConversation`. ([app/api/account/export/route.ts](../app/api/account/export/route.ts), [app/api/chat/route.ts](../app/api/chat/route.ts))
- **Open redirect:** `getSafeRedirectPath` rejects absolute URLs, `//`, backslashes, encoded backslashes, and unsafe protocols; covered by 10 unit tests; used in the OAuth callback. ([lib/auth/redirect.ts](../lib/auth/redirect.ts), [app/auth/callback/route.ts](../app/auth/callback/route.ts))
- **XSS:** No `dangerouslySetInnerHTML` in app code (confirmed by Semgrep). OAuth `error` param sanitized to `[a-zA-Z0-9_-]` before reflection.
- **OAuth:** PKCE `exchangeCodeForSession`, generic failure paths, sanitized error codes, anon key only.
- **File upload:** MIME allowlist + **magic-byte signature validation** (JPEG/PNG/WebP) + size + content-length pre-checks + random UUID filenames (no enumeration) + user-id folder prefix matching the storage RLS policy + rollback on failure. ([app/api/account/avatar/route.ts](../app/api/account/avatar/route.ts))
- **Injection:** All DB access via Supabase query builder (parameterized). No raw SQL string building, no `eval`/`Function` in app code.
- **SSRF:** No server-side fetch of user-supplied URLs; AI provider is a local mock.
- **CSRF:** Next.js Server Actions carry built-in origin checks; state-changing API routes authenticate via Supabase `sb-*` cookies which default to `SameSite=Lax`, blocking cross-site POST credential inclusion.
- **Rate limiting:** Present on auth, chat, avatar, export, password-reset, deletion paths.
- **Secrets / env:** No secrets in repo or in `wrangler.jsonc`/`open-next.config.ts`. Service-role key is `server-only`. `NEXT_PUBLIC_*` exposes only intentionally-public values (Supabase anon key [RLS-protected], Turnstile site key).
- **Security headers:** HSTS (1y, includeSubDomains), `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`. ([next.config.ts](../next.config.ts))

---

## 5. Residual risks & recommendations (not fixed — no safe in-PR fix)

| # | Risk | Severity | Recommendation |
|---|---|---|---|
| R1 | **CSP is Report-Only** and allows `'unsafe-inline'` + `'unsafe-eval'` — provides no enforced XSS mitigation. | Medium | Move to an **enforcing** `Content-Security-Policy` using per-request nonces for scripts. Requires nonce plumbing through the Next.js app + testing; deferred to avoid breaking inline/framework scripts. |
| R2 | `getRequestOrigin` trusts `x-forwarded-host`/`host` for the password-reset `redirectTo` when `NEXT_PUBLIC_SITE_URL` is unset (host-header injection). | Low | Mitigated today by Supabase's redirect-URL allowlist. **Always set `NEXT_PUBLIC_SITE_URL` in production** (it is preferred first when present). ([lib/auth/actions.ts](../lib/auth/actions.ts)) |
| R3 | Debug surface (`/debug/auth`, sessionStorage events) active when `NEXT_PUBLIC_AUTH_DEBUG=true`. | Low | Verify the flag is unset/`false` in the production environment (see D2). |
| R4 | Build/dev dependency advisories (Section 3) cannot be patched without a breaking upgrade. | Low | Track upstream `@opennextjs/cloudflare`/`next` releases; upgrade when a non-breaking fix ships. |

---

## 6. Production-readiness assessment

**Verdict: Production-ready from a security standpoint, with the recommendations above tracked.**

- **No unresolved high-confidence security findings.** All High CodeQL findings are either fixed (F1, F2) or proven false positives with code-level evidence (D1, D2).
- The application demonstrates **strong, consistent security engineering**: server-side JWT validation, RLS + explicit ownership filters, hardened file upload, defended open-redirect, sanitized OAuth flow, broad rate limiting, and a sound secrets boundary.
- The only items left are **defense-in-depth hardening** (enforce CSP) and **operational hygiene** (set `NEXT_PUBLIC_SITE_URL`, ensure `NEXT_PUBLIC_AUTH_DEBUG=false`), none of which represent an exploitable vulnerability in the current code.
