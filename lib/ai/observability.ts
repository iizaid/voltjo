import "server-only";

import type { AiErrorCode } from "@/lib/ai/errors";
import type { AiProviderId, AiTokenUsage } from "@/lib/ai/types";

/**
 * Vendor-neutral structured logging + metrics for the AI subsystem. Emits single
 * JSON lines to stdout so any log aggregator (Cloudflare, Datadog, Loki, etc.)
 * can parse them — no SDK, no vendor lock-in. Swap `emit` to ship elsewhere.
 */

export type AiLogEvent = {
  event: "ai_request";
  requestId: string;
  provider: AiProviderId;
  model?: string;
  outcome: "success" | "error";
  latencyMs: number;
  attempts: number;
  errorCode?: AiErrorCode;
  usage?: AiTokenUsage;
  /** Coarse identity bucket for rate analysis — never raw PII. */
  actor: "user" | "anon";
  thinkingMode: boolean;
};

function emit(record: Record<string, unknown>) {
  // Single structured line. Errors in logging must never break the request.
  try {
    console.log(JSON.stringify({ ts: new Date().toISOString(), ...record }));
  } catch {
    // ignore
  }
}

export function logAiRequest(event: AiLogEvent): void {
  emit(event);
}

export function logAiHealth(provider: AiProviderId, healthy: boolean, detail?: string): void {
  emit({ event: "ai_health", provider, healthy, detail });
}

/** Simple monotonic timer that works across Node and Workers runtimes. */
export function startTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}
