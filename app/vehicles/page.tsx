import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { PageActionRow } from "@/components/vehicles/PageActionRow";
import { listSupportedVehicles } from "@/lib/vehicles/queries";
import { confidenceLabels, vehicleTypeLabels } from "@/lib/vehicles/types";

export default async function VehiclesPage() {
  const vehicles = await listSupportedVehicles();

  return (
    <section className="px-4 pb-20 pt-16 sm:px-6 lg:px-8" dir="rtl">
      <Container>
        <div className="mx-auto max-w-6xl">
          <PageActionRow
            actions={[
              { href: "/", label: "العودة للرئيسية", icon: "home" },
              { href: "/charging-calculator", label: "فتح حاسبة الشحن", icon: "back" },
              { href: "/assistant", label: "اسأل المساعد", icon: "assistant" },
            ]}
          />

          <div className="mb-10 text-right">
            <h1 className="text-4xl font-black text-[var(--voltjo-black)] sm:text-5xl">
              السيارات المدعومة
            </h1>
            <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-[var(--voltjo-muted)] sm:text-lg">
              قاعدة سيارات VoltJo التي يعتمد عليها المساعد والحاسبات.
            </p>
          </div>

          {vehicles.length === 0 ? (
            <div className="space-y-6">
              <div className="rounded-[24px] border border-[var(--voltjo-border)] bg-white px-6 py-12 text-center shadow-[0_18px_50px_rgba(13,13,13,0.05)]">
                <p className="text-2xl font-black text-[var(--voltjo-black)]">
                  قائمة السيارات قيد التجهيز
                </p>
                <p className="mx-auto mt-3 max-w-2xl text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                  نعمل على مراجعة بيانات السيارات المدعومة قبل عرضها للعامة. يمكنك العودة قريبًا أو استخدام حاسبة الشحن يدويًا.
                </p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/"
                    className="inline-flex h-11 items-center rounded-full border border-[var(--voltjo-border)] px-5 text-sm font-black text-[var(--voltjo-black)] transition hover:border-[rgba(255,106,0,0.2)] hover:text-[var(--voltjo-orange)]"
                  >
                    العودة للرئيسية
                  </Link>
                  <Link
                    href="/charging-calculator"
                    className="inline-flex h-11 items-center rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-black text-white transition hover:bg-[#1f1f1f]"
                  >
                    فتح حاسبة الشحن
                  </Link>
                  <Link
                    href="/assistant"
                    className="inline-flex h-11 items-center rounded-full border border-[var(--voltjo-border)] px-5 text-sm font-black text-[var(--voltjo-black)] transition hover:border-[rgba(255,106,0,0.2)] hover:text-[var(--voltjo-orange)]"
                  >
                    اسأل المساعد
                  </Link>
                </div>
              </div>

              <div className="rounded-[24px] border border-[var(--voltjo-border)] bg-white p-6 shadow-[0_18px_50px_rgba(13,13,13,0.05)]">
                <h2 className="text-2xl font-black text-[var(--voltjo-black)]">
                  ماذا سيظهر هنا؟
                </h2>
                <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {[
                    "سيارات كهربائية",
                    "Plug-in Hybrid",
                    "هايبرد",
                    "ملاحظات للسوق الأردني",
                    "بيانات تكلفة تقديرية بعد المراجعة",
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-[16px] border border-[var(--voltjo-border)] bg-[#FBFBF9] px-4 py-4 text-sm font-black text-[var(--voltjo-black)]"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
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
