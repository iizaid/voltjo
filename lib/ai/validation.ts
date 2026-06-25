import {
  ALLOWED_CHAT_ATTACHMENT_TYPES,
  MAX_CHAT_ATTACHMENT_SIZE_BYTES,
  MAX_CHAT_MESSAGE_LENGTH,
} from "@/lib/chat/constants";
import type { AiChatRequest, AiChatTurn, AiModelId } from "@/lib/ai/types";
import { CHAT_MODELS } from "@/lib/ai/model-display";

type ValidationResult =
  | { ok: true; data: AiChatRequest }
  | { ok: false; code: string; message: string; status: number };

const VALID_MODELS: AiModelId[] = CHAT_MODELS.map((model) => model.id);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isSupportedAttachmentType(type: string) {
  return ALLOWED_CHAT_ATTACHMENT_TYPES.includes(
    type as (typeof ALLOWED_CHAT_ATTACHMENT_TYPES)[number],
  );
}

export function validateAiChatRequest(input: unknown): ValidationResult {
  if (!isRecord(input)) {
    return {
      ok: false,
      code: "INVALID_JSON",
      message: "تعذر قراءة الطلب.",
      status: 400,
    };
  }

  const rawMessage = input.message;
  const rawModelId = input.modelId;
  const rawThinkingMode = input.thinkingMode;
  const rawConversationId = input.conversationId;
  const rawAttachment = input.attachment;
  const rawClientHistory = input.clientHistory;
  const rawConversationTitle = input.conversationTitle;
  const rawMessageCount = input.messageCount;

  if (typeof rawMessage !== "string") {
    return {
      ok: false,
      code: "INVALID_MESSAGE",
      message: "الرسالة غير صالحة.",
      status: 400,
    };
  }

  const message = rawMessage.trim();

  if (message.length > MAX_CHAT_MESSAGE_LENGTH) {
    return {
      ok: false,
      code: "MESSAGE_TOO_LONG",
      message: `الرسالة طويلة جدًا. اختصرها إلى ${MAX_CHAT_MESSAGE_LENGTH} حرف كحد أقصى.`,
      status: 400,
    };
  }

  if (typeof rawModelId !== "string" || !VALID_MODELS.includes(rawModelId as AiModelId)) {
    return {
      ok: false,
      code: "INVALID_MODEL",
      message: "الموديل المحدد غير صالح.",
      status: 400,
    };
  }

  if (typeof rawThinkingMode !== "boolean") {
    return {
      ok: false,
      code: "INVALID_THINKING_MODE",
      message: "قيمة وضع التفكير غير صالحة.",
      status: 400,
    };
  }

  let conversationId: string | null = null;
  if (rawConversationId !== undefined && rawConversationId !== null) {
    if (typeof rawConversationId !== "string") {
      return {
        ok: false,
        code: "INVALID_CONVERSATION_ID",
        message: "معرّف المحادثة غير صالح.",
        status: 400,
      };
    }

    const sanitizedConversationId = rawConversationId.trim();
    if (!UUID_PATTERN.test(sanitizedConversationId)) {
      return {
        ok: false,
        code: "INVALID_CONVERSATION_ID",
        message: "معرّف المحادثة غير صالح.",
        status: 400,
      };
    }

    conversationId = sanitizedConversationId;
  }

  let attachment: AiChatRequest["attachment"] = null;

  if (rawAttachment !== undefined && rawAttachment !== null) {
    if (!isRecord(rawAttachment)) {
      return {
        ok: false,
        code: "INVALID_ATTACHMENT",
        message: "بيانات المرفق غير صالحة.",
        status: 400,
      };
    }

    const { id, name, size, type } = rawAttachment;

    if (typeof id !== "string") {
      return {
        ok: false,
        code: "INVALID_ATTACHMENT_ID",
        message: "معرّف المرفق غير صالح.",
        status: 400,
      };
    }

    if (typeof name !== "string") {
      return {
        ok: false,
        code: "INVALID_ATTACHMENT_NAME",
        message: "اسم المرفق غير صالح.",
        status: 400,
      };
    }

    if (typeof type !== "string") {
      return {
        ok: false,
        code: "INVALID_ATTACHMENT_TYPE",
        message: "نوع المرفق غير صالح.",
        status: 400,
      };
    }

    if (typeof size !== "number" || !Number.isFinite(size) || size < 0) {
      return {
        ok: false,
        code: "INVALID_ATTACHMENT_SIZE",
        message: "حجم المرفق غير صالح.",
        status: 400,
      };
    }

    const sanitizedId = id.trim();
    const sanitizedName = name.trim();
    const sanitizedType = type.trim();

    if (!sanitizedId || sanitizedId.length > 120) {
      return {
        ok: false,
        code: "INVALID_ATTACHMENT_ID",
        message: "معرّف المرفق غير صالح.",
        status: 400,
      };
    }

    if (!sanitizedName || sanitizedName.length > 160) {
      return {
        ok: false,
        code: "INVALID_ATTACHMENT_NAME",
        message: "اسم المرفق غير صالح.",
        status: 400,
      };
    }

    if (!sanitizedType || sanitizedType.length > 100) {
      return {
        ok: false,
        code: "INVALID_ATTACHMENT_TYPE",
        message: "نوع المرفق غير صالح.",
        status: 400,
      };
    }

    if (size > MAX_CHAT_ATTACHMENT_SIZE_BYTES) {
      return {
        ok: false,
        code: "ATTACHMENT_TOO_LARGE",
        message: "حجم الملف كبير جدًا. الحد الأقصى للمرفق هو 5 ميغابايت.",
        status: 400,
      };
    }

    if (!isSupportedAttachmentType(sanitizedType)) {
      return {
        ok: false,
        code: "UNSUPPORTED_ATTACHMENT_TYPE",
        message: "نوع الملف غير مدعوم. يمكنك إرفاق صورة PNG أو JPG أو WebP أو ملف PDF فقط.",
        status: 400,
      };
    }

    attachment = {
      id: sanitizedId,
      name: sanitizedName,
      size,
      type: sanitizedType,
    };
  }

  if (!message && !attachment) {
    return {
      ok: false,
      code: "INVALID_MESSAGE",
      message: "أدخل رسالة أو أرفق ملفًا صالحًا.",
      status: 400,
    };
  }

  // Validate optional client-supplied history (fallback for guest sessions)
  let clientHistory: AiChatTurn[] | undefined;
  if (Array.isArray(rawClientHistory)) {
    const MAX_CLIENT_HISTORY = 20;
    const MAX_CONTENT_LENGTH = 2000;
    const valid = rawClientHistory
      .slice(-MAX_CLIENT_HISTORY)
      .filter(
        (t): t is AiChatTurn =>
          isRecord(t) &&
          (t.role === "user" || t.role === "assistant") &&
          typeof t.content === "string" &&
          t.content.length <= MAX_CONTENT_LENGTH,
      );
    if (valid.length > 0) clientHistory = valid;
  }

  // Validate optional conversation context fields
  let conversationTitle: string | undefined;
  if (typeof rawConversationTitle === "string") {
    const trimmed = rawConversationTitle.trim().slice(0, 160);
    if (trimmed.length > 0) conversationTitle = trimmed;
  }

  let messageCount: number | undefined;
  if (typeof rawMessageCount === "number" && Number.isFinite(rawMessageCount) && rawMessageCount >= 0) {
    messageCount = Math.floor(rawMessageCount);
  }

  return {
    ok: true,
    data: {
      message,
      modelId: rawModelId as AiModelId,
      thinkingMode: rawThinkingMode,
      conversationId,
      attachment,
      clientHistory,
      conversationTitle,
      messageCount,
    },
  };
}
