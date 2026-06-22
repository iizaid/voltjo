-- ============================================================
-- VoltJo Database Hardening & Performance Indexes
-- Migration: 008_db_hardening_and_indexes
-- Date: 2026-06-22
-- ============================================================

-- ------------------------------------------------------------
-- 1. Tighten charging_locations RLS Policy
-- ------------------------------------------------------------
-- Ensure public can only read active AND verified charging locations.
-- This prevents unverified data from being exposed prematurely.
--
DROP POLICY IF EXISTS "Public can read active charging locations" ON public.charging_locations;
CREATE POLICY "Public can read active charging locations"
  ON public.charging_locations
  FOR SELECT
  TO public
  USING (is_active = true AND is_verified = true);

-- ------------------------------------------------------------
-- 2. Add JSONB Object Check Constraints on profiles
-- ------------------------------------------------------------
-- Prevent malformed JSON data types (e.g. arrays or primitives)
-- from being written directly to JSONB settings columns.
--
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_avatar_config_is_object,
  ADD CONSTRAINT profiles_avatar_config_is_object
    CHECK (avatar_config IS NULL OR jsonb_typeof(avatar_config) = 'object');

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_privacy_settings_is_object,
  ADD CONSTRAINT profiles_privacy_settings_is_object
    CHECK (privacy_settings IS NULL OR jsonb_typeof(privacy_settings) = 'object');

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_location_preferences_is_object,
  ADD CONSTRAINT profiles_location_preferences_is_object
    CHECK (location_preferences IS NULL OR jsonb_typeof(location_preferences) = 'object');

-- ------------------------------------------------------------
-- 3. Performance Indexes
-- ------------------------------------------------------------
-- Optimization for vehicles list query (market/active/model_year/name_ar)
CREATE INDEX IF NOT EXISTS idx_sv_market_active_year_name
  ON public.supported_vehicles (market, is_active, model_year DESC, name_ar ASC);

-- Optimization for cost profiles join (vehicle_id/scenario)
CREATE INDEX IF NOT EXISTS idx_vcp_vehicle_scenario
  ON public.vehicle_cost_profiles (vehicle_id, scenario ASC);

-- Optimization for active charging locations search (is_active/city/name_ar)
CREATE INDEX IF NOT EXISTS idx_cl_active_city_name
  ON public.charging_locations (is_active, city ASC, name_ar ASC)
  WHERE is_active = true;
