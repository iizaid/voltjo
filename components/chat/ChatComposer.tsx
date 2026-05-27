"use client";

import { ArrowUp, Image, Paperclip, FileText, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatAttachment } from "@/lib/chat/types";
import {
  ALLOWED_CHAT_ATTACHMENT_TYPES,
  ATTACHMENT_DEMO_NOTICE,
  INVALID_ATTACHMENT_TYPE_NOTICE,
  LARGE_ATTACHMENT_NOTICE,
  MAX_CHAT_ATTACHMENT_SIZE_BYTES,
  MAX_CHAT_MESSAGE_LENGTH,
} from "@/lib/chat/constants";

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  isLoading,
  attachment,
  onAttachmentChange,
  onNotice,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  attachment?: ChatAttachment | null;
  onAttachmentChange?: (att: ChatAttachment | null) => void;
  onNotice?: (message: string) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleSubmit = () => onSubmit(value);

  const handleFileSelect = (file: File | undefined | null) => {
    if (!file) return;
    if (
      !ALLOWED_CHAT_ATTACHMENT_TYPES.includes(
        file.type as (typeof ALLOWED_CHAT_ATTACHMENT_TYPES)[number],
      )
    ) {
      onNotice?.(INVALID_ATTACHMENT_TYPE_NOTICE);
      setDropdownOpen(false);
      return;
    }
    if (file.size > MAX_CHAT_ATTACHMENT_SIZE_BYTES) {
      onNotice?.(LARGE_ATTACHMENT_NOTICE);
      setDropdownOpen(false);
      return;
    }
    onAttachmentChange?.({ id: `att-${Date.now()}`, name: file.name, size: file.size, type: file.type });
    onNotice?.(ATTACHMENT_DEMO_NOTICE);
    setDropdownOpen(false);
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  const canSend = (value.trim().length > 0 || !!attachment) && !isLoading;

  return (
    <form
      className="mx-auto w-full max-w-[820px]"
      aria-label="مربع رسالة VoltJo"
      onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}
    >
      <div className="rounded-[22px] border border-white/[0.08] bg-[#1C1C1A] shadow-[0_0_0_1px_rgba(255,255,255,0.03),0_8px_32px_rgba(0,0,0,0.4)] transition focus-within:border-white/[0.14]">
        {attachment && (
          <div className="flex px-4 pt-3">
            <div className="flex items-center gap-2 rounded-lg bg-white/[0.07] px-3 py-1.5 text-[12px] font-semibold text-white/60">
              <Paperclip size={12} />
              <span dir="ltr">{attachment.name}</span>
              <button
                type="button"
                onClick={() => onAttachmentChange?.(null)}
                className="ml-1 rounded-full p-0.5 hover:bg-white/10"
                aria-label="إزالة المرفق"
              >
                <X size={12} />
              </button>
            </div>
          </div>
        )}
        <textarea
          aria-label="رسالة إلى VoltJo Assistant"
          value={value}
          maxLength={MAX_CHAT_MESSAGE_LENGTH + 1}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          className="min-h-[72px] w-full resize-none bg-transparent px-5 py-4 text-right text-[15px] font-medium leading-7 text-white/80 outline-none placeholder:text-white/25"
          placeholder="اسأل عن سيارة، تكلفة الشحن، المقارنة، الدعم أو الضمان..."
          rows={2}
        />
        <div className="flex items-center justify-between gap-3 px-3 pb-3">
          {/* Hidden file inputs */}
          <input type="file" accept="image/png,image/jpeg,image/webp" ref={imageInputRef} className="hidden"
            onChange={(e) => { handleFileSelect(e.target.files?.[0]); e.target.value = ""; }} />
          <input type="file" accept="application/pdf" ref={fileInputRef} className="hidden"
            onChange={(e) => { handleFileSelect(e.target.files?.[0]); e.target.value = ""; }} />

          {/* Attachment */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              aria-label="إضافة مرفق"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((p) => !p)}
              className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
                dropdownOpen ? "bg-white/10 text-white/70" : "text-white/25 hover:bg-white/[0.06] hover:text-white/50"
              }`}
            >
              <Paperclip size={16} />
            </button>
            {dropdownOpen && (
              <div
                className="absolute bottom-full left-0 mb-2 min-w-[160px] overflow-hidden rounded-[14px] border border-white/[0.08] bg-[#1C1C1A] shadow-[0_16px_48px_rgba(0,0,0,0.5)]"
                dir="rtl"
              >
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex w-full items-center gap-3 px-4 py-3 text-right text-[13px] font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white/80"
                >
                  <Image size={14} className="shrink-0 text-white/30" />
                  رفع صورة
                </button>
                <div className="mx-3 h-px bg-white/[0.06]" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-3 px-4 py-3 text-right text-[13px] font-semibold text-white/60 transition hover:bg-white/[0.06] hover:text-white/80"
                >
                  <FileText size={14} className="shrink-0 text-white/30" />
                  رفع ملف PDF
                </button>
              </div>
            )}
          </div>

          {/* Send */}
          <button
            type="submit"
            aria-label="إرسال"
            disabled={!canSend}
            className={`flex h-8 w-8 items-center justify-center rounded-full transition ${
              canSend
                ? "bg-[var(--voltjo-orange)] text-white hover:-translate-y-0.5 hover:bg-[#e85e00]"
                : "bg-white/[0.06] text-white/20 cursor-not-allowed"
            } ${isLoading ? "animate-pulse" : ""}`}
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </form>
  );
}
