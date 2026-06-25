import "server-only";

import { AiError, classifyHttpStatus } from "@/lib/ai/errors";
import { getAiConfig, getProviderApiKey } from "@/lib/ai/config";
import { startTimer } from "@/lib/ai/observability";
import type {
  AiChatRequest,
  AiChatResponse,
  AiGenerationContext,
  AiProvider,
  AiProviderHealth,
  AiProviderMetadata,
  AiStreamChunk,
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
  // Gemini uses "model" (not "assistant") for prior assistant turns.
  const historyContents = (request.history ?? []).map((turn) => ({
    role: turn.role === "assistant" ? "model" : "user",
    parts: [{ text: turn.content }],
  }));

  return {
    systemInstruction: { parts: [{ text: context.systemPrompt }] },
    contents: [...historyContents, { role: "user", parts: [{ text: request.message }] }],
    generationConfig: {
      temperature: request.thinkingMode ? 0.9 : 0.75,
      // Gemini 2.5 Flash uses thinking tokens by default. Without an explicit
      // budget, thinking tokens count against maxOutputTokens and starve the
      // actual response (observed: 980 thinking + 40 output = truncated reply).
      // Set thinkingBudget:0 for normal mode; let the model think freely in
      // thinking mode (higher maxOutputTokens to accommodate both).
      maxOutputTokens: request.thinkingMode ? 16384 : 8192,
      topP: 0.95,
      // Normal mode: disable thinking entirely (thinkingBudget:0) for speed.
      // Thinking mode: allocate a real budget so Gemini 2.5 Flash actually
      // reasons before answering — the difference is measurable on complex
      // multi-step questions.
      thinkingConfig: { thinkingBudget: request.thinkingMode ? 8192 : 0 },
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

/** Sleep that resolves early (rejects) if the external signal aborts mid-backoff. */
function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new AiError("TIMEOUT", "Aborted during backoff.", { providerId: "gemini" }));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new AiError("TIMEOUT", "Aborted during backoff.", { providerId: "gemini" }));
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function callGeminiOnce(
  apiKey: string,
  model: string,
  payload: unknown,
  timeoutMs: number,
  externalSignal?: AbortSignal,
): Promise<GeminiResponseBody> {
  // Per-attempt timeout, combined with the request-level signal so EITHER the
  // local deadline OR an upstream cancellation aborts the in-flight fetch.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else externalSignal.addEventListener("abort", onExternalAbort, { once: true });
  }

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
        cache: "no-store",
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
    externalSignal?.removeEventListener("abort", onExternalAbort);
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
  const signal = context.signal;

  let lastError: AiError | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    // Honor a request-level cancellation before starting another attempt.
    if (signal?.aborted) {
      throw new AiError("TIMEOUT", "Gemini request aborted (deadline).", {
        providerId: "gemini",
      });
    }
    try {
      const body = await callGeminiOnce(apiKey, model, payload, config.timeoutMs, signal);

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
      // Abortable: a request-level timeout interrupts the wait immediately.
      await sleep(250 * 2 ** attempt + Math.random() * 100, signal);
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

export async function* streamGeminiChatResponse(
  request: AiChatRequest,
  context: AiGenerationContext,
): AsyncGenerator<AiStreamChunk> {
  const apiKey = getProviderApiKey("gemini");
  if (!apiKey) {
    yield { type: 'error', code: 'CONFIG_MISSING', message: 'GOOGLE_AI_API_KEY is not set.' };
    return;
  }

  const model = resolveModel();
  const payload = buildRequestBody(request, context);
  const elapsed = startTimer();

  let res: Response;
  try {
    res = await fetch(
      `${GEMINI_API_BASE}/models/${encodeURIComponent(model)}:streamGenerateContent?alt=sse`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify(payload),
        signal: context.signal,
        cache: 'no-store',
      },
    );
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      yield { type: 'error', code: 'TIMEOUT', message: 'Request aborted' };
    } else {
      yield { type: 'error', code: 'UPSTREAM', message: 'Gemini network failure' };
    }
    return;
  }

  if (!res.ok) {
    yield { type: 'error', code: 'UPSTREAM', message: `Gemini HTTP ${res.status}` };
    return;
  }

  if (!res.body) {
    yield { type: 'error', code: 'UPSTREAM', message: 'No response body' };
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let lastUsage: AiTokenUsage = null;

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
          const body = JSON.parse(jsonStr) as GeminiResponseBody;
          const text = extractText(body);
          if (text) {
            yield { type: 'token', content: text };
          }
          const usage = extractUsage(body);
          if (usage) {
            lastUsage = usage;
          }
        } catch {
          // skip malformed SSE line
        }
      }
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      yield { type: 'error', code: 'TIMEOUT', message: 'Request aborted' };
    } else {
      yield { type: 'error', code: 'UPSTREAM', message: 'Stream read failure' };
    }
    return;
  } finally {
    reader.releaseLock();
  }

  yield { type: 'done', usage: lastUsage, model, latencyMs: elapsed() };
}

export const geminiProvider: AiProvider = {
  metadata,
  isConfigured: () => Boolean(getProviderApiKey("gemini")),
  generateChatResponse,
  healthCheck,
};
