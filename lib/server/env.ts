import "server-only";

export function getAiEnv() {
  return {
    aiProvider: process.env.AI_PROVIDER ?? "mock",
    openaiApiKey: process.env.OPENAI_API_KEY,
    geminiApiKey: process.env.GEMINI_API_KEY,
    kimiApiKey: process.env.KIMI_API_KEY,
  };
}

export function getCurrentAiProviderId() {
  return getAiEnv().aiProvider;
}
