-- Enable PostGIS
CREATE EXTENSION IF NOT EXISTS postgis SCHEMA public;

-- Ensure profiles has is_admin column for admin RLS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin boolean DEFAULT false;

-- Drop existing MVP table if exists
DROP TABLE IF EXISTS public.charging_locations CASCADE;

-- 1. Operators
CREATE TABLE public.charging_operators (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name_ar text NOT NULL,
    name_en text,
    website text,
    support_phone text,
    logo_url text,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 2. Charging Stations
CREATE TABLE public.charging_stations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_id uuid REFERENCES public.charging_operators(id) ON DELETE SET NULL,
    name_ar text NOT NULL,
    name_en text,
    city text,
    area text,
    latitude numeric NOT NULL,
    longitude numeric NOT NULL,
    location geography(Point, 4326),
    
    verification_status text DEFAULT 'discovered' 
        CHECK (verification_status IN ('discovered', 'google_verified', 'operator_verified', 'admin_reviewed', 'published')),
    operational_status text DEFAULT 'operational'
        CHECK (operational_status IN ('operational', 'under_construction', 'planned', 'temporarily_closed', 'permanently_closed')),
        
    is_24h boolean DEFAULT false,
    opening_hours_ar text,
    pricing_model text DEFAULT 'unknown' CHECK (pricing_model IN ('per_kwh', 'per_session', 'free', 'unknown')),
    price_notes_ar text,
    payment_methods text[],
    amenities text[],
    google_maps_url text,
    
    data_quality_score int DEFAULT 0 CHECK (data_quality_score >= 0 AND data_quality_score <= 100),
    source_data jsonb,
    
    deleted_at timestamptz NULL,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Geospatial index
CREATE INDEX charging_stations_location_idx ON public.charging_stations USING GIST(location);

-- Function to keep location geography updated
CREATE OR REPLACE FUNCTION sync_station_location()
RETURNS trigger AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude::double precision, NEW.latitude::double precision), 4326)::geography;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sync_station_location
BEFORE INSERT OR UPDATE OF latitude, longitude ON public.charging_stations
FOR EACH ROW EXECUTE FUNCTION sync_station_location();

-- 3. Connectors
CREATE TABLE public.charging_connectors (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id uuid NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
    connector_type text NOT NULL, -- e.g., 'ccs2', 'chademo', 'type2'
    power_kw numeric,
    max_amps numeric,
    voltage_type text CHECK (voltage_type IN ('AC', 'DC', 'unknown')),
    status text DEFAULT 'unknown',
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- 4. Station Images
CREATE TABLE public.station_images (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id uuid NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
    image_url text NOT NULL,
    source text,
    uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    is_primary boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- 5. Community Reports
CREATE TABLE public.station_community_reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id uuid NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status text NOT NULL CHECK (status IN ('available', 'busy', 'long_queue', 'broken', 'closed')),
    notes text,
    reported_at timestamptz DEFAULT now()
);

-- 6. Audit Logs
CREATE TABLE public.station_audit_logs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    station_id uuid NOT NULL REFERENCES public.charging_stations(id) ON DELETE CASCADE,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    old_data jsonb,
    new_data jsonb,
    created_at timestamptz DEFAULT now()
);

-- Set updated_at triggers (Assuming handle_updated_at or set_updated_at exists. Supabase standard is handle_updated_at but I will use the one found in older migrations if needed. I will check the exact function name if it errors, but often it's 'set_updated_at'. Actually I will just omit it or use the standard.)
-- Supabase docs often use a custom function. In 005_supported_vehicles_mvp it used a trigger. I will just define a generic one.
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_charging_operators_updated_at BEFORE UPDATE ON public.charging_operators FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_charging_stations_updated_at BEFORE UPDATE ON public.charging_stations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_charging_connectors_updated_at BEFORE UPDATE ON public.charging_connectors FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- RLS
ALTER TABLE public.charging_operators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_stations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charging_connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_community_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.station_audit_logs ENABLE ROW LEVEL SECURITY;

-- Public can read operators
CREATE POLICY "Public can read operators" ON public.charging_operators FOR SELECT USING (is_active = true);

-- Public can read published, non-deleted stations
CREATE POLICY "Public can read published stations" ON public.charging_stations FOR SELECT USING (
    deleted_at IS NULL 
    AND verification_status = 'published' 
    AND is_active = true
);

-- Public can read connectors of published stations
CREATE POLICY "Public can read connectors" ON public.charging_connectors FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.charging_stations s WHERE s.id = station_id AND s.deleted_at IS NULL AND s.verification_status = 'published')
);

-- Public can read images of published stations
CREATE POLICY "Public can read station images" ON public.station_images FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.charging_stations s WHERE s.id = station_id AND s.deleted_at IS NULL AND s.verification_status = 'published')
);

-- Anyone can read reports
CREATE POLICY "Public can read community reports" ON public.station_community_reports FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.charging_stations s WHERE s.id = station_id AND s.deleted_at IS NULL AND s.verification_status = 'published')
);

-- Authenticated users can submit reports
CREATE POLICY "Authenticated users can submit reports" ON public.station_community_reports FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can do everything (assuming an is_admin logic in public.profiles)
CREATE POLICY "Admins full access on operators" ON public.charging_operators FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins full access on stations" ON public.charging_stations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins full access on connectors" ON public.charging_connectors FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins full access on station images" ON public.station_images FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins full access on audit logs" ON public.station_audit_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admins full access on community reports" ON public.station_community_reports FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
