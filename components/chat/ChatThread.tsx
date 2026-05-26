import { ChatTopBar } from "@/components/chat/ChatTopBar";
import { ChatWelcome } from "@/components/chat/ChatWelcome";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatMessage, type ChatMessageData } from "@/components/chat/ChatMessage";

export function ChatThread({
  messages,
  composerValue,
  notice,
  sourcesActive,
  onComposerChange,
  onSubmit,
  onSuggestionSelect,
  onAttach,
  onToggleSources,
  onOpenSidebar,
}: {
  messages: ChatMessageData[];
  composerValue: string;
  notice: string | null;
  sourcesActive: boolean;
  onComposerChange: (value: string) => void;
  onSubmit: () => void;
  onSuggestionSelect: (suggestion: string) => void;
  onAttach: () => void;
  onToggleSources: () => void;
  onOpenSidebar: () => void;
}) {
  const hasMessages = messages.length > 0;

  return (
    <section className="flex min-w-0 flex-1 flex-col bg-[#F8F7F4]" dir="rtl">
      <ChatTopBar onOpenSidebar={onOpenSidebar} />
      <div
        className={`flex min-h-0 flex-1 px-4 ${
          hasMessages
            ? "flex-col overflow-hidden pb-0"
            : "items-center justify-center pb-[12vh]"
        }`}
      >
        {hasMessages ? (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto py-8">
              <div className="mx-auto flex w-full max-w-3xl flex-col gap-7">
                {messages.map((message) => (
                  <ChatMessage key={message.id} message={message} />
                ))}
              </div>
            </div>
            <div className="mx-auto w-full max-w-[920px] bg-gradient-to-t from-[#F8F7F4] via-[#F8F7F4] to-transparent pb-5 pt-5">
              <ChatComposer
                value={composerValue}
                onChange={onComposerChange}
                onSubmit={onSubmit}
                onAttach={onAttach}
                onToggleSources={onToggleSources}
                sourcesActive={sourcesActive}
              />
              {notice ? (
                <p className="mx-auto mt-3 max-w-[820px] text-center text-xs font-medium text-[#6F6A60]">
                  {notice}
                </p>
              ) : null}
            </div>
          </>
        ) : (
          <ChatWelcome
            composerValue={composerValue}
            notice={notice}
            sourcesActive={sourcesActive}
            onComposerChange={onComposerChange}
            onSubmit={onSubmit}
            onSuggestionSelect={onSuggestionSelect}
            onAttach={onAttach}
            onToggleSources={onToggleSources}
          />
        )}
      </div>
    </section>
  );
}
