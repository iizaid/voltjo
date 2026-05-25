import type { ReactNode } from "react";

export function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-[rgba(255,106,0,0.18)] bg-[rgba(255,106,0,0.07)] px-4 py-2 text-sm font-bold text-[var(--voltjo-orange-dark)]">
      {children}
    </span>
  );
}
