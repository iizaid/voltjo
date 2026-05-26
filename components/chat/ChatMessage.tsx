import type { ChatMessageData } from "@/lib/chat/types";

export function ChatMessage({ message }: { message: ChatMessageData }) {
  const isUser = message.role === "user";

  return (
    <article
      className={`flex w-full ${isUser ? "justify-start" : "justify-end"}`}
      data-role={message.role}
    >
      <div
        className={`max-w-[min(760px,92%)] text-right ${
          isUser
            ? "rounded-[22px] bg-[var(--voltjo-black)] px-5 py-4 text-white"
            : "px-2 py-2 text-[var(--voltjo-black)]"
        }`}
      >
        <p
          className={`text-[15px] font-semibold leading-8 ${
            isUser ? "text-white" : "text-[#1F1F1D]"
          }`}
        >
          {message.content}
        </p>
        {message.bullets ? (
          <ul className="mt-4 space-y-2 text-[15px] font-semibold leading-8 text-[#6F6A60]">
            {message.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2">
                <span className="mt-3 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--voltjo-orange)]" />
                <span>{bullet}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </article>
  );
}
