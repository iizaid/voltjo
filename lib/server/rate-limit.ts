import "server-only";

// Temporary in-memory rate limiter for single-instance use only.
// Replace with shared storage or edge/network protection before public launch.
type RateLimitResult =
  | { ok: true; limit: number; remaining: number; resetAt: number }
  | { ok: false; limit: number; remaining: 0; resetAt: number; message: string };

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, RateLimitBucket>();

function now() {
  return Date.now();
}

function getBucketKey(action: string, key: string) {
  return `${action}:${key}`;
}

function cleanupExpiredBuckets(currentTime: number) {
  for (const [bucketKey, bucket] of buckets.entries()) {
    if (bucket.resetAt <= currentTime) {
      buckets.delete(bucketKey);
    }
  }
}

export function checkRateLimit({
  key,
  action,
  limit,
  windowMs,
}: {
  key: string;
  action: string;
  limit: number;
  windowMs: number;
}): RateLimitResult {
  const currentTime = now();
  cleanupExpiredBuckets(currentTime);

  const bucketKey = getBucketKey(action, key || "unknown");
  const existing = buckets.get(bucketKey);

  if (!existing || existing.resetAt <= currentTime) {
    buckets.set(bucketKey, {
      count: 1,
      resetAt: currentTime + windowMs,
    });
    return {
      ok: true,
      limit,
      remaining: Math.max(0, limit - 1),
      resetAt: currentTime + windowMs,
    };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      limit,
      remaining: 0,
      resetAt: existing.resetAt,
      message: "محاولات كثيرة. حاول بعد قليل.",
    };
  }

  existing.count += 1;
  buckets.set(bucketKey, existing);
  return {
    ok: true,
    limit,
    remaining: Math.max(0, limit - existing.count),
    resetAt: existing.resetAt,
  };
}
