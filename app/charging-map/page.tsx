import { ChargingMapClient } from "@/components/vehicles/ChargingMapClient";
import { Container } from "@/components/ui/Container";
import { PageReturnBar } from "@/components/ui/PageReturnBar";
import { getCurrentUser } from "@/lib/auth/session";
import { listChargingLocations } from "@/lib/vehicles/queries";

export default async function ChargingMapPage() {
  const locations = await listChargingLocations();
  const user = await getCurrentUser();

  return (
    <section className="pb-20 pt-6" dir="rtl">
      <PageReturnBar />
      <Container>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-black text-[var(--voltjo-black)] sm:text-5xl">
            خريطة الشحن في الأردن
          </h1>
          <p className="mt-3 max-w-3xl text-base font-semibold leading-8 text-[var(--voltjo-muted)] sm:text-lg">
            استعرض موقعك ونقاط الشحن المتاحة داخل الأردن على خريطة تفاعلية واحدة.
          </p>

          <div className="mt-8 sm:mt-10">
            <ChargingMapClient
              locations={locations}
              isAuthenticated={Boolean(user)}
            />
          </div>
        </div>
      </Container>
    </section>
  );
}
