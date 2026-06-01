import type { ChatAttachment, ChatMessage } from "@/lib/chat/types";

const CHAT_REQUEST_TIMEOUT_MS = 35_000;

export type SendChatRequest = {
  message: string;
  modelId: string;
  thinkingMode: boolean;
  attachment?: ChatAttachment | null;
};

export async function sendChatMessage(
  request: SendChatRequest,
): Promise<ChatMessage> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHAT_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      const message =
        payload?.error?.message ?? "تعذر تجهيز الرد الآن. حاول مرة أخرى.";
      throw new Error(message);
    }

    return payload.data.message as ChatMessage;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("استغرق الرد وقتًا أطول من المتوقع. حاول مرة أخرى.", {
        cause: error,
      });
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
