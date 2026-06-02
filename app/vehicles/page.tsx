import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { listSupportedVehicles } from "@/lib/vehicles/queries";
import { confidenceLabels, vehicleTypeLabels } from "@/lib/vehicles/types";

export default async function VehiclesPage() {
  const vehicles = await listSupportedVehicles();

  return (
    <section className="px-4 pb-20 pt-16 sm:px-6 lg:px-8" dir="rtl">
      <Container>
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-right">
            <h1 className="text-4xl font-black text-[var(--voltjo-black)] sm:text-5xl">
              السيارات المدعومة
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-[var(--voltjo-muted)] sm:text-lg">
              قاعدة سيارات VoltJo التي يعتمد عليها المساعد والحاسبات.
            </p>
          </div>

          {vehicles.length === 0 ? (
            <div className="rounded-[24px] border border-[var(--voltjo-border)] bg-white px-6 py-12 text-center shadow-[0_18px_50px_rgba(13,13,13,0.05)]">
              <p className="text-xl font-black text-[var(--voltjo-black)]">
                لا توجد سيارات مدعومة معروضة بعد
              </p>
              <p className="mt-3 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                تأكد من تشغيل migration الخاصة بالسيارات المدعومة ثم أعد تحميل الصفحة.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {vehicles.map((vehicle) => (
                <Link
                  key={vehicle.id}
                  href={`/vehicles/${vehicle.slug}`}
                  className="rounded-[20px] border border-[var(--voltjo-border)] bg-white p-5 shadow-[0_18px_50px_rgba(13,13,13,0.05)] transition hover:border-[rgba(255,106,0,0.25)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="text-right">
                      <p className="text-xs font-bold text-[var(--voltjo-muted)]">
                        {vehicle.brand.nameAr}
                      </p>
                      <h2 className="mt-1 text-xl font-black text-[var(--voltjo-black)]">
                        {vehicle.nameAr}
                      </h2>
                    </div>
                    <span className="rounded-full border border-[rgba(255,106,0,0.18)] bg-[rgba(255,106,0,0.06)] px-3 py-1 text-xs font-black text-[var(--voltjo-orange)]">
                      {vehicleTypeLabels[vehicle.vehicleType]}
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 text-sm font-semibold text-[var(--voltjo-muted)]">
                    <p>سنة الموديل: {vehicle.modelYear}</p>
                    {vehicle.batteryKwh ? <p>البطارية: {vehicle.batteryKwh} kWh</p> : null}
                    {vehicle.engineLiters ? <p>المحرك: {vehicle.engineLiters} لتر</p> : null}
                    {vehicle.chargingPort ? <p>منفذ الشحن: {vehicle.chargingPort}</p> : null}
                    {vehicle.summaryAr ? (
                      <p className="mt-2 leading-7 text-[var(--voltjo-black)]">
                        {vehicle.summaryAr}
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-4">
                    <span className="text-xs font-bold text-[var(--voltjo-muted)]">
                      مستوى الثقة: {confidenceLabels[vehicle.dataConfidence]}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
