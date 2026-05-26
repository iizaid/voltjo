import type { SupportedBrand } from "@/data/supported-brands";
import Image from "next/image";

export function LogoCloud({ brands }: { brands: SupportedBrand[] }) {
  return (
    <div
      className="relative mx-auto mt-12 max-w-5xl overflow-hidden rounded-[12px] border border-[var(--voltjo-border-soft)] bg-[var(--voltjo-border-soft)] shadow-[0_1px_0_rgba(13,13,13,0.02)]"
      dir="ltr"
    >
      <div className="grid grid-cols-2 gap-[1px] sm:grid-cols-4">
        {brands.map((brand) => (
          <div
            key={brand.name}
            className="group relative flex h-[104px] items-center justify-center bg-[#FAFAFA] px-6 py-4 transition-colors hover:bg-white"
          >
            <Image
              src={brand.logo}
              alt={brand.name}
              width={140}
              height={50}
              className="max-h-[42px] w-auto object-contain opacity-60 grayscale transition-all duration-300 group-hover:opacity-100 group-hover:grayscale-0"
            />
          </div>
        ))}
      </div>

      {/* Decorative plus marks - Desktop (4 columns, 2 rows) */}
      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        <PlusMark top="50%" left="25%" />
        <PlusMark top="50%" left="50%" />
        <PlusMark top="50%" left="75%" />
      </div>

      {/* Decorative plus marks - Mobile (2 columns, 4 rows) */}
      <div className="pointer-events-none absolute inset-0 sm:hidden">
        <PlusMark top="25%" left="50%" />
        <PlusMark top="50%" left="50%" />
        <PlusMark top="75%" left="50%" />
      </div>
    </div>
  );
}

function PlusMark({ top, left }: { top: string; left: string }) {
  return (
    <div
      className="absolute flex h-[11px] w-[11px] -translate-x-1/2 -translate-y-1/2 items-center justify-center"
      style={{ top, left }}
    >
      <div className="absolute h-full w-[1px] bg-[rgba(13,13,13,0.22)]" />
      <div className="absolute h-[1px] w-full bg-[rgba(13,13,13,0.22)]" />
    </div>
  );
}
