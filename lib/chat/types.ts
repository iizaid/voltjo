export type ChatRole = "user" | "assistant" | "system";

export interface ChatAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
}

export interface ChatMessageMetadata {
  modelId?: string;
  thinkingMode?: boolean;
  provider?: string;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  bullets?: string[];
  createdAt: string;
  status?: "sending" | "streaming" | "done" | "error";
  attachment?: ChatAttachment;
  metadata?: ChatMessageMetadata;
}

export type ChatCategory = "السيارات" | "الشحن" | "المقارنة" | "الحاسبات" | "الدعم والضمان" | "عام";

export interface ChatConversation {
  id: string;
  serverId?: string;
  title: string;
  category: ChatCategory;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
