import { getAiProvider } from "@/lib/ai/provider";
import { validateAiChatRequest } from "@/lib/ai/validation";
import { getCurrentUser } from "@/lib/server/auth";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { checkRateLimit } from "@/lib/server/rate-limit";

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

export async function POST(request: Request) {
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
    return apiError({
      code: "RATE_LIMITED",
      message: rateLimit.message,
      status: 429,
    });
  }

  try {
    const provider = getAiProvider();
    const message = await provider.generateChatResponse(validation.data);

    return apiSuccess({
      message,
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
