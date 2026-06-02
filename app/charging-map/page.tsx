import { Container } from "@/components/ui/Container";
import { listChargingLocations } from "@/lib/vehicles/queries";

export default async function ChargingMapPage() {
  const locations = await listChargingLocations();
  const grouped = locations.reduce<Record<string, typeof locations>>((acc, location) => {
    const city = location.city || "غير محدد";
    acc[city] ??= [];
    acc[city].push(location);
    return acc;
  }, {});

  return (
    <section className="px-4 pb-20 pt-16 sm:px-6 lg:px-8" dir="rtl">
      <Container>
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-black text-[var(--voltjo-black)] sm:text-5xl">
            خريطة الشحن في الأردن
          </h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-[var(--voltjo-muted)] sm:text-lg">
            الخريطة التفاعلية قيد التجهيز، وهذه قائمة أولية بنقاط الشحن المتاحة.
          </p>

          {locations.length === 0 ? (
            <div className="mt-10 rounded-[24px] border border-[var(--voltjo-border)] bg-white px-6 py-12 text-center shadow-[0_18px_50px_rgba(13,13,13,0.05)]">
              <p className="text-xl font-black text-[var(--voltjo-black)]">
                لا توجد نقاط شحن معروضة بعد
              </p>
              <p className="mt-3 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                عند إضافة بيانات أولية أو موثقة، ستظهر هنا قائمة حسب المدينة قبل إطلاق الخريطة التفاعلية.
              </p>
            </div>
          ) : (
            <div className="mt-10 grid gap-6">
              {Object.entries(grouped).map(([city, cityLocations]) => (
                <div
                  key={city}
                  className="rounded-[24px] border border-[var(--voltjo-border)] bg-white p-5 shadow-[0_18px_50px_rgba(13,13,13,0.05)]"
                >
                  <h2 className="text-2xl font-black text-[var(--voltjo-black)]">
                    {city}
                  </h2>
                  <div className="mt-4 grid gap-3">
                    {cityLocations.map((location) => (
                      <div
                        key={location.id}
                        className="rounded-[16px] border border-[var(--voltjo-border)] bg-[#FBFBF9] px-4 py-4"
                      >
                        <p className="text-lg font-black text-[var(--voltjo-black)]">
                          {location.nameAr}
                        </p>
                        {location.area ? (
                          <p className="mt-1 text-sm font-semibold text-[var(--voltjo-muted)]">
                            المنطقة: {location.area}
                          </p>
                        ) : null}
                        {location.powerKw ? (
                          <p className="mt-1 text-sm font-semibold text-[var(--voltjo-muted)]">
                            القدرة: {location.powerKw} kW
                          </p>
                        ) : null}
                        {location.plugTypes.length ? (
                          <p className="mt-1 text-sm font-semibold text-[var(--voltjo-muted)]">
                            المنافذ: {location.plugTypes.join("، ")}
                          </p>
                        ) : null}
                        {location.notesAr ? (
                          <p className="mt-2 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                            {location.notesAr}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </section>
  );
}
