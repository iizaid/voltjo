-- ============================================================
-- VoltJo Proposed Performance Indexes
-- Date: 2026-06-08
-- Status: MANUAL REVIEW REQUIRED — do not apply automatically
-- ============================================================
--
-- These indexes are derived from query analysis of:
--   lib/vehicles/queries.ts and lib/auth/session.ts
--
-- Each must be reviewed by a human before applying.
-- Apply with: psql -h <host> -U <user> -d <db> -f this_file.sql
-- All indexes use CONCURRENTLY to avoid table locks.
-- Run from a migration connection, not the Supabase anon role.
-- ============================================================

-- ------------------------------------------------------------
-- 1. supported_vehicles: composite index for listSupportedVehicles
-- ------------------------------------------------------------
--
-- Query pattern (lib/vehicles/queries.ts):
--   SELECT *, brand:vehicle_brands(*)
--   FROM supported_vehicles
--   WHERE is_active = true AND market = 'jordan'
--   ORDER BY model_year DESC, name_ar ASC
--
-- Why it helps: avoids full sequential scan as vehicle count grows.
-- Rollback: DROP INDEX CONCURRENTLY idx_sv_market_active_year_name;
--
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sv_market_active_year_name
  ON public.supported_vehicles (market, is_active, model_year DESC, name_ar ASC);


-- ------------------------------------------------------------
-- 2. supported_vehicles: slug lookup for getSupportedVehicleBySlug
-- ------------------------------------------------------------
--
-- Query pattern (lib/vehicles/queries.ts):
--   SELECT *, brand:vehicle_brands(*)
--   FROM supported_vehicles
--   WHERE slug = $1 AND is_active = true AND market = 'jordan'
--   LIMIT 1
--
-- Note: slug is already UNIQUE (migration 005) — a unique index exists.
-- This partial index is optional; check EXPLAIN ANALYZE first.
-- Commented out until query plan shows benefit.
--
-- Rollback: DROP INDEX CONCURRENTLY idx_sv_slug_market_active;
--
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sv_slug_market_active
--   ON public.supported_vehicles (slug, market, is_active)
--   WHERE is_active = true AND market = 'jordan';


-- ------------------------------------------------------------
-- 3. vehicle_cost_profiles: index for cost profile joins
-- ------------------------------------------------------------
--
-- Query pattern (lib/vehicles/queries.ts):
--   SELECT * FROM vehicle_cost_profiles
--   WHERE vehicle_id = $1
--   ORDER BY scenario ASC
--
-- Why it helps: vehicle_id FK exists but composite (vehicle_id, scenario)
--   avoids an extra sort pass after the filter.
-- Rollback: DROP INDEX CONCURRENTLY idx_vcp_vehicle_scenario;
--
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vcp_vehicle_scenario
  ON public.vehicle_cost_profiles (vehicle_id, scenario ASC);


-- ------------------------------------------------------------
-- 4. charging_locations: index for listChargingLocations
-- ------------------------------------------------------------
--
-- Query pattern (lib/vehicles/queries.ts):
--   SELECT * FROM charging_locations
--   WHERE is_active = true
--   ORDER BY city ASC, name_ar ASC
--
-- Rollback: DROP INDEX CONCURRENTLY idx_cl_active_city_name;
--
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_cl_active_city_name
  ON public.charging_locations (is_active, city ASC, name_ar ASC)
  WHERE is_active = true;


-- ------------------------------------------------------------
-- 5. profiles: PK lookup for getCurrentUserAndProfile
-- ------------------------------------------------------------
--
-- Query pattern (lib/auth/session.ts):
--   SELECT * FROM profiles WHERE id = $1 LIMIT 1
--
-- profiles.id is the PK — index already exists. No action needed.


-- ============================================================
-- Verification queries (run after applying indexes)
-- ============================================================
--
-- Check indexes exist:
--   SELECT indexname, tablename
--   FROM pg_indexes
--   WHERE schemaname = 'public'
--     AND indexname IN (
--       'idx_sv_market_active_year_name',
--       'idx_vcp_vehicle_scenario',
--       'idx_cl_active_city_name'
--     );
--
-- Check query plan for vehicles list:
--   EXPLAIN ANALYZE
--   SELECT * FROM supported_vehicles
--   WHERE is_active = true AND market = 'jordan'
--   ORDER BY model_year DESC, name_ar ASC;
-- ============================================================
