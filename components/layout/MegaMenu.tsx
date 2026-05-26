import type { MegaMenuColumnData } from "@/data/navigation";
import { MegaMenuItem } from "@/components/layout/MegaMenuItem";

export function MegaMenu({ columns }: { columns: MegaMenuColumnData[] }) {
  return (
    <div
      className="mega-menu-panel overflow-hidden rounded-b-[8px] border-x border-b border-[var(--voltjo-border)] border-t-0 bg-white/97 shadow-[0_8px_18px_rgba(13,13,13,0.035)] backdrop-blur-xl"
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
            className={`flex flex-col ${
              index > 0 ? "border-t border-[var(--voltjo-border)] lg:border-r lg:border-t-0" : ""
            }`}
          >
            <p className="border-b border-[var(--voltjo-border)] bg-[rgba(13,13,13,0.015)] px-6 py-3 text-[13px] font-bold text-[var(--voltjo-muted)]">
              {column.title}
            </p>
            <div className="flex flex-col">
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
