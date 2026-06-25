CREATE OR REPLACE FUNCTION get_nearest_charging_stations(
  user_lat double precision,
  user_lng double precision,
  max_distance_meters double precision DEFAULT 50000,
  limit_count integer DEFAULT 100
) RETURNS TABLE (
  id uuid,
  operator_id uuid,
  name_ar text,
  name_en text,
  city text,
  area text,
  latitude numeric,
  longitude numeric,
  verification_status text,
  operational_status text,
  is_24h boolean,
  opening_hours_ar text,
  pricing_model text,
  price_notes_ar text,
  payment_methods text[],
  amenities text[],
  google_maps_url text,
  data_quality_score int,
  source_data jsonb,
  deleted_at timestamptz,
  is_active boolean,
  distance_meters double precision
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.operator_id,
    s.name_ar,
    s.name_en,
    s.city,
    s.area,
    s.latitude,
    s.longitude,
    s.verification_status,
    s.operational_status,
    s.is_24h,
    s.opening_hours_ar,
    s.pricing_model,
    s.price_notes_ar,
    s.payment_methods,
    s.amenities,
    s.google_maps_url,
    s.data_quality_score,
    s.source_data,
    s.deleted_at,
    s.is_active,
    ST_Distance(s.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography) AS distance_meters
  FROM public.charging_stations s
  WHERE 
    s.deleted_at IS NULL 
    AND s.verification_status = 'published' 
    AND s.is_active = true
    AND ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(user_lng, user_lat), 4326)::geography, max_distance_meters)
  ORDER BY distance_meters ASC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
