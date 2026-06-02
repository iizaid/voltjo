"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  allowedCountryValues,
  allowedJordanCityValues,
  DEFAULT_PRIVACY_SETTINGS,
} from "@/lib/account/settings";
import { createClient } from "@/lib/supabase/server";
import type { CustomerProfileDraft } from "@/lib/onboarding/types";
import {
  profileInsertFromDraft,
  validateFullName,
  validateProfileDraft,
} from "@/lib/auth/profile-validation";
import {
  checkAuthRateLimit,
  clearAuthRateLimit,
} from "@/lib/security/rate-limit";
import { checkRateLimit } from "@/lib/server/rate-limit";

type AuthActionState = {
  ok: boolean;
  message: string;
  emailConfirmationRequired?: boolean;
  needsOnboarding?: boolean;
};

type AccountActionState = {
  ok: boolean;
  message: string;
};

type ParsedDraftResult =
  | {
      ok: true;
      hasDraft: true;
      draft: CustomerProfileDraft;
    }
  | {
      ok: true;
      hasDraft: false;
    }
  | {
      ok: false;
      message: string;
    };

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 254;
const MAX_PASSWORD_LENGTH = 128;
const MAX_ONBOARDING_PAYLOAD_LENGTH = 6000;

function safeAuthErrorMessage() {
  return "تعذر إكمال العملية. تأكد من البيانات وحاول مرة أخرى.";
}

function getFormString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function getFormBoolean(formData: FormData, key: string) {
  return formData.get(key) === "on";
}

function getRequestOrigin(headerStore: Headers) {
  const explicitOrigin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (
    explicitOrigin &&
    (explicitOrigin.startsWith("http://") || explicitOrigin.startsWith("https://"))
  ) {
    return explicitOrigin.replace(/\/$/, "");
  }

  const forwardedProto = headerStore.get("x-forwarded-proto");
  const forwardedHost = headerStore.get("x-forwarded-host");
  const host = forwardedHost || headerStore.get("host");
  const protocol = forwardedProto || "http";

  if (!host) return null;
  return `${protocol}://${host}`;
}

function validateEmail(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return { ok: false as const, message: "أدخل بريدًا إلكترونيًا صحيحًا." };
  }

  const email = value.trim().toLowerCase();

  if (
    email.length === 0 ||
    email.length > MAX_EMAIL_LENGTH ||
    !EMAIL_REGEX.test(email)
  ) {
    return { ok: false as const, message: "أدخل بريدًا إلكترونيًا صحيحًا." };
  }

  return { ok: true as const, email };
}

function validatePassword(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return { ok: false as const, message: "أدخل كلمة المرور." };
  }

  if (value.length < 8 || value.length > MAX_PASSWORD_LENGTH) {
    return {
      ok: false as const,
      message: "كلمة المرور يجب أن تكون بين 8 و128 حرفًا.",
    };
  }

  return { ok: true as const, password: value };
}

