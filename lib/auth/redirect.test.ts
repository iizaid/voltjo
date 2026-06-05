import { describe, it, expect } from "vitest";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

describe("getSafeRedirectPath", () => {
  it("allows a safe internal path", () => {
    expect(getSafeRedirectPath("/account")).toBe("/account");
  });

  it("allows the assistant path", () => {
    expect(getSafeRedirectPath("/assistant")).toBe("/assistant");
  });

  it("returns default when param is null", () => {
    expect(getSafeRedirectPath(null)).toBe("/assistant");
  });

  it("returns default when param is empty string", () => {
    expect(getSafeRedirectPath("")).toBe("/assistant");
  });

  it("blocks absolute external URL (https://)", () => {
    expect(getSafeRedirectPath("https://example.com")).toBe("/assistant");
  });

  it("blocks protocol-relative URL (//evil.com)", () => {
    expect(getSafeRedirectPath("//evil.com")).toBe("/assistant");
  });

  it("blocks literal backslash in path", () => {
    expect(getSafeRedirectPath("/path\\evil")).toBe("/assistant");
  });

  it("blocks URL-encoded backslash (%5c)", () => {
    expect(getSafeRedirectPath("/path%5cevil")).toBe("/assistant");
  });

  it("blocks javascript: protocol", () => {
    expect(getSafeRedirectPath("javascript:alert(1)")).toBe("/assistant");
  });
});
