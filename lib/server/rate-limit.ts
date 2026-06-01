type RateLimitResult =
  | { ok: true }
  | { ok: false; resetAt: number; message: string };

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
    return { ok: true };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      resetAt: existing.resetAt,
      message: "محاولات كثيرة. حاول بعد قليل.",
    };
  }

  existing.count += 1;
  buckets.set(bucketKey, existing);
  return { ok: true };
}
