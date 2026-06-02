import { ChargingMapClient } from "@/components/vehicles/ChargingMapClient";
import { PageActionRow } from "@/components/vehicles/PageActionRow";
import { Container } from "@/components/ui/Container";
import { listChargingLocations } from "@/lib/vehicles/queries";

export default async function ChargingMapPage() {
  const locations = await listChargingLocations();

  return (
    <section className="px-4 pb-20 pt-16 sm:px-6 lg:px-8" dir="rtl">
      <Container>
        <div className="mx-auto max-w-5xl">
          <PageActionRow
            actions={[
              { href: "/", label: "العودة للرئيسية", icon: "home" },
              { href: "/assistant", label: "العودة للمساعد", icon: "assistant" },
            ]}
          />

          <h1 className="text-4xl font-black text-[var(--voltjo-black)] sm:text-5xl">
            خريطة الشحن في الأردن
          </h1>
          <p className="mt-4 max-w-3xl text-base font-semibold leading-8 text-[var(--voltjo-muted)] sm:text-lg">
            الخريطة التفاعلية تعرض موقعك ونقاط الشحن المتاحة داخل الأردن. البيانات الأولية قيد التحقق والتوسيع.
          </p>

          <div className="mt-10">
            <ChargingMapClient locations={locations} />
          </div>

          {locations.length === 0 ? (
            <p className="mt-5 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
              لم نضف نقاط شحن موثقة بعد، لكن الخريطة جاهزة لاستعراض موقعك وسيتم إضافة المحطات تدريجيًا.
            </p>
          ) : null}
        </div>
      </Container>
    </section>
  );
}
