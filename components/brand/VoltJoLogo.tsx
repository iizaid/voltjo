"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const MARK_SRC = "/logo/VoltJo%20logo%20shape.svg";
const WORDMARK_SRC = "/logo/VoltJo%20logo.svg";

type VoltJoLogoProps = {
  compact?: boolean;
  scrollToTop?: boolean;
  className?: string;
};

export function VoltJoLogo({
  compact = false,
  scrollToTop = false,
  className = "",
}: VoltJoLogoProps) {
  const content: ReactNode = (
    <>
      {compact ? (
        <Image
          src={MARK_SRC}
          alt="VoltJo"
          width={34}
          height={50}
          className="h-10 w-auto object-contain"
          priority
          unoptimized
        />
      ) : (
        <Image
          src={WORDMARK_SRC}
          alt="VoltJo"
          width={137}
          height={45}
          className="h-10 w-auto object-contain"
          priority
          unoptimized
        />
      )}
    </>
  );

  if (scrollToTop) {
    return (
      <a
        href="#site-top"
        aria-label="العودة إلى أعلى الصفحة"
        className={`inline-flex items-center gap-3 ${className}`}
        dir="ltr"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        {content}
      </a>
    );
  }

  return (
    <Link
      href="/"
      aria-label="VoltJo"
      className={`inline-flex items-center gap-3 ${className}`}
      dir="ltr"
    >
      {content}
    </Link>
  );
}
