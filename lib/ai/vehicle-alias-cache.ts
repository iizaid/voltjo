import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

/**
 * In-process TTL cache for the (tiny, slow-moving) vehicle alias table. Mirrors
 * `lib/vehicles/catalog-cache.ts`: warm requests pay ~0ms, a single in-flight
 * promise collapses cold-window stampedes, and any failure degrades to an empty
 * list (alias matching is best-effort; the catalog token matcher still runs).
 *
 * Loaded via the SERVICE-ROLE client because `vehicle_aliases` RLS is
 * `to authenticated`, and chat retrieval must work for anonymous users too.
 */
export type VehicleAlias = { vehicleId: string; aliasNorm: string };

const TTL_MS = 60 * 60 * 1000; // 1 hour

let cached: VehicleAlias[] | null = null;
let cachedAt = 0;
let inFlight: Promise<VehicleAlias[]> | null = null;

async function loadAliases(): Promise<VehicleAlias[]> {
  const admin = createAdminClient();
  if (!admin) return [];

  const { data, error } = await admin
    .from("vehicle_aliases")
    .select("vehicle_id, alias_norm");

  if (error || !data) return cached ?? [];
  return data.map((row) => ({ vehicleId: row.vehicle_id, aliasNorm: row.alias_norm }));
}

export async function getCachedVehicleAliases(): Promise<VehicleAlias[]> {
  const now = Date.now();
  if (cached && now - cachedAt < TTL_MS) return cached;
  if (inFlight) return inFlight;

  inFlight = loadAliases()
    .then((rows) => {
      cached = rows;
      cachedAt = Date.now();
      return rows;
    })
    .catch(() => cached ?? [])
    .finally(() => {
      inFlight = null;
    });

  return inFlight;
}

/** Test/admin hook: drop the cache so the next read re-queries. */
export function invalidateVehicleAliasCache(): void {
  cached = null;
  cachedAt = 0;
}
