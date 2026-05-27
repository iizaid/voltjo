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

  const handleSubmit = () => {
    onSubmit(value);
  };

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

    onAttachmentChange?.({
      id: `att-${Date.now()}`,
      name: file.name,
      size: file.size,
      type: file.type,
    });
    onNotice?.(ATTACHMENT_DEMO_NOTICE);
    setDropdownOpen(false);
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

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
              onClick={() => onAttachmentChange?.(null)}
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
          maxLength={MAX_CHAT_MESSAGE_LENGTH + 1}
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
          {/* Hidden file inputs */}
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            ref={imageInputRef}
            className="hidden"
            onChange={(e) => {
              handleFileSelect(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <input
            type="file"
            accept="application/pdf"
            ref={fileInputRef}
            className="hidden"
            onChange={(e) => {
              handleFileSelect(e.target.files?.[0]);
              e.target.value = "";
            }}
          />

          {/* Attachment button with dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              aria-label="إضافة مرفق"
              aria-expanded={dropdownOpen}
              onClick={() => setDropdownOpen((prev) => !prev)}
              className={`flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-[rgba(31,31,29,0.055)] ${
                dropdownOpen
                  ? "bg-[rgba(31,31,29,0.07)] text-[#1F1F1D]"
                  : "text-[#6F6A60] hover:text-[#1F1F1D]"
              }`}
            >
              <Paperclip size={18} />
            </button>

            {/* Dropdown menu */}
            {dropdownOpen && (
              <div
                className="absolute bottom-full left-0 mb-2 min-w-[160px] overflow-hidden rounded-[14px] border border-[rgba(31,31,29,0.1)] bg-white shadow-[0_8px_28px_rgba(31,31,29,0.12)]"
                dir="rtl"
              >
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="flex w-full items-center gap-3 px-4 py-3 text-right text-[14px] font-semibold text-[#1F1F1D] transition hover:bg-[rgba(31,31,29,0.04)]"
                >
                  <Image size={16} className="shrink-0 text-[#6F6A60]" />
                  رفع صورة
                </button>
                <div className="mx-3 h-px bg-[rgba(31,31,29,0.07)]" />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex w-full items-center gap-3 px-4 py-3 text-right text-[14px] font-semibold text-[#1F1F1D] transition hover:bg-[rgba(31,31,29,0.04)]"
                >
                  <FileText size={16} className="shrink-0 text-[#6F6A60]" />
                  رفع ملف
                </button>
              </div>
            )}
          </div>

          {/* Send button */}
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
