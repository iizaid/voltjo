"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { onboardingQuestions } from "@/lib/onboarding/questions";
import type { CustomerProfileDraft, OnboardingQuestionId } from "@/lib/onboarding/types";
import type { Database } from "@/lib/supabase/database.types";

type AuthActionState = {
  ok: boolean;
  message: string;
  emailConfirmationRequired?: boolean;
  needsOnboarding?: boolean;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const allowedValuesByQuestion = onboardingQuestions.reduce<
  Record<OnboardingQuestionId, Set<string>>
>((acc, question) => {
  acc[question.id] = new Set(question.options.map((option) => option.value));
  return acc;
}, {} as Record<OnboardingQuestionId, Set<string>>);

function cleanText(value: FormDataEntryValue | null, maxLength: number) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function safeAuthErrorMessage() {
  return "تعذر إكمال العملية. تأكد من البيانات وحاول مرة أخرى.";
}

function validateProfileDraft(input: unknown): {
  ok: true;
  draft: CustomerProfileDraft;
} | {
  ok: false;
  message: string;
} {
  if (!input || typeof input !== "object") {
    return { ok: false, message: "أكمل أسئلة الملف الذكي قبل المتابعة." };
  }

  const source = input as Record<string, unknown>;
  const draft: CustomerProfileDraft = {};

  for (const question of onboardingQuestions) {
    const value = source[question.id];
    const allowed = allowedValuesByQuestion[question.id];

    if (question.type === "multi") {
      if (!Array.isArray(value)) {
        return { ok: false, message: "إجابات الملف الذكي غير مكتملة أو غير صحيحة." };
      }
      const safeValues = value
        .filter((item): item is string => typeof item === "string")
        .filter((item) => allowed.has(item));

      if (safeValues.length !== value.length || safeValues.length > 8) {
        return { ok: false, message: "إحدى قيم الملف الذكي غير مسموحة." };
      }

      draft[question.id] = safeValues as never;
      continue;
    }

    if (typeof value !== "string" || !allowed.has(value)) {
      if (question.id === "city" && source.country !== "jordan") {
        continue;
      }
      if (
        question.id === "hasDrivenEvOrHybrid" &&
        (source.ownershipStatus === "owns_ev" ||
          source.ownershipStatus === "owns_hybrid")
      ) {
        draft.hasDrivenEvOrHybrid = "yes";
        continue;
      }

      return { ok: false, message: "إحدى إجابات الملف الذكي غير مسموحة." };
    }

    draft[question.id] = value as never;
  }

  if (draft.country !== "jordan") {
    delete draft.city;
  }

  if (
    draft.ownershipStatus === "owns_ev" ||
    draft.ownershipStatus === "owns_hybrid"
  ) {
    draft.hasDrivenEvOrHybrid = "yes";
  }

  return { ok: true, draft };
}

function parseProfileDraftFromForm(formData: FormData) {
  const rawAnswers = cleanText(formData.get("onboardingAnswers"), 5000);
  if (!rawAnswers) {
    return { ok: false as const, message: "أكمل أسئلة الملف الذكي قبل المتابعة." };
  }

  try {
    return validateProfileDraft(JSON.parse(rawAnswers));
  } catch {
    return { ok: false as const, message: "تعذر قراءة إجابات الملف الذكي." };
  }
}

function profileInsertFromDraft({
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

async function upsertCurrentUserProfile({
  fullName,
  draft,
}: {
  fullName?: string;
  draft: CustomerProfileDraft;
}) {
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "إعدادات Supabase غير مكتملة." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "يجب تسجيل الدخول قبل حفظ الملف." };
  }

  const profile = profileInsertFromDraft({
    userId: user.id,
    fullName,
    draft,
  });

  const { error } = await supabase.from("profiles").upsert(profile, {
    onConflict: "id",
  });

  if (error) {
    return { ok: false, message: "تم تسجيل الدخول، لكن تعذر حفظ ملفك الآن." };
  }

  return { ok: true, message: "تم حفظ ملفك بنجاح." };
}

export async function signUpAction(formData: FormData): Promise<AuthActionState> {
  const name = cleanText(formData.get("name"), 80);
  const email = cleanText(formData.get("email"), 254).toLowerCase();
  const password = cleanText(formData.get("password"), 128);
  const draftResult = parseProfileDraftFromForm(formData);

  if (name.length < 2 || name.length > 80) {
    return { ok: false, message: "اكتب اسمًا صحيحًا بين 2 و80 حرفًا." };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, message: "أدخل بريدًا إلكترونيًا صحيحًا." };
  }

  if (password.length < 8) {
    return { ok: false, message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل." };
  }

  if (!draftResult.ok) {
    return draftResult;
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "إعدادات Supabase غير مكتملة." };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
      },
    },
  });

  if (error || !data.user) {
    return { ok: false, message: safeAuthErrorMessage() };
  }

  if (!data.session) {
    return {
      ok: true,
      emailConfirmationRequired: true,
      message:
        "تم إنشاء الحساب. يرجى تأكيد بريدك الإلكتروني، ثم تسجيل الدخول لحفظ ملفك الذكي.",
    };
  }

  const profileResult = await upsertCurrentUserProfile({
    fullName: name,
    draft: draftResult.draft,
  });

  if (!profileResult.ok) {
    return { ok: false, message: profileResult.message };
  }

  return { ok: true, message: "تم إنشاء الحساب وحفظ ملفك الذكي." };
}

export async function signInAction(formData: FormData): Promise<AuthActionState> {
  const email = cleanText(formData.get("email"), 254).toLowerCase();
  const password = cleanText(formData.get("password"), 128);
  const draftResult = parseProfileDraftFromForm(formData);

  if (!EMAIL_REGEX.test(email)) {
    return { ok: false, message: "أدخل بريدًا إلكترونيًا صحيحًا." };
  }

  if (!password) {
    return { ok: false, message: "أدخل كلمة المرور." };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "إعدادات Supabase غير مكتملة." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, message: "بيانات الدخول غير صحيحة أو الحساب غير مؤكد." };
  }

  if (draftResult.ok) {
    const profileResult = await upsertCurrentUserProfile({
      draft: draftResult.draft,
    });
    if (!profileResult.ok) {
      return { ok: false, message: profileResult.message };
    }

    return { ok: true, message: "تم تسجيل الدخول وحفظ ملفك الذكي." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, message: "تعذر التحقق من الجلسة الحالية." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id,onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed) {
    return {
      ok: false,
      needsOnboarding: true,
      message: "أكمل أسئلة البداية حتى نجهّز ملفك الذكي.",
    };
  }

  return { ok: true, message: "تم تسجيل الدخول." };
}

export async function saveOnboardingProfileAction(
  payload: CustomerProfileDraft,
): Promise<AuthActionState> {
  const draftResult = validateProfileDraft(payload);
  if (!draftResult.ok) return draftResult;
  return upsertCurrentUserProfile({ draft: draftResult.draft });
}

export async function signOutAction() {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/");
}
