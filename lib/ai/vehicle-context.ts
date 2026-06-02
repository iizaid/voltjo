import "server-only";

import { getSupportedVehicleBySlug, listSupportedVehicles } from "@/lib/vehicles/queries";
import type { SupportedVehicle } from "@/lib/vehicles/types";

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildVehicleSummaryText(vehicle: SupportedVehicle) {
  const facts = [
    `السيارة: ${vehicle.nameAr} ${vehicle.modelYear}`,
    `النوع: ${vehicle.vehicleType}`,
    vehicle.batteryKwh ? `البطارية: ${vehicle.batteryKwh} kWh` : null,
    vehicle.engineLiters ? `المحرك: ${vehicle.engineLiters} لتر` : null,
    vehicle.chargingPort ? `منفذ الشحن: ${vehicle.chargingPort}` : null,
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

  const vehicles = await listSupportedVehicles();
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
