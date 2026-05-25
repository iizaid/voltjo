import Link from "next/link";

export function VoltJoLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link
      href="/"
      className="group inline-flex items-center gap-3"
      aria-label="VoltJo"
      dir="ltr"
    >
      <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-[var(--voltjo-border)] bg-white shadow-sm">
        <span className="absolute inset-1 rounded-xl bg-[var(--voltjo-black)]" />
        <span className="relative h-5 w-5 rounded-[6px] border-2 border-white">
          <span className="absolute -right-2 -top-1 h-3 w-3 rounded-full bg-[var(--voltjo-orange)]" />
          <span className="absolute bottom-1 left-1 h-1.5 w-3 rounded-full bg-[var(--voltjo-orange)]" />
        </span>
      </span>
      {!compact ? (
        <span className="latin text-2xl font-black tracking-normal text-[var(--voltjo-black)]">
          Volt<span className="text-[var(--voltjo-orange)]">Jo</span>
        </span>
      ) : null}
    </Link>
  );
}
