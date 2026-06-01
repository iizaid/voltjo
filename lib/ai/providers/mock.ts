import type { AiChatRequest, AiChatResponse, AiProvider } from "@/lib/ai/types";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildThinkingResponse(request: AiChatRequest): AiChatResponse {
  const modelSpecificBullet =
    request.modelId === "gemini"
      ? "أرتب لك الإجابة بسرعة ووضوح مع إبراز أهم نقاط القرار أولًا."
      : request.modelId === "kimi"
        ? "أوسع التحليل عندما يحتاج السؤال إلى تفصيل أكثر من زاوية."
        : "أركز على القرار العملي داخل السوق الأردني قبل أي تفاصيل ثانوية.";

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content:
      "حللت سؤالك من زاوية التكلفة، الاستخدام اليومي، الدعم بعد البيع، والمخاطر قبل الشراء. بهذه الطريقة أقدر أوصل لك خلاصة عملية تساعدك على القرار بدل الاكتفاء بمواصفات عامة.",
    bullets: [
      "أبدأ بتحديد نوع الاستخدام: مدينة، سفر، أو استخدام مختلط.",
      "أقارن بين تكلفة التشغيل، المدى، الشحن، والدعم بعد البيع.",
      "أنتبه لعوامل السوق الأردني مثل الضمان، توفر القطع، واعتمادية الوكيل.",
      modelSpecificBullet,
      request.attachment
        ? `أتعامل مع المرفق كمرجع إضافي داخل السياق الحالي: ${request.attachment.name}.`
        : "أعطيك خلاصة عملية تساعدك على القرار بدل الإغراق في المواصفات فقط.",
    ],
    createdAt: new Date().toISOString(),
    status: "done",
    metadata: {
      modelId: request.modelId,
      thinkingMode: true,
      provider: "mock",
    },
  };
}

function buildFastResponse(request: AiChatRequest): AiChatResponse {
  const quickBullet =
    request.message.includes("تكلفة") || request.message.includes("شحن")
      ? "أستطيع تجهيز تقدير مبسط للتكلفة عند توفر بيانات الاستخدام الفعلية."
      : "الأفضل دائمًا مقارنة السعر والدعم والضمان قبل الشراء.";

  const modelSpecificBullet =
    request.modelId === "gemini"
      ? "أقدم لك إجابة سريعة ومباشرة على السؤال الأساسي."
      : request.modelId === "kimi"
        ? "أضيف توضيحًا أكثر عندما يكون السؤال طويلًا أو متعدد الأجزاء."
        : "أحافظ على إجابة عملية موجهة للسوق الأردني.";

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content:
      "نعم، أقدر أساعدك. أعطني اسم السيارة أو الموديل، وسأوضح لك تكلفة الشحن، مدى ملاءمتها للاستخدام اليومي، وأهم نقاط المقارنة داخل السوق الأردني.",
    bullets: [
      "أقارن لك التكلفة والمدى وطريقة الشحن.",
      "أوضح نقاط الدعم والضمان حسب المعلومات المتاحة.",
      quickBullet,
      modelSpecificBullet,
    ],
    createdAt: new Date().toISOString(),
    status: "done",
    metadata: {
      modelId: request.modelId,
      thinkingMode: false,
      provider: "mock",
    },
  };
}

export const mockProvider: AiProvider = {
  id: "mock",
  async generateChatResponse(request: AiChatRequest) {
    const delay = request.thinkingMode
      ? 1400 + Math.random() * 1000
      : 550 + Math.random() * 450;

    await wait(delay);

    return request.thinkingMode
      ? buildThinkingResponse(request)
      : buildFastResponse(request);
  },
};
