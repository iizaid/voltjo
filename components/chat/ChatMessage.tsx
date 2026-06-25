"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Paperclip, RotateCcw } from "lucide-react";
import { motion } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { VoltJoChatMark } from "@/components/chat/VoltJoChatMark";
import type { ChatMessage as ChatMessageType } from "@/lib/chat/types";

const THINKING_PHRASES_NORMAL = [
  "أعمل على إجابتك...",
  "أحلل سؤالك...",
  "يتشكّل الرد...",
  "أتحقق من المعلومات...",
  "اكتملت المعالجة تقريباً...",
  "أوشكت على الانتهاء...",
];

const THINKING_PHRASES_DEEP = [
  "أحلل السؤال بعمق...",
  "أستعرض الاحتمالات...",
  "أدرس المعطيات بدقة...",
  "أقيّم الخيارات المتاحة...",
  "أصيغ الإجابة الأمثل...",
  "اللمسات الأخيرة...",
];

function ThinkingIndicator({ thinkingMode, requestStartedAt }: { thinkingMode: boolean; requestStartedAt?: number }) {
  const phrases = thinkingMode ? THINKING_PHRASES_DEEP : THINKING_PHRASES_NORMAL;
  const [index, setIndex] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setIndex((prev) => (prev + 1) % phrases.length);
    }, 2200);
    return () => clearInterval(id);
  }, [phrases.length]);

  useEffect(() => {
    if (!requestStartedAt) return;
    const speed = thinkingMode ? 0.042 : 0.11;
    const CAP = 4000;

    const tick = () => {
      const elapsedMs = Date.now() - requestStartedAt;
      const simulated = Math.min(CAP, Math.floor(elapsedMs * speed));
      setTokenCount(simulated);
      if (simulated < CAP) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [requestStartedAt, thinkingMode]);

  return (
    <article className="flex w-full justify-end" data-role="assistant">
      <div className="flex items-start gap-3">
        <VoltJoChatMark
          className="mt-1 h-7 w-7 rounded-full border border-[rgba(13,13,13,0.06)] shadow-sm"
          imageClassName="h-5 w-5"
        />
        <div className="pt-2.5">
          <div className="flex gap-1.5">
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9C4BA] [animation-delay:0ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9C4BA] [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C9C4BA] [animation-delay:300ms]" />
          </div>
          <p className="mt-1 text-[11px] font-medium text-[#6F6A60] transition-all duration-500">
            {phrases[index]}
          </p>
          {requestStartedAt && (
            <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-[#A09890]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#B8A898] animate-pulse" />
              <span>{tokenCount.toLocaleString('en-US')}</span>
              <span className="text-[#C0BAB2]">رمز</span>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export function ChatMessage({
  message,
  animateAssistant = false,
  onTypingComplete,
  onRetry,
  retryDisabled = false,
}: {
  message: ChatMessageType;
  animateAssistant?: boolean;
  onTypingComplete?: (id: string) => void;
  onRetry?: (id: string) => void;
  retryDisabled?: boolean;
}) {
  const isUser = message.role === "user";
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const progressRef = useRef({ value: 0 });
  const isAnimatingRef = useRef(false);
  const [visibleLength, setVisibleLength] = useState(0);

  // GSAP progressive reveal when a new assistant message arrives
  useEffect(() => {
    if (!animateAssistant || isUser || message.status !== "done" || !message.content) return;

    const fullLength = message.content.length;
    progressRef.current.value = 0;
    setVisibleLength(0);
    isAnimatingRef.current = true;

    // Duration scales with content length: fast for short, max 3s for long responses
    const duration = Math.max(0.5, Math.min(3.0, fullLength / 400));

    tweenRef.current = gsap.to(progressRef.current, {
      value: fullLength,
      duration,
      ease: "power2.inOut",
      onUpdate() {
        setVisibleLength(Math.floor(progressRef.current.value));
      },
      onComplete() {
        isAnimatingRef.current = false;
        tweenRef.current = null;
        setVisibleLength(fullLength);
        onTypingComplete?.(message.id);
      },
    });

    return () => {
      tweenRef.current?.kill();
      tweenRef.current = null;
      isAnimatingRef.current = false;
    };
  }, [animateAssistant, isUser, message.id, message.content, message.status, onTypingComplete]);

  // When animateAssistant turns false mid-animation (e.g. user pressed stop) → jump to full text
  useEffect(() => {
    if (!animateAssistant && isAnimatingRef.current) {
      tweenRef.current?.kill();
      tweenRef.current = null;
      isAnimatingRef.current = false;
      setVisibleLength(message.content?.length ?? 0);
    }
  }, [animateAssistant, message.content]);

  const isStreaming =
    animateAssistant &&
    message.status === "done" &&
    visibleLength < (message.content?.length ?? 0);

  // Snap to word boundary to avoid splitting markdown tokens mid-render
  const displayContent = (() => {
    if (!isStreaming) return message.content ?? "";
    const full = message.content ?? "";
    let pos = visibleLength;
    if (pos < full.length && full[pos] !== " " && full[pos] !== "\n") {
      const lastBreak = full.lastIndexOf(" ", pos);
      if (lastBreak > pos - 15) pos = lastBreak + 1;
    }
    return full.slice(0, pos);
  })();

  const visibleBullets = message.bullets ?? [];

  if (!isUser && message.status === "sending") {
    return (
      <ThinkingIndicator
        thinkingMode={message.metadata?.thinkingMode ?? false}
        requestStartedAt={message.metadata?.requestStartedAt}
      />
    );
  }

  if (!isUser && message.status === 'streaming') {
    const liveTokenEstimate = Math.floor((message.content?.length ?? 0) / 4);
    return (
      <motion.article
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
        className="flex w-full justify-end"
        data-role="assistant"
      >
        <div className="flex w-full max-w-[min(720px,95%)] items-start gap-3">
          <VoltJoChatMark
            className="mt-0.5 h-7 w-7 rounded-full border border-[rgba(13,13,13,0.06)] shadow-sm"
            imageClassName="h-5 w-5"
          />
          <div className="min-w-0 flex-1 pt-0.5 text-right" dir="rtl">
            <div className="w-full text-right text-[14px] font-medium leading-7 text-[#1F1F1D] [unicode-bidi:plaintext]" dir="rtl">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  p: ({ children }) => <p className="mb-3 last:mb-0 text-[14px] font-medium leading-7 text-[#1F1F1D]">{children}</p>,
                  strong: ({ children }) => <strong className="font-bold text-[#1F1F1D]">{children}</strong>,
                  ul: ({ children }) => <ul className="mb-3 space-y-1.5 pr-1" dir="rtl">{children}</ul>,
                  li: ({ children }) => (
                    <li className="flex items-start gap-2 text-[14px] font-medium leading-7 text-[#1F1F1D]">
                      <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[var(--voltjo-orange)]" aria-hidden="true" />
                      <span className="min-w-0">{children}</span>
                    </li>
                  ),
                }}
              >
                {message.content ?? ''}
              </ReactMarkdown>
              <span className="inline-block w-0.5 h-[1.1em] bg-[#8A7A6A] ml-0.5 animate-[blink_0.8s_step-end_infinite] align-middle" />
            </div>
            <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-[#A09890]">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#B8A898] animate-pulse" />
              <span>{liveTokenEstimate.toLocaleString('en-US')}</span>
              <span className="text-[#C0BAB2]">رمز تقريباً</span>
            </div>
          </div>
        </div>
      </motion.article>
    );
  }

  if (!isUser && message.status === "error") {
    return (
      <article className="flex w-full justify-end" data-role="assistant">
        <div
          className="flex max-w-[min(680px,90%)] flex-col items-end gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-right text-[13px] font-medium leading-7 text-red-700"
          dir="rtl"
        >
          <span>{message.content || "حدث خطأ غير متوقع. حاول مرة أخرى."}</span>
          {onRetry ? (
            <button
              type="button"
              onClick={() => onRetry(message.id)}
              disabled={retryDisabled}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-[12px] font-bold text-red-600 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RotateCcw size={13} />
              إعادة المحاولة
            </button>
          ) : null}
        </div>
      </article>
    );
  }

  if (isUser) {
    return (
      <motion.article
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="flex w-full justify-start"
        data-role="user"
      >
        <div className="max-w-[min(680px,90%)] rounded-[20px] bg-[#1F1F1D] px-5 py-3 text-right shadow-sm" dir="rtl">
          {message.attachment && (
            <div className="mb-2 flex w-max max-w-full items-center gap-2 rounded-lg bg-white/10 px-2.5 py-1.5 text-[11px] font-semibold text-white/80">
              <Paperclip size={11} />
              <span className="truncate" dir="ltr">
                {message.attachment.name}
              </span>
            </div>
          )}
          <p className="whitespace-pre-wrap break-words text-[14px] font-medium leading-7 text-white [unicode-bidi:plaintext]">
            {message.content}
          </p>
        </div>
      </motion.article>
    );
  }

  return (
    <motion.article
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex w-full justify-end"
      data-role="assistant"
    >
      <div className="flex w-full max-w-[min(720px,95%)] items-start gap-3">
        <VoltJoChatMark
          className="mt-0.5 h-7 w-7 rounded-full border border-[rgba(13,13,13,0.06)] shadow-sm"
          imageClassName="h-5 w-5"
        />
        <div className="min-w-0 flex-1 pt-0.5 text-right" dir="rtl">
          {message.attachment && (
            <div className="mb-2.5 flex w-max max-w-full items-center gap-2 rounded-lg bg-[rgba(13,13,13,0.04)] px-3 py-1.5 text-[11px] font-semibold text-[#6F6A60]">
              <Paperclip size={11} />
              <span className="truncate" dir="ltr">
                {message.attachment.name}
              </span>
            </div>
          )}
          <motion.div
            initial={animateAssistant ? { opacity: 0 } : false}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="w-full text-right text-[14px] font-medium leading-7 text-[#1F1F1D] [unicode-bidi:plaintext] prose-rtl"
            dir="rtl"
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                p: ({ children }) => (
                  <p className="mb-3 last:mb-0 text-[14px] font-medium leading-7 text-[#1F1F1D]">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold text-[#1F1F1D]">{children}</strong>
                ),
                ul: ({ children }) => (
                  <ul className="mb-3 space-y-1.5 pr-1" dir="rtl">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="mb-3 space-y-1.5 pr-1 list-decimal list-inside" dir="rtl">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="flex items-start gap-2 text-[14px] font-medium leading-7 text-[#1F1F1D]">
                    <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-[var(--voltjo-orange)]" aria-hidden="true" />
                    <span className="min-w-0">{children}</span>
                  </li>
                ),
                h1: ({ children }) => (
                  <h1 className="mb-2 mt-4 text-[16px] font-bold text-[#1F1F1D] first:mt-0">{children}</h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mb-2 mt-3 text-[15px] font-bold text-[#1F1F1D] first:mt-0">{children}</h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mb-1.5 mt-3 text-[14px] font-bold text-[#1F1F1D] first:mt-0">{children}</h3>
                ),
                table: ({ children }) => (
                  <div className="mb-3 overflow-x-auto">
                    <table className="w-full border-collapse text-[13px]">{children}</table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-[rgba(13,13,13,0.1)] bg-[#F8F7F4] px-3 py-2 text-right font-bold text-[#1F1F1D]">{children}</th>
                ),
                td: ({ children }) => (
                  <td className="border border-[rgba(13,13,13,0.08)] px-3 py-2 text-right text-[#3A3732]">{children}</td>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-[#F8F7F4] px-1.5 py-0.5 text-[13px] font-mono text-[#1F1F1D]">{children}</code>
                ),
                hr: () => <hr className="my-3 border-[rgba(13,13,13,0.08)]" />,
              }}
            >
              {displayContent}
            </ReactMarkdown>
            {isStreaming && (
              <span className="inline-block w-0.5 h-3.5 bg-[#8A7A6A] ml-0.5 animate-[blink_0.8s_step-end_infinite] align-middle" />
            )}
          </motion.div>
          {!isStreaming && visibleBullets.length > 0 ? (
            <ul className="mt-3 space-y-2" dir="rtl">
              {visibleBullets.map((bullet, index) => (
                <motion.li
                  key={`${bullet}-${index}`}
                  initial={animateAssistant ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.12, delay: index * 0.04 }}
                  className="flex items-start gap-2.5 text-[13px] font-medium leading-6 text-[#3A3732]"
                >
                  <span
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--voltjo-orange)]"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 break-words [unicode-bidi:plaintext]">
                    {bullet}
                  </span>
                </motion.li>
              ))}
            </ul>
          ) : null}
          {message.metadata?.usage && (
            <div className="mt-2 flex items-center gap-2 text-[10px] text-[#A09890]" dir="ltr">
              <span>{message.metadata.usage.totalTokens.toLocaleString('en-US')} tokens</span>
              {message.metadata.latencyMs && (
                <><span className="text-[#C0BAB2]">·</span>
                <span>{(message.metadata.latencyMs / 1000).toFixed(1)}s</span></>
              )}
              {message.metadata.model && (
                <><span className="text-[#C0BAB2]">·</span>
                <span className="opacity-60">{message.metadata.model}</span></>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.article>
  );
}
