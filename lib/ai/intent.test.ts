import { describe, it, expect } from "vitest";
import { detectIntent } from "@/lib/ai/intent";

describe("detectIntent", () => {
  it("detects battery/charging questions", () => {
    expect(detectIntent("كم ساعة يحتاج شحن البطارية؟")).toBe("battery_charging");
    expect(detectIntent("what is the DC fast charge speed?")).toBe("battery_charging");
  });

  it("detects maintenance over engine when oil is the subject", () => {
    // 'زيت' (maintenance) + 'المحرك' (engine) tie → maintenance wins on priority.
    expect(detectIntent("متى أغيّر زيت المحرك؟")).toBe("maintenance");
  });

  it("detects engine/fuel questions", () => {
    expect(detectIntent("كم استهلاك الوقود لكل 100 كم؟")).toBe("engine_fuel");
  });

  it("detects safety questions", () => {
    expect(detectIntent("هل تتوفر وسائد هوائية وأنظمة فرامل ABS؟")).toBe("safety");
  });

  it("detects trims questions", () => {
    expect(detectIntent("ما هي فئات السيارة المتوفرة؟")).toBe("trims");
  });

  it("detects market questions", () => {
    expect(detectIntent("ما سعر السيارة في الأردن مع الضمان؟")).toBe("market");
  });

  it("returns null when no category dominates", () => {
    expect(detectIntent("مرحبا كيف حالك اليوم؟")).toBeNull();
    expect(detectIntent("")).toBeNull();
  });
});
