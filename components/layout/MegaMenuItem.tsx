import Link from "next/link";
import type { MegaMenuItemData } from "@/data/navigation";

export function MegaMenuItem({ item }: { item: MegaMenuItemData }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="group flex gap-3 border-b border-[var(--voltjo-border-soft)] px-2 py-3.5 text-right transition last:border-b-0 hover:bg-[rgba(13,13,13,0.032)]"
    >
      <span className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-[var(--voltjo-border-soft)] bg-[var(--voltjo-bg-soft)] text-[var(--voltjo-black)] transition group-hover:border-[var(--voltjo-border)]">
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
