import "server-only";

import { getRedisClient } from "@/lib/server/redis";

// Durable rate limiter backed by Upstash Redis so limits hold across serverless
// instances and restarts. Uses an atomic INCR + PEXPIRE fixed-window counter.
// Fail-closed: if the store is unconfigured or unreachable, deny rather than
// allow unlimited requests. Raw Redis errors are never exposed to callers.
type RateLimitResult =
  | { ok: true; limit: number; remaining: number; resetAt: number }
  | { ok: false; limit: number; remaining: 0; resetAt: number; message: string };

const RATE_LIMIT_MESSAGE = "محاولات كثيرة. حاول بعد قليل.";

function getBucketKey(action: string, key: string) {
  return `ratelimit:${action}:${key || "unknown"}`;
}

function denied(limit: number, windowMs: number): RateLimitResult {
  return {
    ok: false,
    limit,
    remaining: 0,
    resetAt: Date.now() + windowMs,
    message: RATE_LIMIT_MESSAGE,
  };
}

export async function checkRateLimit({
  key,
  action,
  limit,
  windowMs,
}: {
  key: string;
  action: string;
  limit: number;
  windowMs: number;
}): Promise<RateLimitResult> {
  const redis = getRedisClient();

  if (!redis) {
    // Fail closed: no shared store means we cannot safely allow traffic.
    console.warn("rate-limit: store unavailable", {
      action,
      reason: "missing-config",
    });
    return denied(limit, windowMs);
  }

  const bucketKey = getBucketKey(action, key);
  const currentTime = Date.now();

  try {
    const count = await redis.incr(bucketKey);

    let pttl: number;
    if (count === 1) {
      await redis.pexpire(bucketKey, windowMs);
      pttl = windowMs;
    } else {
      pttl = await redis.pttl(bucketKey);
      if (pttl < 0) {
        // Key exists without a TTL (unexpected) — re-arm the window.
        await redis.pexpire(bucketKey, windowMs);
        pttl = windowMs;
      }
    }

    const resetAt = currentTime + pttl;

    if (count > limit) {
      return {
        ok: false,
        limit,
        remaining: 0,
        resetAt,
        message: RATE_LIMIT_MESSAGE,
      };
    }

    return {
      ok: true,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt,
    };
  } catch (error) {
    // Fail closed on store errors. Log only the action and error name — never
    // the Redis URL, token, or full error object.
    console.warn("rate-limit: store error", {
      action,
      error: error instanceof Error ? error.name : "unknown",
    });
    return denied(limit, windowMs);
  }
}
