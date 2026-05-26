export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessageData {
  id: string;
  role: ChatRole;
  content: string;
  bullets?: string[];
}

export interface ChatState {
  messages: ChatMessageData[];
  input: string;
  isLoading: boolean;
  error: Error | null;
  activeConversationId?: string;
}
