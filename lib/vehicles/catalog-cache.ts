import "server-only";

import { listSupportedVehicles } from "@/lib/vehicles/queries";
import type { SupportedVehicle } from "@/lib/vehicles/types";

/**
 * In-process TTL cache for the full Jordan vehicle catalog.
 *
 * The AI context layer (`lib/ai/vehicle-context.ts`) needs the catalog on EVERY
 * chat message to ground answers. Hitting Supabase per message put a DB
 * round-trip on the critical path of generation (a direct TTFT tax). The catalog
 * is tiny (single digits of rows today) and changes rarely, so a short-lived
 * in-process cache is the right trade-off: warm requests pay ~0ms, and a stale
 * window of `TTL_MS` is acceptable for slow-moving spec data.
 *
 * Runtime-safe: a plain module-scoped variable. On serverless/edge this caches
 * per warm instance — exactly the hot-path win we want, with no external deps.
 * Concurrent callers during a cold window share a single in-flight promise so we
 * never fan out N identical queries.
 */
const TTL_MS = 60 * 60 * 1000; // 1 hour

let cachedVehicles: SupportedVehicle[] | null = null;
let cachedAt = 0;
let inFlight: Promise<SupportedVehicle[]> | null = null;

/** Returns the catalog, served from cache when fresh. Never throws (fails to []). */
export async function getCachedVehicleCatalog(): Promise<SupportedVehicle[]> {
  const now = Date.now();
  if (cachedVehicles && now - cachedAt < TTL_MS) {
    return cachedVehicles;
  }

  // Collapse a concurrent stampede during the cold window onto one query.
  if (inFlight) return inFlight;

  inFlight = listSupportedVehicles()
    .then((vehicles) => {
      cachedVehicles = vehicles;
      cachedAt = Date.now();
      return vehicles;
    })
    .catch(() => {
      // Serve stale on failure if we have it; otherwise empty (context is
      // best-effort and must never block a reply).
      return cachedVehicles ?? [];
    })
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Test/admin hook: drop the cache so the next read re-queries. */
export function invalidateVehicleCatalogCache(): void {
  cachedVehicles = null;
  cachedAt = 0;
}
