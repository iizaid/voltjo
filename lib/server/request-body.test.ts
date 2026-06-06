import { describe, expect, it } from "vitest";
import { readJsonWithByteLimit } from "@/lib/server/request-body";

describe("readJsonWithByteLimit", () => {
  it("accepts valid JSON within the byte limit", async () => {
    const request = new Request("https://example.test/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "مرحبا" }),
    });

    const result = await readJsonWithByteLimit(request, 1024);

    expect(result).toEqual({
      ok: true,
      data: { message: "مرحبا" },
    });
  });

  it("rejects a body over the byte limit", async () => {
    const request = new Request("https://example.test/api/chat", {
      method: "POST",
      body: JSON.stringify({ message: "x".repeat(32) }),
    });

    const result = await readJsonWithByteLimit(request, 16);

    expect(result).toEqual({
      ok: false,
      reason: "too_large",
    });
  });
});
