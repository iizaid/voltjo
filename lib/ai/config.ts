import "server-only";

import { AiError } from "@/lib/ai/errors";
import type { AiProviderId } from "@/lib/ai/types";

/**
 * Single source of truth for AI environment configuration and strict validation.
 *
 * Required: GOOGLE_AI_API_KEY (Gemini is the default production provider).
 * Optional: OPENAI_API_KEY, KIMI_API_KEY, DEEPSEEK_API_KEY, ANTHROPIC_API_KEY.
 *
 * All keys are server-only. None may ever be read through NEXT_PUBLIC_*.
 */

export const PROVIDER_ENV_KEYS: Record<AiProviderId, string> = {
  gemini: "GOOGLE_AI_API_KEY",
  openai: "OPENAI_API_KEY",
  kimi: "KIMI_API_KEY",
  deepseek: "DEEPSEEK_API_KEY",
  anthropic: "ANTHROPIC_API_KEY",
};

const VALID_PROVIDER_IDS = Object.keys(PROVIDER_ENV_KEYS) as AiProviderId[];

function readKey(envKey: string): string | undefined {
  const value = process.env[envKey];
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export type AiConfig = {
  /** Primary provider used to answer requests. */
  primaryProvider: AiProviderId;
  /** Ordered fallback providers attempted when the primary fails (configured only). */
  fallbackOrder: AiProviderId[];
  /** Optional model override (defaults come from provider metadata). */
  modelOverride?: string;
  /** Per-request hard deadline. */
  timeoutMs: number;
  /** Max upstream retries on retryable errors. */
  maxRetries: number;
};

function parseProviderId(raw: string | undefined, fallback: AiProviderId): AiProviderId {
  if (raw && VALID_PROVIDER_IDS.includes(raw as AiProviderId)) {
    return raw as AiProviderId;
  }
  return fallback;
}

export function getAiConfig(): AiConfig {
  const primaryProvider = parseProviderId(process.env.AI_PROVIDER?.trim(), "gemini");

  // Fallbacks: any configured provider other than the primary, in a stable order.
  const fallbackOrder = VALID_PROVIDER_IDS.filter(
    (id) => id !== primaryProvider && Boolean(readKey(PROVIDER_ENV_KEYS[id])),
  );

  const timeoutMs = Number.parseInt(process.env.AI_TIMEOUT_MS ?? "", 10);
  const maxRetries = Number.parseInt(process.env.AI_MAX_RETRIES ?? "", 10);

  return {
    primaryProvider,
    fallbackOrder,
    modelOverride: process.env.AI_MODEL?.trim() || undefined,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 30_000,
    maxRetries: Number.isFinite(maxRetries) && maxRetries >= 0 ? maxRetries : 2,
  };
}

export function getProviderApiKey(provider: AiProviderId): string | undefined {
  return readKey(PROVIDER_ENV_KEYS[provider]);
}

export function isProviderConfigured(provider: AiProviderId): boolean {
  return Boolean(getProviderApiKey(provider));
}

/**
 * Fail-fast validation. Throws an AiError(CONFIG_MISSING) when the primary
 * provider has no API key. Call this at request-entry so misconfiguration
 * produces a clear, controlled error instead of a downstream crash.
 */
export function assertAiConfigured(config: AiConfig = getAiConfig()): void {
  if (!isProviderConfigured(config.primaryProvider)) {
    const envKey = PROVIDER_ENV_KEYS[config.primaryProvider];
    throw new AiError(
      "CONFIG_MISSING",
      `AI provider "${config.primaryProvider}" is selected but ${envKey} is not set. ` +
        `Set ${envKey} as a server-only secret (never NEXT_PUBLIC_*).`,
      { providerId: config.primaryProvider },
    );
  }
}
