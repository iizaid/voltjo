"use client";

import { useEffect, useMemo, useState } from "react";
import type { ChargingCalculatorVehicleOption } from "@/lib/vehicles/types";

type Props = {
  vehicles: ChargingCalculatorVehicleOption[];
  defaultElectricityPriceJodPerKwh: number;
  defaultEfficiencyPercent: number;
};

function round(value: number, digits = 2) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;
}

export function ChargingCalculatorClient({
  vehicles,
  defaultElectricityPriceJodPerKwh,
  defaultEfficiencyPercent,
}: Props) {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [batteryKwh, setBatteryKwh] = useState<string>("");
  const [fromPercent, setFromPercent] = useState<string>("20");
  const [toPercent, setToPercent] = useState<string>("80");
  const [pricePerKwh, setPricePerKwh] = useState<string>(
    String(defaultElectricityPriceJodPerKwh),
  );
  const [efficiencyPercent, setEfficiencyPercent] = useState<string>(
    String(defaultEfficiencyPercent),
  );

  const selectedVehicleData = useMemo(
    () => vehicles.find((vehicle) => vehicle.slug === selectedVehicle) ?? null,
    [vehicles, selectedVehicle],
  );
  const hasVehicleOptions = vehicles.length > 0;

  useEffect(() => {
    if (selectedVehicleData) {
      setBatteryKwh(String(selectedVehicleData.batteryKwh));
    }
  }, [selectedVehicleData]);

  const calculation = useMemo(() => {
    const battery = Number(batteryKwh);
    const from = Number(fromPercent);
    const to = Number(toPercent);
    const price = Number(pricePerKwh);
    const efficiency = Number(efficiencyPercent);

    if (
      !Number.isFinite(battery) ||
      !Number.isFinite(from) ||
      !Number.isFinite(to) ||
      !Number.isFinite(price) ||
      !Number.isFinite(efficiency)
    ) {
      return { ok: false as const, message: "أدخل قيمًا رقمية صحيحة." };
    }

    if (battery <= 0) {
      return { ok: false as const, message: "حجم البطارية يجب أن يكون أكبر من صفر." };
    }

    if (from < 0 || from > 100 || to < 0 || to > 100 || to <= from) {
      return { ok: false as const, message: "نطاق الشحن غير صالح. يجب أن تكون نسبة الشحن النهائية أكبر من البداية." };
    }

    if (price < 0) {
      return { ok: false as const, message: "سعر الكهرباء يجب أن يكون صفرًا أو أعلى." };
    }

    if (efficiency <= 0 || efficiency > 100) {
      return { ok: false as const, message: "كفاءة الشحن يجب أن تكون بين 1 و100." };
    }

    const delta = (to - from) / 100;
    const efficiencyFactor = efficiency / 100;
    const energyNeeded = battery * delta / efficiencyFactor;
    const estimatedCost = energyNeeded * price;

    return {
      ok: true as const,
      energyNeeded: round(energyNeeded, 2),
      estimatedCost: round(estimatedCost, 2),
      effectiveChargeWindow: `${from}% → ${to}%`,
    };
  }, [batteryKwh, efficiencyPercent, fromPercent, pricePerKwh, toPercent]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]" dir="rtl">
      <div className="rounded-[20px] border border-[var(--voltjo-border)] bg-white p-5 shadow-[0_18px_50px_rgba(13,13,13,0.05)]">
        <div className="mb-5 rounded-[16px] border border-[rgba(255,106,0,0.12)] bg-[rgba(255,106,0,0.05)] px-4 py-4">
          <p className="text-sm font-black text-[var(--voltjo-black)]">
            {hasVehicleOptions ? "يمكنك الاختيار من السيارات المتاحة أو إدخال القيم يدويًا." : "الوضع اليدوي متاح بالكامل حتى لو لم تظهر سيارات في القائمة."}
          </p>
          <p className="mt-2 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
            إذا لم تظهر سيارات، يمكنك إدخال حجم البطارية يدويًا.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)] sm:col-span-2">
            اختر سيارة مدعومة
            <select
              value={selectedVehicle}
              onChange={(event) => setSelectedVehicle(event.target.value)}
              disabled={!hasVehicleOptions}
              className="h-12 rounded-[14px] border border-[var(--voltjo-border)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none"
            >
              <option value="">
                {hasVehicleOptions ? "بدون اختيار سيارة" : "لا توجد سيارات مضافة حاليًا"}
              </option>
              {vehicles.map((vehicle) => (
                <option key={vehicle.slug} value={vehicle.slug}>
                  {vehicle.label}
                </option>
              ))}
            </select>
            <span className="text-xs font-semibold leading-6 text-[var(--voltjo-muted)]">
              يمكنك إدخال حجم البطارية يدويًا إذا لم تكن سيارتك موجودة في القائمة.
            </span>
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
            حجم البطارية (kWh)
            <input
              type="number"
              min="0"
              step="0.1"
              value={batteryKwh}
              onChange={(event) => setBatteryKwh(event.target.value)}
              placeholder="مثال: 60"
              className="h-12 rounded-[14px] border border-[var(--voltjo-border)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
            سعر الكهرباء (د.أ/ك.و.س)
            <input
              type="number"
              min="0"
              step="0.01"
              value={pricePerKwh}
              onChange={(event) => setPricePerKwh(event.target.value)}
              className="h-12 rounded-[14px] border border-[var(--voltjo-border)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
            من نسبة (%)
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={fromPercent}
              onChange={(event) => setFromPercent(event.target.value)}
              className="h-12 rounded-[14px] border border-[var(--voltjo-border)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
            إلى نسبة (%)
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={toPercent}
              onChange={(event) => setToPercent(event.target.value)}
              className="h-12 rounded-[14px] border border-[var(--voltjo-border)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)] sm:col-span-2">
            كفاءة الشحن (%)
            <input
              type="number"
              min="1"
              max="100"
              step="1"
              value={efficiencyPercent}
              onChange={(event) => setEfficiencyPercent(event.target.value)}
              className="h-12 rounded-[14px] border border-[var(--voltjo-border)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none"
            />
          </label>
        </div>
      </div>

      <div className="rounded-[20px] border border-[var(--voltjo-border)] bg-white p-5 shadow-[0_18px_50px_rgba(13,13,13,0.05)]">
        <h2 className="text-2xl font-black text-[var(--voltjo-black)]">
          النتيجة التقديرية
        </h2>
        <p className="mt-2 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
          الحسبة محلية داخل المتصفح فقط، والقيم الافتراضية قابلة للتعديل قبل الاعتماد عليها.
        </p>
        <p className="mt-2 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
          السعر الافتراضي قابل للتعديل حسب تعرفة الكهرباء لديك.
        </p>

        {calculation.ok ? (
          <div className="mt-6 grid gap-4">
            <div className="rounded-[16px] border border-[rgba(255,106,0,0.18)] bg-[rgba(255,106,0,0.05)] px-4 py-4">
              <p className="text-xs font-bold text-[var(--voltjo-muted)]">
                نافذة الشحن
              </p>
              <p className="mt-1 text-xl font-black text-[var(--voltjo-black)]">
                {calculation.effectiveChargeWindow}
              </p>
            </div>
            <div className="rounded-[16px] border border-[var(--voltjo-border)] px-4 py-4">
              <p className="text-xs font-bold text-[var(--voltjo-muted)]">
                الطاقة المطلوبة
              </p>
              <p className="mt-1 text-xl font-black text-[var(--voltjo-black)]">
                {calculation.energyNeeded} kWh
              </p>
            </div>
            <div className="rounded-[16px] border border-[var(--voltjo-border)] px-4 py-4">
              <p className="text-xs font-bold text-[var(--voltjo-muted)]">
                التكلفة المتوقعة
              </p>
              <p className="mt-1 text-2xl font-black text-[var(--voltjo-orange)]">
                {calculation.estimatedCost} د.أ
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6 rounded-[16px] border border-[var(--voltjo-border)] bg-[#FBFBF9] px-4 py-4 text-sm font-bold text-[var(--voltjo-muted)]">
            {calculation.message}
          </div>
        )}
      </div>
    </div>
  );
}
