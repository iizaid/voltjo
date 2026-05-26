import { ChatMessageData } from "./types";

export async function simulateChatResponse(prompt: string): Promise<ChatMessageData> {
  // Simulate network delay
  await new Promise((resolve) => setTimeout(resolve, 800 + Math.random() * 1000));

  return {
    id: `assistant-${Date.now()}`,
    role: "assistant",
    content: "نعم، أقدر أساعدك. أعطني اسم السيارة أو الموديل، وسأوضح لك تكلفة الشحن، مدى ملاءمتها للاستخدام اليومي، وأهم نقاط المقارنة داخل السوق الأردني.",
    bullets: [
      "أقارن لك التكلفة والمدى وطريقة الشحن.",
      "أوضح نقاط الدعم والضمان حسب المعلومات المتاحة.",
      prompt.includes("تكلفة") || prompt.includes("شحن")
        ? "أستطيع تجهيز تقدير ثابت للتكلفة عند توفر بيانات الاستخدام."
        : "الأفضل دائمًا مقارنة السعر والدعم والضمان قبل الشراء.",
    ],
  };
}
