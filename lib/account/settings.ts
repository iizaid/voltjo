import type { Json } from "@/lib/supabase/database.types";

export const AVATAR_STYLES = ["initials", "mark", "icon"] as const;
export const AVATAR_SHAPES = ["circle", "rounded"] as const;

export type AvatarStyle = (typeof AVATAR_STYLES)[number];
export type AvatarShape = (typeof AVATAR_SHAPES)[number];

export type AvatarConfig = {
  style: AvatarStyle;
  bgColor: string;
  fgColor: string;
  shape: AvatarShape;
};

export const AVATAR_BACKGROUND_OPTIONS = [
  "#FFF1E8",
  "#FFE4D1",
  "#F3F1EA",
  "#EFE7DE",
  "#0D0D0D",
] as const;

export const AVATAR_FOREGROUND_OPTIONS = [
  "#FF6A00",
  "#0D0D0D",
  "#FFFFFF",
  "#7A6F63",
] as const;

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  style: "initials",
  bgColor: "#FFF1E8",
  fgColor: "#FF6A00",
  shape: "circle",
};

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

export function normalizeAvatarConfig(input: Json | null | undefined): AvatarConfig {
  if (!isRecord(input)) return DEFAULT_AVATAR_CONFIG;

  const style = AVATAR_STYLES.includes(input.style as AvatarStyle)
    ? (input.style as AvatarStyle)
    : DEFAULT_AVATAR_CONFIG.style;

  const shape = AVATAR_SHAPES.includes(input.shape as AvatarShape)
    ? (input.shape as AvatarShape)
    : DEFAULT_AVATAR_CONFIG.shape;

  const bgColor = AVATAR_BACKGROUND_OPTIONS.includes(
    input.bgColor as (typeof AVATAR_BACKGROUND_OPTIONS)[number],
  )
    ? (input.bgColor as string)
    : DEFAULT_AVATAR_CONFIG.bgColor;

  const fgColor = AVATAR_FOREGROUND_OPTIONS.includes(
    input.fgColor as (typeof AVATAR_FOREGROUND_OPTIONS)[number],
  )
    ? (input.fgColor as string)
    : DEFAULT_AVATAR_CONFIG.fgColor;

  return {
    style,
    bgColor,
    fgColor,
    shape,
  };
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
