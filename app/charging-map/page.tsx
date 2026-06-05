import type { Metadata } from "next";
import { ChargingMapClient } from "@/components/vehicles/ChargingMapClient";
import { Container } from "@/components/ui/Container";
import { PageReturnBar } from "@/components/ui/PageReturnBar";
import { getCurrentUser } from "@/lib/auth/session";
import { listChargingLocations } from "@/lib/vehicles/queries";

export const metadata: Metadata = {
  title: "خريطة الشحن | VoltJo",
  description:
    "اعثر على نقاط شحن السيارات الكهربائية في الأردن على خريطة تفاعلية.",
  openGraph: {
    title: "خريطة الشحن في الأردن | VoltJo",
    description:
      "اعثر على نقاط شحن السيارات الكهربائية في الأردن على خريطة تفاعلية.",
  },
};

export default async function ChargingMapPage() {
  const locations = await listChargingLocations();
  const user = await getCurrentUser();

  return (
    <section className="pb-16 pt-4 sm:pb-20 sm:pt-6" dir="rtl">
      <PageReturnBar />
      <Container>
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-black text-[var(--voltjo-black)] sm:text-5xl">
            خريطة الشحن في الأردن
          </h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[var(--voltjo-muted)] sm:text-lg sm:leading-8">
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
