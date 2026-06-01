"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import Folder from "@/components/Folder";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import { signInAction, signUpAction } from "@/lib/auth/actions";
import { signInWithOAuth, type OAuthProvider } from "@/lib/auth/oauth-client";
import { onboardingQuestions } from "@/lib/onboarding/questions";
import { clearOnboardingDraft, saveOnboardingDraft } from "@/lib/onboarding/storage";
import type { CustomerProfileDraft } from "@/lib/onboarding/types";

type AuthMode = "signup" | "login";

function getAnswerLabel(questionId: keyof CustomerProfileDraft, value: string) {
  const question = onboardingQuestions.find((item) => item.id === questionId);
  return question?.options.find((option) => option.value === value)?.label ?? value;
}

function getProfileHighlights(answers: CustomerProfileDraft) {
  const highlights = [
    answers.mainGoal ? getAnswerLabel("mainGoal", answers.mainGoal) : undefined,
    answers.drivingPattern
      ? getAnswerLabel("drivingPattern", answers.drivingPattern)
      : undefined,
    Array.isArray(answers.priorities) && answers.priorities[0]
      ? getAnswerLabel("priorities", answers.priorities[0])
      : undefined,
  ];

  return highlights.filter(Boolean) as string[];
}

export function OnboardingAuthPanel({
  answers,
  notice,
  onBack,
}: {
  answers: CustomerProfileDraft;
  notice?: string | null;
  onBack: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(notice || null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] =
    useState(false);
  const highlights = useMemo(() => getProfileHighlights(answers), [answers]);
  const serializedAnswers = useMemo(() => JSON.stringify(answers), [answers]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setAuthMessage(null);
    setAuthError(null);
    setEmailConfirmationRequired(false);

    const formData = new FormData(event.currentTarget);
    const result =
      mode === "signup"
        ? await signUpAction(formData)
        : await signInAction(formData);

    if (!result.ok) {
      setAuthError(
        result.needsOnboarding
          ? "أكمل أسئلة البداية حتى نجهّز ملفك الذكي قبل الدخول."
          : result.message,
      );
      setIsSubmitting(false);
      return;
    }

    if (result.emailConfirmationRequired) {
      saveOnboardingDraft(answers);
      setAuthMessage(result.message);
      setEmailConfirmationRequired(true);
      setIsSubmitting(false);
      return;
    }

    clearOnboardingDraft();
    setAuthMessage(result.message);
    setIsSubmitting(false);
    router.push("/assistant");
    router.refresh();
  };

  const handleCancel = () => {
    clearOnboardingDraft();
    router.push("/");
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setAuthError(null);
    setAuthMessage(null);
    setEmailConfirmationRequired(false);

    saveOnboardingDraft(answers);

    try {
      await signInWithOAuth(provider);
    } catch {
      setAuthError("تعذر بدء تسجيل الدخول. حاول مرة أخرى.");
      setIsSubmitting(false);
    }
  };

  return (
    <motion.section
      className="flex min-h-dvh items-center justify-center px-4 py-8 sm:px-6"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.26, ease: "easeOut" }}
      dir="rtl"
    >
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-[rgba(13,13,13,0.08)] bg-white/88 shadow-[0_28px_90px_rgba(13,13,13,0.09)] backdrop-blur-md lg:grid-cols-[0.95fr_1.05fr]">
        <div className="flex flex-col items-center border-b border-[rgba(13,13,13,0.07)] p-6 text-center sm:p-8 lg:border-b-0 lg:border-l">
          <div className="flex justify-center">
            <VoltJoLogo />
          </div>
          <h1 className="mt-12 text-3xl font-bold leading-tight text-[var(--voltjo-black)] sm:text-5xl">
            أنشئ حسابك واحفظ ملفك الذكي
          </h1>
          <p className="mt-5 max-w-lg text-base font-medium leading-8 text-[var(--voltjo-muted)]">
            سنستخدم إجاباتك لتخصيص تجربة المساعد، المقارنات، وتقديرات التكلفة
            داخل VoltJo.
          </p>

          <motion.div
            className="mt-8 flex w-full max-w-[360px] flex-col items-center rounded-3xl border border-[rgba(13,13,13,0.06)] bg-white p-8 shadow-sm"
            whileHover={{ y: -3 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <Folder color="#ff6a00" size={0.8} className="mb-8 mt-2" />
            
            <h3 className="text-[22px] font-bold text-[var(--voltjo-black)]">
              ملفك الشخصي جاهز
            </h3>
            
            <p className="mt-3 text-center text-[15px] font-medium leading-[1.6] text-[#6F6673]">
              تم تجهيز تفضيلاتك لتخصيص تجربة المساعد والمقارنات.
            </p>
            
            <div className="mt-6 flex flex-wrap justify-center gap-2.5">
              {(highlights.length ? highlights : ["تجربة مخصصة"]).map(
                (highlight) => (
                  <span
                    key={highlight}
                    className="rounded-full border border-[#FFD5C0] bg-white px-4 py-1.5 text-[14px] font-bold text-[var(--voltjo-black)] transition-colors hover:bg-[#FFF5EF]"
                  >
                    {highlight}
                  </span>
                ),
              )}
            </div>
          </motion.div>
        </div>

        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-2 rounded-full bg-[#F3F3F1] p-1">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`h-10 rounded-full text-sm font-bold transition ${
                mode === "signup"
                  ? "bg-white text-[var(--voltjo-black)] shadow-sm"
                  : "text-[var(--voltjo-muted)]"
              }`}
            >
              إنشاء حساب
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`h-10 rounded-full text-sm font-bold transition ${
                mode === "login"
                  ? "bg-white text-[var(--voltjo-black)] shadow-sm"
                  : "text-[var(--voltjo-muted)]"
              }`}
            >
              تسجيل الدخول
            </button>
          </div>

          <div className="mt-7 grid gap-4">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-[14px] border border-[var(--voltjo-border)] bg-white text-sm font-bold text-[var(--voltjo-black)] shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--voltjo-orange)] focus:ring-offset-2 disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              المتابعة باستخدام Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-[14px] border border-[var(--voltjo-border)] bg-white text-sm font-bold text-[var(--voltjo-black)] shadow-sm transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--voltjo-orange)] focus:ring-offset-2 disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              المتابعة باستخدام GitHub
            </button>
            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[rgba(13,13,13,0.08)]"></div>
              <span className="flex-shrink-0 px-4 text-xs font-semibold text-[var(--voltjo-muted)]">
                أو استخدم البريد الإلكتروني
              </span>
              <div className="flex-grow border-t border-[rgba(13,13,13,0.08)]"></div>
            </div>
          </div>

          <form className="mt-2 grid gap-4" onSubmit={handleSubmit}>
            <input
              type="hidden"
              name="onboardingAnswers"
              value={serializedAnswers}
            />
            <p className="rounded-[16px] border border-[rgba(255,106,0,0.18)] bg-[rgba(255,106,0,0.055)] px-4 py-3 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
              سيتم إنشاء حساب VoltJo وحفظ تفضيلاتك في ملفك الذكي. لا يتم حفظ كلمة المرور داخل VoltJo.
            </p>
            {authError ? (
              <p
                role="alert"
                className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-7 text-red-700"
              >
                {authError}
              </p>
            ) : null}
            {authMessage ? (
              emailConfirmationRequired ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-[18px] border border-emerald-200 bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(240,253,250,0.92))] px-4 py-4 text-right shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={20} strokeWidth={2.2} />
                    </span>
                    <div className="space-y-2">
                      <p className="text-sm font-extrabold leading-7 text-emerald-900">
                        تم إنشاء حسابك بنجاح. أرسلنا رابط التأكيد إلى بريدك
                        الإلكتروني. افتح الرابط لتفعيل حسابك، ثم عد إلى VoltJo
                        لتسجيل الدخول.
                      </p>
                      <p className="text-sm font-semibold leading-7 text-emerald-800/90">
                        قد يستغرق وصول الرسالة دقيقة، وتحقق من مجلد الرسائل غير
                        المرغوب فيها أو العروض الترويجية.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p
                  role="status"
                  aria-live="polite"
                  className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-7 text-emerald-800"
                >
                  {authMessage}
                </p>
              )
            ) : null}
            {mode === "signup" ? (
              <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
                الاسم
                <input
                  required
                  name="name"
                  autoComplete="name"
                  className="h-12 rounded-[14px] border border-[rgba(13,13,13,0.1)] bg-white px-4 text-base font-medium outline-none transition focus:border-[rgba(255,106,0,0.46)]"
                />
              </label>
            ) : null}
            <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
              البريد الإلكتروني
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                className="h-12 rounded-[14px] border border-[rgba(13,13,13,0.1)] bg-white px-4 text-base font-medium outline-none transition focus:border-[rgba(255,106,0,0.46)]"
              />
            </label>
            <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
              كلمة المرور
              <input
                required
                name="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="h-12 rounded-[14px] border border-[rgba(13,13,13,0.1)] bg-white px-4 text-base font-medium outline-none transition focus:border-[rgba(255,106,0,0.46)]"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 h-12 rounded-full bg-[var(--voltjo-black)] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-wait disabled:bg-[#C9C4BA]"
            >
              {isSubmitting
                ? "جاري التجهيز..."
                : mode === "signup"
                  ? "إنشاء الحساب"
                  : "تسجيل الدخول"}
            </button>
            <button
              type="button"
              onClick={onBack}
              className="h-11 rounded-full text-sm font-bold text-[var(--voltjo-muted)] transition hover:bg-[#F6F6F4] hover:text-[var(--voltjo-black)]"
            >
              رجوع للأسئلة
            </button>
            <button
              type="button"
              onClick={handleCancel}
              className="h-11 rounded-full border border-[rgba(13,13,13,0.1)] bg-white text-sm font-bold text-[var(--voltjo-black)] transition hover:border-[rgba(13,13,13,0.18)] hover:bg-[#FAFAFA]"
            >
              إلغاء والعودة للرئيسية
            </button>
          </form>
        </div>
      </div>
    </motion.section>
  );
}
