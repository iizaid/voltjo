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
 * Production Gemini provider. Calls the Google Generative Language REST API
 * directly via fetch — no SDK — so it runs unchanged on Cloudflare Workers,
 * Node, and edge runtimes, with full control over timeouts, retries, and error
 * classification, and zero vendor lock-in.
 */

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";

const metadata: AiProviderMetadata = {
  id: "gemini",
  label: "Google Gemini",
  envKey: "GOOGLE_AI_API_KEY",
  defaultModel: "gemini-2.5-flash",
  supportsStreaming: true,
};

type GeminiResponseBody = {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
};

function resolveModel(): string {
  return getAiConfig().modelOverride || metadata.defaultModel;
}

function buildRequestBody(request: AiChatRequest, context: AiGenerationContext) {
  return {
    systemInstruction: { parts: [{ text: context.systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: request.message }] }],
    generationConfig: {
      temperature: request.thinkingMode ? 0.7 : 0.4,
      maxOutputTokens: request.thinkingMode ? 2048 : 1024,
      topP: 0.95,
    },
  };
}

function extractText(body: GeminiResponseBody): string {
  const parts = body.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}

function extractUsage(body: GeminiResponseBody): AiTokenUsage {
  const u = body.usageMetadata;
  if (!u) return null;
  return {
    promptTokens: u.promptTokenCount ?? 0,
    completionTokens: u.candidatesTokenCount ?? 0,
    totalTokens: u.totalTokenCount ?? 0,
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function callGeminiOnce(
  apiKey: string,
  model: string,
  payload: unknown,
  timeoutMs: number,
): Promise<GeminiResponseBody> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(
      `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      },
    );

    if (!res.ok) {
      const { code, retryable } = classifyHttpStatus(res.status);
      // Read a short snippet for logs but never surface raw provider text to users.
      let detail = "";
      try {
        detail = (await res.text()).slice(0, 300);
      } catch {
        detail = "";
      }
      throw new AiError(code, `Gemini HTTP ${res.status}: ${detail}`, {
        retryable,
        providerId: "gemini",
        status: res.status,
      });
    }

    return (await res.json()) as GeminiResponseBody;
  } catch (error) {
    if (error instanceof AiError) throw error;
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new AiError("TIMEOUT", "Gemini request aborted (timeout).", {
        retryable: true,
        providerId: "gemini",
      });
    }
    throw new AiError("UPSTREAM", "Gemini network failure.", {
      retryable: true,
      providerId: "gemini",
    });
  } finally {
    clearTimeout(timer);
  }
}

async function generateChatResponse(
  request: AiChatRequest,
  context: AiGenerationContext,
): Promise<AiChatResponse> {
  const apiKey = getProviderApiKey("gemini");
  if (!apiKey) {
    throw new AiError("CONFIG_MISSING", "GOOGLE_AI_API_KEY is not set.", {
      providerId: "gemini",
    });
  }

  const config = getAiConfig();
  const model = resolveModel();
  const payload = buildRequestBody(request, context);

  let lastError: AiError | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const body = await callGeminiOnce(apiKey, model, payload, config.timeoutMs);

      if (body.promptFeedback?.blockReason) {
        throw new AiError("SAFETY", `Blocked: ${body.promptFeedback.blockReason}`, {
          providerId: "gemini",
        });
      }

      const content = extractText(body);
      if (!content) {
        throw new AiError("EMPTY", "Gemini returned no content.", {
          retryable: true,
          providerId: "gemini",
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
          provider: "gemini",
          model,
          usage: extractUsage(body),
        },
      };
    } catch (error) {
      lastError = error instanceof AiError
        ? error
        : new AiError("UNKNOWN", "Unexpected Gemini error.", { providerId: "gemini" });

      if (!lastError.retryable || attempt === config.maxRetries) {
        throw lastError;
      }
      // Exponential backoff with jitter before retrying a retryable failure.
      await sleep(250 * 2 ** attempt + Math.random() * 100);
    }
  }

  throw lastError ?? new AiError("UNKNOWN", "Gemini failed.", { providerId: "gemini" });
}

async function healthCheck(): Promise<AiProviderHealth> {
  const configured = Boolean(getProviderApiKey("gemini"));
  return {
    id: "gemini",
    configured,
    healthy: configured,
    checkedAt: new Date().toISOString(),
    detail: configured ? undefined : "GOOGLE_AI_API_KEY missing",
  };
}

export const geminiProvider: AiProvider = {
  metadata,
  isConfigured: () => Boolean(getProviderApiKey("gemini")),
  generateChatResponse,
  healthCheck,
};
