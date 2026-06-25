import "server-only";

import { geminiProvider } from "@/lib/ai/providers/gemini";
import { nvidiaProvider } from "@/lib/ai/providers/nvidia";
import { getAiConfig } from "@/lib/ai/config";
import { AiError } from "@/lib/ai/errors";
import type { AiProvider, AiProviderHealth, AiProviderId } from "@/lib/ai/types";

/**
 * Provider registry — the single place providers are registered.
 *
 * To onboard a new provider:
 *   1. Add its key to PROVIDER_ENV_KEYS in config.ts.
 *   2. Create lib/ai/providers/<name>.ts implementing AiProvider.
 *   3. Add one line to REGISTRY below.
 * No other code changes are required (selection, fallback, health, and the route
 * all read from this registry).
 */
const REGISTRY: Partial<Record<AiProviderId, AiProvider>> = {
  gemini: geminiProvider,
  nvidia: nvidiaProvider,
  // openai: openaiProvider,
  // kimi: kimiProvider,
  // deepseek: deepseekProvider,
  // anthropic: anthropicProvider,
};

export function getRegisteredProvider(id: AiProviderId): AiProvider | null {
  return REGISTRY[id] ?? null;
}

export function listRegisteredProviders(): AiProvider[] {
  return Object.values(REGISTRY).filter((p): p is AiProvider => Boolean(p));
}

/**
 * Selection strategy: model-specific provider first, then global primary, then fallbacks.
 * Pass a providerId override (from model-config) to route per-model.
 */
export function resolveProviderChain(primaryOverride?: AiProviderId): AiProvider[] {
  const config = getAiConfig();
  const seen = new Set<AiProviderId>();
  const order: AiProviderId[] = [];

  if (primaryOverride) order.push(primaryOverride);
  order.push(config.primaryProvider, ...config.fallbackOrder);

  const chain: AiProvider[] = [];
  for (const id of order) {
    if (seen.has(id)) continue;
    seen.add(id);
    const provider = REGISTRY[id];
    if (provider && provider.isConfigured()) chain.push(provider);
  }
  return chain;
}

/** Health snapshot for every registered provider (never throws). */
export async function healthCheckAll(): Promise<AiProviderHealth[]> {
  return Promise.all(
    listRegisteredProviders().map(async (provider) => {
      try {
        return await provider.healthCheck();
      } catch {
        return {
          id: provider.metadata.id,
          configured: provider.isConfigured(),
          healthy: false,
          checkedAt: new Date().toISOString(),
          detail: "health check threw",
        } satisfies AiProviderHealth;
      }
    }),
  );
}

/** Throws CONFIG_MISSING when no registered+configured provider can serve traffic. */
export function assertResolvableProvider(primaryOverride?: AiProviderId): AiProvider[] {
  const chain = resolveProviderChain(primaryOverride);
  if (chain.length === 0) {
    throw new AiError(
      "CONFIG_MISSING",
      "No AI provider is both registered and configured. Set GOOGLE_AI_API_KEY or NVIDIA_API_KEY.",
    );
  }
  return chain;
}
