import type { OnboardingQuestion } from "@/lib/onboarding/types";

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "ageRange",
    title: "كم عمرك؟",
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
    title: "من أي بلد تستخدم VoltJo؟",
    type: "single",
    options: [
      { label: "الأردن", value: "jordan" },
      { label: "دولة أخرى", value: "other" },
    ],
  },
  {
    id: "city",
    title: "في أي مدينة داخل الأردن؟",
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
    title: "هل تمتلك سيارة كهربائية أو هايبرد؟",
    type: "single",
    options: [
      { label: "نعم، كهربائية", value: "owns_ev" },
      { label: "نعم، هايبرد", value: "owns_hybrid" },
      { label: "لا، أفكر أشتري", value: "planning_to_buy" },
      { label: "لا، فقط أبحث", value: "researching" },
    ],
  },
  {
    id: "hasDrivenEvOrHybrid",
    title: "هل سبق وجربت قيادة سيارة كهربائية أو هايبرد؟",
    type: "single",
    options: [
      { label: "نعم", value: "yes" },
      { label: "لا", value: "no" },
      { label: "جرّبت مرة قصيرة", value: "short_test" },
    ],
  },
  {
    id: "mainGoal",
    title: "ما هدفك الرئيسي الآن؟",
    type: "single",
    options: [
      { label: "أريد شراء سيارة", value: "buying" },
      { label: "أريد مقارنة موديلات", value: "compare_models" },
      { label: "أريد حساب تكلفة الشحن", value: "charging_cost" },
      { label: "أريد فهم الدعم والضمان", value: "support_warranty" },
      { label: "أريد التعلم فقط", value: "learning" },
    ],
  },
  {
    id: "drivingPattern",
    title: "استخدامك اليومي غالبًا يكون كيف؟",
    type: "single",
    options: [
      { label: "داخل المدينة", value: "city" },
      { label: "سفر بين المحافظات", value: "intercity" },
      { label: "مختلط", value: "mixed" },
      { label: "غير متأكد", value: "not_sure" },
    ],
  },
  {
    id: "homeChargingAccess",
    title: "هل عندك إمكانية شحن منزلي؟",
    type: "single",
    options: [
      { label: "نعم", value: "yes" },
      { label: "لا", value: "no" },
      { label: "ممكن لاحقًا", value: "maybe_later" },
      { label: "لا أعرف", value: "not_sure" },
    ],
  },
  {
    id: "priorities",
    title: "ما أكثر شيء يهمك؟",
    type: "multi",
    helperText: "يمكنك اختيار أكثر من إجابة.",
    options: [
      { label: "أقل تكلفة تشغيل", value: "lowest_running_cost" },
      { label: "مدى أطول", value: "longer_range" },
      { label: "راحة واعتمادية", value: "reliability_comfort" },
      { label: "سعر شراء مناسب", value: "affordable_purchase_price" },
      { label: "ضمان ودعم أفضل", value: "better_warranty_support" },
    ],
  },
];
