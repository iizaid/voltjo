import { Paperclip } from "lucide-react";
import type { ChatMessage as ChatMessageType } from "@/lib/chat/types";

export function ChatMessage({ message }: { message: ChatMessageType }) {
  const isUser = message.role === "user";

  if (!isUser && message.status === "sending") {
    return (
      <article className="flex w-full justify-end" data-role="assistant">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--voltjo-orange)]/20 text-[var(--voltjo-orange)]">
            <span className="text-[10px] font-black">V</span>
          </div>
          <div className="pt-0.5">
            <div className="flex gap-1.5 pt-2">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/30 [animation-delay:0ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/30 [animation-delay:150ms]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white/30 [animation-delay:300ms]" />
            </div>
            <p className="mt-1 text-[12px] font-semibold text-white/25">جاري التفكير...</p>
          </div>
        </div>
      </article>
    );
  }

  if (!isUser && message.status === "error") {
    return (
      <article className="flex w-full justify-end" data-role="assistant">
        <div className="flex items-start gap-3">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
            <span className="text-[10px] font-black">V</span>
          </div>
          <div
            className="max-w-[min(680px,88%)] rounded-2xl border border-red-500/20 bg-red-950/40 px-4 py-3 text-right text-[14px] font-semibold leading-7 text-red-400"
            dir="rtl"
          >
            {message.content || "حدث خطأ غير متوقع. حاول مرة أخرى."}
          </div>
        </div>
      </article>
    );
  }

  if (isUser) {
    return (
      <article className="flex w-full justify-start" data-role="user">
        <div className="max-w-[min(680px,88%)] rounded-[20px] bg-[#2A2A28] px-5 py-3.5 text-right" dir="rtl">
          {message.attachment && (
            <div className="mb-2.5 flex w-max items-center gap-2 rounded-lg bg-white/10 px-3 py-1.5 text-[12px] font-semibold text-white/70">
              <Paperclip size={12} />
              <span dir="ltr">{message.attachment.name}</span>
            </div>
          )}
          <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-7 text-white/90 [unicode-bidi:plaintext]">
            {message.content}
          </p>
        </div>
      </article>
    );
  }

  // Assistant message
  return (
    <article className="flex w-full justify-end" data-role="assistant">
      <div className="flex items-start gap-3 max-w-[min(720px,92%)]">
        <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--voltjo-orange)]/15 text-[var(--voltjo-orange)]">
          <span className="text-[10px] font-black">V</span>
        </div>
        <div className="min-w-0 flex-1" dir="rtl">
          {message.attachment && (
            <div className="mb-2.5 flex w-max items-center gap-2 rounded-lg bg-white/[0.06] px-3 py-1.5 text-[12px] font-semibold text-white/50">
              <Paperclip size={12} />
              <span dir="ltr">{message.attachment.name}</span>
            </div>
          )}
          <p className="whitespace-pre-wrap break-words text-[15px] font-semibold leading-8 text-white/80 [unicode-bidi:plaintext]">
            {message.content}
          </p>
          {message.bullets ? (
            <ul className="mt-4 space-y-2" dir="rtl">
              {message.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-2.5 text-[14px] font-semibold leading-7 text-white/55">
                  <span className="mt-[11px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--voltjo-orange)]" aria-hidden="true" />
                  <span className="min-w-0 break-words [unicode-bidi:plaintext]">{bullet}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </article>
  );
}
