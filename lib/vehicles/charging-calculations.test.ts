import { describe, it, expect } from "vitest";
import { calculateChargingCost } from "@/lib/vehicles/charging-calculations";

describe("calculateChargingCost", () => {
  it("computes energy and cost correctly for a typical EV session", () => {
    const result = calculateChargingCost({
      batteryKwh: 60,
      fromPercent: 20,
      toPercent: 80,
      pricePerKwh: 0.1,
      efficiencyPercent: 90,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      // (80-20)/100 * 60 / 0.9 = 40 kWh; 40 * 0.1 = 4 JOD
      expect(result.energyNeeded).toBe(40);
      expect(result.estimatedCost).toBe(4);
      expect(result.effectiveChargeWindow).toBe("20% → 80%");
    }
  });

  it("rejects battery <= 0", () => {
    const result = calculateChargingCost({
      batteryKwh: 0,
      fromPercent: 20,
      toPercent: 80,
      pricePerKwh: 0.1,
      efficiencyPercent: 90,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects toPercent <= fromPercent", () => {
    const result = calculateChargingCost({
      batteryKwh: 60,
      fromPercent: 80,
      toPercent: 20,
      pricePerKwh: 0.1,
      efficiencyPercent: 90,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects efficiencyPercent <= 0", () => {
    const result = calculateChargingCost({
      batteryKwh: 60,
      fromPercent: 20,
      toPercent: 80,
      pricePerKwh: 0.1,
      efficiencyPercent: 0,
    });
    expect(result.ok).toBe(false);
  });

  it("rejects efficiencyPercent > 100", () => {
    const result = calculateChargingCost({
      batteryKwh: 60,
      fromPercent: 20,
      toPercent: 80,
      pricePerKwh: 0.1,
      efficiencyPercent: 110,
    });
    expect(result.ok).toBe(false);
  });

  it("allows pricePerKwh = 0 (free electricity)", () => {
    const result = calculateChargingCost({
      batteryKwh: 60,
      fromPercent: 20,
      toPercent: 80,
      pricePerKwh: 0,
      efficiencyPercent: 90,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.estimatedCost).toBe(0);
      expect(result.energyNeeded).toBe(40);
    }
  });

  it("rejects negative pricePerKwh", () => {
    const result = calculateChargingCost({
      batteryKwh: 60,
      fromPercent: 20,
      toPercent: 80,
      pricePerKwh: -1,
      efficiencyPercent: 90,
    });
    expect(result.ok).toBe(false);
  });
});
