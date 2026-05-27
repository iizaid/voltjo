import { onboardingQuestions } from "@/lib/onboarding/questions";
import type { CurrentProfile } from "@/lib/auth/session";

export const UNKNOWN_LABEL = "غير محدد";

type CompletionItem = {
  key: string;
  label: string;
  complete: boolean;
};

export function getOptionLabel(questionId: string, value: string | null | undefined) {
  if (!value) return UNKNOWN_LABEL;

  const question = onboardingQuestions.find((item) => item.id === questionId);
  return question?.options.find((option) => option.value === value)?.label ?? value;
}

export function getPriorityLabels(values: string[] | null | undefined) {
  const question = onboardingQuestions.find((item) => item.id === "priorities");
  const priorities = Array.isArray(values) ? values : [];

  return priorities.map(
    (value) =>
      question?.options.find((option) => option.value === value)?.label ?? value,
  );
}

export function getUserInitial(label: string | null | undefined) {
  const value = label?.trim();
  return value ? value.charAt(0).toUpperCase() : "V";
}

export function calculateProfileCompletion(profile: CurrentProfile | null) {
  const items: CompletionItem[] = [
    {
      key: "full_name",
      label: "الاسم",
      complete: Boolean(profile?.full_name),
    },
    {
      key: "location",
      label: "البلد أو المدينة",
      complete: Boolean(profile?.country || profile?.city),
    },
    {
      key: "main_goal",
      label: "الهدف الرئيسي",
      complete: Boolean(profile?.main_goal),
    },
    {
      key: "driving_pattern",
      label: "نمط القيادة",
      complete: Boolean(profile?.driving_pattern),
    },
    {
      key: "home_charging_access",
      label: "إمكانية الشحن المنزلي",
      complete: Boolean(profile?.home_charging_access),
    },
    {
      key: "ownership_status",
      label: "حالة امتلاك السيارة",
      complete: Boolean(profile?.ownership_status),
    },
    {
      key: "priorities",
      label: "الأولويات",
      complete: Boolean(profile?.priorities?.length),
    },
  ];

  const completedCount = items.filter((item) => item.complete).length;
  const percentage = Math.round((completedCount / items.length) * 100);

  return {
    percentage,
    completedCount,
    totalCount: items.length,
    missing: items.filter((item) => !item.complete),
    statusText:
      percentage >= 100
        ? "ملفك جاهز للتخصيص الكامل داخل VoltJo."
        : "أكمل البيانات الناقصة لتحسين تخصيص التجربة.",
  };
}
