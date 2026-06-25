import "server-only";

import { AiError, classifyHttpStatus } from "@/lib/ai/errors";
import { getAiConfig, getProviderApiKey } from "@/lib/ai/config";
import type {
  AiChatRequest,
  AiChatResponse,
  AiGenerationContext,
  AiProvider,
  AiProviderHealth,
  AiProviderMetadata,
  AiTokenUsage,
} from "@/lib/ai/types";

/**
 * NVIDIA NIM provider. Uses the OpenAI-compatible REST API at
 * integrate.api.nvidia.com/v1 — so the request/response shape is identical
 * to OpenAI. Runs on any runtime (Node, edge, Cloudflare Workers) via fetch.
 */

const NVIDIA_API_BASE = "https://integrate.api.nvidia.com/v1";

const metadata: AiProviderMetadata = {
  id: "nvidia",
  label: "NVIDIA NIM (MiniMax M3)",
  envKey: "NVIDIA_API_KEY",
  defaultModel: "minimaxai/minimax-m3",
  supportsStreaming: false,
};

type OpenAiResponseBody = {
  choices?: Array<{
    message?: { content?: string };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: { message?: string; type?: string };
};

function resolveModel(): string {
  return getAiConfig().modelOverride || metadata.defaultModel;
}

function buildMessages(request: AiChatRequest, systemPrompt: string) {
  const messages: Array<{ role: string; content: string }> = [
    { role: "system", content: systemPrompt },
  ];

  for (const turn of request.history ?? []) {
    messages.push({ role: turn.role, content: turn.content });
  }

  messages.push({ role: "user", content: request.message });
  return messages;
}

function extractText(body: OpenAiResponseBody): string {
  return (body.choices?.[0]?.message?.content ?? "").trim();
}

function extractUsage(body: OpenAiResponseBody): AiTokenUsage {
  const u = body.usage;
  if (!u) return null;
  return {
    promptTokens: u.prompt_tokens ?? 0,
    completionTokens: u.completion_tokens ?? 0,
    totalTokens: u.total_tokens ?? 0,
  };
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AiError("TIMEOUT", "Aborted during backoff.", { providerId: "nvidia" }));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new AiError("TIMEOUT", "Aborted during backoff.", { providerId: "nvidia" }));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function callNvidiaOnce(
  apiKey: string,
  model: string,
  payload: unknown,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<OpenAiResponseBody> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

  try {
    const res = await fetch(`${NVIDIA_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
      cache: "no-store",
    });

    if (!res.ok) {
      const { code, retryable } = classifyHttpStatus(res.status);
      let detail = "";
      try {
        detail = (await res.text()).slice(0, 300);
      } catch {
        detail = "";
      }
      throw new AiError(code, `NVIDIA HTTP ${res.status}: ${detail}`, {
        retryable,
        providerId: "nvidia",
        status: res.status,
      });
    }

    return (await res.json()) as OpenAiResponseBody;
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiError("TIMEOUT", "NVIDIA request aborted (timeout).", {
        retryable: true,
        providerId: "nvidia",
      });
    }
    throw new AiError("UPSTREAM", "NVIDIA network failure.", {
      retryable: true,
      providerId: "nvidia",
    });
  } finally {
    clearTimeout(timer);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

async function generateChatResponse(
  request: AiChatRequest,
  context: AiGenerationContext,
): Promise<AiChatResponse> {
  const apiKey = getProviderApiKey("nvidia");
  if (!apiKey) {
    throw new AiError("CONFIG_MISSING", "NVIDIA_API_KEY is not set.", {
      providerId: "nvidia",
    });
  }

  const config = getAiConfig();
  const model = resolveModel();
  const messages = buildMessages(request, context.systemPrompt);

  const payload = {
    model,
    messages,
    temperature: request.thinkingMode ? 0.9 : 0.75,
    max_tokens: request.thinkingMode ? 16384 : 8192,
    top_p: 0.95,
    stream: false,
  };

  const signal = context.signal;
  let lastError: AiError | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    if (signal?.aborted) {
      throw new AiError("TIMEOUT", "NVIDIA request aborted (deadline).", {
        providerId: "nvidia",
      });
    }
    try {
      const body = await callNvidiaOnce(apiKey, model, payload, config.timeoutMs, signal);

      if (body.error?.message) {
        throw new AiError("UPSTREAM", `NVIDIA error: ${body.error.message}`, {
          providerId: "nvidia",
        });
      }

      const content = extractText(body);
      if (!content) {
        throw new AiError("EMPTY", "NVIDIA returned no content.", {
          retryable: true,
          providerId: "nvidia",
        });
      }

      return {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content,
        createdAt: new Date().toISOString(),
        status: "done",
        metadata: {
          modelId: request.modelId,
          thinkingMode: request.thinkingMode,
          provider: "nvidia",
          model,
          usage: extractUsage(body),
        },
      };
    } catch (error) {
      lastError = error instanceof AiError
        ? error
        : new AiError("UNKNOWN", "Unexpected NVIDIA error.", { providerId: "nvidia" });

      if (!lastError.retryable || attempt === config.maxRetries) {
        throw lastError;
      }
      await sleep(250 * 2 ** attempt + Math.random() * 100, signal);
    }
  }

  throw lastError ?? new AiError("UNKNOWN", "NVIDIA failed.", { providerId: "nvidia" });
}

async function healthCheck(): Promise<AiProviderHealth> {
  const configured = Boolean(getProviderApiKey("nvidia"));
  return {
    id: "nvidia",
    configured,
    healthy: configured,
    checkedAt: new Date().toISOString(),
    detail: configured ? undefined : "NVIDIA_API_KEY missing",
  };
}

export const nvidiaProvider: AiProvider = {
  metadata,
  isConfigured: () => Boolean(getProviderApiKey("nvidia")),
  generateChatResponse,
  healthCheck,
};
