import type { OnboardingQuestion } from "@/lib/onboarding/types";

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "ageRange",
    title: "أي فئة عمرية تناسبك؟",
    subtitle: "نستخدمها فقط لتحسين نبرة الإرشاد وطريقة عرض المعلومات.",
    type: "single",
    options: [
      { label: "أقل من 18", value: "under_18" },
      { label: "18–24", value: "18_24" },
      { label: "25–34", value: "25_34" },
      { label: "35–44", value: "35_44" },
      { label: "45+", value: "45_plus" },
    ],
  },
  {
    id: "country",
    title: "وين رح تستخدم VoltJo غالبًا؟",
    subtitle: "التركيز الحالي على الأردن، لكن نترك خيارًا لمن يتصفح من الخارج.",
    type: "single",
    options: [
      { label: "داخل الأردن", value: "jordan" },
      { label: "خارج الأردن حاليًا", value: "other" },
    ],
  },
  {
    id: "city",
    title: "أي مدينة أقرب لاستخدامك اليومي؟",
    subtitle: "لا نحتاج عنوانك؛ المدينة تساعدنا نفهم نمط الشحن والمشاوير.",
    type: "single",
    options: [
      { label: "عمّان", value: "amman" },
      { label: "إربد", value: "irbid" },
      { label: "الزرقاء", value: "zarqa" },
      { label: "العقبة", value: "aqaba" },
      { label: "أخرى", value: "other" },
    ],
  },
  {
    id: "ownershipStatus",
    title: "أنت بأي مرحلة مع الكهربائي أو الهايبرد؟",
    subtitle: "هذا يساعدنا نفرق بين مالك حالي، مشتري محتمل، أو شخص يجمع معلومات.",
    type: "single",
    options: [
      { label: "أمتلك سيارة كهربائية", value: "owns_ev" },
      { label: "أمتلك سيارة هايبرد", value: "owns_hybrid" },
      { label: "أفكر بالشراء قريبًا", value: "planning_to_buy" },
      { label: "أبحث وأقارن فقط", value: "researching" },
    ],
  },
  {
    id: "hasDrivenEvOrHybrid",
    title: "قديش عندك خبرة بقيادة الكهربائي أو الهايبرد؟",
    subtitle: "نستخدمها حتى تكون الإجابات مناسبة لخبرتك، بدون افتراضات زائدة.",
    type: "single",
    options: [
      { label: "عندي تجربة واضحة", value: "yes" },
      { label: "ما جربت بعد", value: "no" },
      { label: "جربت تجربة قصيرة", value: "short_test" },
    ],
  },
  {
    id: "mainGoal",
    title: "شو بدك من VoltJo أولًا؟",
    subtitle: "اختر أقرب هدف الآن؛ تقدر تغيره لاحقًا من ملفك.",
    type: "single",
    options: [
      { label: "أختار سيارة مناسبة", value: "buying" },
      { label: "أقارن بين موديلات", value: "compare_models" },
      { label: "أحسب تكلفة الشحن والتشغيل", value: "charging_cost" },
      { label: "أفهم الضمان والدعم وقطع الغيار", value: "support_warranty" },
      { label: "أتعلم قبل ما أقرر", value: "learning" },
    ],
  },
  {
    id: "drivingPattern",
    title: "مشاويرك غالبًا كيف؟",
    subtitle: "نمط القيادة يغير معنى المدى، الشحن، وتكلفة التشغيل.",
    type: "single",
    options: [
      { label: "داخل المدينة أغلب الوقت", value: "city" },
      { label: "بين المحافظات بشكل متكرر", value: "intercity" },
      { label: "مختلط بين مدينة وسفر", value: "mixed" },
      { label: "لسه مش متأكد", value: "not_sure" },
    ],
  },
  {
    id: "homeChargingAccess",
    title: "هل الشحن المنزلي خيار واقعي عندك؟",
    subtitle: "هذا من أهم العوامل عند تقييم EV أو PHEV داخل الأردن.",
    type: "single",
    options: [
      { label: "نعم، متاح عندي", value: "yes" },
      { label: "لا، أعتمد على حلول خارجية", value: "no" },
      { label: "ممكن أجهزه لاحقًا", value: "maybe_later" },
      { label: "مش متأكد من الإمكانية", value: "not_sure" },
    ],
  },
  {
    id: "priorities",
    title: "شو أهم عوامل قرارك؟",
    type: "multi",
    helperText: "اختر عاملًا واحدًا أو أكثر حتى نبني ملفًا أذكى لاحتياجك.",
    options: [
      { label: "أقل تكلفة تشغيل", value: "lowest_running_cost" },
      { label: "مدى أطول وقلق شحن أقل", value: "longer_range" },
      { label: "اعتمادية وراحة يومية", value: "reliability_comfort" },
      { label: "سعر شراء مناسب", value: "affordable_purchase_price" },
      { label: "ضمان ودعم وقطع غيار أوضح", value: "better_warranty_support" },
    ],
  },
];
