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
  Sparkles,
  Brain,
  Compass,
  Cpu,
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
import { CHAT_MODELS, type ModelDisplay } from "@/lib/ai/model-display";

function getModelIcon(iconName: string, size = 16) {
  const cls = "shrink-0";
  switch (iconName) {
    case "voltjo":
      return <Sparkles size={size} className={`text-neutral-800 ${cls}`} />;
    case "google":
      return <Sparkles size={size} className={`text-neutral-500 ${cls}`} />;
    case "deepseek":
      return <Brain size={size} className={`text-neutral-500 ${cls}`} />;
    case "kimi":
      return <Compass size={size} className={`text-neutral-500 ${cls}`} />;
    case "nvidia":
      return <Cpu size={size} className={`text-neutral-500 ${cls}`} />;
    default:
      return <Sparkles size={size} className={`text-neutral-450 ${cls}`} />;
  }
}

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
  modelSelectorOpen,
  onModelSelectorOpenChange,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (text: string) => void;
  isLoading?: boolean;
  attachment?: ChatAttachment | null;
  onAttachmentChange?: (att: ChatAttachment | null) => void;
  onNotice?: (message: string) => void;
  selectedModel: ModelDisplay;
  onModelChange: (model: ModelDisplay) => void;
  thinkingMode: boolean;
  onThinkingModeChange: (enabled: boolean) => void;
  modelSelectorOpen: boolean;
  onModelSelectorOpenChange: (open: boolean) => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const modelRef = useRef<HTMLDivElement>(null);
  const modelTriggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const [focusedModelIndex, setFocusedModelIndex] = useState(0);

  // Indices of selectable (non coming-soon) models — the keyboard nav order.
  const selectableModelIndices = CHAT_MODELS.reduce<number[]>((acc, model, index) => {
    if (!model.comingSoon) acc.push(index);
    return acc;
  }, []);

  const openModelSelector = () => {
    const selectedIndex = CHAT_MODELS.findIndex((m) => m.id === selectedModel.id);
    const startIndex =
      selectedIndex >= 0 && !CHAT_MODELS[selectedIndex].comingSoon
        ? selectedIndex
        : (selectableModelIndices[0] ?? 0);
    setFocusedModelIndex(startIndex);
    onModelSelectorOpenChange(true);
  };

  const closeModelSelector = (returnFocus = false) => {
    onModelSelectorOpenChange(false);
    if (returnFocus) modelTriggerRef.current?.focus();
  };

  const moveModelFocus = (direction: 1 | -1) => {
    const pos = selectableModelIndices.indexOf(focusedModelIndex);
    const safePos = pos === -1 ? 0 : pos;
    const next =
      selectableModelIndices[
        (safePos + direction + selectableModelIndices.length) % selectableModelIndices.length
      ];
    setFocusedModelIndex(next);
  };

  // Move DOM focus to the active option whenever it changes while open.
  useEffect(() => {
    if (modelSelectorOpen) optionRefs.current[focusedModelIndex]?.focus();
  }, [modelSelectorOpen, focusedModelIndex]);

  const handleModelListKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        moveModelFocus(1);
        break;
      case "ArrowUp":
        event.preventDefault();
        moveModelFocus(-1);
        break;
      case "Home":
        event.preventDefault();
        setFocusedModelIndex(selectableModelIndices[0] ?? 0);
        break;
      case "End":
        event.preventDefault();
        setFocusedModelIndex(selectableModelIndices[selectableModelIndices.length - 1] ?? 0);
        break;
      case "Escape":
        event.preventDefault();
        closeModelSelector(true);
        break;
      case "Enter":
      case " ": {
        event.preventDefault();
        const model = CHAT_MODELS[focusedModelIndex];
        if (model && !model.comingSoon) {
          onModelChange(model);
          closeModelSelector(true);
        }
        break;
      }
    }
  };

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

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) {
        closeModelSelector();
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
        {/* Sleeker border radius and refined borders/shadows */}
        <div className="rounded-2xl border border-[rgba(13,13,13,0.08)] bg-[#FEFEFC] p-2.5 sm:p-3 shadow-[0_8px_30px_rgba(31,31,29,0.05)] transition-all duration-200 hover:shadow-[0_12px_36px_rgba(31,31,29,0.07)] focus-within:border-[rgba(13,13,13,0.15)] focus-within:shadow-[0_14px_40px_rgba(31,31,29,0.08)]">
          
          <AnimatePresence>
            {attachment && (
              <motion.div 
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 6 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                transition={{ duration: 0.15 }}
                className="overflow-hidden px-1"
              >
                <div className="group flex w-max max-w-full items-center gap-2.5 rounded-xl border border-[rgba(13,13,13,0.06)] bg-[#F8F7F4] px-2.5 py-2 text-xs font-semibold text-[#1F1F1D] shadow-[0_1px_4px_rgba(31,31,29,0.02)]">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-[#6F6A60]">
                    <Paperclip size={13} />
                  </span>
                  <span className="min-w-0 truncate" dir="ltr">{attachment.name}</span>
                  <button
                    type="button"
                    onClick={() => onAttachmentChange?.(null)}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[#6F6A60] shadow-sm transition hover:text-[#1F1F1D]"
                    aria-label="إزالة المرفق"
                  >
                    <X size={10} />
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
            className="min-h-[48px] sm:min-h-[56px] w-full resize-none bg-transparent px-3 py-1.5 sm:py-2 text-right text-[15px] sm:text-[16px] font-medium leading-7 sm:leading-8 text-[#1F1F1D] outline-none placeholder:text-[#6F6A60]/60"
            placeholder="اسأل عن سيارة، تكلفة الشحن، المقارنة..."
            rows={1}
          />
          
          <div className="flex items-center justify-between gap-3 border-t border-[rgba(13,13,13,0.04)] px-1 pt-2 sm:pt-2.5">
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
                  className={`flex h-8 w-8 items-center justify-center rounded-lg transition active:scale-[0.98] ${
                    dropdownOpen
                      ? "bg-[rgba(13,13,13,0.06)] text-[#1F1F1D]"
                      : "text-[#6F6A60] hover:bg-[#F8F7F4] hover:text-[#1F1F1D]"
                  }`}
                >
                  <Plus size={18} />
                </button>

                <AnimatePresence>
                  {dropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.98 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full right-0 z-50 mb-2 min-w-[190px] overflow-hidden rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-[#FEFEFC] p-1.5 shadow-[0_12px_36px_rgba(31,31,29,0.1)]"
                      dir="rtl"
                    >
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-right text-[13px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4]"
                      >
                        <Image size={15} className="shrink-0 text-[#6F6A60]" />
                        رفع صورة
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex w-full items-center gap-3 rounded-[10px] px-3 py-2 text-right text-[13px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4]"
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
                className={`inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[12px] font-semibold transition ${
                  thinkingMode
                    ? "bg-[#1F1F1D] text-white shadow-[0_4px_12px_rgba(31,31,29,0.1)]"
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
                <Clock3 size={14} />
                تفكير
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="relative" ref={modelRef} dir="rtl">
                <button
                  ref={modelTriggerRef}
                  type="button"
                  aria-haspopup="listbox"
                  aria-expanded={modelSelectorOpen}
                  aria-label={`النموذج المحدد: ${selectedModel.displayName}. اضغط لتغيير النموذج`}
                  onClick={() => (modelSelectorOpen ? closeModelSelector() : openModelSelector())}
                  onKeyDown={(event) => {
                    if (!modelSelectorOpen && (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ")) {
                      event.preventDefault();
                      openModelSelector();
                    }
                  }}
                  className="flex h-8 items-center gap-1 rounded-lg px-2 text-[12px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300"
                >
                  <span className="flex items-center gap-1.5">
                    {getModelIcon(selectedModel.icon, 14)}
                    <span dir="ltr">{selectedModel.displayName}</span>
                  </span>
                  <ChevronDown
                    size={12}
                    className={`text-[#6F6A60] transition-transform duration-200 ${modelSelectorOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {modelSelectorOpen && (
                    <>
                      {/* Mobile backdrop overlay */}
                      <div
                        className="fixed inset-0 z-40 bg-black/25 backdrop-blur-[1px] md:hidden"
                        onClick={() => closeModelSelector()}
                      />

                       <motion.div
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 15 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        role="listbox"
                        aria-label="اختيار نموذج الذكاء الاصطناعي"
                        aria-activedescendant={`model-option-${CHAT_MODELS[focusedModelIndex]?.id}`}
                        onKeyDown={handleModelListKeyDown}
                        style={isMobile ? { paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom, 0px))" } : undefined}
                        className="fixed bottom-0 left-0 right-0 z-50 max-h-[85vh] w-full rounded-t-[24px] border-t border-[rgba(13,13,13,0.08)] bg-[#FEFEFC] p-4 pb-8 shadow-[0_-12px_40px_rgba(31,31,29,0.12)] md:absolute md:bottom-full md:left-auto md:right-0 md:top-auto md:mb-2.5 md:max-h-[360px] md:w-[320px] md:rounded-[16px] md:border md:p-1.5 md:shadow-[0_12px_36px_rgba(31,31,29,0.12)] flex flex-col"
                      >
                        {/* Drawer pull bar for mobile */}
                        <div className="mx-auto mb-3 h-1 w-10 shrink-0 rounded-full bg-neutral-200 md:hidden" />

                        <p className="px-2.5 pb-2 pt-1 text-[11px] font-bold uppercase tracking-wider text-[#8A8478] dark:text-[#6F6A60] shrink-0">
                          اختر النموذج
                        </p>
                        
                        <div className="overflow-y-auto min-h-0 flex-1 space-y-1">
                          {CHAT_MODELS.map((model, index) => {
                            const isSelected = selectedModel.id === model.id;
                            const isComingSoon = model.comingSoon;

                            return (
                              <button
                                key={model.id}
                                id={`model-option-${model.id}`}
                                ref={(el) => {
                                  optionRefs.current[index] = el;
                                }}
                                type="button"
                                role="option"
                                aria-selected={isSelected}
                                aria-disabled={isComingSoon}
                                tabIndex={-1}
                                onClick={() => {
                                  if (!isComingSoon) {
                                    onModelChange(model);
                                    closeModelSelector(true);
                                  }
                                }}
                                onMouseEnter={() => !isComingSoon && setFocusedModelIndex(index)}
                                className={`group flex w-full items-start gap-3 rounded-[12px] px-3.5 py-2.5 text-right transition-colors duration-150 focus-visible:outline-none ${
                                  isComingSoon
                                    ? "cursor-not-allowed opacity-40"
                                    : isSelected
                                      ? "bg-neutral-50 ring-1 ring-neutral-200/80"
                                      : "hover:bg-neutral-50/50 focus-visible:bg-neutral-50/50"
                                }`}
                              >
                                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                                  {getModelIcon(model.icon, 16)}
                                </span>

                                <span className="min-w-0 flex-1">
                                  <span className="flex flex-wrap items-center gap-1.5">
                                    <span className="text-[13px] font-semibold text-[#1F1F1D] leading-none" dir="ltr">
                                      {model.displayName}
                                    </span>
                                    {model.recommended && (
                                      <span className="inline-flex items-center rounded-full bg-neutral-100 border border-neutral-200/50 px-1.5 py-0.5 text-[9px] font-medium text-neutral-600">
                                        موصى به
                                      </span>
                                    )}
                                    {isComingSoon && (
                                      <span className="inline-flex items-center rounded-full bg-neutral-50 border border-neutral-200/30 px-1.5 py-0.5 text-[9px] font-medium text-neutral-400">
                                        قريباً
                                      </span>
                                    )}
                                  </span>

                                  <span className="mt-1 block text-[11.5px] font-normal leading-normal text-[#6F6A60]">
                                    {model.description}
                                  </span>

                                  {model.tags.length > 0 && (
                                    <span className="mt-1.5 flex flex-wrap gap-1">
                                      {model.tags.map((tag) => (
                                        <span
                                          key={tag}
                                          className="inline-flex items-center rounded bg-neutral-50 border border-neutral-200/30 px-1 py-0.5 text-[9.5px] font-medium text-[#6F6A60]"
                                        >
                                          {tag}
                                        </span>
                                      ))}
                                    </span>
                                  )}
                                </span>

                                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                                  {isSelected && (
                                    <Check size={14} className="text-neutral-800" strokeWidth={2.5} />
                                  )}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Send button */}
              <button
                type="submit"
                aria-label="إرسال"
                disabled={!canSubmit}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 active:scale-[0.98] ${
                  canSubmit
                    ? "bg-[#1F1F1D] text-white hover:bg-black"
                    : "cursor-not-allowed bg-neutral-100 text-neutral-400"
                } ${isLoading ? "animate-pulse" : ""}`}
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
