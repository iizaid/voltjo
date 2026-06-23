import "server-only";

import { getRedisClient } from "@/lib/server/redis";

/**
 * Production-grade AI cost protection.
 *
 * GOAL
 * ----
 * Prevent runaway provider spend (e.g. a bug, an abusive client, or a viral
 * spike draining the Gemini budget) by enforcing layered daily caps plus an
 * emergency circuit breaker.
 *
 * LAYERS (checked in order; first failure refuses the request)
 * ------------------------------------------------------------
 *   1. Circuit breaker  — a global kill switch ops can flip, also auto-tripped
 *                         when the global cap is blown past a hard ceiling.
 *   2. Global daily cap — total tokens across ALL users/anon per UTC day.
 *   3. Per-user daily   — tokens for one authenticated user per UTC day.
 *   4. Anonymous daily  — tokens for one anonymous client (by IP) per UTC day.
 *
 * UNIT
 * ----
 * Budgets are denominated in TOKENS — the only cost signal every LLM provider
 * exposes — so this module is fully provider-agnostic (no Gemini specifics). A
 * request whose provider reports no usage is charged a fixed fallback estimate.
 *
 * FAIL MODE
 * ---------
 * Fail CLOSED, matching lib/server/rate-limit.ts: if the store is unconfigured
 * or unreachable we refuse, because the entire point is to bound spend. Raw
 * Redis errors/URLs/tokens are never surfaced or logged.
 */

export type BudgetActor = "user" | "anon";

export type BudgetRefusalReason = "breaker" | "global" | "user" | "anon" | "store";

export type BudgetDecision =
  | { ok: true }
  | { ok: false; reason: BudgetRefusalReason; message: string };

// Friendly Arabic messages — never leak internals or which exact cap was hit
// beyond what is useful to the user.
export const BUDGET_MESSAGES = {
  breaker: "خدمة المساعد متوقفة مؤقتًا للصيانة. حاول لاحقًا.",
  global: "الطلب مرتفع جدًا على المساعد اليوم. عاد الخدمة غدًا أو حاول لاحقًا.",
  user: "لقد استهلكت حصتك اليومية من المساعد. تعود الحصة غدًا.",
  anon: "بلغت الحد اليومي للاستخدام. سجّل الدخول للحصول على حصة أكبر، أو عُد غدًا.",
  store: "خدمة المساعد غير متاحة حاليًا. حاول لاحقًا.",
} as const satisfies Record<BudgetRefusalReason, string>;

