import { describe, it, expect } from "vitest";
import { normalizeArabic, normalizedContains } from "@/lib/ai/normalize-arabic";

describe("normalizeArabic", () => {
  it("returns empty string for empty/falsy input", () => {
    expect(normalizeArabic("")).toBe("");
  });

  it("strips tashkeel/diacritics but keeps the letters", () => {
    // بَطَّارِيَّة (with diacritics + ta-marbuta) → بطاريه
    expect(normalizeArabic("بَطَّارِيَّة")).toBe("بطاريه");
  });

  it("folds Arabic-Indic digits to ASCII (digits must survive diacritic stripping)", () => {
    expect(normalizeArabic("٢٠٢٥")).toBe("2025");
    expect(normalizeArabic("موديل ٣")).toBe("موديل 3");
  });

  it("unifies alef/hamza variants", () => {
    expect(normalizeArabic("أتو")).toBe("اتو");
    expect(normalizeArabic("إصدار")).toBe("اصدار");
  });

  it("maps alef-maqsura and ta-marbuta consistently", () => {
    expect(normalizeArabic("على")).toBe("علي"); // ى → ي
    expect(normalizeArabic("سيارة")).toBe("سياره"); // ة → ه
  });

  it("lowercases Latin and collapses whitespace/punctuation", () => {
    expect(normalizeArabic("RAV4   Hybrid!")).toBe("rav4 hybrid");
    expect(normalizeArabic("Tesla,  Model-3")).toBe("tesla model 3");
  });
});

describe("normalizedContains", () => {
  it("matches whole tokens/phrases on word boundaries", () => {
    expect(normalizedContains("اريد سيارة سيلايون 05", "سيلايون 05")).toBe(true);
    expect(normalizedContains("rav4 hybrid", "rav4")).toBe(true);
  });

  it("does not match a needle embedded inside a larger token", () => {
    expect(normalizedContains("ximage", "mage")).toBe(false);
    expect(normalizedContains("xrav4", "rav4")).toBe(false);
  });

  it("returns false for empty operands", () => {
    expect(normalizedContains("", "rav4")).toBe(false);
    expect(normalizedContains("rav4", "")).toBe(false);
  });
});
