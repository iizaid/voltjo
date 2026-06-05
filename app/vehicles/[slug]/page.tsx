import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageReturnBar } from "@/components/ui/PageReturnBar";
import { getSupportedVehicleBySlug } from "@/lib/vehicles/queries";
import { confidenceLabels, vehicleTypeLabels } from "@/lib/vehicles/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getSupportedVehicleBySlug(slug);

  if (!vehicle) {
    return { title: "سيارة غير موجودة | VoltJo" };
  }

  const description =
    vehicle.summaryAr ??
    `تفاصيل ${vehicle.nameAr} من ${vehicle.brand.nameAr} — موديل ${vehicle.modelYear}`;

  return {
    title: `${vehicle.nameAr} | VoltJo`,
    description,
    openGraph: {
      title: `${vehicle.nameAr} | VoltJo`,
      description,
    },
  };
}

function formatPriceRange(min: number | null, max: number | null) {
  if (typeof min === "number" && typeof max === "number") {
    return `${min.toLocaleString("en-US")} - ${max.toLocaleString("en-US")} د.أ`;
  }
  if (typeof min === "number") {
    return `ابتداءً من ${min.toLocaleString("en-US")} د.أ`;
  }
  if (typeof max === "number") {
    return `حتى ${max.toLocaleString("en-US")} د.أ`;
  }
  return null;
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = await getSupportedVehicleBySlug(slug);

  if (!vehicle) {
    notFound();
  }
  const currentVehicle = vehicle;

  const facts = [
    { label: "النوع", value: vehicleTypeLabels[currentVehicle.vehicleType] },
    { label: "سنة الموديل", value: String(currentVehicle.modelYear) },
    { label: "البطارية", value: currentVehicle.batteryKwh ? `${currentVehicle.batteryKwh} kWh` : null },
    { label: "خزان الوقود", value: currentVehicle.fuelTankLiters ? `${currentVehicle.fuelTankLiters} لتر` : null },
    { label: "المحرك", value: currentVehicle.engineLiters ? `${currentVehicle.engineLiters} لتر` : null },
    { label: "المدى الكهربائي", value: currentVehicle.electricRangeKm ? `${currentVehicle.electricRangeKm} كم` : null },
    { label: "المدى الكلي", value: currentVehicle.totalRangeKm ? `${currentVehicle.totalRangeKm} كم` : null },
    { label: "السعر التقريبي", value: formatPriceRange(currentVehicle.priceJodMin, currentVehicle.priceJodMax) },
    { label: "منفذ الشحن", value: currentVehicle.chargingPort },
    {
      label: "الشحن المنزلي",
      value:
        currentVehicle.homeChargingSupported === true
          ? "مدعوم"
          : currentVehicle.homeChargingSupported === false
            ? "غير مدعوم"
            : null,
    },
    {
      label: "الشحن السريع DC",
      value:
        currentVehicle.dcFastCharging === true
          ? "مدعوم"
          : currentVehicle.dcFastCharging === false
            ? "غير مؤكد"
            : null,
    },
  ].filter((item) => item.value);

  return (
    <section className="pb-20 pt-6" dir="rtl">
      <PageReturnBar />
      <Container>
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-[24px] border border-[var(--voltjo-border)] bg-white p-6 shadow-[0_18px_50px_rgba(13,13,13,0.05)]">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-[rgba(255,106,0,0.18)] bg-[rgba(255,106,0,0.06)] px-3 py-1 text-xs font-black text-[var(--voltjo-orange)]">
                {vehicleTypeLabels[currentVehicle.vehicleType]}
              </span>
              <span className="text-xs font-bold text-[var(--voltjo-muted)]">
                مستوى الثقة: {confidenceLabels[currentVehicle.dataConfidence]}
              </span>
            </div>

            <h1 className="mt-4 text-4xl font-black text-[var(--voltjo-black)]">
              {currentVehicle.nameAr}
            </h1>
            <p className="mt-2 text-base font-semibold text-[var(--voltjo-muted)]">
              {vehicle.brand.nameAr} • {vehicle.modelYear}
            </p>

            {vehicle.summaryAr ? (
              <p className="mt-5 max-w-3xl text-base font-semibold leading-8 text-[var(--voltjo-black)]">
                {vehicle.summaryAr}
              </p>
            ) : null}

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {facts.map((fact) => (
                <div
                  key={fact.label}
                  className="rounded-[18px] border border-[var(--voltjo-border)] bg-[#FBFBF9] px-4 py-4"
                >
                  <p className="text-xs font-bold text-[var(--voltjo-muted)]">
                    {fact.label}
                  </p>
                  <p className="mt-1 text-lg font-black text-[var(--voltjo-black)]">
                    {fact.value}
                  </p>
                </div>
              ))}
            </div>

            {vehicle.jordanNotesAr ? (
              <div className="mt-8 rounded-[18px] border border-[var(--voltjo-border)] bg-white px-4 py-4">
                <h2 className="text-xl font-black text-[var(--voltjo-black)]">
                  ملاحظات للسوق الأردني
                </h2>
                <p className="mt-3 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                  {vehicle.jordanNotesAr}
                </p>
              </div>
            ) : null}

            {vehicle.costProfiles?.length ? (
              <div className="mt-8 rounded-[18px] border border-[var(--voltjo-border)] bg-white px-4 py-4">
                <h2 className="text-xl font-black text-[var(--voltjo-black)]">
                  ملفات تكلفة أولية
                </h2>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  {vehicle.costProfiles.map((profile) => (
                    <div
                      key={profile.id}
                      className="rounded-[16px] border border-[var(--voltjo-border)] bg-[#FBFBF9] px-4 py-4"
                    >
                      <p className="text-sm font-black text-[var(--voltjo-black)]">
                        {profile.scenario}
                      </p>
                      {profile.electricityKwh100km ? (
                        <p className="mt-2 text-sm font-semibold text-[var(--voltjo-muted)]">
                          استهلاك كهرباء: {profile.electricityKwh100km} kWh / 100km
                        </p>
                      ) : null}
                      {profile.fuelL100km ? (
                        <p className="mt-2 text-sm font-semibold text-[var(--voltjo-muted)]">
                          استهلاك وقود: {profile.fuelL100km} لتر / 100km
                        </p>
                      ) : null}
                      {profile.notesAr ? (
                        <p className="mt-2 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                          {profile.notesAr}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <p className="mt-8 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
              هذه البيانات قيد المراجعة وقد تختلف حسب النسخة والسوق.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4 text-sm font-bold">
              <Link
                href="/vehicles"
                className="text-[var(--voltjo-black)] transition hover:text-[var(--voltjo-orange)]"
              >
                العودة للسيارات
              </Link>
              <Link
                href="/charging-calculator"
                className="text-[var(--voltjo-black)] transition hover:text-[var(--voltjo-orange)]"
              >
                حاسبة الشحن
              </Link>
              <Link
                href="/assistant"
                className="text-[var(--voltjo-black)] transition hover:text-[var(--voltjo-orange)]"
              >
                اسأل المساعد
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
