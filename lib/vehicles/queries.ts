import "server-only";

import { createPublicClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";
import type {
  ChargingCostInputs,
  ChargingLocation,
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
type RawChargingLocationRow = Database["public"]["Tables"]["charging_locations"]["Row"];

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

export async function listChargingLocations(): Promise<ChargingLocation[]> {
  const supabase = createPublicClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("charging_locations")
    .select("*")
    .eq("is_active", true)
    .order("city", { ascending: true })
    .order("name_ar", { ascending: true });

  if (error || !data) return [];

  return data.map((row: RawChargingLocationRow) => ({
    id: row.id,
    nameAr: row.name_ar,
    nameEn: row.name_en,
    city: row.city,
    area: row.area,
    latitude: row.latitude,
    longitude: row.longitude,
    plugTypes: row.plug_types ?? [],
    powerKw: row.power_kw,
    isVerified: row.is_verified,
    source: row.source,
    notesAr: row.notes_ar,
  }));
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
