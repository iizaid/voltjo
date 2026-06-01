import { mockProvider } from "@/lib/ai/providers/mock";
import { getAiEnv } from "@/lib/server/env";

export function getAiProvider() {
  const env = getAiEnv();

  switch (env.aiProvider) {
    case "mock":
      return mockProvider;
    default:
      // Real providers are intentionally not implemented in this phase.
      return mockProvider;
  }
}
