import type { Metadata } from "next";
import Link from "next/link";
import { House, MapPin, Calculator, Sparkles, LogOut, User } from "lucide-react";
import { ChargingMapClient } from "@/components/vehicles/ChargingMapClient";
import { getCurrentUserAndProfile } from "@/lib/auth/session";
import { listChargingLocations } from "@/lib/vehicles/queries";
import { resolveAccountAvatarUrl } from "@/lib/account/avatar";

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
    <div className="flex h-screen flex-col bg-white overflow-hidden" dir="rtl">
      {/* Mobile Top Header (hidden on desktop) */}
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--voltjo-border)] bg-white px-4 lg:hidden">
        <Link
          href="/"
          className="inline-flex h-9 items-center gap-2 rounded-full border border-[var(--voltjo-border)] bg-white px-3 text-xs font-bold text-[var(--voltjo-black)] transition hover:bg-[var(--voltjo-bg-soft)]"
        >
          <House className="size-3.5" />
          <span>الرئيسية</span>
        </Link>
        <span className="font-display text-lg font-black tracking-tight text-[var(--voltjo-black)]">
          VoltJo<span className="text-[var(--voltjo-orange)]">.</span>
        </span>
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden lg:flex-row h-full w-full">
        {/* Desktop Vertical Sidebar (Navbar) - Far right in RTL (first in DOM) */}
        <div className="hidden lg:flex w-64 shrink-0 flex-col justify-between border-l border-neutral-900 bg-neutral-950 p-5 text-white">
          <div className="space-y-8">
            {/* Logo Area */}
            <div className="px-2">
              <span className="font-display text-2xl font-black tracking-tight text-white">
                VoltJo<span className="text-[var(--voltjo-orange)]">.</span>
              </span>
            </div>

            {/* Navigation Links */}
            <nav className="flex flex-col gap-1.5" aria-label="تنقل لوحة التحكم">
              <Link
                href="/charging-map"
                className="flex h-11 items-center gap-3 rounded-xl bg-neutral-900 px-4 text-sm font-bold text-[var(--voltjo-orange)] transition"
              >
                <MapPin className="size-4" />
                <span>محطات الشحن</span>
              </Link>

              <Link
                href="/calculator"
                className="flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
              >
                <Calculator className="size-4" />
                <span>حاسبة الشحن</span>
              </Link>

              <Link
                href="/assistant"
                className="flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
              >
                <Sparkles className="size-4" />
                <span>المساعد الذكي</span>
              </Link>

              <Link
                href="/"
                className="flex h-11 items-center gap-3 rounded-xl px-4 text-sm font-bold text-neutral-400 hover:bg-neutral-900 hover:text-white transition"
              >
                <House className="size-4" />
                <span>العودة للرئيسية</span>
              </Link>
            </nav>
          </div>

          {/* User Account Panel at bottom */}
          <div className="border-t border-neutral-800 pt-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-neutral-900/50 p-3">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-neutral-800 text-xs font-black text-white">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={displayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    initial
                  )}
                </span>
                <div className="overflow-hidden text-right">
                  <p className="truncate text-xs font-black text-white">{firstName}</p>
                  <p className="truncate text-[10px] font-semibold text-neutral-500">{email || "حساب تجريبي"}</p>
                </div>
              </div>
              
              {user ? (
                <form action="/api/auth/signout" method="POST" className="shrink-0">
                  <button
                    type="submit"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
                    aria-label="تسجيل الخروج"
                  >
                    <LogOut className="size-4" />
                  </button>
                </form>
              ) : (
                <Link
                  href="/start"
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:bg-neutral-800 hover:text-white transition"
                  aria-label="تسجيل الدخول"
                >
                  <User className="size-4" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Info Column - Left side (in the middle in RTL) */}
        <div className="z-10 flex w-full shrink-0 flex-col overflow-y-auto border-t border-[var(--voltjo-border)] bg-white shadow-[-10px_0_30px_rgba(0,0,0,0.03)] lg:w-[380px] lg:border-l lg:border-t-0">
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

        {/* Map Column - Right side in RTL (far left in domestic order) */}
        <div className="relative z-0 flex-1 lg:h-full min-h-[50vh]">
          <ChargingMapClient
            locations={locations}
            isAuthenticated={Boolean(user)}
          />
        </div>
      </div>
    </div>
  );
}
