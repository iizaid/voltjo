"use client";

import { Menu, ChevronDown } from "lucide-react";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import { getModelIcon } from "@/components/chat/ChatComposer";

import type { ModelDisplay } from "@/lib/ai/model-display";

export function ChatTopBar({
  onOpenSidebar,
  selectedModel,
  onToggleModelSelector,
}: {
  onOpenSidebar: () => void;
  selectedModel: ModelDisplay;
  onToggleModelSelector: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-4 relative z-10 border-b border-[rgba(13,13,13,0.04)] bg-white/50 backdrop-blur-sm">
      <button
        type="button"
        aria-label="فتح القائمة"
        onClick={onOpenSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.05)] lg:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="mx-auto flex items-center justify-center">
        <div className="flex items-center gap-2" dir="rtl">
          <div className="lg:hidden">
            <VoltJoLogo compact />
          </div>
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={onToggleModelSelector}
              className="flex items-center gap-1 rounded-lg px-2 py-0.5 hover:bg-[rgba(31,31,29,0.05)] transition-colors active:scale-[0.98]"
              aria-label={`تغيير النموذج، الحالي: ${selectedModel.displayName}`}
            >
              <span className="flex items-center gap-1.5 text-[14px] font-bold text-[#1F1F1D]" dir="ltr">
                <span className="flex h-5 w-5 items-center justify-center">
                  {getModelIcon(selectedModel.icon, 16)}
                </span>
                {selectedModel.displayName}
              </span>
              <ChevronDown size={13} className="text-[#6F6A60] mr-1" />
            </button>
            <p className="hidden text-[11px] font-semibold text-[#6F6A60] sm:block mt-0.5">
              مستشار السيارات الكهربائية والهايبرد في الأردن
            </p>
          </div>
        </div>
      </div>

      <div className="h-9 w-9" aria-hidden="true" />
    </header>
  );
}
