import type { ChatMessage } from "../chat/types";

/**
 * Valid AI providers supported by the future VoltJo AI engine.
 */
export type AiProviderName = "mock" | "openai";

/**
 * Representation of the inbound request body sent to `POST /api/chat`.
 */
export interface AiChatRequest {
  conversationId: string | null;
  messages: ChatMessage[];
  sourcesActive?: boolean;
  vehicleContext?: {
    brand?: string;
    model?: string;
    batteryCapacityKwh?: number;
  };
  locale: "ar-JO";
}

/**
 * Standard reference citations pointing users back to trusted Jordanian databases/articles.
 */
export interface AiSource {
  title: string;
  url?: string;
  type?: "internal" | "external" | "official" | "user-uploaded";
}

/**
 * The standard non-streaming static JSON response payload.
 */
export interface AiChatResponse {
  id: string;
  role: "assistant";
  content: string;
  bullets?: string[];
  sources?: AiSource[];
  createdAt: string;
}

/**
 * Discrete event packets dispatched via Server-Sent Events (SSE) stream channels.
 */
export type AiStreamEvent =
  | { type: "start"; id: string }
  | { type: "chunk"; delta: string }
  | { type: "bullet_start"; index: number }
  | { type: "bullet_chunk"; index: number; delta: string }
  | { type: "source"; source: AiSource }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * Standardized driver interface allowing hot-swapping between model providers.
 */
export interface AiProvider {
  name: AiProviderName;
  generate(request: AiChatRequest): Promise<AiChatResponse>;
  stream?(request: AiChatRequest): AsyncIterable<AiStreamEvent>;
}
