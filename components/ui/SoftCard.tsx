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
      className={`rounded-[30px] border border-[var(--voltjo-border)] bg-white soft-shadow ${className}`}
    >
      {children}
    </div>
  );
}
