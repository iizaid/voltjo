import { useEffect, useRef } from "react";
import { ChatTopBar } from "@/components/chat/ChatTopBar";
import { ChatWelcome } from "@/components/chat/ChatWelcome";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatMessage } from "@/components/chat/ChatMessage";
import type { ChatMessage as ChatMessageType, ChatAttachment } from "@/lib/chat/types";

export function ChatThread({
  messages,
  composerValue,
  notice,
  onComposerChange,
  onSubmit,
  onSuggestionSelect,
  onOpenSidebar,
  isLoading,
  attachment,
  onAttachmentChange,
  onNotice,
}: {
  messages: ChatMessageType[];
  composerValue: string;
  notice: string | null;
  onComposerChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
  onSuggestionSelect: (suggestion: string) => void;
  onOpenSidebar: () => void;
  isLoading?: boolean;
  attachment: ChatAttachment | null;
  onAttachmentChange: (att: ChatAttachment | null) => void;
  onNotice: (message: string) => void;
}) {
  const hasMessages = messages.length > 0;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (hasMessages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, hasMessages]);

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#161614]" dir="rtl">
      <ChatTopBar onOpenSidebar={onOpenSidebar} />

      <div
        className={`flex min-h-0 flex-1 ${
          hasMessages ? "flex-col overflow-hidden" : "items-center justify-center pb-[10vh]"
        }`}
      >
        {hasMessages ? (
          <>
            {/* Messages scroll area */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
                <div ref={bottomRef} />
              </div>
            </div>

            {/* Sticky composer */}
            <div className="shrink-0 border-t border-white/[0.05] bg-[#161614]/80 px-4 py-4 backdrop-blur-sm">
              <ChatComposer
                value={composerValue}
                onChange={onComposerChange}
                onSubmit={onSubmit}
                isLoading={isLoading}
                attachment={attachment}
                onAttachmentChange={onAttachmentChange}
                onNotice={onNotice}
              />
              {notice ? (
                <p className="mx-auto mt-2.5 max-w-[820px] text-center text-[12px] font-medium text-white/25">
                  {notice}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <ChatWelcome
            composerValue={composerValue}
            notice={notice}
            onComposerChange={onComposerChange}
            onSubmit={onSubmit}
            onSuggestionSelect={onSuggestionSelect}
            attachment={attachment}
            onAttachmentChange={onAttachmentChange}
            onNotice={onNotice}
          />
        )}
      </div>
    </section>
  );
}
