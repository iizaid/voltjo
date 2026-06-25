import "server-only";

import { getSupportedVehicleBySlug } from "@/lib/vehicles/queries";
import { getCachedVehicleCatalog } from "@/lib/vehicles/catalog-cache";
import { getCachedVehicleAliases } from "@/lib/ai/vehicle-alias-cache";
import { normalizeArabic, normalizedContains } from "@/lib/ai/normalize-arabic";
import { detectIntent, type KnowledgeCategory } from "@/lib/ai/intent";
import {
  assembleGroundedContext,
  computeRetrievalConfidence,
  retrieveKnowledgeChunks,
} from "@/lib/ai/retrieval";
import type { Citation, RetrievalConfidence } from "@/lib/ai/types";
import type { SupportedVehicle } from "@/lib/vehicles/types";

export type RetrievalOptions = {
  /** Carry-over subject from prior turns (memory). Used only when nothing matches. */
  lastVehicleIds?: string[];
  /** Max chunks for a single-vehicle query (comparison uses 2 per vehicle). */
  maxChunks?: number;
};

export type RetrievalResult = {
  /** Grounded context block, or null when there is nothing verified to inject. */
  contextText: string | null;
  citations: Citation[];
  retrievalConfidence: RetrievalConfidence;
  matchedVehicleIds: string[];
  intent: KnowledgeCategory | null;
};

export const EMPTY_RETRIEVAL: RetrievalResult = {
  contextText: null,
  citations: [],
  retrievalConfidence: "LOW",
  matchedVehicleIds: [],
  intent: null,
};

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

/**
 * Detect which supported vehicle(s) a message refers to. Precision-first:
 *   1. exact alias hit (vehicle_aliases, normalized) — the reliable path;
 *   2. catalog token fallback on significant tokens (≥4 chars, non-numeric) so a
 *      stray "3" or "05" cannot false-match;
 *   3. carry-over subject from prior turns when nothing else matches.
 * Returns at most 2 ids (comparison cap).
 */
function detectVehicleIds(
  normalizedMessage: string,
  catalog: SupportedVehicle[],
  aliases: { vehicleId: string; aliasNorm: string }[],
  lastVehicleIds?: string[],
): string[] {
  const matched = new Set<string>();

  // (1) alias match — high precision.
  for (const alias of aliases) {
    if (normalizedContains(normalizedMessage, alias.aliasNorm)) matched.add(alias.vehicleId);
  }

  // (2) catalog token fallback — only when aliases found nothing.
  if (matched.size === 0) {
    for (const vehicle of catalog) {
      const haystack = normalizeArabic(
        [vehicle.slug.replace(/-/g, " "), vehicle.nameAr, vehicle.nameEn].join(" "),
      );
      const significant = haystack
        .split(" ")
        .filter((t) => t.length >= 4 && !/^\d+$/.test(t));
      if (significant.some((token) => normalizedContains(normalizedMessage, token))) {
        matched.add(vehicle.id);
      }
    }
  }

  // (3) carry-over subject — multi-turn ("وكم سعرها؟" after naming a car).
  if (matched.size === 0 && lastVehicleIds?.length) {
    for (const id of lastVehicleIds) matched.add(id);
  }

  return Array.from(matched).slice(0, 2);
}

/**
 * RAG-lite context builder: detect vehicle(s) + intent, retrieve grounded chunks,
 * gate on confidence, and assemble a token-budgeted, cited context block. Always
 * resolves (never throws) — retrieval is best-effort and must never block a reply.
 */
export async function buildVehicleContextForPrompt(
  message: string,
  options: RetrievalOptions = {},
): Promise<RetrievalResult> {
  const DEBUG = process.env.RAG_DEBUG === "1";
  const d = (...a: unknown[]) => DEBUG && console.log("[RAG]", ...a);

  d("incoming message:", message);

  const normalizedMessage = normalizeArabic(message);
  d("normalized message:", normalizedMessage);
  if (!normalizedMessage) return EMPTY_RETRIEVAL;

  const [catalog, aliases] = await Promise.all([
    getCachedVehicleCatalog(),
    getCachedVehicleAliases(),
  ]);

  d("alias cache size:", aliases.length);

  const matchedIds = detectVehicleIds(
    normalizedMessage,
    catalog,
    aliases,
    options.lastVehicleIds,
  );
  d("alias matches → vehicle IDs:", matchedIds);

  const intent = detectIntent(message);
  d("detected intent:", intent);

  const matchedVehicles = catalog.filter((v) => matchedIds.includes(v.id)).slice(0, 2);
  const finalIds = matchedVehicles.map((v) => v.id);
  d("matched vehicles:", matchedVehicles.map((v) => v.slug));

  const structuredText = matchedVehicles.length
    ? matchedVehicles.map(buildVehicleSummaryText).join("\n\n")
    : null;
  d("structured vehicle context injected:", !!structuredText);

  let chunks: Awaited<ReturnType<typeof retrieveKnowledgeChunks>> = [];
  if (matchedVehicles.length === 2) {
    // Comparison: 2 chunks per vehicle so neither side starves the other.
    const perVehicle = await Promise.all(
      matchedVehicles.map((v) =>
        retrieveKnowledgeChunks({ vehicleIds: [v.id], query: message, category: intent, limit: 2 }),
      ),
    );
    chunks = perVehicle.flat();
  } else if (matchedVehicles.length === 1) {
    chunks = await retrieveKnowledgeChunks({
      vehicleIds: finalIds,
      query: message,
      category: intent,
      limit: options.maxChunks ?? 4,
    });
  }

  d("retrieved chunk count:", chunks.length);
  d("retrieved chunk sections:", chunks.map((c) => c.section));

  const retrievalConfidence = computeRetrievalConfidence(chunks);
  d("retrieval confidence:", retrievalConfidence);

  const { contextText, citations } = assembleGroundedContext(structuredText, chunks);
  d("context text length:", contextText?.length ?? 0);
  d("RAG chunks injected:", chunks.length > 0);

  return { contextText, citations, retrievalConfidence, matchedVehicleIds: finalIds, intent };
}
