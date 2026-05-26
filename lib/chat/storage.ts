import type { ChatConversation } from "./types";

const IS_SERVER = typeof window === "undefined";

export function loadConversations(): ChatConversation[] {
  if (IS_SERVER) return [];
  try {
    const data = localStorage.getItem("voltjo_conversations");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: ChatConversation[]) {
  if (IS_SERVER) return;
  localStorage.setItem("voltjo_conversations", JSON.stringify(conversations));
}

export function loadActiveConversationId(): string | null {
  if (IS_SERVER) return null;
  return localStorage.getItem("voltjo_active_conversation_id");
}

export function saveActiveConversationId(id: string | null) {
  if (IS_SERVER) return;
  if (id) localStorage.setItem("voltjo_active_conversation_id", id);
  else localStorage.removeItem("voltjo_active_conversation_id");
}

export function loadSidebarCollapsed(): boolean {
  if (IS_SERVER) return false;
  return localStorage.getItem("voltjo_sidebar_collapsed") === "true";
}

export function saveSidebarCollapsed(value: boolean) {
  if (IS_SERVER) return;
  localStorage.setItem("voltjo_sidebar_collapsed", String(value));
}
