import type { ChatAttachment, ChatMessage } from "./types";

type SimulateChatOptions = {
  modelId?: string;
  thinkingMode?: boolean;
  attachment?: ChatAttachment | null;
};

export async function simulateChatResponse(
  prompt: string,
  options?: SimulateChatOptions,
): Promise<ChatMessage> {
  const thinkingMode = options?.thinkingMode ?? false;
  const modelId = options?.modelId ?? "voltjo";

  const delay = thinkingMode
    ? 1400 + Math.random() * 1100
    : 550 + Math.random() * 500;

  await new Promise((resolve) => setTimeout(resolve, delay));

  if (thinkingMode) {
    return {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content:
        "حللت سؤالك من زاوية الاستخدام اليومي، تكلفة التشغيل، مستوى الدعم، والمخاطر قبل الشراء. بهذه الطريقة أقدر أعطيك خلاصة عملية تساعدك على القرار بدل الاكتفاء بمواصفات عامة.",
      bullets: [
        "أبدأ بتحديد نوع الاستخدام: مدينة، سفر، أو استخدام مختلط.",
        "أقارن بين تكلفة التشغيل، المدى، الشحن، والدعم بعد البيع.",
        "أنتبه لعوامل السوق الأردني مثل الضمان، توفر القطع، واعتمادية الوكيل.",
        modelId === "gemini"
          ? "أرتب لك الإجابة بشكل سريع وواضح مع إبراز أهم المخاطر مباشرة."
          : modelId === "kimi"
            ? "أوسّع التحليل عندما يكون السؤال طويلًا أو يحتاج تفكيكًا على أكثر من نقطة."
            : "أعطيك خلاصة عملية تركّز على القرار النهائي لا على المواصفات فقط.",
        options?.attachment
          ? `أضع المرفق في السياق كمعلومة مساعدة فقط: ${options.attachment.name}.`
          : "أستطيع بعد الربط الحقيقي أن أبني نفس هذا التحليل على بيانات فعلية ومحدثة.",
      ],
      createdAt: new Date().toISOString(),
      status: "done",
      metadata: {
        modelId,
        thinkingMode: true,
      },
    };
  }

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content:
      "نعم، أقدر أساعدك. أعطني اسم السيارة أو الموديل، وسأوضح لك تكلفة الشحن، مدى ملاءمتها للاستخدام اليومي، وأهم نقاط المقارنة داخل السوق الأردني.",
    bullets: [
      "أقارن لك التكلفة والمدى وطريقة الشحن.",
      "أوضح نقاط الدعم والضمان حسب المعلومات المتاحة.",
      prompt.includes("تكلفة") || prompt.includes("شحن")
        ? "أستطيع تجهيز تقدير ثابت للتكلفة عند توفر بيانات الاستخدام."
        : "الأفضل دائمًا مقارنة السعر والدعم والضمان قبل الشراء.",
    ],
    createdAt: new Date().toISOString(),
    status: "done",
    metadata: {
      modelId,
      thinkingMode: false,
    },
  };
}
