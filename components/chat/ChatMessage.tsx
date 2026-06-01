"use client";

import { useState } from "react";
import { Paperclip } from "lucide-react";
import { motion } from "motion/react";
import { AssistantTypingText } from "@/components/chat/AssistantTypingText";
import { VoltJoChatMark } from "@/components/chat/VoltJoChatMark";
import type { ChatMessage as ChatMessageType } from "@/lib/chat/types";

export function ChatMessage({
  message,
  animateAssistant = false,
}: {
  message: ChatMessageType;
  animateAssistant?: boolean;
}) {
  const isUser = message.role === "user";
  const [typingComplete, setTypingComplete] = useState(!animateAssistant);
  const visibleBullets = typingComplete ? (message.bullets ?? []) : [];

  if (!isUser && message.status === "sending") {
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
            <p className="mt-1 text-[11px] font-medium text-[#6F6A60]">
              جاري التفكير...
            </p>
          </div>
        </div>
      </article>
    );
  }

  if (!isUser && message.status === "error") {
    return (
      <article className="flex w-full justify-end" data-role="assistant">
        <div
          className="max-w-[min(680px,90%)] rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-right text-[13px] font-medium leading-7 text-red-700"
          dir="rtl"
        >
          {message.content || "حدث خطأ غير متوقع. حاول مرة أخرى."}
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
          <p
            className="w-full overflow-visible text-right text-[14px] font-medium leading-7 text-[#1F1F1D] [unicode-bidi:plaintext]"
            dir="rtl"
          >
            <AssistantTypingText
              text={message.content}
              animate={animateAssistant}
              onComplete={() => setTypingComplete(true)}
            />
          </p>
          {visibleBullets.length > 0 ? (
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
        </div>
      </div>
    </motion.article>
  );
}
