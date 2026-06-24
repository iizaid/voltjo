import "server-only";

import { getSupportedVehicleBySlug } from "@/lib/vehicles/queries";
import { getCachedVehicleCatalog } from "@/lib/vehicles/catalog-cache";
import type { SupportedVehicle } from "@/lib/vehicles/types";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildVehicleSummaryText(vehicle: SupportedVehicle) {
  const priceRange =
    vehicle.priceJodMin && vehicle.priceJodMax
      ? `السعر التقريبي في الأردن: ${vehicle.priceJodMin}–${vehicle.priceJodMax} دينار`
      : null;

  const drivetrainLabels: Record<string, string> = {
    fwd: "أمامي (FWD)",
    rwd: "خلفي (RWD)",
    awd: "رباعي (AWD)",
  };

  const charging = [
    vehicle.acChargeKw ? `AC ${vehicle.acChargeKw} kW` : null,
    vehicle.dcChargeKw ? `DC ${vehicle.dcChargeKw} kW` : null,
    vehicle.charge1080Min ? `شحن 10–80٪ ~${vehicle.charge1080Min} دقيقة` : null,
  ].filter(Boolean);

  const facts = [
    `السيارة: ${vehicle.nameAr} ${vehicle.modelYear}`,
    `النوع: ${vehicle.vehicleType}`,
    vehicle.batteryKwh ? `البطارية: ${vehicle.batteryKwh} kWh` : null,
    vehicle.electricRangeKm ? `المدى الكهربائي: ${vehicle.electricRangeKm} كم` : null,
    vehicle.totalRangeKm ? `المدى الإجمالي: ${vehicle.totalRangeKm} كم` : null,
    vehicle.efficiencyKwh100km ? `الكفاءة: ${vehicle.efficiencyKwh100km} kWh/100km` : null,
    vehicle.engineLiters ? `المحرك: ${vehicle.engineLiters} لتر` : null,
    vehicle.drivetrain ? `الدفع: ${drivetrainLabels[vehicle.drivetrain] ?? vehicle.drivetrain}` : null,
    vehicle.chargingPort ? `منفذ الشحن: ${vehicle.chargingPort}` : null,
    charging.length ? `الشحن: ${charging.join(" / ")}` : null,
    priceRange,
    // Structured strengths/weaknesses (migration 011) are now first-class facts,
    // not buried in prose — the model can compare and rank on them directly.
    vehicle.strengthsAr.length ? `نقاط القوة: ${vehicle.strengthsAr.join("، ")}` : null,
    vehicle.weaknessesAr.length ? `نقاط الضعف: ${vehicle.weaknessesAr.join("، ")}` : null,
    vehicle.useCaseTags.length ? `الاستخدامات المناسبة: ${vehicle.useCaseTags.join("، ")}` : null,
    // summary_ar remains as a narrative fallback for facts without a column yet.
    vehicle.summaryAr ? `الملخص: ${vehicle.summaryAr}` : null,
    vehicle.jordanNotesAr ? `ملاحظات الأردن: ${vehicle.jordanNotesAr}` : null,
  ].filter(Boolean);

  const profiles = vehicle.costProfiles?.length
    ? vehicle.costProfiles
        .map((profile) => {
          const parts = [
            `سيناريو ${profile.scenario}`,
            profile.electricityKwh100km
              ? `${profile.electricityKwh100km} kWh/100km`
              : null,
            profile.fuelL100km ? `${profile.fuelL100km} L/100km` : null,
          ].filter(Boolean);
          return parts.join(" - ");
        })
        .join(" | ")
    : null;

  return [facts.join(" | "), profiles ? `ملفات تكلفة: ${profiles}` : null]
    .filter(Boolean)
    .join("\n");
}

export async function getVehicleContextBySlug(slug: string) {
  const vehicle = await getSupportedVehicleBySlug(slug);
  if (!vehicle) return null;

  return buildVehicleSummaryText(vehicle);
}

export async function buildVehicleContextForPrompt(message: string) {
  const normalizedMessage = normalizeText(message);
  if (!normalizedMessage) return null;

  const vehicles = await getCachedVehicleCatalog();
  const matches = vehicles.filter((vehicle) => {
    const haystack = normalizeText(
      [vehicle.slug, vehicle.nameAr, vehicle.nameEn, vehicle.brand.nameAr, vehicle.brand.nameEn].join(" "),
    );

    return haystack.split(" ").some((token) => token && normalizedMessage.includes(token));
  });

  if (matches.length === 0) return null;

  const topMatches = matches.slice(0, 2);
  return topMatches.map(buildVehicleSummaryText).join("\n\n");
}
