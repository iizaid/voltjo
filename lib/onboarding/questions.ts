import type { OnboardingQuestion } from "@/lib/onboarding/types";

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "ageRange",
    title: "ما الفئة العمرية الأقرب لك؟",
    subtitle: "يساعدنا ذلك على تبسيط الشرح وتقديم المعلومات بطريقة أنسب لك.",
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
    title: "أين ستستخدم VoltJo غالبًا؟",
    subtitle: "التركيز الحالي على الأردن، مع إتاحة التصفح من خارج الأردن.",
    type: "single",
    options: [
      { label: "داخل الأردن", value: "jordan" },
      { label: "خارج الأردن حاليًا", value: "other" },
    ],
  },
  {
    id: "city",
    title: "ما المدينة الأقرب لاستخدامك اليومي؟",
    subtitle: "لا نطلب عنوانك الدقيق؛ المدينة تساعدنا على فهم نمط القيادة والشحن.",
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
    title: "ما مرحلتك الحالية مع السيارات الكهربائية أو الهجينة؟",
    subtitle: "يساعدنا ذلك على تخصيص الإرشاد حسب كونك مالكًا حاليًا، مشتريًا محتملًا، أو في مرحلة البحث.",
    type: "single",
    options: [
      { label: "أمتلك سيارة كهربائية بالكامل", value: "owns_ev" },
      { label: "أمتلك سيارة هجينة", value: "owns_hybrid" },
      { label: "أفكر في الشراء قريبًا", value: "planning_to_buy" },
      { label: "أبحث وأقارن فقط", value: "researching" },
    ],
  },
  {
    id: "hasDrivenEvOrHybrid",
    title: "هل لديك تجربة سابقة مع السيارات الكهربائية أو الهجينة؟",
    subtitle: "يساعدنا ذلك على تقديم إجابات مناسبة لمستوى خبرتك دون افتراضات زائدة.",
    type: "single",
    options: [
      { label: "نعم، لدي تجربة واضحة", value: "yes" },
      { label: "لا، لم أجرب بعد", value: "no" },
      { label: "جربت تجربة قصيرة", value: "short_test" },
    ],
  },
  {
    id: "mainGoal",
    title: "ما هدفك الأساسي من استخدام VoltJo؟",
    subtitle: "اختر أقرب هدف الآن، ويمكنك تغييره لاحقًا من ملفك.",
    type: "single",
    options: [
      { label: "اختيار سيارة مناسبة", value: "buying" },
      { label: "مقارنة الموديلات", value: "compare_models" },
      { label: "حساب تكلفة الشحن والتشغيل", value: "charging_cost" },
      { label: "فهم الضمان والدعم وقطع الغيار", value: "support_warranty" },
      { label: "التعلم قبل اتخاذ القرار", value: "learning" },
    ],
  },
  {
    id: "drivingPattern",
    title: "ما طبيعة مشاويرك غالبًا؟",
    subtitle: "نمط القيادة يؤثر على المدى، الشحن، وتكلفة التشغيل.",
    type: "single",
    options: [
      { label: "داخل المدينة في أغلب الوقت", value: "city" },
      { label: "بين المحافظات بشكل متكرر", value: "intercity" },
      { label: "استخدام مختلط بين المدينة والسفر", value: "mixed" },
      { label: "لست متأكدًا بعد", value: "not_sure" },
    ],
  },
  {
    id: "homeChargingAccess",
    title: "هل الشحن المنزلي متاح أو ممكن لديك؟",
    subtitle: "الشحن المنزلي من أهم العوامل عند تقييم السيارات الكهربائية والهجينة القابلة للشحن داخل الأردن.",
    type: "single",
    options: [
      { label: "نعم، متاح لدي", value: "yes" },
      { label: "لا، سأعتمد على حلول خارجية", value: "no" },
      { label: "قد أجهزه لاحقًا", value: "maybe_later" },
      { label: "لست متأكدًا من الإمكانية", value: "not_sure" },
    ],
  },
  {
    id: "priorities",
    title: "ما أهم العوامل في قرارك؟",
    type: "multi",
    helperText: "يمكنك اختيار عامل واحد أو أكثر.",
    options: [
      { label: "أقل تكلفة تشغيل", value: "lowest_running_cost" },
      { label: "مدى أطول وقلق شحن أقل", value: "longer_range" },
      { label: "اعتمادية وراحة يومية", value: "reliability_comfort" },
      { label: "سعر شراء مناسب", value: "affordable_purchase_price" },
      { label: "ضمان ودعم وقطع غيار أوضح", value: "better_warranty_support" },
    ],
  },
];
