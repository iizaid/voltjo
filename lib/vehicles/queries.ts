import "server-only";

import { createPublicClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type {
  ChargingCostInputs,
  ChargingStation,
  ChargingOperator,
  ChargingConnector,
  StationCommunityReport,
  StationImage,
  SupportedVehicle,
  VehicleBrand,
  VehicleCostProfile,
  VehicleType,
} from "@/lib/vehicles/types";

type VehicleFilters = {
  brandSlug?: string;
  vehicleType?: VehicleType;
};

type RawBrandRow = Database["public"]["Tables"]["vehicle_brands"]["Row"];
type RawVehicleRow = Database["public"]["Tables"]["supported_vehicles"]["Row"];
type RawCostProfileRow = Database["public"]["Tables"]["vehicle_cost_profiles"]["Row"];
type RawChargingStationRow = any; // Supabase types will be regenerated later

function mapBrand(row: RawBrandRow): VehicleBrand {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    country: row.country,
  };
}

function mapCostProfile(row: RawCostProfileRow): VehicleCostProfile {
  return {
    id: row.id,
    scenario: row.scenario,
    electricityKwh100km: row.electricity_kwh_100km,
    fuelL100km: row.fuel_l_100km,
    notesAr: row.notes_ar,
    confidence: row.confidence,
  };
}

function mapVehicle(
  row: RawVehicleRow,
  brand: RawBrandRow,
  costProfiles?: RawCostProfileRow[],
): SupportedVehicle {
  return {
    id: row.id,
    slug: row.slug,
    nameEn: row.name_en,
    nameAr: row.name_ar,
    modelYear: row.model_year,
    vehicleType: row.vehicle_type,
    bodyType: row.body_type,
    market: row.market,
    batteryKwh: row.battery_kwh,
    fuelTankLiters: row.fuel_tank_liters,
    engineLiters: row.engine_liters,
    electricRangeKm: row.electric_range_km,
    totalRangeKm: row.total_range_km,
    priceJodMin: row.price_jod_min,
    priceJodMax: row.price_jod_max,
    chargingPort: row.charging_port,
    dcFastCharging: row.dc_fast_charging,
    homeChargingSupported: row.home_charging_supported,
    drivetrain: row.drivetrain,
    acChargeKw: row.ac_charge_kw,
    dcChargeKw: row.dc_charge_kw,
    efficiencyKwh100km: row.efficiency_kwh_100km,
    charge1080Min: row.charge_10_80_min,
    availability: row.availability,
    useCaseTags: row.use_case_tags ?? [],
    strengthsAr: row.strengths_ar ?? [],
    weaknessesAr: row.weaknesses_ar ?? [],
    summaryAr: row.summary_ar,
    jordanNotesAr: row.jordan_notes_ar,
    dataConfidence: row.data_confidence,
    brand: mapBrand(brand),
    costProfiles: costProfiles?.map(mapCostProfile) ?? [],
  };
}

export async function listVehicleBrands(): Promise<VehicleBrand[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("vehicle_brands")
    .select("*")
    .order("name_ar", { ascending: true });

  if (error || !data) return [];
  return data.map(mapBrand);
}

export async function listSupportedVehicles(
  filters?: VehicleFilters,
): Promise<SupportedVehicle[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("supported_vehicles")
    .select("*, brand:vehicle_brands(*)")
    .eq("is_active", true)
    .eq("market", "jordan")
    .order("model_year", { ascending: false })
    .order("name_ar", { ascending: true });

  if (error || !data) return [];

  return data
    .filter((row) => row.brand)
    .filter((row) =>
      filters?.vehicleType ? row.vehicle_type === filters.vehicleType : true,
    )
    .filter((row) =>
      filters?.brandSlug ? row.brand.slug === filters.brandSlug : true,
    )
    .map((row) => mapVehicle(row, row.brand));
}

