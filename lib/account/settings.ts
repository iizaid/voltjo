import type { Json } from "@/lib/supabase/database.types";

export type PrivacySettings = {
  allowSmartProfileRecommendations: boolean;
  showDataInAssistant: boolean;
  receiveImportantAccountEmails: boolean;
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  allowSmartProfileRecommendations: false,
  showDataInAssistant: false,
  receiveImportantAccountEmails: false,
};

export const COUNTRY_OPTIONS = [
  { value: "jordan", label: "الأردن" },
  { value: "other", label: "دولة أخرى" },
] as const;

export const JORDAN_CITY_OPTIONS = [
  { value: "amman", label: "عمّان" },
  { value: "irbid", label: "إربد" },
  { value: "zarqa", label: "الزرقاء" },
  { value: "aqaba", label: "العقبة" },
  { value: "other", label: "أخرى" },
] as const;

export const allowedCountryValues = new Set(COUNTRY_OPTIONS.map((item) => item.value));
export const allowedJordanCityValues = new Set(
  JORDAN_CITY_OPTIONS.map((item) => item.value),
);

export const ALLOWED_AVATAR_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export const MAX_AVATAR_IMAGE_SIZE_BYTES = 3 * 1024 * 1024;

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

export function normalizePrivacySettings(
  input: Json | null | undefined,
): PrivacySettings {
  if (!isRecord(input)) return DEFAULT_PRIVACY_SETTINGS;

  return {
    allowSmartProfileRecommendations:
      input.allowSmartProfileRecommendations === true,
    showDataInAssistant: input.showDataInAssistant === true,
    receiveImportantAccountEmails: input.receiveImportantAccountEmails === true,
  };
}
