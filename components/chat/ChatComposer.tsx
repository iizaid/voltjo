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
      return <Sparkles size={size} className={`text-[var(--voltjo-orange)] ${cls}`} />;
    case "google":
      return <Sparkles size={size} className={`text-blue-500 ${cls}`} />;
    case "deepseek":
      return <Brain size={size} className={`text-purple-500 ${cls}`} />;
    case "kimi":
      return <Compass size={size} className={`text-emerald-500 ${cls}`} />;
    case "nvidia":
      return <Cpu size={size} className={`text-[#76b900] ${cls}`} />;
    default:
      return <Sparkles size={size} className={`text-[#6F6A60] ${cls}`} />;
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
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
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
    setModelSelectorOpen(true);
  };

  const closeModelSelector = (returnFocus = false) => {
    setModelSelectorOpen(false);
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
                  className="flex h-9 items-center gap-1.5 rounded-xl px-2.5 text-[13px] font-semibold text-[#1F1F1D] transition hover:bg-[#F8F7F4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,106,0,0.4)]"
                >
                  <span className="flex items-center gap-1.5">
                    {getModelIcon(selectedModel.icon, 15)}
                    <span dir="ltr">{selectedModel.displayName}</span>
                  </span>
                  <ChevronDown
                    size={13}
                    className={`text-[#6F6A60] transition-transform duration-200 ${modelSelectorOpen ? "rotate-180" : ""}`}
                  />
                </button>

                <AnimatePresence>
                  {modelSelectorOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 6, scale: 0.97 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      role="listbox"
                      aria-label="اختيار نموذج الذكاء الاصطناعي"
                      aria-activedescendant={`model-option-${CHAT_MODELS[focusedModelIndex]?.id}`}
                      onKeyDown={handleModelListKeyDown}
                      className="absolute bottom-full right-0 z-50 mb-2.5 w-[clamp(280px,90vw,340px)] overflow-hidden rounded-3xl border border-[rgba(13,13,13,0.08)] bg-[#FEFEFC] p-2 shadow-[0_24px_60px_rgba(31,31,29,0.16)]"
                    >
                      <p className="px-2.5 pb-1.5 pt-1 text-[11px] font-bold uppercase tracking-wide text-[#A8A296]">
                        اختر النموذج
                      </p>
                      <div className="max-h-[min(60vh,380px)] space-y-1 overflow-y-auto">
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
                              className={`group flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-right transition-colors duration-150 focus-visible:outline-none ${
                                isComingSoon
                                  ? "cursor-not-allowed opacity-55"
                                  : isSelected
                                    ? "bg-[#FFF1E8] ring-1 ring-[rgba(255,106,0,0.28)]"
                                    : "hover:bg-[#F4F2EC] focus-visible:bg-[#F4F2EC]"
                              }`}
                            >
                              <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white shadow-[0_2px_6px_rgba(31,31,29,0.05)] ring-1 ring-[rgba(13,13,13,0.05)]">
                                {getModelIcon(model.icon, 18)}
                              </span>

                              <span className="min-w-0 flex-1">
                                <span className="flex items-center gap-2">
                                  <span className="text-[14px] font-bold text-[#1F1F1D]" dir="ltr">
                                    {model.displayName}
                                  </span>
                                  {model.recommended && (
                                    <span className="inline-flex items-center rounded-full bg-[var(--voltjo-orange)] px-2 py-0.5 text-[9px] font-black text-white">
                                      موصى به
                                    </span>
                                  )}
                                  {isComingSoon && (
                                    <span className="inline-flex items-center rounded-full border border-[rgba(31,31,29,0.12)] bg-[#F2F0EA] px-2 py-0.5 text-[9px] font-black text-[#8A8478]">
                                      قريباً
                                    </span>
                                  )}
                                </span>

                                <span className="mt-1 block text-[11.5px] font-medium leading-5 text-[#6F6A60]">
                                  {model.description}
                                </span>

                                {model.tags.length > 0 && (
                                  <span className="mt-2 flex flex-wrap gap-1.5">
                                    {model.tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="inline-flex items-center rounded-md bg-[#F2F0EA] px-1.5 py-0.5 text-[10px] font-bold text-[#6F6A60] group-hover:bg-white"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </span>
                                )}
                              </span>

                              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                                {isSelected && (
                                  <Check size={16} className="text-[var(--voltjo-orange)]" strokeWidth={3} />
                                )}
                              </span>
                            </button>
                          );
                        })}
                      </div>
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