function intFromEnv(name: string, fallback: number): number {
  const parsed = Number.parseInt(process.env[name] ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

type BudgetConfig = {
  userDailyTokens: number;
  anonDailyTokens: number;
  globalDailyTokens: number;
  /** Hard backstop: auto-trips the breaker when global exceeds this. */
  breakerCeilingTokens: number;
  /** Charged when a provider reports no token usage. */
  fallbackTokens: number;
};

export function getBudgetConfig(): BudgetConfig {
  const globalDailyTokens = intFromEnv("AI_BUDGET_GLOBAL_DAILY_TOKENS", 5_000_000);
  return {
    userDailyTokens: intFromEnv("AI_BUDGET_USER_DAILY_TOKENS", 100_000),
    anonDailyTokens: intFromEnv("AI_BUDGET_ANON_DAILY_TOKENS", 20_000),
    globalDailyTokens,
    breakerCeilingTokens: intFromEnv(
      "AI_BUDGET_BREAKER_TOKENS",
      globalDailyTokens * 2,
    ),
    fallbackTokens: intFromEnv("AI_BUDGET_FALLBACK_TOKENS", 1_000),
  };
}

/** UTC day stamp so all instances share the same daily window boundary. */
function utcDay(now = Date.now()): string {
  return new Date(now).toISOString().slice(0, 10); // YYYY-MM-DD
}

/** Milliseconds until the next UTC midnight — used as the counter TTL. */
function msUntilUtcMidnight(now = Date.now()): number {
  const d = new Date(now);
  const next = Date.UTC(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate() + 1,
    0,
    0,
    0,
    0,
  );
  return Math.max(1, next - now);
}

const BREAKER_KEY = "aibudget:breaker:open";

function globalKey(day: string) {
  return `aibudget:global:${day}`;
}
function userKey(day: string, userId: string) {
  return `aibudget:user:${day}:${userId}`;
}
function anonKey(day: string, ip: string) {
  return `aibudget:anon:${day}:${ip || "unknown"}`;
}

function toInt(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "string") {
    const n = Number.parseInt(value, 10);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function refuse(reason: BudgetRefusalReason): BudgetDecision {
  return { ok: false, reason, message: BUDGET_MESSAGES[reason] };
}

/**
 * Pre-flight budget gate. Call BEFORE invoking the provider. Returns ok:true
 * when the request is within all applicable caps and the breaker is closed.
 */
export async function checkAiBudget(params: {
  actor: BudgetActor;
  userId?: string | null;
  ip?: string | null;
}): Promise<BudgetDecision> {
  const redis = getRedisClient();
  if (!redis) {
    console.warn("ai-budget: store unavailable", { reason: "missing-config" });
    return refuse("store");
  }

  const cfg = getBudgetConfig();
  const day = utcDay();

  try {
    const breakerOpen = await redis.get(BREAKER_KEY);
    if (breakerOpen) {
      logBudgetEvent("ai_budget_breaker_block", { actor: params.actor });
      return refuse("breaker");
    }

    const isUser = params.actor === "user" && Boolean(params.userId);
    const scopedKey = isUser
      ? userKey(day, params.userId as string)
      : anonKey(day, params.ip ?? "unknown");

    const [globalRaw, scopedRaw] = await redis.mget<[unknown, unknown]>(
      globalKey(day),
      scopedKey,
    );

    const globalUsed = toInt(globalRaw);
    if (globalUsed >= cfg.globalDailyTokens) {
      logBudgetEvent("ai_budget_exhausted", { scope: "global", used: globalUsed });
      return refuse("global");
    }

    const scopedUsed = toInt(scopedRaw);
    const scopedCap = isUser ? cfg.userDailyTokens : cfg.anonDailyTokens;
    if (scopedUsed >= scopedCap) {
      logBudgetEvent("ai_budget_exhausted", {
        scope: isUser ? "user" : "anon",
        used: scopedUsed,
      });
      return refuse(isUser ? "user" : "anon");
    }

    return { ok: true };
  } catch (error) {
    console.warn("ai-budget: store error", {
      phase: "check",
      error: error instanceof Error ? error.name : "unknown",
    });
    return refuse("store");
  }
}

/**
 * Post-flight accounting. Call AFTER a successful generation with the tokens the
 * provider reported (or 0/undefined → fallback estimate). Best-effort: a logging
 * failure must never break the user's successful response.
 *
 * Auto-trips the emergency circuit breaker if the global counter blows past the
 * configured hard ceiling.
 */
export async function recordAiUsage(params: {
  actor: BudgetActor;
  userId?: string | null;
  ip?: string | null;
  tokens?: number | null;
}): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  const cfg = getBudgetConfig();
  const day = utcDay();
  const ttl = msUntilUtcMidnight();
  const charge =
    params.tokens && params.tokens > 0 ? Math.ceil(params.tokens) : cfg.fallbackTokens;

  const isUser = params.actor === "user" && Boolean(params.userId);
  const scopedKey = isUser
    ? userKey(day, params.userId as string)
    : anonKey(day, params.ip ?? "unknown");

  try {
    const gKey = globalKey(day);
    const globalTotal = await redis.incrby(gKey, charge);
    if (globalTotal === charge) await redis.pexpire(gKey, ttl);

    const scopedTotal = await redis.incrby(scopedKey, charge);
    if (scopedTotal === charge) await redis.pexpire(scopedKey, ttl);

    // Hard backstop: if global spend runs away beyond the ceiling, trip the
    // breaker for the rest of the day so nothing else can spend.
    if (globalTotal >= cfg.breakerCeilingTokens) {
      await redis.set(BREAKER_KEY, "1", { px: ttl });
      logBudgetEvent("ai_budget_breaker_trip", {
        globalTotal,
        ceiling: cfg.breakerCeilingTokens,
      });
    }
  } catch (error) {
    console.warn("ai-budget: store error", {
      phase: "record",
      error: error instanceof Error ? error.name : "unknown",
    });
  }
}

/** Manually open the emergency circuit breaker (ops kill switch). */
export async function tripBreaker(ttlMs = msUntilUtcMidnight()): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  try {
    await redis.set(BREAKER_KEY, "1", { px: ttlMs });
    logBudgetEvent("ai_budget_breaker_trip", { manual: true });
    return true;
  } catch {
    return false;
  }
}

/** Manually close (reset) the emergency circuit breaker. */
export async function resetBreaker(): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) return false;
  try {
    await redis.del(BREAKER_KEY);
    return true;
  } catch {
    return false;
  }
}

function logBudgetEvent(event: string, fields: Record<string, unknown>): void {
  try {
    console.warn(JSON.stringify({ ts: new Date().toISOString(), event, ...fields }));
  } catch {
    // never throw from logging
  }
}
