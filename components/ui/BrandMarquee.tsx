"use client";

import { useState } from "react";
import type { SupportedBrand } from "@/data/supported-brands";

function BrandLogo({
  brand,
  duplicate = false,
}: {
  brand: SupportedBrand;
  duplicate?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="brand-logo-cell" aria-hidden={duplicate || undefined}>
      {failed ? (
        <span className="latin text-sm font-bold text-[rgba(13,13,13,0.4)]">
          {brand.name}
        </span>
      ) : (
        <img
          src={brand.logo}
          alt={duplicate ? "" : `${brand.name} logo`}
          className="max-h-[42px] max-w-[130px] object-contain grayscale"
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </div>
  );
}

export function BrandMarquee({ brands }: { brands: SupportedBrand[] }) {
  return (
    <div className="brand-marquee-viewport mt-8" dir="ltr">
      <div className="brand-marquee flex w-max">
        {brands.map((brand) => (
          <BrandLogo key={brand.name} brand={brand} />
        ))}
        {brands.map((brand) => (
          <BrandLogo key={`${brand.name}-duplicate`} brand={brand} duplicate />
        ))}
      </div>
    </div>
  );
}
