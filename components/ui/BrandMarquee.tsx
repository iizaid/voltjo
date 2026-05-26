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
    <div
      className="brand-logo-cell"
      aria-hidden={duplicate || undefined}
      aria-label={!duplicate && failed ? `${brand.name} logo missing` : undefined}
    >
      {failed ? (
        <span className="brand-logo-missing" />
      ) : (
        <img
          src={brand.logo}
          alt={duplicate ? "" : `${brand.name} logo`}
          className="max-h-[42px] max-w-[130px] object-contain grayscale"
          loading="lazy"
          onError={() => {
            console.warn(`Missing brand logo asset: ${brand.logo}`);
            setFailed(true);
          }}
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
