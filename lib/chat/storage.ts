import type { ChatConversation } from "./types";
import { safeParseConversations } from "./conversation-utils";

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

function getStorage() {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function getItem(storage: Storage, primaryKey: string, legacyKey?: string) {
  try {
    return storage.getItem(primaryKey) || (legacyKey ? storage.getItem(legacyKey) : null);
  } catch {
    return null;
  }
}

export function loadConversations(): ChatConversation[] {
  const storage = getStorage();
  if (!storage) return [];

  const data = getItem(storage, KEYS.CONVERSATIONS, LEGACY_KEYS.CONVERSATIONS);
  return safeParseConversations(data);
}

export function saveConversations(conversations: ChatConversation[]) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(KEYS.CONVERSATIONS, JSON.stringify(conversations));
  } catch {
    // Local chat persistence is best-effort only.
  }
}

export function loadActiveConversationId(): string | null {
  const storage = getStorage();
  if (!storage) return null;

  return getItem(storage, KEYS.ACTIVE_ID, LEGACY_KEYS.ACTIVE_ID);
}

export function saveActiveConversationId(id: string | null) {
  const storage = getStorage();
  if (!storage) return;

  try {
    if (id) storage.setItem(KEYS.ACTIVE_ID, id);
    else storage.removeItem(KEYS.ACTIVE_ID);
  } catch {
    // Local chat persistence is best-effort only.
  }
}

export function loadSidebarCollapsed(): boolean {
  const storage = getStorage();
  if (!storage) return false;

  const val = getItem(storage, KEYS.SIDEBAR_COLLAPSED, LEGACY_KEYS.SIDEBAR_COLLAPSED);
  return val === "true";
}

export function saveSidebarCollapsed(value: boolean) {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(KEYS.SIDEBAR_COLLAPSED, String(value));
  } catch {
    // Local chat persistence is best-effort only.
  }
}
