"use client";

import {
  ArrowUp,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Image,
  Paperclip,
  Plus,
  X,
} from "lucide-react";
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
  thinkingMode,
  onThinkingModeChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  attachment?: ChatAttachment | null;
  onAttachmentChange?: (att: ChatAttachment | null) => void;
  onNotice?: (message: string) => void;
  selectedModel: { id: string; name: string; description: string };
  onModelChange: (model: { id: string; name: string; description: string }) => void;
  thinkingMode: boolean;
  onThinkingModeChange: (enabled: boolean) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
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
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const nextHeight = Math.min(textarea.scrollHeight, 220);
    textarea.style.height = `${nextHeight}px`;
    textarea.style.overflowY = textarea.scrollHeight > 220 ? "auto" : "hidden";
  }, [value]);

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
        <div className="rounded-[24px] border border-[rgba(13,13,13,0.12)] bg-[#FEFEFC] p-3 shadow-[0_10px_35px_rgba(31,31,29,0.07)] transition-all duration-200 hover:shadow-[0_14px_42px_rgba(31,31,29,0.08)] focus-within:border-[rgba(13,13,13,0.2)] focus-within:shadow-[0_18px_50px_rgba(31,31,29,0.10)]">
          
          <AnimatePresence>
            {attachment && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 8 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden px-1"
              >
                <div className="group flex w-max max-w-full items-center gap-3 rounded-2xl border border-[rgba(13,13,13,0.08)] bg-[#F8F7F4] px-3 py-2.5 text-sm font-semibold text-[#1F1F1D] shadow-[0_2px_8px_rgba(31,31,29,0.03)]">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white text-[#6F6A60]">
                    <Paperclip size={15} />
                  </span>
                  <span className="min-w-0 truncate" dir="ltr">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => onAttachmentChange?.(null)}
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[#6F6A60] shadow-sm transition hover:text-[#1F1F1D]"
                    aria-label="إزالة المرفق"
                  >
                    <X size={12} />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <textarea
            ref={textareaRef}
            aria-label="رسالة إلى VoltJo Assistant"
            value={value}
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSubmit();
              }
            }}
            className="min-h-[72px] w-full resize-none bg-transparent px-3 py-2 text-right text-[16px] font-medium leading-8 text-[#1F1F1D] outline-none placeholder:text-[#6F6A60]/70"
            placeholder="اسأل عن سيارة، تكلفة الشحن، المقارنة..."
            rows={1}
          />
          
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgba(13,13,13,0.06)] px-1 pt-3">
            <div className="flex min-w-0 items-center gap-1.5">
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
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-[0.98] ${
                    dropdownOpen
                      ? "bg-[rgba(13,13,13,0.06)] text-[#1F1F1D]"
                      : "text-[#6F6A60] hover:bg-[#F8F7F4] hover:text-[#1F1F1D]"
                  }`}
                >
                  <Plus size={20} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full right-0 z-50 mb-2 min-w-[190px] overflow-hidden rounded-2xl border border-[rgba(13,13,13,0.08)] bg-white p-1.5 shadow-[0_18px_45px_rgba(31,31,29,0.12)]"
                      dir="rtl"
                    >
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-[13px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4]"
                      >
                        <Image size={15} className="shrink-0 text-[#6F6A60]" />
                        رفع صورة
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-[13px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4]"
                      >
                        <FileText size={15} className="shrink-0 text-[#6F6A60]" />
                        رفع ملف PDF
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                type="button"
                aria-pressed={thinkingMode}
                className={`inline-flex h-9 items-center gap-2 rounded-xl px-3 text-[13px] font-semibold transition ${
                  thinkingMode
                    ? "bg-[#1F1F1D] text-white shadow-[0_8px_18px_rgba(31,31,29,0.12)]"
                    : "text-[#6F6A60] hover:bg-[#F8F7F4] hover:text-[#1F1F1D]"
                }`}
                aria-label={thinkingMode ? "إيقاف وضع التفكير" : "تفعيل وضع التفكير"}
                onClick={() => {
                  const nextState = !thinkingMode;
                  onThinkingModeChange(nextState);
                  onNotice?.(
                    nextState
                      ? "تم تفعيل وضع التفكير لهذه الجلسة."
                      : "تم إيقاف وضع التفكير."
                  );
                }}
              >
                <Clock3 size={15} />
                تفكير
              </button>
            </div>

            <div className="flex min-w-0 items-center gap-1.5">
              <div className="relative" ref={modelRef} dir="rtl">
                <button
                  type="button"
                  onClick={() => setModelSelectorOpen(!modelSelectorOpen)}
                  className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4]"
                >
                  <span dir="ltr">{selectedModel.name}</span>
                  <ChevronDown
                    size={13}
                    className={`text-[#6F6A60] transition ${modelSelectorOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {modelSelectorOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute bottom-full right-0 z-50 mb-2 w-[280px] overflow-hidden rounded-2xl border border-[rgba(13,13,13,0.08)] bg-white p-1.5 shadow-[0_18px_45px_rgba(31,31,29,0.12)]"
                    >
                      {CHAT_MODELS.map((model) => (
                        <button
                          key={model.id}
                          type="button"
                          onClick={() => {
                            onModelChange(model);
                            setModelSelectorOpen(false);
                          }}
                          className={`flex w-full items-start justify-between gap-3 rounded-xl px-3 py-2.5 text-right transition ${
                            selectedModel.id === model.id 
                              ? "bg-[rgba(255,106,0,0.075)] text-[#1F1F1D]" 
                              : "text-[#6F6A60] hover:bg-[#F8F7F4] hover:text-[#1F1F1D]"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block text-[13px] font-bold" dir="ltr">
                              {model.name}
                            </span>
                            <span className="mt-0.5 block text-[11px] font-semibold leading-5 text-[#6F6A60]">
                              {model.description}
                            </span>
                          </span>
                          {selectedModel.id === model.id ? (
                            <Check size={15} className="mt-1 shrink-0 text-[var(--voltjo-orange)]" />
                          ) : null}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Send button */}
              <button
                type="submit"
                aria-label="إرسال"
                disabled={!canSubmit}
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors duration-150 active:scale-[0.98] ${
                  canSubmit
                    ? "bg-[#1F1F1D] text-white hover:bg-black"
                    : "cursor-not-allowed bg-[#F3F1ED] text-[#C9C4BA]"
                } ${isLoading ? "animate-pulse" : ""}`}
              >
                <ArrowUp size={17} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
