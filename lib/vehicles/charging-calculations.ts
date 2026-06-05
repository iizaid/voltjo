export type ChargingInput = {
  batteryKwh: number;
  fromPercent: number;
  toPercent: number;
  pricePerKwh: number;
  efficiencyPercent: number;
};

export type ChargingResult =
  | { ok: true; energyNeeded: number; estimatedCost: number; effectiveChargeWindow: string }
  | { ok: false; message: string };

function round(value: number, digits = 2): number {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
}

export function calculateChargingCost(input: ChargingInput): ChargingResult {
  const { batteryKwh, fromPercent, toPercent, pricePerKwh, efficiencyPercent } = input;

  if (
    !Number.isFinite(batteryKwh) ||
    !Number.isFinite(fromPercent) ||
    !Number.isFinite(toPercent) ||
    !Number.isFinite(pricePerKwh) ||
    !Number.isFinite(efficiencyPercent)
  ) {
    return { ok: false, message: "أدخل قيمًا رقمية صحيحة." };
  }

  if (batteryKwh <= 0) {
    return { ok: false, message: "حجم البطارية يجب أن يكون أكبر من صفر." };
  }

  if (fromPercent < 0 || fromPercent > 100 || toPercent < 0 || toPercent > 100 || toPercent <= fromPercent) {
    return { ok: false, message: "نطاق الشحن غير صالح. يجب أن تكون نسبة الشحن النهائية أكبر من البداية." };
  }

  if (pricePerKwh < 0) {
    return { ok: false, message: "سعر الكهرباء يجب أن يكون صفرًا أو أعلى." };
  }

  if (efficiencyPercent <= 0 || efficiencyPercent > 100) {
    return { ok: false, message: "كفاءة الشحن يجب أن تكون بين 1 و100." };
  }

  const delta = (toPercent - fromPercent) / 100;
  const efficiencyFactor = efficiencyPercent / 100;
  const energyNeeded = (batteryKwh * delta) / efficiencyFactor;
  const estimatedCost = energyNeeded * pricePerKwh;

  return {
    ok: true,
    energyNeeded: round(energyNeeded, 2),
    estimatedCost: round(estimatedCost, 2),
    effectiveChargeWindow: `${fromPercent}% → ${toPercent}%`,
  };
}
