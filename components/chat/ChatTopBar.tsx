"use client";

import { Menu, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

const models = [
  { 
    id: "deepseek", 
    name: "VoltJo Max", 
    description: "استفسارات سريعة لمقارنة السيارات وحساب الشحن" 
  },
  { 
    id: "gemini", 
    name: "Gemini", 
    description: "تحليل ذكي وسرعة فائقة للإجابات المعقدة" 
  },
  { 
    id: "kimi", 
    name: "Kimi", 
    description: "قراءة وتحليل كتيبات السيارات والمواصفات الطويلة" 
  },
];

export function ChatTopBar({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(models[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="flex h-14 shrink-0 items-center justify-between px-4 md:px-6 relative z-10">
      <button
        type="button"
        aria-label="فتح القائمة"
        onClick={onOpenSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.055)] lg:hidden"
      >
        <Menu size={19} />
      </button>

      <div className="mx-auto flex items-center justify-center">
        <div className="relative" ref={dropdownRef} dir="rtl">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="group flex items-center gap-2 rounded-xl px-3 py-1.5 transition hover:bg-[rgba(31,31,29,0.04)]"
          >
            <span className="flex items-center gap-1.5 text-[15px] font-bold text-[#1F1F1D]">
              {selectedModel.name}
            </span>
            <ChevronDown size={16} className={`text-[#6F6A60] transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
          
          {isOpen && (
            <div className="absolute top-full right-1/2 mt-1 w-[320px] translate-x-1/2 rounded-2xl border border-[rgba(31,31,29,0.08)] bg-white p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.08)]">
              {models.map((model) => (
                <button
                  key={model.id}
                  onClick={() => {
                    setSelectedModel(model);
                    setIsOpen(false);
                  }}
                  className={`flex w-full flex-col items-start gap-1 rounded-xl px-4 py-3 text-right transition ${
                    selectedModel.id === model.id
                      ? "bg-[rgba(31,31,29,0.04)]"
                      : "hover:bg-[rgba(31,31,29,0.02)]"
                  }`}
                >
                  <span className="flex items-center gap-1.5 text-[15px] font-bold text-[#1F1F1D]">
                    {model.name}
                  </span>
                  <span className="text-xs font-semibold leading-relaxed text-[#6F6A60]">{model.description}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="h-9 w-9" aria-hidden="true" />
    </header>
  );
}
