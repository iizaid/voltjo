import { describe, it, expect } from "vitest";
import { getClientIp, isCloudflareRuntime } from "@/lib/server/client-ip";

function req(headers: Record<string, string>): Request {
  return new Request("https://voltjo.example/api/chat", { headers });
}

describe("isCloudflareRuntime", () => {
  it("detects Cloudflare via cf-ray", () => {
    expect(isCloudflareRuntime(req({ "cf-ray": "abc-IAD" }))).toBe(true);
  });

  it("detects Cloudflare via cf-connecting-ip", () => {
    expect(isCloudflareRuntime(req({ "cf-connecting-ip": "1.2.3.4" }))).toBe(true);
  });

  it("returns false for a bare request (local dev)", () => {
    expect(isCloudflareRuntime(req({}))).toBe(false);
  });
});

describe("getClientIp precedence", () => {
  it("prefers CF-Connecting-IP above everything", () => {
    const ip = getClientIp(
      req({
        "cf-connecting-ip": "9.9.9.9",
        "true-client-ip": "8.8.8.8",
        "x-forwarded-for": "1.1.1.1",
        "x-real-ip": "2.2.2.2",
      }),
    );
    expect(ip).toBe("9.9.9.9");
  });

  it("falls back to True-Client-IP when CF-Connecting-IP is absent", () => {
    const ip = getClientIp(
      req({ "true-client-ip": "8.8.8.8", "x-forwarded-for": "1.1.1.1" }),
    );
    expect(ip).toBe("8.8.8.8");
  });

  it("uses x-forwarded-for only in dev (no Cloudflare signal)", () => {
    const ip = getClientIp(req({ "x-forwarded-for": "1.1.1.1, 10.0.0.1" }));
    expect(ip).toBe("1.1.1.1");
  });
});

describe("getClientIp spoofing resistance (production / Cloudflare)", () => {
  it("ignores a spoofed x-forwarded-for when behind Cloudflare", () => {
    // Attacker sets XFF but the trusted CF header is what Cloudflare injected.
    const ip = getClientIp(
      req({
        "cf-ray": "abc-IAD",
        "cf-connecting-ip": "203.0.113.7",
        "x-forwarded-for": "66.66.66.66",
      }),
    );
    expect(ip).toBe("203.0.113.7");
  });

  it("does NOT fall back to spoofable headers on Cloudflare when CF header missing", () => {
    // Even though XFF is present, being on Cloudflare disables the dev fallback,
    // so a rotating XFF cannot mint fresh buckets — they all collapse to "unknown".
    const a = getClientIp(req({ "cf-ray": "r1", "x-forwarded-for": "1.1.1.1" }));
    const b = getClientIp(req({ "cf-ray": "r2", "x-forwarded-for": "2.2.2.2" }));
    const c = getClientIp(req({ "cf-ray": "r3", "x-forwarded-for": "3.3.3.3" }));
    expect(a).toBe("unknown");
    expect(b).toBe("unknown");
    expect(c).toBe("unknown");
    // All spoofed requests share ONE bucket → no bypass.
    expect(new Set([a, b, c]).size).toBe(1);
  });

  it("returns 'unknown' when no source is available", () => {
    expect(getClientIp(req({}))).toBe("unknown");
  });
});
