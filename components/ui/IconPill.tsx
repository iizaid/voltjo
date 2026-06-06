import type { ReactNode } from "react";

export function IconPill({
  icon,
  title,
  text,
}: {
  icon: ReactNode;
  title: string;
  text?: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[var(--voltjo-radius-card)] border border-[var(--voltjo-border)] bg-[var(--voltjo-surface-soft)] px-4 py-3 shadow-[0_1px_0_rgba(0,0,0,0.02)]">
      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(255,77,0,0.16)] bg-white text-[var(--voltjo-orange)]">
        {icon}
      </span>
      <span>
        <span className="block text-base font-black text-[var(--voltjo-black)]">
          {title}
        </span>
        {text ? (
          <span className="mt-1 block text-sm font-semibold leading-6 text-[var(--voltjo-muted)]">
            {text}
          </span>
        ) : null}
      </span>
    </div>
  );
}
