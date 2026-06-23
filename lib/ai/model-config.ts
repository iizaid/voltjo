import "server-only";

import type { AiModelId, AiProviderId } from "./types";

/**
 * Server-only mapping from a user-facing model id to the real upstream provider.
 *
 * This is the ONE place provider internals live. It is `server-only`, so a
 * client component that tried to import it would fail to build — guaranteeing
 * that branding (e.g. "VoltJo Max") never reveals the model behind it.
 *
 * NOTE: today the generation path selects its provider from environment config
 * (`getAiConfig()`), not from this map; this map documents and centralizes the
 * intended branded routing so the upstream model can be swapped here alone,
 * with zero UI changes.
 */
const MODEL_PROVIDER_MAP: Record<AiModelId, AiProviderId> = {
  // VoltJo Max is a branded experience; its upstream model is an internal detail.
  voltjo: "qwen",
  gemini: "gemini",
  deepseek: "deepseek",
  kimi: "kimi",
  nvidia: "nvidia",
  qwen: "qwen",
  openai: "openai",
};

/** Resolve the upstream provider for a user-facing model id. Server-only. */
export function resolveProviderForModel(modelId: AiModelId): AiProviderId {
  return MODEL_PROVIDER_MAP[modelId] ?? "gemini";
}
