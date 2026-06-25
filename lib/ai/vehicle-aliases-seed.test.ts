import { describe, it, expect } from "vitest";
import { normalizeArabic } from "@/lib/ai/normalize-arabic";

/**
 * Drift guard for `supabase/migrations/013_vehicle_aliases.sql`.
 *
 * The seed stores `alias_norm` as a literal, but the runtime matcher compares it
 * against `normalizeArabic(userMessage)`. If the normalizer ever changes such that
 * `normalizeArabic(alias) !== alias_norm`, alias matching silently breaks. This
 * test mirrors every seeded (alias, alias_norm) pair and fails CI on drift —
 * signalling that migration 013's literals must be regenerated.
 */
const SEED: Array<[alias: string, aliasNorm: string]> = [
  ["song plus", "song plus"],
  ["byd song plus", "byd song plus"],
  ["song plus dmi", "song plus dmi"],
  ["سونغ بلس", "سونغ بلس"],
  ["سونج بلس", "سونج بلس"],
  ["song pro", "song pro"],
  ["byd song pro", "byd song pro"],
  ["song pro dmi", "song pro dmi"],
  ["سونغ برو", "سونغ برو"],
  ["سونج برو", "سونج برو"],
  ["sealion 05", "sealion 05"],
  ["sealion", "sealion"],
  ["byd sealion 05", "byd sealion 05"],
  ["seal u", "seal u"],
  ["سيلايون 05", "سيلايون 05"],
  ["سيلايون", "سيلايون"],
  ["سيل يو", "سيل يو"],
  ["model 3", "model 3"],
  ["tesla model 3", "tesla model 3"],
  ["موديل 3", "موديل 3"],
  ["تسلا موديل 3", "تسلا موديل 3"],
  ["تسلا 3", "تسلا 3"],
  ["dongfeng mage", "dongfeng mage"],
  ["mage phev", "mage phev"],
  ["دونغفنغ ماج", "دونغفنغ ماج"],
  ["rav4", "rav4"],
  ["rav 4", "rav 4"],
  ["toyota rav4", "toyota rav4"],
  ["rav4 hybrid", "rav4 hybrid"],
  ["راف4", "راف4"],
  ["راف 4", "راف 4"],
];

describe("vehicle_aliases seed (migration 013)", () => {
  it.each(SEED)("normalizeArabic(%j) === seeded alias_norm", (alias, aliasNorm) => {
    expect(normalizeArabic(alias)).toBe(aliasNorm);
  });
});
