import Link from "next/link";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";

export default function NotFound() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center bg-white px-4 text-center"
      dir="rtl"
    >
      <div className="mb-8 flex h-14 items-center justify-center rounded-xl border border-[var(--voltjo-border)] bg-white px-6 shadow-lg">
        <VoltJoLogo />
      </div>

      <p className="text-7xl font-black text-[var(--voltjo-orange)]">404</p>

      <h1 className="mt-4 text-2xl font-black text-[var(--voltjo-black)] sm:text-3xl">
        الصفحة غير موجودة
      </h1>

      <p className="mt-3 max-w-sm text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
        لم نتمكن من العثور على هذه الصفحة. قد يكون الرابط خاطئًا أو الصفحة
        غير متاحة حتى الآن.
      </p>

      <Link
        href="/"
        className="mt-8 inline-flex h-12 items-center justify-center rounded-[10px] bg-[var(--voltjo-orange)] px-7 text-sm font-bold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#e85e00]"
      >
        العودة إلى الرئيسية
      </Link>
    </div>
  );
}
