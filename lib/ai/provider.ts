import "server-only";

import { mockProvider } from "@/lib/ai/providers/mock";
import { getAiEnv } from "@/lib/server/env";

export function getAiProvider() {
  const env = getAiEnv();

  switch (env.aiProvider) {
    case "mock":
      return mockProvider;
    case "openai":
    case "gemini":
    case "kimi":
      // Provider not implemented yet in this phase.
      return mockProvider;
    default:
      // Real providers are intentionally not implemented in this phase.
      return mockProvider;
  }
}
