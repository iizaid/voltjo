import type { ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 text-sm font-black text-[var(--voltjo-orange)]">
      {children}
    </p>
  );
}
