import type { ReactNode } from "react";

export function SoftCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-[12px] border border-[var(--voltjo-border)] bg-white/88 shadow-[0_1px_0_rgba(13,13,13,0.04)] ${className}`}
    >
      {children}
    </div>
  );
}
