import "server-only";

import { geminiProvider } from "@/lib/ai/providers/gemini";
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
 * Selection strategy: return the primary provider plus its configured fallbacks,
 * in attempt order, filtered to providers that are both registered and configured.
 */
export function resolveProviderChain(): AiProvider[] {
  const config = getAiConfig();
  const order: AiProviderId[] = [config.primaryProvider, ...config.fallbackOrder];

  const chain: AiProvider[] = [];
  for (const id of order) {
    const provider = REGISTRY[id];
    if (provider && provider.isConfigured() && !chain.includes(provider)) {
      chain.push(provider);
    }
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
export function assertResolvableProvider(): AiProvider[] {
  const chain = resolveProviderChain();
  if (chain.length === 0) {
    throw new AiError(
      "CONFIG_MISSING",
      "No AI provider is both registered and configured. Set GOOGLE_AI_API_KEY.",
    );
  }
  return chain;
}
