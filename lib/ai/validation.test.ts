import { describe, it, expect } from "vitest";
import { validateAiChatRequest } from "@/lib/ai/validation";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

function validRequest(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    message: "ما هي أفضل سيارة كهربائية؟",
    modelId: "voltjo",
    thinkingMode: false,
    conversationId: null,
    attachment: null,
    ...overrides,
  };
}

describe("validateAiChatRequest", () => {
  it("accepts a valid basic chat request", () => {
    const result = validateAiChatRequest(validRequest());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.message).toBe("ما هي أفضل سيارة كهربائية؟");
      expect(result.data.modelId).toBe("voltjo");
      expect(result.data.thinkingMode).toBe(false);
    }
  });

  it("rejects non-object input", () => {
    const result = validateAiChatRequest("not an object");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_JSON");
  });

  it("rejects invalid message shape (non-string)", () => {
    const result = validateAiChatRequest(validRequest({ message: 42 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_MESSAGE");
  });

  it("rejects message exceeding max length", () => {
    const result = validateAiChatRequest(validRequest({ message: "x".repeat(1001) }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("MESSAGE_TOO_LONG");
  });

  it("rejects invalid conversationId (not a UUID)", () => {
    const result = validateAiChatRequest(validRequest({ conversationId: "not-a-uuid" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_CONVERSATION_ID");
  });

  it("accepts valid conversationId (UUID v4)", () => {
    const result = validateAiChatRequest(validRequest({ conversationId: VALID_UUID }));
    expect(result.ok).toBe(true);
  });

  it("rejects invalid modelId", () => {
    const result = validateAiChatRequest(validRequest({ modelId: "gpt-4" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_MODEL");
  });

  it("rejects whitespace-only message with no attachment", () => {
    const result = validateAiChatRequest(validRequest({ message: "   " }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("INVALID_MESSAGE");
  });
});
