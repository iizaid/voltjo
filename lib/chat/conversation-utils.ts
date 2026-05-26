import type { ChatCategory, ChatConversation, ChatMessage } from "./types";

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
 * and appends an empty string if truncated as per instructions.
 */
export function generateConversationTitle(text: string): string {
  const trimmed = text.replace(/[\r\n]+/g, " ").trim();
  if (!trimmed) {
    return "محادثة جديدة";
  }
  if (trimmed.length > 36) {
    return trimmed.slice(0, 36) + "";
  }
  return trimmed;
}

/**
 * Creates a brand new conversation state.
 */
export function createConversation(options?: {
  title?: string;
  category?: ChatCategory;
}): ChatConversation {
  const now = new Date().toISOString();
  const title = options?.title || "محادثة جديدة";
  const category = options?.category || "عام";
  
  // Generating a lightweight safe unique ID
  const randomSuffix = Math.random().toString(36).substring(2, 11);
  const id = `conv-${Date.now()}-${randomSuffix}`;

  return {
    id,
    title,
    category,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Creates a new user message, trimming content and mapping attachments if provided.
 */
export function createUserMessage(content: string, attachmentName?: string): ChatMessage {
  const randomSuffix = Math.random().toString(36).substring(2, 11);
  const id = `msg-${Date.now()}-${randomSuffix}`;
  const now = new Date().toISOString();

  const message: ChatMessage = {
    id,
    role: "user",
    content: content.trim(),
    createdAt: now,
  };

  if (attachmentName) {
    message.attachment = {
      id: `att-${Date.now()}-${randomSuffix}`,
      name: attachmentName,
      size: 0,
      type: "unknown",
    };
  }

  return message;
}

/**
 * Generates an assistant placeholder message.
 */
export function createAssistantPlaceholder(): ChatMessage {
  const randomSuffix = Math.random().toString(36).substring(2, 11);
  const id = `placeholder-${Date.now()}-${randomSuffix}`;

  return {
    id,
    role: "assistant",
    content: "",
    status: "sending",
    createdAt: new Date().toISOString(),
  };
}

/**
 * Completes a placeholder assistant message with raw response payload content.
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
  };
}

/**
 * Filters, searches, and sorts conversations.
 * Supports localized search matching in English and Arabic.
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
      // 1. Filter by category
      if (selectedCategory !== "all" && c.category !== selectedCategory) {
        return false;
      }
      // 2. Filter by search text (title or content matching)
      if (query) {
        const titleMatch = c.title.toLowerCase().includes(query);
        const messageMatch = c.messages.some((m) =>
          m.content.toLowerCase().includes(query)
        );
        return titleMatch || messageMatch;
      }
      return true;
    })
    // 3. Sort by updatedAt in descending order
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

/**
 * Removes a conversation and resolves which ID should become next active.
 */
export function deleteConversationById(
  conversations: ChatConversation[],
  id: string
): {
  conversations: ChatConversation[];
  nextActiveId: string | null;
} {
  const filtered = conversations.filter((c) => c.id !== id);
  if (filtered.length === 0) {
    return {
      conversations: filtered,
      nextActiveId: null,
    };
  }

  // Next active ID should be the most recently updated one remaining
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
 * Ignores empty or blank values.
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
    
    // Support parsing direct exports or plain raw arrays
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
