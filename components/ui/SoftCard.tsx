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
      className={`rounded-[var(--voltjo-radius-card)] border border-[var(--voltjo-border)] bg-[var(--voltjo-surface-soft)] shadow-[var(--voltjo-shadow-ring)] ${className}`}
    >
      {children}
    </div>
  );
}
