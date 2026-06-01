import {
  ALLOWED_CHAT_ATTACHMENT_TYPES,
  MAX_CHAT_ATTACHMENT_SIZE_BYTES,
  MAX_CHAT_MESSAGE_LENGTH,
} from "@/lib/chat/constants";
import type { AiChatRequest, AiModelId } from "@/lib/ai/types";

type ValidationResult =
  | { ok: true; data: AiChatRequest }
  | { ok: false; code: string; message: string; status: number };

const VALID_MODELS: AiModelId[] = ["voltjo", "gemini", "kimi"];

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
  const rawAttachment = input.attachment;

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

    if (
      typeof id !== "string" ||
      typeof name !== "string" ||
      typeof size !== "number" ||
      !Number.isFinite(size) ||
      typeof type !== "string"
    ) {
      return {
        ok: false,
        code: "INVALID_ATTACHMENT",
        message: "بيانات المرفق غير مكتملة أو غير صالحة.",
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

    if (!isSupportedAttachmentType(type)) {
      return {
        ok: false,
        code: "UNSUPPORTED_ATTACHMENT_TYPE",
        message: "نوع الملف غير مدعوم. يمكنك إرفاق صورة PNG أو JPG أو WebP أو ملف PDF فقط.",
        status: 400,
      };
    }

    attachment = {
      id,
      name: name.trim(),
      size,
      type,
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

  return {
    ok: true,
    data: {
      message,
      modelId: rawModelId as AiModelId,
      thinkingMode: rawThinkingMode,
      attachment,
    },
  };
}