function parseProfileDraftFromForm(
  formData: FormData,
  { required }: { required: boolean },
): ParsedDraftResult {
  const rawAnswers = getFormString(formData, "onboardingAnswers");

  if (!rawAnswers) {
    if (!required) return { ok: true, hasDraft: false };
    return { ok: false, message: "أكمل أسئلة الملف الذكي قبل المتابعة." };
  }

  if (rawAnswers.length > MAX_ONBOARDING_PAYLOAD_LENGTH) {
    return { ok: false, message: "بيانات الملف الذكي أكبر من المسموح." };
  }

  try {
    const result = validateProfileDraft(JSON.parse(rawAnswers));
    if (!result.ok) return result;
    return { ok: true, hasDraft: true, draft: result.draft };
  } catch {
    return { ok: false, message: "تعذر قراءة إجابات الملف الذكي." };
  }
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
    return { ok: false, message: "الخدمة غير جاهزة حاليًا. حاول لاحقًا." };
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
  const nameResult = validateFullName(getFormString(formData, "name"));
  const emailResult = validateEmail(formData.get("email"));
  const passwordResult = validatePassword(formData.get("password"));
  const draftResult = parseProfileDraftFromForm(formData, { required: true });

  if (!nameResult.ok) return nameResult;
  if (!emailResult.ok) return emailResult;
  if (!passwordResult.ok) return passwordResult;
  if (!draftResult.ok) return draftResult;
  if (!draftResult.hasDraft) {
    return { ok: false, message: "أكمل أسئلة الملف الذكي قبل المتابعة." };
  }

  const rateLimit = checkAuthRateLimit("signup", emailResult.email);
  if (!rateLimit.ok) {
    return { ok: false, message: rateLimit.message };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "الخدمة غير جاهزة حاليًا. حاول لاحقًا." };
  }

  const { data, error } = await supabase.auth.signUp({
    email: emailResult.email,
    password: passwordResult.password,
    options: {
      data: {
        full_name: nameResult.name,
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
    fullName: nameResult.name,
    draft: draftResult.draft,
  });

  if (!profileResult.ok) {
    return { ok: false, message: profileResult.message };
  }

  return { ok: true, message: "تم إنشاء الحساب وحفظ ملفك الذكي." };
}

export async function signInAction(formData: FormData): Promise<AuthActionState> {
  const emailResult = validateEmail(formData.get("email"));
  const passwordResult = validatePassword(formData.get("password"));
  const draftResult = parseProfileDraftFromForm(formData, { required: false });

  if (!emailResult.ok) return emailResult;
  if (!passwordResult.ok) return passwordResult;
  if (!draftResult.ok) return draftResult;

  const rateLimit = checkAuthRateLimit("login", emailResult.email);
  if (!rateLimit.ok) {
    return { ok: false, message: rateLimit.message };
  }

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "الخدمة غير جاهزة حاليًا. حاول لاحقًا." };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: emailResult.email,
    password: passwordResult.password,
  });

  if (error) {
    return { ok: false, message: "بيانات الدخول غير صحيحة أو الحساب غير مؤكد." };
  }

  clearAuthRateLimit("login", emailResult.email);

  if (draftResult.hasDraft) {
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

export async function updateAccountProfileAction(formData: FormData) {
  const nameResult = validateFullName(getFormString(formData, "fullName"));
  if (!nameResult.ok) {
    redirect("/account?section=account&status=invalid-name");
  }

  const country = getFormString(formData, "country");
  const city = getFormString(formData, "city");

  if (!allowedCountryValues.has(country as "jordan" | "other")) {
    redirect("/account?section=account&status=invalid-location");
  }

  if (
    country === "jordan" &&
    !allowedJordanCityValues.has(
      city as "amman" | "irbid" | "zarqa" | "aqaba" | "other",
    )
  ) {
    redirect("/account?section=account&status=invalid-location");
  }

  const supabase = await createClient();
  if (!supabase) {
    redirect("/account?section=account&status=unavailable");
  }
  const supabaseClient = supabase;

  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    redirect("/start");
  }
  const currentUser = user;

  const { error } = await supabaseClient
    .from("profiles")
    .update({
      full_name: nameResult.name,
      country,
      city: country === "jordan" ? city : null,
    })
    .eq("id", currentUser.id);

  if (error) {
    redirect("/account?section=account&status=failed");
  }

  revalidatePath("/account");
  redirect("/account?section=account&status=saved");
}

export async function sendPasswordResetLinkAction(
  prevState: AccountActionState,
): Promise<AccountActionState> {
  void prevState;
  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "الخدمة غير جاهزة حاليًا. حاول لاحقًا." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.email) {
    return { ok: false, message: "يجب تسجيل الدخول قبل إرسال رابط التغيير." };
  }

  const rateLimit = checkRateLimit({
    key: user.id,
    action: "password-reset",
    limit: 3,
    windowMs: 15 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return { ok: false, message: "محاولات كثيرة. حاول مرة أخرى بعد قليل." };
  }

  const headerStore = await headers();
  const origin = getRequestOrigin(headerStore);

  const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
    ...(origin ? { redirectTo: `${origin}/auth/update-password` } : {}),
  });

  if (error) {
    return { ok: false, message: "تعذر إرسال الرابط الآن. حاول مرة أخرى." };
  }

  return {
    ok: true,
    message: "أرسلنا رابط تغيير كلمة المرور إلى بريدك الإلكتروني.",
  };
}

export async function savePrivacySettingsAction(
  prevState: AccountActionState,
  formData: FormData,
): Promise<AccountActionState> {
  void prevState;
  // These settings are persisted now so product surfaces can enforce them incrementally.
  const privacySettings = {
    allowSmartProfileRecommendations: getFormBoolean(
      formData,
      "allowSmartProfileRecommendations",
    ),
    showDataInAssistant: getFormBoolean(formData, "showDataInAssistant"),
    receiveImportantAccountEmails: getFormBoolean(
      formData,
      "receiveImportantAccountEmails",
    ),
  };

  const supabase = await createClient();
  if (!supabase) {
    return { ok: false, message: "الخدمة غير جاهزة حاليًا. حاول لاحقًا." };
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "يجب تسجيل الدخول قبل حفظ إعدادات الخصوصية." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      privacy_settings: {
        ...DEFAULT_PRIVACY_SETTINGS,
        ...privacySettings,
      },
    })
    .eq("id", user.id);

  if (error) {
    return { ok: false, message: "تعذر حفظ إعدادات الخصوصية الآن." };
  }

  revalidatePath("/account");
  return { ok: true, message: "تم حفظ إعدادات الخصوصية بنجاح." };
}
