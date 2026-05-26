import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { ChatThread } from "@/components/chat/ChatThread";

export function ChatShell() {
  return (
    <div
      className="fixed inset-0 z-[80] flex h-dvh overflow-hidden bg-[#FCFCFB] text-[var(--voltjo-black)]"
      dir="ltr"
    >
      <ChatSidebar />
      <ChatThread />
    </div>
  );
}
