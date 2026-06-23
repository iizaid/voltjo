import "server-only";

/**
 * Trustworthy client-IP extraction for rate limiting and abuse controls.
 *
 * THREAT MODEL
 * ------------
 * `x-forwarded-for` (XFF) is fully attacker-controlled: any client can send an
 * arbitrary value, and an attacker can rotate it on every request to mint a
 * fresh rate-limit bucket and bypass per-IP limits entirely. We must NOT trust
 * it in production.
 *
 * This app runs on Cloudflare Workers. Cloudflare strips/overwrites trusted
 * headers at its edge before our code runs, so the following are authoritative
 * when (and only when) we are actually executing behind Cloudflare:
 *
 *   - `CF-Connecting-IP`  — the real client IP as seen by Cloudflare (primary).
 *   - `True-Client-IP`    — Enterprise equivalent of the above (secondary).
 *
 * PRECEDENCE ORDER (highest trust first)
 * --------------------------------------
 *   1. CF-Connecting-IP        (trusted: set by Cloudflare edge)
 *   2. True-Client-IP          (trusted: set by Cloudflare edge, Enterprise)
 *   3. x-forwarded-for[0]      (UNTRUSTED — development fallback ONLY)
 *   4. x-real-ip               (UNTRUSTED — development fallback ONLY)
 *   5. "unknown"               (no usable source)
 *
 * In production (Cloudflare runtime detected), steps 3–4 are skipped so a
 * spoofed XFF cannot influence the bucket key. In local development there is no
 * Cloudflare edge, so we permit the dev-proxy headers to keep `next dev` usable.
 */

/** Headers Cloudflare sets at its edge and that clients cannot forge through it. */
const CF_TRUSTED_HEADERS = ["cf-connecting-ip", "true-client-ip"] as const;

/** Headers a local dev proxy may set. Spoofable — never trusted in production. */
const DEV_FALLBACK_HEADERS = ["x-forwarded-for", "x-real-ip"] as const;

/**
 * Detect whether we are running behind Cloudflare. We treat the presence of the
 * Cloudflare-only `cf-ray` header (added to every request that transits the CF
 * edge) as the signal. `CF_PAGES`/Workers env is not always visible from the
 * fetch handler, so we rely on the request itself, which is the safest source.
 *
 * Exported for testing and so callers can branch on runtime if needed.
 */
export function isCloudflareRuntime(request: Request): boolean {
  // `cf-ray` is injected by Cloudflare for every edge-served request and cannot
  // be set by an upstream client in a way that reaches our Worker as a forgery
  // (Cloudflare overwrites it). Also accept an explicit opt-out for local prod
  // emulation via TRUST_CLOUDFLARE_HEADERS=1.
  if (request.headers.has("cf-ray")) return true;
  if (request.headers.has("cf-connecting-ip")) return true;
  if (process.env.TRUST_CLOUDFLARE_HEADERS === "1") return true;
  return false;
}

function firstHeaderIp(value: string | null): string | null {
  if (!value) return null;
  // XFF can be a comma-separated chain "client, proxy1, proxy2"; take the first.
  const first = value.split(",")[0]?.trim();
  return first ? first : null;
}

/**
 * Resolve the best-effort client IP for the given request following the
 * precedence order documented above.
 *
 * @param request  The incoming Request.
 * @param options.allowInsecureFallback  Force-enable the dev fallback headers
 *   (used by tests). Defaults to "only when not on Cloudflare".
 */
export function getClientIp(
  request: Request,
  options: { allowInsecureFallback?: boolean } = {},
): string {
  // 1–2: Cloudflare-trusted headers always win when present.
  for (const header of CF_TRUSTED_HEADERS) {
    const ip = firstHeaderIp(request.headers.get(header));
    if (ip) return ip;
  }

  // In production behind Cloudflare we STOP here. If the trusted headers are
  // absent for some reason, we must not fall back to spoofable headers — doing
  // so would reopen the bypass. Return "unknown" instead (shared bucket).
  const onCloudflare = isCloudflareRuntime(request);
  const allowFallback = options.allowInsecureFallback ?? !onCloudflare;
  if (!allowFallback) {
    return "unknown";
  }

  // 3–4: development-only fallbacks (spoofable; never reached in production).
  for (const header of DEV_FALLBACK_HEADERS) {
    const ip = firstHeaderIp(request.headers.get(header));
    if (ip) return ip;
  }

  // 5: nothing usable.
  return "unknown";
}
