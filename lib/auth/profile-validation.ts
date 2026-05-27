import { onboardingQuestions } from "@/lib/onboarding/questions";
import type { CustomerProfileDraft, OnboardingQuestionId } from "@/lib/onboarding/types";
import type { Database } from "@/lib/supabase/database.types";

type ProfileValidationResult =
  | {
      ok: true;
      draft: CustomerProfileDraft;
    }
  | {
      ok: false;
      message: string;
    };

type SingleProfileQuestionId = Exclude<OnboardingQuestionId, "priorities">;

export const allowedValuesByQuestion = onboardingQuestions.reduce<
  Record<OnboardingQuestionId, Set<string>>
>((acc, question) => {
  acc[question.id] = new Set(question.options.map((option) => option.value));
  return acc;
}, {} as Record<OnboardingQuestionId, Set<string>>);

const OWNERSHIP_ASSUMES_DRIVEN = new Set(["owns_ev", "owns_hybrid"]);
const CONTROL_OR_INVISIBLE_RE = /[\p{C}\u200B-\u200F\u202A-\u202E\u2060-\u206F]/u;

function hasSuspiciousCharacters(value: string) {
  return CONTROL_OR_INVISIBLE_RE.test(value);
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

function invalidProfileMessage() {
  return "إحدى إجابات الملف الذكي غير مسموحة.";
}

function requireAllowedString({
  source,
  questionId,
}: {
  source: Record<string, unknown>;
  questionId: OnboardingQuestionId;
}) {
  const value = source[questionId];
  const allowed = allowedValuesByQuestion[questionId];

  if (
    typeof value !== "string" ||
    hasSuspiciousCharacters(value) ||
    !allowed.has(value)
  ) {
    return null;
  }

  return value;
}

export function validateFullName(value: unknown) {
  if (typeof value !== "string") {
    return { ok: false as const, message: "اكتب اسمًا صحيحًا بين 2 و80 حرفًا." };
  }

  const name = value.trim();

  if (
    name.length < 2 ||
    name.length > 80 ||
    hasSuspiciousCharacters(name)
  ) {
    return { ok: false as const, message: "اكتب اسمًا صحيحًا بين 2 و80 حرفًا." };
  }

  return { ok: true as const, name };
}

export function validateProfileDraft(input: unknown): ProfileValidationResult {
  if (!isRecord(input)) {
    return { ok: false, message: "أكمل أسئلة الملف الذكي قبل المتابعة." };
  }

  const country = requireAllowedString({ source: input, questionId: "country" });
  const ownershipStatus = requireAllowedString({
    source: input,
    questionId: "ownershipStatus",
  });

  if (!country || !ownershipStatus) {
    return { ok: false, message: invalidProfileMessage() };
  }

  const draft: CustomerProfileDraft = {
    country,
    ownershipStatus,
  };

  const singleQuestions: SingleProfileQuestionId[] = [
    "ageRange",
    "mainGoal",
    "drivingPattern",
    "homeChargingAccess",
  ];

  for (const questionId of singleQuestions) {
    const value = requireAllowedString({ source: input, questionId });
    if (!value) return { ok: false, message: invalidProfileMessage() };
    draft[questionId] = value;
  }

  if (country === "jordan") {
    const city = requireAllowedString({ source: input, questionId: "city" });
    if (!city) return { ok: false, message: invalidProfileMessage() };
    draft.city = city;
  } else if (
    input.city !== undefined &&
    input.city !== null &&
    input.city !== ""
  ) {
    return {
      ok: false,
      message: "اختر مدينة داخل الأردن فقط عندما يكون بلد الاستخدام هو الأردن.",
    };
  }

  if (OWNERSHIP_ASSUMES_DRIVEN.has(ownershipStatus)) {
    draft.hasDrivenEvOrHybrid = "yes";
  } else {
    const hasDriven = requireAllowedString({
      source: input,
      questionId: "hasDrivenEvOrHybrid",
    });
    if (!hasDriven) return { ok: false, message: invalidProfileMessage() };
    draft.hasDrivenEvOrHybrid = hasDriven;
  }

  const priorities = input.priorities;
  const priorityAllowedValues = allowedValuesByQuestion.priorities;
  const maxPriorityCount = priorityAllowedValues.size;

  if (!Array.isArray(priorities) || priorities.length === 0) {
    return { ok: false, message: "اختر أولوية واحدة على الأقل." };
  }

  if (priorities.length > maxPriorityCount) {
    return { ok: false, message: invalidProfileMessage() };
  }

  const normalizedPriorities: string[] = [];
  const seen = new Set<string>();

  for (const priority of priorities) {
    if (
      typeof priority !== "string" ||
      hasSuspiciousCharacters(priority) ||
      !priorityAllowedValues.has(priority)
    ) {
      return { ok: false, message: invalidProfileMessage() };
    }

    if (seen.has(priority)) {
      return { ok: false, message: "لا يمكن تكرار نفس الأولوية أكثر من مرة." };
    }

    seen.add(priority);
    normalizedPriorities.push(priority);
  }

  draft.priorities = normalizedPriorities;

  return { ok: true, draft };
}

export function normalizeProfileDraft(input: unknown): CustomerProfileDraft | null {
  const result = validateProfileDraft(input);
  return result.ok ? result.draft : null;
}

export function profileInsertFromDraft({
  userId,
  fullName,
  draft,
}: {
  userId: string;
  fullName?: string;
  draft: CustomerProfileDraft;
}): Database["public"]["Tables"]["profiles"]["Insert"] {
  return {
    id: userId,
    ...(fullName !== undefined ? { full_name: fullName || null } : {}),
    age_range: draft.ageRange ?? null,
    country: draft.country ?? null,
    city: draft.city ?? null,
    ownership_status: draft.ownershipStatus ?? null,
    has_driven_ev_or_hybrid: draft.hasDrivenEvOrHybrid ?? null,
    main_goal: draft.mainGoal ?? null,
    driving_pattern: draft.drivingPattern ?? null,
    home_charging_access: draft.homeChargingAccess ?? null,
    priorities: Array.isArray(draft.priorities) ? draft.priorities : [],
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
    profile_version: 1,
  };
}
