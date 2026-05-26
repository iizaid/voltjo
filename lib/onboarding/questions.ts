import type { OnboardingQuestion } from "@/lib/onboarding/types";

export const onboardingQuestions: OnboardingQuestion[] = [
  {
    id: "ageRange",
    title: "كم عمرك؟",
    type: "single",
    options: [
      { label: "أقل من 18", value: "أقل من 18" },
      { label: "18–24", value: "18–24" },
      { label: "25–34", value: "25–34" },
      { label: "35–44", value: "35–44" },
      { label: "45+", value: "45+" },
    ],
  },
  {
    id: "country",
    title: "من أي بلد تستخدم VoltJo؟",
    type: "single",
    options: [
      { label: "الأردن", value: "الأردن" },
      { label: "دولة أخرى", value: "دولة أخرى" },
    ],
  },
  {
    id: "city",
    title: "في أي مدينة داخل الأردن؟",
    type: "single",
    options: [
      { label: "عمّان", value: "عمّان" },
      { label: "إربد", value: "إربد" },
      { label: "الزرقاء", value: "الزرقاء" },
      { label: "العقبة", value: "العقبة" },
      { label: "أخرى", value: "أخرى" },
    ],
  },
  {
    id: "ownershipStatus",
    title: "هل تمتلك سيارة كهربائية أو هايبرد؟",
    type: "single",
    options: [
      { label: "نعم، كهربائية", value: "نعم، كهربائية" },
      { label: "نعم، هايبرد", value: "نعم، هايبرد" },
      { label: "لا، أفكر أشتري", value: "لا، أفكر أشتري" },
      { label: "لا، فقط أبحث", value: "لا، فقط أبحث" },
    ],
  },
  {
    id: "hasDrivenEvOrHybrid",
    title: "هل سبق وجربت قيادة سيارة كهربائية أو هايبرد؟",
    type: "single",
    options: [
      { label: "نعم", value: "نعم" },
      { label: "لا", value: "لا" },
      { label: "جرّبت مرة قصيرة", value: "جرّبت مرة قصيرة" },
    ],
  },
  {
    id: "mainGoal",
    title: "ما هدفك الرئيسي الآن؟",
    type: "single",
    options: [
      { label: "أريد شراء سيارة", value: "أريد شراء سيارة" },
      { label: "أريد مقارنة موديلات", value: "أريد مقارنة موديلات" },
      { label: "أريد حساب تكلفة الشحن", value: "أريد حساب تكلفة الشحن" },
      { label: "أريد فهم الدعم والضمان", value: "أريد فهم الدعم والضمان" },
      { label: "أريد التعلم فقط", value: "أريد التعلم فقط" },
    ],
  },
  {
    id: "drivingPattern",
    title: "استخدامك اليومي غالبًا يكون كيف؟",
    type: "single",
    options: [
      { label: "داخل المدينة", value: "داخل المدينة" },
      { label: "سفر بين المحافظات", value: "سفر بين المحافظات" },
      { label: "مختلط", value: "مختلط" },
      { label: "غير متأكد", value: "غير متأكد" },
    ],
  },
  {
    id: "homeChargingAccess",
    title: "هل عندك إمكانية شحن منزلي؟",
    type: "single",
    options: [
      { label: "نعم", value: "نعم" },
      { label: "لا", value: "لا" },
      { label: "ممكن لاحقًا", value: "ممكن لاحقًا" },
      { label: "لا أعرف", value: "لا أعرف" },
    ],
  },
  {
    id: "priorities",
    title: "ما أكثر شيء يهمك؟",
    type: "multi",
    helperText: "يمكنك اختيار أكثر من إجابة.",
    options: [
      { label: "أقل تكلفة تشغيل", value: "أقل تكلفة تشغيل" },
      { label: "مدى أطول", value: "مدى أطول" },
      { label: "راحة واعتمادية", value: "راحة واعتمادية" },
      { label: "سعر شراء مناسب", value: "سعر شراء مناسب" },
      { label: "ضمان ودعم أفضل", value: "ضمان ودعم أفضل" },
    ],
  },
];
