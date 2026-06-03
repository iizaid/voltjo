import "server-only";

import { getRedisClient } from "@/lib/server/redis";

// Durable auth rate limiter backed by Upstash Redis so login/signup limits hold
// across serverless instances and restarts. Atomic INCR + PEXPIRE fixed window.
// Fail-closed: if the store is unconfigured or unreachable, deny the attempt
// rather than allow unlimited auth attempts. Raw Redis errors are never exposed.
type RateLimitAction = "login" | "signup";

type RateLimitConfig = {
  maxAttempts: number;
  windowMs: number;
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

export const RATE_LIMIT_MESSAGE = "محاولات كثيرة. حاول مرة أخرى بعد قليل.";

function getRateLimitKey(action: RateLimitAction, email: string) {
  return `authratelimit:${action}:${email.toLowerCase()}`;
}

export async function checkAuthRateLimit(
  action: RateLimitAction,
  email: string,
) {
  const config = LIMITS[action];
  const redis = getRedisClient();
  const currentTime = Date.now();

  if (!redis) {
    // Fail closed: deny auth attempts when no shared store is configured.
    console.warn("auth-rate-limit: store unavailable", {
      action,
      reason: "missing-config",
    });
    return {
      ok: false as const,
      message: RATE_LIMIT_MESSAGE,
      resetAt: currentTime + config.windowMs,
    };
  }

  const key = getRateLimitKey(action, email);

  try {
    const count = await redis.incr(key);

    let pttl: number;
    if (count === 1) {
      await redis.pexpire(key, config.windowMs);
      pttl = config.windowMs;
    } else {
      pttl = await redis.pttl(key);
      if (pttl < 0) {
        await redis.pexpire(key, config.windowMs);
        pttl = config.windowMs;
      }
    }

    if (count > config.maxAttempts) {
      return {
        ok: false as const,
        message: RATE_LIMIT_MESSAGE,
        resetAt: currentTime + pttl,
      };
    }

    return { ok: true as const };
  } catch (error) {
    console.warn("auth-rate-limit: store error", {
      action,
      error: error instanceof Error ? error.name : "unknown",
    });
    return {
      ok: false as const,
      message: RATE_LIMIT_MESSAGE,
      resetAt: currentTime + config.windowMs,
    };
  }
}

export async function clearAuthRateLimit(
  action: RateLimitAction,
  email: string,
) {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.del(getRateLimitKey(action, email));
  } catch (error) {
    // Best effort: failing to clear leaves the bucket to expire naturally.
    console.warn("auth-rate-limit: clear failed", {
      action,
      error: error instanceof Error ? error.name : "unknown",
    });
  }
}
