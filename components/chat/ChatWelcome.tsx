import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatSuggestions } from "@/components/chat/ChatSuggestions";
import type { ChatAttachment } from "@/lib/chat/types";

export function ChatWelcome({
  composerValue,
  notice,
  onComposerChange,
  onSubmit,
  onSuggestionSelect,
  attachment,
  onAttachmentChange,
}: {
  composerValue: string;
  notice: string | null;
  onComposerChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
  onSuggestionSelect: (suggestion: string) => void;
  attachment: ChatAttachment | null;
  onAttachmentChange: (att: ChatAttachment | null) => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-[920px] flex-col items-center px-4 text-center">
      <h1 className="text-[34px] font-semibold leading-tight tracking-normal text-[#1F1F1D] sm:text-[46px]">
        كيف أقدر أساعدك في سيارتك؟
      </h1>
      <p className="mt-3 max-w-2xl text-base font-medium leading-8 text-[#6F6A60]">
        اسأل عن سيارة، تكلفة الشحن، المقارنة، الدعم أو الضمان داخل الأردن.
      </p>

      <div className="mt-8 w-full">
        <ChatComposer
          value={composerValue}
          onChange={onComposerChange}
          onSubmit={onSubmit}
          attachment={attachment}
          onAttachmentChange={onAttachmentChange}
        />
        {notice ? (
          <p className="mx-auto mt-3 max-w-[820px] text-center text-xs font-medium text-[#6F6A60]">
            {notice}
          </p>
        ) : null}
        <ChatSuggestions onSelect={onSuggestionSelect} />
      </div>
    </section>
  );
}
