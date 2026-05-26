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
  canGoBack: boolean;
  canContinue: boolean;
  onSelect: (value: string) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const progress = ((questionIndex + 1) / totalQuestions) * 100;

  return (
    <motion.section
      key={question.id}
      className="flex min-h-dvh items-center justify-center px-5 py-8 sm:px-8"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      dir="rtl"
    >
      <div className="w-full max-w-[820px]">
        <div className="flex items-center justify-between gap-4 border-b border-[rgba(13,13,13,0.08)] pb-5">
          <span className="text-sm font-bold text-[#6F6673]">
            سؤال {questionIndex + 1} من {totalQuestions}
          </span>
          <span className="text-xs font-bold text-[var(--voltjo-orange)]">
            ملفك الذكي
          </span>
        </div>

        <div className="mt-5 h-px overflow-hidden bg-[rgba(13,13,13,0.1)]">
          <motion.div
            className="h-full bg-[var(--voltjo-orange)]"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.28, ease: "easeOut" }}
          />
        </div>

        <div className="mt-14">
          <h1 className="max-w-3xl text-4xl font-bold leading-tight text-[var(--voltjo-black)] sm:text-5xl">
            {question.title}
          </h1>
          {question.subtitle ? (
            <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-[var(--voltjo-muted)]">
              {question.subtitle}
            </p>
          ) : null}
          {question.helperText ? (
            <p className="mt-4 text-sm font-semibold text-[var(--voltjo-muted)]">
              {question.helperText}
            </p>
          ) : null}
        </div>

        <div className="mt-10 border-y border-[rgba(13,13,13,0.08)] bg-white/50 backdrop-blur-sm">
          {question.options.map((option) => {
            const selected = isOptionSelected(option, answer);

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(option.value)}
                className={`group flex min-h-[68px] w-full items-center justify-between gap-5 border-b border-[rgba(13,13,13,0.065)] px-1 py-4 text-right text-base font-bold leading-7 transition last:border-b-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,106,0,0.28)] sm:px-2 ${
                  selected
                    ? "bg-[rgba(255,106,0,0.055)] text-[var(--voltjo-black)]"
                    : "text-[var(--voltjo-black)] hover:bg-white/80"
                }`}
              >
                <span className="flex items-center gap-4">
                  <span
                    className={`h-3 w-3 shrink-0 rounded-full border transition ${
                      selected
                        ? "border-[var(--voltjo-orange)] bg-[var(--voltjo-orange)] shadow-[0_0_0_5px_rgba(255,106,0,0.12)]"
                        : "border-[rgba(13,13,13,0.24)] bg-white group-hover:border-[rgba(13,13,13,0.42)]"
                    }`}
                  />
                  {option.label}
                </span>
                <span
                  className={`h-px w-10 transition ${
                    selected
                      ? "bg-[var(--voltjo-orange)]"
                      : "bg-transparent group-hover:bg-[rgba(13,13,13,0.14)]"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <div className="mt-10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={!canGoBack}
            className="h-11 border-b border-transparent px-1 text-sm font-bold text-[var(--voltjo-muted)] transition hover:border-[rgba(13,13,13,0.22)] hover:text-[var(--voltjo-black)] disabled:cursor-not-allowed disabled:opacity-35"
          >
            رجوع
          </button>
          <button
            type="button"
            onClick={onNext}
            disabled={!canContinue}
            className="h-11 rounded-full bg-[var(--voltjo-black)] px-8 text-sm font-bold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-[#C9C4BA]"
          >
            التالي
          </button>
        </div>
      </div>
    </motion.section>
  );
}
