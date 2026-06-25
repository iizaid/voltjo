import type { Metadata } from "next";
import { ChargingMapClient } from "@/components/vehicles/ChargingMapClient";
import { getCurrentUserAndProfile } from "@/lib/auth/session";
import { listChargingLocations } from "@/lib/vehicles/queries";
import { resolveAccountAvatarUrl } from "@/lib/account/avatar";
import { ChargingMapLayoutClient } from "@/components/vehicles/ChargingMapLayoutClient";

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

function getFirstName(label: string | null | undefined) {
  const trimmed = label?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0] ?? null;
}

function getEmailName(email: string | null | undefined) {
  const localPart = email?.split("@")[0]?.trim();
  return localPart || null;
}

function getInitial(label: string | null | undefined, fallback = "V") {
  const trimmed = label?.trim();
  return trimmed?.charAt(0).toUpperCase() || fallback;
}

export default async function ChargingMapPage() {
  const locations = await listChargingLocations();
  const { user, profile } = await getCurrentUserAndProfile();

  const displayName = profile?.full_name || getEmailName(user?.email) || "ضيف";
  const firstName = getFirstName(displayName) || displayName;
  const email = user?.email || null;
  const initial = getInitial(displayName);
  const avatarUrl = resolveAccountAvatarUrl(profile);

  return (
    <ChargingMapLayoutClient
      user={user}
      avatarUrl={avatarUrl}
      displayName={displayName}
      initial={initial}
      firstName={firstName}
      email={email}
      infoColumn={
        <div className="flex flex-col h-full w-full bg-white">
          <div className="border-b border-[var(--voltjo-border)] bg-white p-6 xl:p-8">
            <h1 className="text-2xl font-black text-[var(--voltjo-black)] xl:text-3xl">
              خريطة الشحن في الأردن
            </h1>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-[var(--voltjo-muted)] xl:text-base">
              استعرض موقعك ونقاط الشحن المتاحة داخل الأردن على خريطة تفاعلية واحدة.
            </p>
          </div>
          
          <div className="flex-1 bg-[var(--voltjo-bg-soft)] p-6 xl:p-8">
            <h2 className="mb-4 text-lg font-black text-[var(--voltjo-black)]">
              معلومات محطات الشحن
            </h2>
            <div className="flex min-h-[250px] items-center justify-center rounded-[16px] border-2 border-dashed border-[var(--voltjo-border-soft)] bg-white p-6 text-center shadow-sm">
              <span className="text-xl font-bold text-[var(--voltjo-muted)] opacity-60">
                Coming Soon!
              </span>
            </div>
          </div>
        </div>
      }
      map={
        <ChargingMapClient
          locations={locations}
          isAuthenticated={Boolean(user)}
        />
      }
    />
  );
}

