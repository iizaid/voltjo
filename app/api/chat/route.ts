import { generateAiChatResponse } from "@/lib/ai/provider";
import { getAiConfig } from "@/lib/ai/config";
import { checkAiBudget, recordAiUsage } from "@/lib/ai/cost-control";
import { AiError, userMessageForAiError, type AiErrorCode } from "@/lib/ai/errors";
import { validateAiChatRequest } from "@/lib/ai/validation";
import {
  createChatConversation,
  createChatMessage,
  findOwnedChatConversation,
} from "@/lib/chat/server-persistence";
import { getCurrentUser } from "@/lib/server/auth";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { getClientIp } from "@/lib/server/client-ip";
import { readJsonWithByteLimit } from "@/lib/server/request-body";
import { combineAbortSignals, runWithAbortableTimeout } from "@/lib/server/timeout";

const MAX_CHAT_API_BODY_BYTES = 12 * 1024;

function buildRateLimitHeaders(limit: number, remaining: number, resetAt: number) {
  return {
    "Cache-Control": "no-store, max-age=0",
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
}

async function tryCreateConversation(input: {
  title: string;
  modelId: string;
  thinkingMode: boolean;
}) {
  try {
    return await createChatConversation(input);
  } catch {
    return { ok: false as const, error: "Failed to create chat conversation." };
  }
}

async function tryCreateMessage(input: Parameters<typeof createChatMessage>[0]) {
  try {
    return await createChatMessage(input);
  } catch {
    return { ok: false as const, error: "Failed to create chat message." };
  }
}

async function tryFindOwnedConversation(conversationId: string) {
  try {
    return await findOwnedChatConversation(conversationId);
  } catch {
    return { ok: false as const, error: "Failed to load chat conversation." };
  }
}

function statusForAiError(code: AiErrorCode): number {
  switch (code) {
    case "RATE_LIMIT":
    case "QUOTA":
      return 429;
    case "TIMEOUT":
      return 504;
    case "CONFIG_MISSING":
    case "UPSTREAM":
      return 503;
    default:
      return 500;
  }
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const requestId = crypto.randomUUID();
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number.parseInt(contentLength, 10);
    if (Number.isFinite(parsedLength) && parsedLength > MAX_CHAT_API_BODY_BYTES) {
      return apiError({
        code: "PAYLOAD_TOO_LARGE",
        message: "حجم الطلب كبير جدًا.",
        status: 413,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }
  }

  const preParseRateLimit = await checkRateLimit({
    key: `ip:${ip}`,
    action: "chat-preparse",
    limit: 60,
    windowMs: 10 * 60 * 1000,
  });

  if (!preParseRateLimit.ok) {
    const retryAfter = Math.max(
      1,
      Math.ceil((preParseRateLimit.resetAt - Date.now()) / 1000),
    );
    return apiError({
      code: "RATE_LIMITED",
      message: preParseRateLimit.message,
      status: 429,
      headers: {
        ...buildRateLimitHeaders(
          preParseRateLimit.limit,
          preParseRateLimit.remaining,
          preParseRateLimit.resetAt,
        ),
        "Retry-After": String(retryAfter),
      },
    });
  }

  const bodyResult = await readJsonWithByteLimit(request, MAX_CHAT_API_BODY_BYTES);
  if (!bodyResult.ok) {
    if (bodyResult.reason === "too_large") {
      return apiError({
        code: "PAYLOAD_TOO_LARGE",
        message: "حجم الطلب كبير جدًا.",
        status: 413,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      });
    }

    return apiError({
      code: "INVALID_JSON",
      message: "تعذر قراءة الطلب.",
      status: 400,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
  const body = bodyResult.data;

  const validation = validateAiChatRequest(body);
  if (!validation.ok) {
    return apiError({
      code: validation.code,
      message: validation.message,
      status: validation.status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }

  const { user } = await getCurrentUser();
  const rateKey = user ? `user:${user.id}` : `ip:${ip}`;

  const rateLimit = await checkRateLimit({
    key: rateKey,
    action: "chat",
    limit: user ? 30 : 10,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    const retryAfter = Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000));
    return apiError({
      code: "RATE_LIMITED",
      message: rateLimit.message,
      status: 429,
      headers: {
        ...buildRateLimitHeaders(rateLimit.limit, rateLimit.remaining, rateLimit.resetAt),
        "Retry-After": String(retryAfter),
      },
    });
  }

  // Cost protection: refuse before any spend (and before creating a conversation)
  // when a daily budget is exhausted or the emergency breaker is open.
  const actor: "user" | "anon" = user ? "user" : "anon";
  const budget = await checkAiBudget({ actor, userId: user?.id ?? null, ip });
  if (!budget.ok) {
    return apiError({
      code: "AI_BUDGET_EXHAUSTED",
      message: budget.message,
      status: 429,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "Retry-After": "3600",
      },
    });
  }

  try {
    let persistedConversationId: string | null = null;
    let canPersistAssistantMessage = false;

    if (user) {
      if (validation.data.conversationId) {
        const existingConversation = await tryFindOwnedConversation(
          validation.data.conversationId,
        );
        if (existingConversation.ok && existingConversation.data?.id) {
          persistedConversationId = existingConversation.data.id;
        }
      } else {
        const createdConversation = await tryCreateConversation({
          title: validation.data.message.slice(0, 160),
          modelId: validation.data.modelId,
          thinkingMode: validation.data.thinkingMode,
        });

        if (createdConversation.ok) {
          persistedConversationId = createdConversation.data.id;
        }
      }

      if (persistedConversationId) {
        const userMessageResult = await tryCreateMessage({
          conversationId: persistedConversationId,
          role: "user",
          content: validation.data.message,
          attachment: validation.data.attachment ?? null,
          metadata: {
            modelId: validation.data.modelId,
            thinkingMode: validation.data.thinkingMode,
            provider: getAiConfig().primaryProvider,
          },
          status: "done",
        });

        if (userMessageResult.ok) {
          canPersistAssistantMessage = true;
        } else {
          persistedConversationId = null;
        }
      }
    }

    const message = await runWithAbortableTimeout({
      timeoutMs: 45_000,
      errorMessage: "AI provider timed out",
      work: (timeoutSignal) =>
        generateAiChatResponse(validation.data, {
          actor,
          requestId,
          // Cancel the provider when EITHER our deadline elapses OR the client
          // disconnects — no orphaned Gemini calls survive past the request.
          signal: combineAbortSignals(timeoutSignal, request.signal),
        }),
    });

    // Cost accounting: charge the tokens this request actually consumed so daily
    // budgets and the global circuit breaker stay accurate.
    await recordAiUsage({
      actor,
      userId: user?.id ?? null,
      ip,
      tokens: message.metadata.usage?.totalTokens ?? null,
    });

    if (user && persistedConversationId && canPersistAssistantMessage) {
      await tryCreateMessage({
        conversationId: persistedConversationId,
        role: "assistant",
        content: message.content,
        bullets: message.bullets ?? null,
        metadata: message.metadata,
        status: message.status,
      });
    }

    return apiSuccess({
      message,
      conversationId: persistedConversationId,
    }, {
      headers: buildRateLimitHeaders(rateLimit.limit, rateLimit.remaining, rateLimit.resetAt),
    });
  } catch (error) {
    if (error instanceof AiError) {
      return apiError({
        code: error.code,
        message: userMessageForAiError(error.code),
        status: statusForAiError(error.code),
        headers: { "Cache-Control": "no-store, max-age=0" },
      });
    }

    return apiError({
      code: "CHAT_GENERATION_FAILED",
      message: "تعذر تجهيز الرد الآن. حاول مرة أخرى.",
      status: 500,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    });
  }
}

export async function GET() {
  return apiError({
    code: "METHOD_NOT_ALLOWED",
    message: "استخدم POST لإرسال رسالة.",
    status: 405,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
