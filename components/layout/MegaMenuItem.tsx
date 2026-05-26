import Link from "next/link";
import type { MegaMenuItemData } from "@/data/navigation";

export function MegaMenuItem({ item }: { item: MegaMenuItemData }) {
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      className="group flex items-start gap-4 border-b border-[var(--voltjo-border-soft)] px-6 py-5 text-right transition last:border-b-0 hover:bg-[rgba(13,13,13,0.025)]"
    >
      <span className="mt-0.5 shrink-0 text-[var(--voltjo-muted)] transition group-hover:text-[var(--voltjo-orange)]">
        <Icon size={18} strokeWidth={2} />
      </span>
      <span>
        <span className="block text-[15px] font-bold text-[var(--voltjo-black)]">
          {item.title}
        </span>
        <span className="mt-1 block text-[13px] font-medium leading-6 text-[var(--voltjo-muted)]">
          {item.description}
        </span>
      </span>
    </Link>
  );
}
