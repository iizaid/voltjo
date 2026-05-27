"use client";

import { Menu } from "lucide-react";

export function ChatTopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] px-4 md:px-6" dir="rtl">
      {/* Mobile sidebar toggle */}
      <button
        type="button"
        aria-label="فتح القائمة"
        onClick={onOpenSidebar}
        className="flex h-8 w-8 items-center justify-center rounded-lg text-white/40 transition hover:bg-white/[0.06] hover:text-white/80 lg:hidden"
      >
        <Menu size={17} />
      </button>

      {/* Center title */}
      <div className="flex flex-col items-center" dir="rtl">
        <p className="text-[14px] font-bold text-white/80">VoltJo Assistant</p>
        <p className="text-[11px] font-semibold text-white/30 leading-none mt-0.5">
          مستشار السيارات الكهربائية والهايبرد في الأردن
        </p>
      </div>

      {/* Status pill */}
      <span className="hidden h-6 items-center rounded-full border border-[var(--voltjo-orange)]/30 bg-[var(--voltjo-orange)]/10 px-2.5 text-[11px] font-bold text-[var(--voltjo-orange)] sm:flex">
        نسخة تجريبية
      </span>
      {/* Mobile spacer */}
      <div className="h-8 w-8 lg:hidden" aria-hidden="true" />
    </header>
  );
}
