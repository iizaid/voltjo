"use client";

import { motion } from "motion/react";
import type {
  OnboardingOption,
  OnboardingQuestion as OnboardingQuestionType,
} from "@/lib/onboarding/types";

function isOptionSelected(
  option: OnboardingOption,
  answer: string | string[] | undefined,
) {
  if (Array.isArray(answer)) return answer.includes(option.value);
  return answer === option.value;
}

export function OnboardingQuestion({
  question,
  questionIndex,
  totalQuestions,
  answer,
  notice,
  canGoBack,
  canContinue,
  onSelect,
  onBack,
  onNext,
}: {
  question: OnboardingQuestionType;
  questionIndex: number;
  totalQuestions: number;
  answer: string | string[] | undefined;
  notice?: string | null;
  canGoBack: boolean;
  canContinue: boolean;
  onSelect: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const progress = ((questionIndex + 1) / totalQuestions) * 100;
  const isMultiSelect = question.type === "multi";

  return (
    <motion.section
      key={question.id}
      className="flex min-h-dvh items-center justify-center bg-white px-4 py-6 sm:px-8 sm:py-8"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      dir="rtl"
    >
      <div className="w-full max-w-[980px] rounded-[26px] border border-[var(--voltjo-border)] bg-white px-5 py-6 shadow-[0_24px_70px_rgba(13,13,13,0.055)] sm:px-8 sm:py-8 lg:px-10 lg:py-9">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-9 items-center rounded-full border border-[var(--voltjo-border)] bg-[var(--voltjo-surface-soft)] px-4 text-sm font-bold text-[var(--voltjo-black)]">
              سؤال {questionIndex + 1} من {totalQuestions}
            </span>
            {isMultiSelect ? (
              <span className="text-xs font-bold text-[var(--voltjo-muted)]">
                يمكن اختيار أكثر من إجابة
              </span>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-2 text-xs font-black text-[var(--voltjo-orange-dark)]">
            <span className="h-2 w-2 rounded-full bg-[var(--voltjo-orange)]" />
            ملفك الذكي
          </span>
        </div>

        <div className="mt-5 h-1 overflow-hidden rounded-full bg-[var(--voltjo-surface-soft)]">
          <motion.div
            className="h-full rounded-full bg-[var(--voltjo-orange)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          />
        </div>

        <div className="mt-10 border-b border-[var(--voltjo-border-soft)] pb-8">
          {notice ? (
            <p
              role="status"
              className="mb-5 inline-flex rounded-full border border-[rgba(255,77,0,0.18)] bg-[rgba(255,77,0,0.055)] px-4 py-2 text-sm font-bold leading-6 text-[var(--voltjo-orange-dark)]"
            >
              {notice}
            </p>
          ) : null}
          <h1 className="max-w-3xl text-3xl font-black leading-[1.25] text-[var(--voltjo-black)] sm:text-5xl">
            {question.title}
          </h1>
          {question.subtitle ? (
            <p className="mt-4 max-w-2xl text-base font-semibold leading-8 text-[var(--voltjo-muted)]">
              {question.subtitle}
            </p>
          ) : null}
          {question.helperText ? (
            <p className="mt-4 max-w-2xl text-sm font-bold leading-7 text-[var(--voltjo-muted)]">
              {question.helperText}
            </p>
          ) : null}
        </div>

        <div className="mt-7 grid gap-3 sm:grid-cols-2">
          {question.options.map((option, index) => {
            const selected = isOptionSelected(option, answer);

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(option.value)}
                className={`group flex min-h-[76px] w-full items-center justify-between gap-4 rounded-[18px] border px-4 py-4 text-right text-base font-bold leading-7 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,77,0,0.28)] focus-visible:ring-offset-2 ${
                  selected
                    ? "border-[rgba(255,77,0,0.36)] bg-[rgba(255,77,0,0.045)] text-[var(--voltjo-black)] shadow-[inset_0_0_0_1px_rgba(255,77,0,0.08)]"
                    : "border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)] hover:border-[rgba(255,77,0,0.24)] hover:bg-[#fffdfb]"
                }`}
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid h-6 w-6 shrink-0 place-items-center border text-[13px] font-black transition ${
                      isMultiSelect ? "rounded-[8px]" : "rounded-full"
                    } ${
                      selected
                        ? "border-[var(--voltjo-orange)] bg-[var(--voltjo-orange)] text-white"
                        : "border-[rgba(13,13,13,0.18)] bg-white text-transparent group-hover:border-[rgba(255,77,0,0.32)]"
                    }`}
                    aria-hidden="true"
                  >
                    {selected ? "✓" : ""}
                  </span>
                  <span className="min-w-0">{option.label}</span>
                </span>
                <span
                  className={`hidden h-7 min-w-7 place-items-center rounded-full border text-xs font-black transition sm:grid ${
                    selected
                      ? "border-[rgba(255,77,0,0.22)] bg-white text-[var(--voltjo-orange-dark)]"
                      : "border-transparent bg-[var(--voltjo-surface-soft)] text-[var(--voltjo-muted)]"
                  }`}
                >
                  {index + 1}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-9 flex items-center justify-between gap-3 border-t border-[var(--voltjo-border-soft)] pt-6">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className="h-11 rounded-full px-4 text-sm font-bold text-[var(--voltjo-muted)] transition hover:bg-[var(--voltjo-surface-soft)] hover:text-[var(--voltjo-black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(13,13,13,0.16)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            رجوع
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            className="h-11 rounded-full bg-[var(--voltjo-black)] px-8 text-sm font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(13,13,13,0.2)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-[#C9C4BA] disabled:hover:translate-y-0"
          >
            التالي
          </button>
        </div>
      </div>
    </motion.section>
  );
}
