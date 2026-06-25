import { useEffect, useRef, useState } from "react";
import { ChatTopBar } from "@/components/chat/ChatTopBar";
import { ChatWelcome } from "@/components/chat/ChatWelcome";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatMessage } from "@/components/chat/ChatMessage";
import type { ChatMessage as ChatMessageType, ChatAttachment } from "@/lib/chat/types";
import { motion, AnimatePresence } from "motion/react";
import type { ModelDisplay } from "@/lib/ai/model-display";

export function ChatThread({
  messages,
  composerValue,
  notice,
  onComposerChange,
  onSubmit,
  onSuggestionSelect,
  onOpenSidebar,
  isLoading,
  onStop,
  attachment,
  onAttachmentChange,
  onNotice,
  selectedModel,
  onModelChange,
  typingMessageId,
  thinkingMode,
  onThinkingModeChange,
  onAssistantTypingComplete,
  onRetryMessage,
}: {
  messages: ChatMessageType[];
  composerValue: string;
  notice: string | null;
  onComposerChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
  onSuggestionSelect: (suggestion: string) => void;
  onOpenSidebar: () => void;
  isLoading?: boolean;
  onStop?: () => void;
  attachment: ChatAttachment | null;
  onAttachmentChange: (att: ChatAttachment | null) => void;
  onNotice: (message: string) => void;
  selectedModel: ModelDisplay;
  onModelChange: (model: ModelDisplay) => void;
  typingMessageId: string | null;
  thinkingMode: boolean;
  onThinkingModeChange: (enabled: boolean) => void;
  onAssistantTypingComplete: (id: string) => void;
  onRetryMessage: (id: string) => void;
}) {
  const hasMessages = messages.length > 0;
  const bottomRef = useRef<HTMLDivElement>(null);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  useEffect(() => {
    if (hasMessages) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, hasMessages]);

  // Close the model selector the moment a request starts so the user can't
  // switch models mid-flight.
  useEffect(() => {
    if (isLoading) setModelSelectorOpen(false);
  }, [isLoading]);

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#FDFDFC]" dir="rtl">
      <ChatTopBar
        onOpenSidebar={onOpenSidebar}
        selectedModel={selectedModel}
        onToggleModelSelector={() => {
          setModelSelectorOpen((prev) => !prev);
        }}
        isLoading={isLoading}
      />

      <div
        className={`flex min-h-0 flex-1 relative ${
          hasMessages ? "flex-col overflow-hidden" : "items-center justify-center pb-[4vh] sm:pb-[8vh]"
        }`}
      >
        <AnimatePresence mode="wait">
          {hasMessages ? (
            <motion.div
              key="thread"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col flex-1 min-h-0 w-full"
            >
              {/* Messages scroll area */}
              <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 sm:gap-6 px-3 sm:px-4 py-4 sm:py-6">
                  {messages.map((message) => (
                    <ChatMessage
                      key={message.id}
                      message={message}
                      animateAssistant={message.id === typingMessageId}
                      onTypingComplete={onAssistantTypingComplete}
                      onRetry={onRetryMessage}
                      retryDisabled={isLoading}
                    />
                  ))}
                  <div ref={bottomRef} className="h-4" />
                </div>
              </div>

              {/* Sticky composer dock */}
              <div className="shrink-0 bg-gradient-to-t from-[#FDFDFC] via-[#FDFDFC] to-transparent px-3 sm:px-4 pb-3 sm:pb-5 pt-4 sm:pt-8">
                <ChatComposer
                  value={composerValue}
                  onChange={onComposerChange}
                  onSubmit={onSubmit}
                  onStop={onStop}
                  isLoading={isLoading}
                  attachment={attachment}
                  onAttachmentChange={onAttachmentChange}
                  onNotice={onNotice}
                  selectedModel={selectedModel}
                  onModelChange={onModelChange}
                  thinkingMode={thinkingMode}
                  onThinkingModeChange={onThinkingModeChange}
                  modelSelectorOpen={modelSelectorOpen}
                  onModelSelectorOpenChange={setModelSelectorOpen}
                />
                {notice ? (
                  <p className="mx-auto mt-2 text-center text-[12px] font-semibold text-[#6F6A60]">
                    {notice}
                  </p>
                ) : null}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="w-full px-4"
            >
              <ChatWelcome
                composerValue={composerValue}
                notice={notice}
                onComposerChange={onComposerChange}
                onSubmit={onSubmit}
                onSuggestionSelect={onSuggestionSelect}
                attachment={attachment}
                onAttachmentChange={onAttachmentChange}
                onNotice={onNotice}
                selectedModel={selectedModel}
                onModelChange={onModelChange}
                thinkingMode={thinkingMode}
                onThinkingModeChange={onThinkingModeChange}
                modelSelectorOpen={modelSelectorOpen}
                onModelSelectorOpenChange={setModelSelectorOpen}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
