import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatSuggestions } from "@/components/chat/ChatSuggestions";
import { VoltJoChatMark } from "@/components/chat/VoltJoChatMark";
import type { ChatAttachment } from "@/lib/chat/types";
import { motion } from "motion/react";

import type { ModelDisplay } from "@/lib/ai/model-display";

export function ChatWelcome({
  composerValue,
  notice,
  onComposerChange,
  onSubmit,
  onSuggestionSelect,
  attachment,
  onAttachmentChange,
  onNotice,
  selectedModel,
  onModelChange,
  thinkingMode,
  onThinkingModeChange,
}: {
  composerValue: string;
  notice: string | null;
  onComposerChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
  onSuggestionSelect: (suggestion: string) => void;
  attachment: ChatAttachment | null;
  onAttachmentChange: (att: ChatAttachment | null) => void;
  onNotice: (message: string) => void;
  selectedModel: ModelDisplay;
  onModelChange: (model: ModelDisplay) => void;
  thinkingMode: boolean;
  onThinkingModeChange: (enabled: boolean) => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-[820px] flex-col items-center text-center" dir="rtl">
      
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-4"
      >
        <VoltJoChatMark
          className="h-16 w-16"
          imageClassName="h-14 w-14"
          priority
        />
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
        className="text-[28px] font-black leading-tight tracking-tight text-[#1F1F1D] sm:text-[32px]"
      >
        كيف أقدر أساعدك؟
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.08 }}
        className="mt-3 max-w-xl text-[15px] font-medium leading-7 text-[#6F6A60]"
      >
        اسأل عن سيارة، تكلفة الشحن، المقارنة، الدعم أو الضمان داخل الأردن.
      </motion.p>

      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.1 }}
        className="mt-6 w-full"
      >
        <ChatComposer
          value={composerValue}
          onChange={onComposerChange}
          onSubmit={onSubmit}
          attachment={attachment}
          onAttachmentChange={onAttachmentChange}
          onNotice={onNotice}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          thinkingMode={thinkingMode}
          onThinkingModeChange={onThinkingModeChange}
        />
        {notice ? (
          <p className="mx-auto mt-3 max-w-[820px] text-center text-[12px] font-medium text-[#6F6A60]">
            {notice}
          </p>
        ) : null}
        <ChatSuggestions onSelect={onSuggestionSelect} />
      </motion.div>
    </section>
  );
}
