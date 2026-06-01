import { getAiProvider } from "@/lib/ai/provider";
import { validateAiChatRequest } from "@/lib/ai/validation";
import { createChatConversation, createChatMessage } from "@/lib/chat/server-persistence";
import { getCurrentUser } from "@/lib/server/auth";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { withTimeout } from "@/lib/server/timeout";

const MAX_CHAT_API_BODY_BYTES = 12 * 1024;

function getIpFromRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
}

function buildRateLimitHeaders(limit: number, remaining: number, resetAt: number) {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(resetAt / 1000)),
  };
}

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (contentLength) {
    const parsedLength = Number.parseInt(contentLength, 10);
    if (Number.isFinite(parsedLength) && parsedLength > MAX_CHAT_API_BODY_BYTES) {
      return apiError({
        code: "PAYLOAD_TOO_LARGE",
        message: "حجم الطلب كبير جدًا.",
        status: 413,
      });
    }
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return apiError({
      code: "INVALID_JSON",
      message: "تعذر قراءة الطلب.",
      status: 400,
    });
  }

  const validation = validateAiChatRequest(body);
  if (!validation.ok) {
    return apiError({
      code: validation.code,
      message: validation.message,
      status: validation.status,
    });
  }

  const { user } = await getCurrentUser();
  const ip = getIpFromRequest(request);
  const rateKey = user ? `user:${user.id}` : `ip:${ip}`;

  const rateLimit = checkRateLimit({
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

  try {
    const provider = getAiProvider();
    let persistedConversationId: string | null = null;
    let canPersistAssistantMessage = false;

    if (user) {
      if (validation.data.conversationId) {
        persistedConversationId = validation.data.conversationId;
      } else {
        const createdConversation = await createChatConversation({
          title: validation.data.message.slice(0, 160),
          modelId: validation.data.modelId,
          thinkingMode: validation.data.thinkingMode,
        });

        if (createdConversation.ok) {
          persistedConversationId = createdConversation.data.id;
        }
      }

      if (persistedConversationId) {
        const userMessageResult = await createChatMessage({
          conversationId: persistedConversationId,
          role: "user",
          content: validation.data.message,
          attachment: validation.data.attachment ?? null,
          metadata: {
            modelId: validation.data.modelId,
            thinkingMode: validation.data.thinkingMode,
            provider: "mock",
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

    const message = await withTimeout({
      promise: provider.generateChatResponse(validation.data),
      timeoutMs: 30_000,
      errorMessage: "AI provider timed out",
    });

    if (user && persistedConversationId && canPersistAssistantMessage) {
      await createChatMessage({
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
  } catch {
    return apiError({
      code: "CHAT_GENERATION_FAILED",
      message: "تعذر تجهيز الرد الآن. حاول مرة أخرى.",
      status: 500,
    });
  }
}

export async function GET() {
  return apiError({
    code: "METHOD_NOT_ALLOWED",
    message: "استخدم POST لإرسال رسالة.",
    status: 405,
  });
}
