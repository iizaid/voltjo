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
  onNotice,
}: {
  composerValue: string;
  notice: string | null;
  onComposerChange: (value: string) => void;
  onSubmit: (prompt: string) => void;
  onSuggestionSelect: (suggestion: string) => void;
  attachment: ChatAttachment | null;
  onAttachmentChange: (att: ChatAttachment | null) => void;
  onNotice: (message: string) => void;
}) {
  return (
    <section className="mx-auto flex w-full max-w-[820px] flex-col items-center px-4 text-center" dir="rtl">
      {/* Logo mark */}
      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--voltjo-orange)]/15 text-[var(--voltjo-orange)]">
        <span className="text-2xl font-black">V</span>
      </div>

      <h1 className="text-[32px] font-black leading-tight tracking-tight text-white/90 sm:text-[42px]">
        كيف أقدر أساعدك؟
      </h1>
      <p className="mt-3 max-w-lg text-[15px] font-medium leading-7 text-white/35">
        اسأل عن سيارة كهربائية أو هايبرد، احسب تكلفة الشحن، أو قارن بين موديلين داخل الأردن.
      </p>

      <div className="mt-8 w-full">
        <ChatComposer
          value={composerValue}
          onChange={onComposerChange}
          onSubmit={onSubmit}
          attachment={attachment}
          onAttachmentChange={onAttachmentChange}
          onNotice={onNotice}
        />
        {notice ? (
          <p className="mx-auto mt-3 max-w-[820px] text-center text-[12px] font-medium text-white/30">
            {notice}
          </p>
        ) : null}
        <ChatSuggestions onSelect={onSuggestionSelect} />
      </div>
    </section>
  );
}
