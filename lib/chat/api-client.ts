import type { ChatAttachment, ChatMessage } from "@/lib/chat/types";
import type { AiChatTurn } from "@/lib/ai/types";

const CHAT_REQUEST_TIMEOUT_MS = 35_000;

export type SendChatRequest = {
  message: string;
  modelId: string;
  thinkingMode: boolean;
  conversationId?: string | null;
  attachment?: ChatAttachment | null;
  clientHistory?: AiChatTurn[];
  conversationTitle?: string;
  messageCount?: number;
};

export type SendChatResponse = {
  message: ChatMessage;
  conversationId?: string | null;
};

export type StreamChatTokenChunk = { type: 'token'; content: string };
export type StreamChatDoneChunk = {
  type: 'done';
  conversationId: string | null;
  usage: { promptTokens: number; completionTokens: number; totalTokens: number } | null;
  model: string;
  latencyMs: number;
};
export type StreamChatErrorChunk = { type: 'error'; code: string; message: string };
export type StreamChatChunk = StreamChatTokenChunk | StreamChatDoneChunk | StreamChatErrorChunk;

export async function* streamChatMessage(
  request: SendChatRequest,
  options?: { signal?: AbortSignal },
): AsyncGenerator<StreamChatChunk> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHAT_REQUEST_TIMEOUT_MS);
  options?.signal?.addEventListener('abort', () => controller.abort(), { once: true });

  let response: Response;
  try {
    response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        message: request.message,
        modelId: request.modelId,
        thinkingMode: request.thinkingMode,
        conversationId: request.conversationId,
        attachment: request.attachment,
        clientHistory: request.clientHistory,
        conversationTitle: request.conversationTitle,
        messageCount: request.messageCount,
      }),
      signal: controller.signal,
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('استغرق الرد وقتًا أطول من المتوقع. حاول مرة أخرى.');
    }
    throw error;
  }

  if (!response.ok || !response.body) {
    clearTimeout(timeout);
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error?.message ?? 'تعذر تجهيز الرد الآن. حاول مرة أخرى.');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;
        try {
          yield JSON.parse(jsonStr) as StreamChatChunk;
        } catch {
          // skip malformed SSE line
        }
      }
    }
  } finally {
    clearTimeout(timeout);
    reader.releaseLock();
  }
}

export async function sendChatMessage(
  request: SendChatRequest,
  options?: { signal?: AbortSignal },
): Promise<SendChatResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CHAT_REQUEST_TIMEOUT_MS);

  // Forward external stop signal (e.g. user pressing stop button) into our internal controller
  options?.signal?.addEventListener("abort", () => controller.abort(), { once: true });

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: request.message,
        modelId: request.modelId,
        thinkingMode: request.thinkingMode,
        conversationId: request.conversationId,
        attachment: request.attachment,
        clientHistory: request.clientHistory,
        conversationTitle: request.conversationTitle,
        messageCount: request.messageCount,
      }),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.ok) {
      const message =
        payload?.error?.message ?? "تعذر تجهيز الرد الآن. حاول مرة أخرى.";
      throw new Error(message);
    }

    return {
      message: payload.data.message as ChatMessage,
      conversationId:
        typeof payload.data.conversationId === "string"
          ? payload.data.conversationId
          : null,
    };
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
