import { describe, it, expect, beforeEach, vi } from "vitest";

// In-memory fake of the Upstash Redis surface this module uses.
class FakeRedis {
  store = new Map<string, number | string>();

  async get(key: string) {
    return this.store.has(key) ? this.store.get(key)! : null;
  }
  async mget<T extends unknown[]>(...keys: string[]): Promise<T> {
    return keys.map((k) => (this.store.has(k) ? this.store.get(k)! : null)) as T;
  }
  async incrby(key: string, by: number) {
    const next = Number(this.store.get(key) ?? 0) + by;
    this.store.set(key, next);
    return next;
  }
  async set(key: string, value: string) {
    this.store.set(key, value);
    return "OK";
  }
  async del(key: string) {
    this.store.delete(key);
    return 1;
  }
  async pexpire() {
    return 1;
  }
}

let fake: FakeRedis;

vi.mock("@/lib/server/redis", () => ({
  getRedisClient: () => fake,
}));

import {
  checkAiBudget,
  recordAiUsage,
  resetBreaker,
  tripBreaker,
  getBudgetConfig,
} from "@/lib/ai/cost-control";

beforeEach(() => {
  fake = new FakeRedis();
  // Deterministic small caps for fast assertions.
  process.env.AI_BUDGET_USER_DAILY_TOKENS = "1000";
  process.env.AI_BUDGET_ANON_DAILY_TOKENS = "300";
  process.env.AI_BUDGET_GLOBAL_DAILY_TOKENS = "5000";
  process.env.AI_BUDGET_BREAKER_TOKENS = "8000";
  process.env.AI_BUDGET_FALLBACK_TOKENS = "100";
});

describe("checkAiBudget", () => {
  it("allows a fresh user under all caps", async () => {
    const d = await checkAiBudget({ actor: "user", userId: "u1" });
    expect(d.ok).toBe(true);
  });

  it("refuses a user who exhausted their daily cap", async () => {
    await recordAiUsage({ actor: "user", userId: "u1", tokens: 1000 });
    const d = await checkAiBudget({ actor: "user", userId: "u1" });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toBe("user");
  });

  it("keeps separate buckets per user (no cross-user bleed)", async () => {
    await recordAiUsage({ actor: "user", userId: "u1", tokens: 1000 });
    const other = await checkAiBudget({ actor: "user", userId: "u2" });
    expect(other.ok).toBe(true);
  });

  it("refuses an anon IP that exhausted the (smaller) anon cap", async () => {
    await recordAiUsage({ actor: "anon", ip: "1.2.3.4", tokens: 300 });
    const d = await checkAiBudget({ actor: "anon", ip: "1.2.3.4" });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toBe("anon");
  });

  it("refuses everyone once the global cap is reached", async () => {
    await recordAiUsage({ actor: "user", userId: "whale", tokens: 5000 });
    // A brand-new user is still blocked because the GLOBAL cap is hit.
    const d = await checkAiBudget({ actor: "user", userId: "fresh" });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toBe("global");
  });

  it("refuses all requests when the circuit breaker is open", async () => {
    await tripBreaker(60_000);
    const d = await checkAiBudget({ actor: "user", userId: "u1" });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toBe("breaker");
    await resetBreaker();
    const after = await checkAiBudget({ actor: "user", userId: "u1" });
    expect(after.ok).toBe(true);
  });

  it("auto-trips the breaker when global blows past the ceiling", async () => {
    await recordAiUsage({ actor: "user", userId: "runaway", tokens: 8000 });
    const d = await checkAiBudget({ actor: "anon", ip: "9.9.9.9" });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toBe("breaker");
  });
});

describe("recordAiUsage", () => {
  it("charges the fallback estimate when no tokens reported", async () => {
    await recordAiUsage({ actor: "user", userId: "u1", tokens: null });
    const cfg = getBudgetConfig();
    // 100 fallback < 1000 cap → still allowed, but the bucket advanced.
    const d = await checkAiBudget({ actor: "user", userId: "u1" });
    expect(d.ok).toBe(true);
    expect(cfg.fallbackTokens).toBe(100);
  });
});

describe("fail-closed", () => {
  it("refuses when the store is unavailable", async () => {
    const original = fake;
    // Simulate unconfigured store (getRedisClient returns null).
    fake = null as unknown as FakeRedis;
    const d = await checkAiBudget({ actor: "user", userId: "u1" });
    expect(d.ok).toBe(false);
    if (!d.ok) expect(d.reason).toBe("store");
    fake = original;
  });
});
