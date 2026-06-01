import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatSuggestions } from "@/components/chat/ChatSuggestions";
import type { ChatAttachment } from "@/lib/chat/types";
import { motion } from "motion/react";

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
}: {
  composerValue: string;
  notice: string | null;
  onComposerChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
  onSuggestionSelect: (suggestion: string) => void;
  attachment: ChatAttachment | null;
  onAttachmentChange: (att: ChatAttachment | null) => void;
  onNotice: (message: string) => void;
  selectedModel: { id: string; name: string };
  onModelChange: (model: { id: string; name: string }) => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-[820px] flex-col items-center text-center" dir="rtl">
      
      <motion.div 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm border border-[rgba(13,13,13,0.06)]"
      >
        <span className="text-lg font-black text-[var(--voltjo-orange)]">V</span>
      </motion.div>

      <motion.h1 
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: "easeOut", delay: 0.05 }}
        className="text-[28px] font-black leading-tight tracking-tight text-[#1F1F1D] sm:text-[32px]"
      >
        كيف أقدر أساعدك؟
      </motion.h1>

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