export async function getSupportedVehicleBySlug(
  slug: string,
): Promise<SupportedVehicle | null> {
  const supabase = createPublicClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("supported_vehicles")
    .select("*, brand:vehicle_brands(*)")
    .eq("slug", slug)
    .eq("is_active", true)
    .eq("market", "jordan")
    .maybeSingle();

  if (error || !data?.brand) return null;

  const { data: costProfiles, error: costProfilesError } = await supabase
    .from("vehicle_cost_profiles")
    .select("*")
    .eq("vehicle_id", data.id)
    .order("scenario", { ascending: true });

  return mapVehicle(
    data,
    data.brand,
    costProfilesError || !costProfiles ? [] : costProfiles,
  );
}

export async function listChargingStations(
  userLat?: number,
  userLng?: number,
  maxDistanceMeters: number = 50000
): Promise<ChargingStation[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  let query = supabase
    .from("charging_stations")
    .select(`
      *,
      operator:charging_operators(*),
      connectors:charging_connectors(*),
      images:station_images(*),
      latestReport:station_community_reports(*)
    `)
    .eq("is_active", true)
    .eq("verification_status", "published")
    .is("deleted_at", null);

  let distancesMap = new Map<string, number>();

  if (userLat && userLng) {
    // PostGIS Proximity Query
    const { data: nearestStations, error: rpcError } = await supabase.rpc(
      "get_nearest_charging_stations",
      {
        user_lat: userLat,
        user_lng: userLng,
        max_distance_meters: maxDistanceMeters,
        limit_count: 100,
      }
    );

    if (rpcError || !nearestStations) {
      console.error("Error executing PostGIS proximity query:", rpcError);
      return [];
    }

    if (nearestStations.length === 0) return [];

    const stationIds = nearestStations.map((s: any) => s.id);
    query = query.in("id", stationIds);

    nearestStations.forEach((s: any) => {
      distancesMap.set(s.id, s.distance_meters);
    });
  }

  const { data, error } = await query;

  if (error || !data) {
    console.error("Error fetching charging stations:", error);
    return [];
  }

  // Map the raw data to the ChargingStation type
  let stations = data.map((row: any): ChargingStation => ({
    id: row.id,
    operatorId: row.operator_id,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    city: row.city,
    area: row.area,
    latitude: row.latitude,
    longitude: row.longitude,
    verificationStatus: row.verification_status,
    operationalStatus: row.operational_status,
    is24h: row.is_24h,
    openingHoursAr: row.opening_hours_ar,
    pricingModel: row.pricing_model,
    priceNotesAr: row.price_notes_ar,
    paymentMethods: row.payment_methods ?? [],
    amenities: row.amenities ?? [],
    googleMapsUrl: row.google_maps_url,
    dataQualityScore: row.data_quality_score,
    sourceData: row.source_data,
    deletedAt: row.deleted_at,
    isActive: row.is_active,
    
    // Relations
    operator: row.operator,
    connectors: row.connectors ?? [],
    images: row.images ?? [],
    latestReport: row.latestReport && row.latestReport.length > 0 
      ? row.latestReport.sort((a: any, b: any) => new Date(b.reported_at).getTime() - new Date(a.reported_at).getTime())[0] 
      : null,
      
    // Geolocation distance
    distanceMeters: distancesMap.get(row.id),
  }));

  if (userLat && userLng) {
    // Sort by distance using the mapped distances from PostGIS
    stations.sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
  } else {
    // Default sorting
    stations.sort((a, b) => a.nameAr.localeCompare(b.nameAr));
  }

  return stations;
}

export async function getChargingCostInputs(): Promise<ChargingCostInputs> {
  const vehicles = await listSupportedVehicles();

  return {
    vehicles: vehicles
      .filter((vehicle) => typeof vehicle.batteryKwh === "number" && vehicle.batteryKwh > 0)
      .map((vehicle) => ({
        slug: vehicle.slug,
        label: `${vehicle.nameAr} ${vehicle.modelYear}`,
        batteryKwh: vehicle.batteryKwh as number,
      })),
    defaultElectricityPriceJodPerKwh: 0.12,
    defaultEfficiencyPercent: 90,
  };
}
