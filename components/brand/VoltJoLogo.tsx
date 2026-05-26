import Image from "next/image";
import Link from "next/link";

const MARK_SRC = "/brands/logo%201.png";
const WORDMARK_SRC = "/brands/typo%201.png";

export function VoltJoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="VoltJo"
      className="inline-flex items-center gap-3"
      dir="ltr"
    >
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
    </Link>
  );
}
