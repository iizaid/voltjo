"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

const MARK_SRC = "/brands/logo%201.png";
const WORDMARK_SRC = "/brands/typo%201.png";

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
      <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden">
        <Image
          src={MARK_SRC}
          alt="VoltJo mark"
          width={44}
          height={44}
          className="h-11 w-11 object-contain"
          priority
        />
      </span>
      {!compact ? (
        <Image
          src={WORDMARK_SRC}
          alt="VoltJo"
          width={160}
          height={44}
          className="h-9 w-auto object-contain"
          priority
        />
      ) : null}
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
