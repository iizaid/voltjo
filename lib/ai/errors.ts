import "server-only";

/**
 * Provider-agnostic AI error classification. Every provider maps its native
 * failures onto these codes so the route, observability, and fallback logic can
 * reason about errors without knowing which vendor produced them.
 */
export type AiErrorCode =
  | "CONFIG_MISSING" // No API key / provider not configured.
  | "AUTH" // Key rejected (401/403).
  | "RATE_LIMIT" // Provider throttled us (429).
  | "QUOTA" // Billing/quota exhausted.
  | "TIMEOUT" // Our deadline elapsed.
  | "UPSTREAM" // Provider 5xx / network failure.
  | "BAD_REQUEST" // We sent something invalid (400/422).
  | "SAFETY" // Content blocked by provider safety filters.
  | "EMPTY" // Provider returned no usable content.
  | "UNKNOWN";

export class AiError extends Error {
  readonly code: AiErrorCode;
  readonly retryable: boolean;
  readonly providerId?: string;
  readonly status?: number;

  constructor(
    code: AiErrorCode,
    message: string,
    options: { retryable?: boolean; providerId?: string; status?: number } = {},
  ) {
    super(message);
    this.name = "AiError";
    this.code = code;
    this.retryable = options.retryable ?? false;
    this.providerId = options.providerId;
    this.status = options.status;
  }
}

/** Map an HTTP status from any AI provider onto a normalized code + retryability. */
export function classifyHttpStatus(status: number): {
  code: AiErrorCode;
  retryable: boolean;
} {
  if (status === 401 || status === 403) return { code: "AUTH", retryable: false };
  if (status === 429) return { code: "RATE_LIMIT", retryable: true };
  if (status === 400 || status === 422) return { code: "BAD_REQUEST", retryable: false };
  if (status >= 500) return { code: "UPSTREAM", retryable: true };
  return { code: "UNKNOWN", retryable: false };
}

/** A user-safe Arabic message per error code. Never leak provider internals. */
export function userMessageForAiError(code: AiErrorCode): string {
  switch (code) {
    case "CONFIG_MISSING":
      return "خدمة المساعد غير مهيأة حاليًا. حاول لاحقًا.";
    case "RATE_LIMIT":
    case "QUOTA":
      return "الضغط مرتفع على المساعد الآن. أعد المحاولة بعد قليل.";
    case "TIMEOUT":
      return "استغرق الرد وقتًا أطول من المتوقع. أعد المحاولة.";
    case "SAFETY":
      return "تعذر تجهيز رد على هذا المحتوى. جرّب صياغة مختلفة.";
    default:
      return "تعذر تجهيز الرد الآن. حاول مرة أخرى.";
  }
}
