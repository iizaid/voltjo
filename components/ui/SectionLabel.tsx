import type { ReactNode } from "react";

export function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--voltjo-border)] bg-white px-3 py-1.5 text-xs font-black text-[var(--voltjo-muted)] shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <span className="h-1.5 w-1.5 rounded-full bg-[var(--voltjo-orange)]" />
      <span>{children}</span>
    </p>
  );
}
