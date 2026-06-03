import "server-only";

import { Redis } from "@upstash/redis";

// Shared Upstash Redis client for durable, multi-instance rate limiting.
// Reads server-only env (never NEXT_PUBLIC_*). Returns null when unconfigured so
// callers can decide their own fail-closed behavior. The token/URL are never
// logged or exposed.
let cachedClient: Redis | null | undefined;

export function getRedisClient(): Redis | null {
  if (cachedClient !== undefined) {
    return cachedClient;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    cachedClient = null;
    return cachedClient;
  }

  cachedClient = new Redis({ url, token });
  return cachedClient;
}
