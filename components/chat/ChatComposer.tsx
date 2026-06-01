"use client";

import { ArrowUp, Image, Paperclip, FileText, X, ChevronDown, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { ChatAttachment } from "@/lib/chat/types";
import {
  ALLOWED_CHAT_ATTACHMENT_TYPES,
  ATTACHMENT_DEMO_NOTICE,
  INVALID_ATTACHMENT_TYPE_NOTICE,
  LARGE_ATTACHMENT_NOTICE,
  MAX_CHAT_ATTACHMENT_SIZE_BYTES,
  MAX_CHAT_MESSAGE_LENGTH,
} from "@/lib/chat/constants";
import { CHAT_MODELS } from "@/components/chat/ChatShell";

export function ChatComposer({
  value,
  onChange,
  onSubmit,
  isLoading,
  attachment,
  onAttachmentChange,
  onNotice,
  selectedModel,
  onModelChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  attachment?: ChatAttachment | null;
  onAttachmentChange?: (att: ChatAttachment | null) => void;
  onNotice?: (message: string) => void;
  selectedModel: { id: string; name: string };
  onModelChange: (model: { id: string; name: string }) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const modelRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        setModelSelectorOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const canSubmit = (value.trim().length > 0 || attachment) && !isLoading;

  return (
    <div className="mx-auto w-full max-w-[820px]">
      <form
        aria-label="مربع رسالة VoltJo"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
      >
        <div className="rounded-2xl border border-[rgba(13,13,13,0.12)] bg-[#FEFEFC] p-2.5 shadow-[0_4px_12px_rgba(13,13,13,0.03)] transition-all focus-within:border-[rgba(13,13,13,0.2)] focus-within:shadow-[0_8px_24px_rgba(13,13,13,0.06)]">
          
          <AnimatePresence>
            {attachment && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden px-1"
              >
                <div className="flex w-max items-center gap-2 rounded-lg border border-[rgba(13,13,13,0.06)] bg-[#F8F7F4] px-3 py-2 text-sm font-semibold text-[#1F1F1D]">
                  <Paperclip size={14} className="text-[#6F6A60]" />
                  <span dir="ltr">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => onAttachmentChange?.(null)}
                    className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#6F6A60] shadow-sm transition hover:text-[#1F1F1D]"
                    aria-label="إزالة المرفق"
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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
            className="min-h-[64px] w-full resize-none bg-transparent px-3 py-1 text-right text-[15px] font-medium leading-7 text-[#1F1F1D] outline-none placeholder:text-[#6F6A60]/70"
            placeholder="اسأل عن سيارة، تكلفة الشحن، المقارنة..."
            rows={1}
          />
          
          <div className="flex items-center justify-between gap-3 px-1 pt-2">
            <div className="flex items-center gap-2">
              {/* Attachment button */}
              <div className="relative" ref={dropdownRef}>
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

                <button
                  type="button"
                  aria-label="إضافة مرفق"
                  aria-expanded={dropdownOpen}
                  onClick={() => setDropdownOpen((prev) => !prev)}
                  className={`flex h-9 w-9 items-center justify-center rounded-full transition ${
                    dropdownOpen
                      ? "bg-[rgba(13,13,13,0.06)] text-[#1F1F1D]"
                      : "text-[#6F6A60] hover:bg-[#F8F7F4] hover:text-[#1F1F1D]"
                  }`}
                >
                  <Paperclip size={18} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full right-0 mb-2 min-w-[180px] overflow-hidden rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-white p-1 shadow-[0_8px_24px_rgba(13,13,13,0.06)] z-50"
                      dir="rtl"
                    >
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right text-[13px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4]"
                      >
                        <Image size={15} className="shrink-0 text-[#6F6A60]" />
                        رفع صورة
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-right text-[13px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4]"
                      >
                        <FileText size={15} className="shrink-0 text-[#6F6A60]" />
                        رفع ملف PDF
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Model Selector inside composer row */}
              <div className="relative" ref={modelRef} dir="rtl">
                <button
                  type="button"
                  onClick={() => setModelSelectorOpen(!modelSelectorOpen)}
                  className="flex h-8 items-center gap-1.5 rounded-lg border border-[rgba(13,13,13,0.06)] bg-white px-2.5 text-[12px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4]"
                >
                  <Sparkles size={13} className="text-[var(--voltjo-orange)]" />
                  <span dir="ltr">{selectedModel.name}</span>
                  <ChevronDown size={13} className="text-[#6F6A60] mr-0.5" />
                </button>

                <AnimatePresence>
                  {modelSelectorOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute bottom-full right-0 mb-2 min-w-[160px] z-50 overflow-hidden rounded-xl border border-[rgba(13,13,13,0.08)] bg-white p-1 shadow-[0_8px_24px_rgba(13,13,13,0.06)]"
                    >
                      {CHAT_MODELS.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            onModelChange(model);
                            setModelSelectorOpen(false);
                          }}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-right text-[12px] font-semibold transition ${
                            selectedModel.id === model.id 
                              ? "bg-[#F8F7F4] text-[#1F1F1D]" 
                              : "text-[#6F6A60] hover:bg-[rgba(13,13,13,0.03)] hover:text-[#1F1F1D]"
                          }`}
                        >
                          <Sparkles size={13} className={selectedModel.id === model.id ? "text-[var(--voltjo-orange)]" : "opacity-0"} />
                          <span dir="ltr">{model.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Send button */}
            <button
              type="submit"
              aria-label="إرسال"
              disabled={!canSubmit}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors duration-150 ${
                canSubmit
                  ? "bg-[#1F1F1D] text-white hover:bg-black"
                  : "bg-[#F8F7F4] text-[#C9C4BA] cursor-not-allowed"
              } ${isLoading ? "animate-pulse" : ""}`}
            >
              <ArrowUp size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
