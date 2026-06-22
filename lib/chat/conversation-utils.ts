import type {
  ChatAttachment,
  ChatCategory,
  ChatConversation,
  ChatMessage,
  ChatMessageMetadata,
} from "./types";

/**
 * Infers the chat category based on the query text.
 * Uses exact rules specified for Jordanian EV/hybrid market context.
 */
export function inferChatCategory(text: string): ChatCategory {
  const lowerText = text.toLowerCase();

  if (lowerText.includes("شحن") || lowerText.includes("كهرباء")) {
    return "الشحن";
  }
  if (lowerText.includes("تكلفة") || lowerText.includes("احسب")) {
    return "الحاسبات";
  }
  if (lowerText.includes("قارن") || lowerText.includes("مقارنة")) {
    return "المقارنة";
  }
  if (lowerText.includes("ضمان") || lowerText.includes("دعم")) {
    return "الدعم والضمان";
  }
  if (
    lowerText.includes("سيارة") ||
    lowerText.includes("byd") ||
    lowerText.includes("toyota") ||
    lowerText.includes("changan") ||
    lowerText.includes("هايبرد") ||
    lowerText.includes("كهربائية")
  ) {
    return "السيارات";
  }

  return "عام";
}

/**
 * Trims whitespace, removes line breaks, truncates to 36 characters,
 * and appends "…" if truncated.
 */
export function generateConversationTitle(text: string): string {
  const trimmed = text.replace(/[\r\n]+/g, " ").trim();
  if (!trimmed) {
    return "محادثة جديدة";
  }
  if (trimmed.length > 36) {
    return trimmed.slice(0, 36) + "…";
  }
  return trimmed;
}

/**
 * Creates a brand new conversation state.
 */
// Cryptographically strong id suffix. Uses crypto.randomUUID (available in
// modern browsers in secure contexts and in Node), with a getRandomValues
// fallback. Avoids Math.random, which CodeQL flags as insecure randomness.
function secureSuffix(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID().replace(/-/g, "").slice(0, 9);
  }
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("").slice(0, 9);
}

export function createConversation(options?: {
  title?: string;
  category?: ChatCategory;
  messages?: ChatMessage[];
}): ChatConversation {
  const now = new Date().toISOString();
  const title = options?.title || "محادثة جديدة";
  const category = options?.category || "عام";
  const messages = options?.messages || [];

  const randomSuffix = secureSuffix();
  const id = `conv-${Date.now()}-${randomSuffix}`;

  return {
    id,
    title,
    category,
    messages,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates a new user message with optional structured attachment metadata.
 */
export function createUserMessage(content: string, attachment?: ChatAttachment): ChatMessage {
  const randomSuffix = secureSuffix();
  const id = `msg-${Date.now()}-${randomSuffix}`;

  return {
    id,
    role: "user",
    content: content.trim(),
    createdAt: new Date().toISOString(),
    attachment,
  };
}

/**
 * Generates an assistant placeholder message with "sending" status.
 */
export function createAssistantPlaceholder(metadata?: ChatMessageMetadata): ChatMessage {
  const randomSuffix = secureSuffix();
  const id = `placeholder-${Date.now()}-${randomSuffix}`;

  return {
    id,
    role: "assistant",
    content: "",
    status: "sending",
    createdAt: new Date().toISOString(),
    metadata,
  };
}

/**
 * Completes a placeholder assistant message with the real response content.
 */
export function completeAssistantMessage(
  placeholderMessage: ChatMessage,
  responseMessage: ChatMessage
): ChatMessage {
  return {
    ...placeholderMessage,
    content: responseMessage.content,
    bullets: responseMessage.bullets,
    status: "done",
    metadata: responseMessage.metadata ?? placeholderMessage.metadata,
  };
}

/**
 * Marks a placeholder assistant message as failed with an error status.
 */
export function failAssistantMessage(
  placeholderMessage: ChatMessage,
  errorMessage?: string
): ChatMessage {
  return {
    ...placeholderMessage,
    status: "error",
    content: errorMessage || "حدث خطأ أثناء تجهيز الرد. حاول مرة أخرى.",
  };
}

/**
 * Filters, searches, and sorts conversations.
 */
export function getVisibleConversations({
  conversations,
  searchQuery,
  selectedCategory,
}: {
  conversations: ChatConversation[];
  searchQuery: string;
  selectedCategory: ChatCategory | "all";
}): ChatConversation[] {
  const query = searchQuery.trim().toLowerCase();

  return conversations
    .filter((c) => {
      if (selectedCategory !== "all" && c.category !== selectedCategory) {
        return false;
      }
      if (query) {
        const titleMatch = c.title.toLowerCase().includes(query);
        const messageMatch = c.messages.some((m) =>
          m.content.toLowerCase().includes(query)
        );
        return titleMatch || messageMatch;
      }
      return true;
    })
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Removes a conversation and resolves which ID should become next active.
 * If the deleted conversation was active, picks the most recently updated remaining one.
 * If it was not active, keeps activeId unchanged.
 */
export function deleteConversationById(
  conversations: ChatConversation[],
  id: string,
  activeId: string | null
): {
  conversations: ChatConversation[];
  nextActiveId: string | null;
} {
  const filtered = conversations.filter((c) => c.id !== id);

  if (activeId !== id) {
    return { conversations: filtered, nextActiveId: activeId };
  }

  if (filtered.length === 0) {
    return { conversations: filtered, nextActiveId: null };
  }

  const sorted = [...filtered].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return {
    conversations: filtered,
    nextActiveId: sorted[0].id,
  };
}

/**
 * Safely renames a conversation title and tags updatedAt time.
 */
export function renameConversation(
  conversations: ChatConversation[],
  id: string,
  title: string
): ChatConversation[] {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    return conversations;
  }

  return conversations.map((c) => {
    if (c.id === id) {
      return {
        ...c,
        title: trimmedTitle,
        updatedAt: new Date().toISOString(),
      };
    }
    return c;
  });
}

/**
 * Encodes the conversation database into a pretty-printed export JSON.
 */
export function serializeConversationsForExport(conversations: ChatConversation[]): string {
  const payload = {
    product: "VoltJo",
    exportedAt: new Date().toISOString(),
    conversations,
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Safely parses stringified storage/file values, applying light validations.
 */
export function safeParseConversations(value: string | null): ChatConversation[] {
  if (!value) {
    return [];
  }

  try {
    const data = JSON.parse(value);

    if (
      data &&
      typeof data === "object" &&
      data.product === "VoltJo" &&
      Array.isArray(data.conversations)
    ) {
      return data.conversations.filter(isValidConversation);
    }

    if (Array.isArray(data)) {
      return data.filter(isValidConversation);
    }

    return [];
  } catch {
    return [];
  }
}

/**
 * Basic type guard validating conversation records.
 */
function isValidConversation(c: unknown): c is ChatConversation {
  if (!c || typeof c !== "object") {
    return false;
  }
  const record = c as Record<string, unknown>;
  return (
    typeof record.id === "string" &&
    typeof record.title === "string" &&
    Array.isArray(record.messages)
  );
}
