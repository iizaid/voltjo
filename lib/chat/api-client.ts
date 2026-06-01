import type { ChatAttachment, ChatMessage } from "@/lib/chat/types";

export type SendChatRequest = {
  message: string;
  modelId: string;
  thinkingMode: boolean;
  attachment?: ChatAttachment | null;
};

export async function sendChatMessage(
  request: SendChatRequest,
): Promise<ChatMessage> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.ok) {
    const message =
      payload?.error?.message ?? "تعذر تجهيز الرد الآن. حاول مرة أخرى.";
    throw new Error(message);
  }

  return payload.data.message as ChatMessage;
}
