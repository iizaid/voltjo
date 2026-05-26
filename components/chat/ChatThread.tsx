import { ChatTopBar } from "@/components/chat/ChatTopBar";
import { ChatWelcome } from "@/components/chat/ChatWelcome";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { ChatMessage } from "@/components/chat/ChatMessage";
import type { ChatMessageData } from "@/lib/chat/types";

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
  isLoading,
  error,
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
  isLoading?: boolean;
  error?: Error | null;
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
                {isLoading && (
                  <div className="flex w-full justify-start">
                    <div className="max-w-[min(760px,92%)] px-2 py-2 text-right">
                      <p className="animate-pulse text-[15px] font-semibold leading-8 text-[#6F6A60]">
                        جاري التفكير...
                      </p>
                    </div>
                  </div>
                )}
                {error && (
                  <div className="mx-auto mt-2 max-w-md rounded-xl bg-red-50 p-4 text-center text-sm font-semibold text-red-600">
                    {error.message}
                  </div>
                )}
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
                isLoading={isLoading}
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
