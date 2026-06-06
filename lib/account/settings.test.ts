import { describe, expect, it } from "vitest";
import { getAvatarUploadFormat } from "@/lib/account/settings";

describe("getAvatarUploadFormat", () => {
  it.each([
    ["image/jpeg", { extension: "jpg", contentType: "image/jpeg" }],
    ["image/png", { extension: "png", contentType: "image/png" }],
    ["image/webp", { extension: "webp", contentType: "image/webp" }],
  ])("maps %s to a matching extension and content type", (mimeType, expected) => {
    expect(getAvatarUploadFormat(mimeType)).toEqual(expected);
  });

  it("rejects unsupported image MIME types", () => {
    expect(getAvatarUploadFormat("image/gif")).toBeNull();
  });
});
