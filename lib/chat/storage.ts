import type { ChatConversation } from "./types";

const IS_SERVER = typeof window === "undefined";

const KEYS = {
  CONVERSATIONS: "voltjo:chat:conversations",
  ACTIVE_ID: "voltjo:chat:activeConversationId",
  SIDEBAR_COLLAPSED: "voltjo:chat:sidebarCollapsed",
};

const LEGACY_KEYS = {
  CONVERSATIONS: "voltjo_conversations",
  ACTIVE_ID: "voltjo_active_conversation_id",
  SIDEBAR_COLLAPSED: "voltjo_sidebar_collapsed",
};

export function loadConversations(): ChatConversation[] {
  if (IS_SERVER) return [];
  try {
    const data = localStorage.getItem(KEYS.CONVERSATIONS) || localStorage.getItem(LEGACY_KEYS.CONVERSATIONS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: ChatConversation[]) {
  if (IS_SERVER) return;
  localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(conversations));
}

export function loadActiveConversationId(): string | null {
  if (IS_SERVER) return null;
  return localStorage.getItem(KEYS.ACTIVE_ID) || localStorage.getItem(LEGACY_KEYS.ACTIVE_ID);
}

export function saveActiveConversationId(id: string | null) {
  if (IS_SERVER) return;
  if (id) localStorage.setItem(KEYS.ACTIVE_ID, id);
  else localStorage.removeItem(KEYS.ACTIVE_ID);
}

export function loadSidebarCollapsed(): boolean {
  if (IS_SERVER) return false;
  const val = localStorage.getItem(KEYS.SIDEBAR_COLLAPSED) || localStorage.getItem(LEGACY_KEYS.SIDEBAR_COLLAPSED);
  return val === "true";
}

export function saveSidebarCollapsed(value: boolean) {
  if (IS_SERVER) return;
  localStorage.setItem(KEYS.SIDEBAR_COLLAPSED, String(value));
}
