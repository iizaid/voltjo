import type { MegaMenuColumnData } from "@/data/navigation";
import { MegaMenuItem } from "@/components/layout/MegaMenuItem";

export function MegaMenu({ columns }: { columns: MegaMenuColumnData[] }) {
  return (
    <div
      className="mega-menu-panel rounded-[24px] border border-[var(--voltjo-border)] bg-white shadow-[0_24px_80px_rgba(13,13,13,0.12)]"
      dir="rtl"
    >
      <div
        className={`grid ${
          columns.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"
        }`}
      >
        {columns.map((column, index) => (
          <div
            key={column.title}
            className={`p-5 ${
              index > 0 ? "border-t border-[var(--voltjo-border-soft)] lg:border-r lg:border-t-0" : ""
            }`}
          >
            <p className="px-3 pb-2 text-xs font-black text-[var(--voltjo-muted)]">
              {column.title}
            </p>
            <div className="grid gap-1">
              {column.items.map((item) => (
                <MegaMenuItem key={item.title} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
