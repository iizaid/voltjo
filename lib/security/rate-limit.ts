type RateLimitAction = "login" | "signup";

type RateLimitConfig = {
  maxAttempts: number;
  windowMs: number;
};

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

const LIMITS: Record<RateLimitAction, RateLimitConfig> = {
  login: {
    maxAttempts: 5,
    windowMs: 10 * 60 * 1000,
  },
  signup: {
    maxAttempts: 3,
    windowMs: 30 * 60 * 1000,
  },
};

const buckets = new Map<string, RateLimitEntry>();

export const RATE_LIMIT_MESSAGE = "محاولات كثيرة. حاول مرة أخرى بعد قليل.";

function getRateLimitKey(action: RateLimitAction, email: string) {
  return `${action}:${email.toLowerCase()}`;
}

export function checkAuthRateLimit(action: RateLimitAction, email: string) {
  const now = Date.now();
  const config = LIMITS[action];
  const key = getRateLimitKey(action, email);
  const current = buckets.get(key);

  if (!current || current.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    });
    return { ok: true as const };
  }

  if (current.count >= config.maxAttempts) {
    return {
      ok: false as const,
      message: RATE_LIMIT_MESSAGE,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  buckets.set(key, current);
  return { ok: true as const };
}

// This is intentionally in-memory for Phase 1 hardening only. Multi-instance
// production deployments must replace it with Redis/Upstash, Supabase Edge
// rate limiting, or platform/WAF-level protection.
