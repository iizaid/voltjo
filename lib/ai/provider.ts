import "server-only";

import { assertAiConfigured, getAiConfig } from "@/lib/ai/config";
import { AiError } from "@/lib/ai/errors";
import { logAiRequest, startTimer } from "@/lib/ai/observability";
import { buildSystemPrompt } from "@/lib/ai/prompt";
import { assertResolvableProvider } from "@/lib/ai/registry";
import type { AiChatRequest, AiChatResponse } from "@/lib/ai/types";

/**
 * Orchestrates a chat generation: validates config, builds the system prompt,
 * then walks the provider chain (primary → fallbacks) until one succeeds.
 * Emits one structured log per request with latency, attempts, and token usage.
 *
 * There is no mock path. If nothing is configured this throws CONFIG_MISSING.
 */
export async function generateAiChatResponse(
  request: AiChatRequest,
  options: { actor: "user" | "anon"; requestId: string },
): Promise<AiChatResponse> {
  assertAiConfigured(getAiConfig());
  const chain = assertResolvableProvider();

  const systemPrompt = await buildSystemPrompt(request);
  const context = { systemPrompt, requestId: options.requestId };

  const elapsed = startTimer();
  let attempts = 0;
  let lastError: AiError | null = null;

  for (const provider of chain) {
    attempts += 1;
    try {
      const response = await provider.generateChatResponse(request, context);
      const latencyMs = elapsed();
      logAiRequest({
        event: "ai_request",
        requestId: options.requestId,
        provider: provider.metadata.id,
        model: response.metadata.model,
        outcome: "success",
        latencyMs,
        attempts,
        usage: response.metadata.usage ?? null,
        actor: options.actor,
        thinkingMode: request.thinkingMode,
      });
      return { ...response, metadata: { ...response.metadata, latencyMs } };
    } catch (error) {
      lastError = error instanceof AiError
        ? error
        : new AiError("UNKNOWN", "Unexpected provider error.", {
            providerId: provider.metadata.id,
          });

      logAiRequest({
        event: "ai_request",
        requestId: options.requestId,
        provider: provider.metadata.id,
        outcome: "error",
        latencyMs: elapsed(),
        attempts,
        errorCode: lastError.code,
        actor: options.actor,
        thinkingMode: request.thinkingMode,
      });

      // Only continue to a fallback when the failure is provider-side and the
      // next provider could plausibly succeed. Config/auth issues stop the chain.
      const shouldFallback =
        lastError.code === "UPSTREAM" ||
        lastError.code === "RATE_LIMIT" ||
        lastError.code === "QUOTA" ||
        lastError.code === "TIMEOUT" ||
        lastError.code === "EMPTY";
      if (!shouldFallback) break;
    }
  }

  throw lastError ?? new AiError("UNKNOWN", "AI generation failed.");
}
