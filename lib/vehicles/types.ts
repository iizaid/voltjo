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

export type ChargingOperator = {
  id: string;
  nameAr: string;
  nameEn: string | null;
  website: string | null;
  supportPhone: string | null;
  logoUrl: string | null;
  isActive: boolean;
};

export type ChargingConnector = {
  id: string;
  stationId: string;
  connectorType: string;
  powerKw: number | null;
  maxAmps: number | null;
  voltageType: 'AC' | 'DC' | 'unknown' | null;
  status: string | null;
};

export type StationImage = {
  id: string;
  stationId: string;
  imageUrl: string;
  source: string | null;
  uploadedBy: string | null;
  isPrimary: boolean;
};

export type StationCommunityReport = {
  id: string;
  stationId: string;
  userId: string | null;
  status: 'available' | 'busy' | 'long_queue' | 'broken' | 'closed';
  notes: string | null;
  reportedAt: string;
};

export type ChargingStation = {
  id: string;
  operatorId: string | null;
  nameAr: string;
  nameEn: string | null;
  city: string | null;
  area: string | null;
  latitude: number;
  longitude: number;
  verificationStatus: 'discovered' | 'google_verified' | 'operator_verified' | 'admin_reviewed' | 'published';
  operationalStatus: 'operational' | 'under_construction' | 'planned' | 'temporarily_closed' | 'permanently_closed';
  is24h: boolean;
  openingHoursAr: string | null;
  pricingModel: 'per_kwh' | 'per_session' | 'free' | 'unknown';
  priceNotesAr: string | null;
  paymentMethods: string[];
  amenities: string[];
  googleMapsUrl: string | null;
  dataQualityScore: number;
  sourceData: any | null;
  deletedAt: string | null;
  isActive: boolean;

  // Relations
  operator?: ChargingOperator | null;
  connectors?: ChargingConnector[];
  images?: StationImage[];
  latestReport?: StationCommunityReport | null;
  
  // Computed distance in meters when queried geospatially
  distanceMeters?: number;
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
