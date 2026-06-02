import Link from "next/link";
import { ArrowLeft, Bot, CarFront, Home } from "lucide-react";

type Action = {
  href: string;
  label: string;
  icon: "home" | "assistant" | "vehicles" | "back";
};

const iconMap = {
  home: Home,
  assistant: Bot,
  vehicles: CarFront,
  back: ArrowLeft,
};

export function PageActionRow({ actions }: { actions: Action[] }) {
  return (
    <div className="mb-8 flex flex-wrap items-center justify-end gap-3" dir="rtl">
      {actions.map((action) => {
        const Icon = iconMap[action.icon];

        return (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className="inline-flex h-11 items-center gap-2 rounded-full border border-[var(--voltjo-border)] bg-white px-4 text-sm font-bold text-[var(--voltjo-black)] transition hover:border-[rgba(255,106,0,0.2)] hover:text-[var(--voltjo-orange)]"
          >
            <Icon className="size-4" />
            <span>{action.label}</span>
          </Link>
        );
      })}
    </div>
  );
}
