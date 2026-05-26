"use client";

import { ArrowUp, Paperclip, X } from "lucide-react";
import { useState, useRef } from "react";

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  isLoading,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string, attachmentName?: string) => void;
  isLoading?: boolean;
}) {
  const [attachment, setAttachment] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    onSubmit(value, attachment?.name);
    setAttachment(null);
  };

  return (
    <form
      className="mx-auto w-full max-w-[820px]"
      aria-label="مربع رسالة VoltJo"
      onSubmit={(event) => {
        event.preventDefault();
        handleSubmit();
      }}
    >
      <div className="rounded-[24px] border border-[rgba(31,31,29,0.14)] bg-[#FEFEFC] p-3 shadow-[0_8px_22px_rgba(31,31,29,0.045)] transition focus-within:border-[rgba(31,31,29,0.22)]">
        {attachment && (
          <div className="mb-2 flex w-max items-center gap-2 rounded-lg bg-[rgba(31,31,29,0.04)] px-3 py-2 text-sm font-semibold text-[#1F1F1D]">
            <Paperclip size={14} />
            <span dir="ltr">{attachment.name}</span>
            <button
              type="button"
              onClick={() => setAttachment(null)}
              className="ml-1 rounded-full p-0.5 hover:bg-black/10"
              aria-label="إزالة المرفق"
            >
              <X size={14} />
            </button>
          </div>
        )}
        <textarea
          aria-label="رسالة إلى VoltJo Assistant"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              handleSubmit();
            }
          }}
          className="min-h-[76px] w-full resize-none bg-transparent px-3 py-2 text-right text-[15px] font-medium leading-7 text-[#1F1F1D] outline-none placeholder:text-[#6F6A60]"
          placeholder="اسأل عن سيارة، تكلفة الشحن، المقارنة، الدعم أو الضمان..."
          rows={2}
        />
        <div className="flex items-center justify-between gap-3 px-1 pt-2">
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                setAttachment(e.target.files[0]);
              }
            }}
          />
          <button
            type="button"
            aria-label="إضافة مرفق"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-9 w-9 items-center justify-center rounded-full text-[#6F6A60] transition hover:bg-[rgba(31,31,29,0.055)] hover:text-[#1F1F1D]"
          >
            <Paperclip size={18} />
          </button>
          <button
            type="submit"
            aria-label="إرسال"
            disabled={(!value.trim() && !attachment) || isLoading}
            className={`flex h-9 w-9 items-center justify-center rounded-full bg-[#1F1F1D] text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#C9C4BA] ${isLoading ? "animate-pulse" : ""}`}
          >
            <ArrowUp size={18} />
          </button>
        </div>
      </div>
    </form>
  );
}
