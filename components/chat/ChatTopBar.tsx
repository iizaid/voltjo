import { Menu } from "lucide-react";

export function ChatTopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-4 md:px-6">
      <button
        type="button"
        aria-label="فتح القائمة"
        onClick={onOpenSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.055)] lg:hidden"
      >
        <Menu size={19} />
      </button>

      <div className="mx-auto text-center">
        <p className="latin text-sm font-semibold text-[#1F1F1D]" dir="ltr">
          VoltJo Assistant
        </p>
        <p className="text-xs font-medium text-[#6F6A60]">
          مساعد متخصص للسوق الأردني
        </p>
      </div>

      <div className="h-9 w-9" aria-hidden="true" />
    </header>
  );
}
