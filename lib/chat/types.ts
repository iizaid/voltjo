export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  bullets?: string[];
  createdAt: string;
  status?: "sending" | "streaming" | "done" | "error";
  attachmentName?: string;
}

export type ChatCategory = "السيارات" | "الشحن" | "المقارنة" | "الحاسبات" | "الدعم والضمان" | "عام";

export interface ChatConversation {
  id: string;
  title: string;
  category: ChatCategory;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}
