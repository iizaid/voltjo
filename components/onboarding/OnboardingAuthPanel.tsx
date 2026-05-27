"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import Folder from "@/components/Folder";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import { onboardingQuestions } from "@/lib/onboarding/questions";
import {
  clearOnboardingDraft,
  saveOnboardingDraft,
} from "@/lib/onboarding/storage";
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
  onBack,
}: {
  answers: CustomerProfileDraft;
  onBack: () => void;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const highlights = useMemo(() => getProfileHighlights(answers), [answers]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    // TODO: Replace this fake success with backend auth and profile persistence.
    // Do not persist email/password in the local demo flow.
    saveOnboardingDraft(answers);

    window.setTimeout(() => {
      router.push("/assistant");
    }, 520);
  };

  const handleCancel = () => {
    clearOnboardingDraft();
    router.push("/");
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

          <form className="mt-7 grid gap-4" onSubmit={handleSubmit}>
            <p className="rounded-[16px] border border-[rgba(255,106,0,0.18)] bg-[rgba(255,106,0,0.055)] px-4 py-3 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
              هذه نسخة تجريبية محلية. لن يتم إنشاء حساب حقيقي الآن، وسيتم استخدام
              إجاباتك فقط لتخصيص التجربة داخل المتصفح.
            </p>
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
