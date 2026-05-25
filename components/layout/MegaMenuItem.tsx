import Link from "next/link";
import type { MegaMenuItemData } from "@/data/navigation";

export function MegaMenuItem({ item }: { item: MegaMenuItemData }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="group flex gap-3 rounded-2xl border border-transparent p-3 text-right transition hover:border-[var(--voltjo-border)] hover:bg-[rgba(13,13,13,0.035)]"
    >
      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)]">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <span>
        <span className="block text-sm font-black text-[var(--voltjo-black)]">
          {item.title}
        </span>
        <span className="mt-1 block text-xs font-medium leading-6 text-[var(--voltjo-muted)]">
          {item.description}
        </span>
      </span>
    </Link>
  );
}
