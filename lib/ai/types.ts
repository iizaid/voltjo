/**
 * Public AI types shared across server and client. No "mock" provider exists
 * anymore — every model maps to a real provider under the hood.
 */

// User-facing model selector in the chat UI. These are friendly labels, not
// raw provider ids; the registry maps each to a concrete provider.
export type AiModelId =
  | "voltjo"
  | "gemini"
  | "deepseek"
  | "kimi"
  | "nvidia"
  | "qwen"
  | "openai";

// Concrete backend providers. Adding one here + a provider file + registry entry
// is all that is required to onboard a new vendor.
export type AiProviderId =
  | "gemini"
  | "openai"
  | "kimi"
  | "deepseek"
  | "anthropic"
  | "qwen"
  | "nvidia";

export type AiChatAttachment = {
  id: string;
  name: string;
  size: number;
  type: string;
};

export type AiChatRequest = {
  message: string;
  modelId: AiModelId;
  thinkingMode: boolean;
  conversationId?: string | null;
  attachment?: AiChatAttachment | null;
};

export type AiTokenUsage = {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
} | null;

/** Retrieval-confidence band for a grounded answer (see retrieval gating). */
export type RetrievalConfidence = "HIGH" | "MEDIUM" | "LOW";

/**
 * A citation surfaced alongside an answer. Mirrors the projected columns of a
 * `vehicle_knowledge` chunk so the UI can render source/page/confidence chips.
 */
export type Citation = {
  section: string;
  sourceRef: string | null;
  sourceFile: string | null;
  pageRef: string | null;
  confidence: string;
  confidenceRaw: string | null;
};

export type AiChatResponse = {
  id: string;
  role: "assistant";
  content: string;
  bullets?: string[];
  createdAt: string;
  status: "done";
  metadata: {
    modelId: AiModelId;
    thinkingMode: boolean;
    provider: AiProviderId;
    model?: string;
    usage?: AiTokenUsage;
    latencyMs?: number;
    /** Grounded citations injected into the prompt (RAG-lite). Empty when none. */
    citations?: Citation[];
    /** Confidence band of the retrieved evidence backing this answer. */
    retrievalConfidence?: RetrievalConfidence;
  };
};

/** Static description of a provider, used for the registry and health UI. */
export type AiProviderMetadata = {
  id: AiProviderId;
  label: string;
  /** Env var that holds this provider's secret key. */
  envKey: string;
  /** Default model id sent to the provider API. */
  defaultModel: string;
  supportsStreaming: boolean;
};

export type AiProviderHealth = {
  id: AiProviderId;
  configured: boolean;
  healthy: boolean;
  checkedAt: string;
  detail?: string;
};

/** Optional server-side context passed to a provider (e.g. injected vehicle data). */
export type AiGenerationContext = {
  systemPrompt: string;
  requestId: string;
  /**
   * Request-level cancellation signal. When aborted (timeout or client
   * disconnect) providers MUST cancel in-flight fetches, retries, and backoff so
   * no upstream call is orphaned. Optional for backward compatibility.
   */
  signal?: AbortSignal;
};

export interface AiProvider {
  readonly metadata: AiProviderMetadata;
  /** True when the required key is present. */
  isConfigured(): boolean;
  generateChatResponse(
    request: AiChatRequest,
    context: AiGenerationContext,
  ): Promise<AiChatResponse>;
  /** Lightweight liveness/config probe. Must never throw. */
  healthCheck(): Promise<AiProviderHealth>;
}
