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
    <div className="flex items-start gap-3 rounded-2xl border border-[var(--voltjo-border-soft)] bg-white px-4 py-3">
      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-muted)]">
        {icon}
      </span>
      <span>
        <span className="block text-base font-black text-[var(--voltjo-black)]">
          {title}
        </span>
        {text ? (
          <span className="mt-1 block text-sm leading-6 text-[var(--voltjo-muted)]">
            {text}
          </span>
        ) : null}
      </span>
    </div>
  );
}
