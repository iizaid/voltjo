export type VehicleType = "ev" | "phev" | "hev";
export type VehicleConfidence = "official" | "dealer" | "owner_reported" | "estimate";
export type VehicleDrivetrain = "fwd" | "rwd" | "awd";
export type VehicleAvailability = "available" | "preorder" | "discontinued" | "unconfirmed";

export type VehicleBrand = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  country: string | null;
};

export type VehicleCostProfile = {
  id: string;
  scenario: string;
  electricityKwh100km: number | null;
  fuelL100km: number | null;
  notesAr: string | null;
  confidence: VehicleConfidence;
};

export type SupportedVehicle = {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  modelYear: number;
  vehicleType: VehicleType;
  bodyType: string | null;
  market: string;
  batteryKwh: number | null;
  fuelTankLiters: number | null;
  engineLiters: number | null;
  electricRangeKm: number | null;
  totalRangeKm: number | null;
  priceJodMin: number | null;
  priceJodMax: number | null;
  chargingPort: string | null;
  dcFastCharging: boolean | null;
  homeChargingSupported: boolean | null;
  drivetrain: VehicleDrivetrain | null;
  acChargeKw: number | null;
  dcChargeKw: number | null;
  efficiencyKwh100km: number | null;
  charge1080Min: number | null;
  availability: VehicleAvailability;
  useCaseTags: string[];
  strengthsAr: string[];
  weaknessesAr: string[];
  summaryAr: string | null;
  jordanNotesAr: string | null;
  dataConfidence: VehicleConfidence;
  brand: VehicleBrand;
  costProfiles?: VehicleCostProfile[];
};

export type ChargingLocation = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  city: string | null;
  area: string | null;
  latitude: number | null;
  longitude: number | null;
  plugTypes: string[];
  powerKw: number | null;
  isVerified: boolean;
  source: string | null;
  notesAr: string | null;
};

export type ChargingCalculatorVehicleOption = {
  slug: string;
  label: string;
  batteryKwh: number;
};

export type ChargingCostInputs = {
  vehicles: ChargingCalculatorVehicleOption[];
  defaultElectricityPriceJodPerKwh: number;
  defaultEfficiencyPercent: number;
};

export const vehicleTypeLabels: Record<VehicleType, string> = {
  ev: "كهربائية",
  hev: "هايبرد",
  phev: "Plug-in Hybrid",
};

export const confidenceLabels: Record<VehicleConfidence, string> = {
  official: "رسمي",
  dealer: "من الوكيل",
  owner_reported: "من ملاك",
  estimate: "تقديري",
};
