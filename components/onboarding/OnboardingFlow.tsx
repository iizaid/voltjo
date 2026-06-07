"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { OnboardingAuthPanel } from "@/components/onboarding/OnboardingAuthPanel";
import { OnboardingIntro } from "@/components/onboarding/OnboardingIntro";
import { OnboardingPrivacyConsent } from "@/components/onboarding/OnboardingPrivacyConsent";
import { OnboardingQuestion } from "@/components/onboarding/OnboardingQuestion";
import { onboardingQuestions } from "@/lib/onboarding/questions";
import { saveOnboardingProfileAction } from "@/lib/auth/actions";
import {
  loadOnboardingDraft,
  saveOnboardingDraft,
  loadOnboardingProgress,
  saveOnboardingProgress,
  clearOnboardingDraft,
  loadOnboardingPrivacyConsent,
  saveOnboardingPrivacyConsent,
} from "@/lib/onboarding/storage";
import type {
  CustomerProfileDraft,
  OnboardingQuestion as OnboardingQuestionData,
} from "@/lib/onboarding/types";

type FlowState = "intro" | "consent" | "questions" | "auth" | "processing";

function getMotionDelay(duration: number) {
  if (typeof window === "undefined") return duration;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : duration;
}

function ownsEvOrHybrid(ownershipStatus: string | undefined) {
  return ownershipStatus === "owns_ev" || ownershipStatus === "owns_hybrid";
}

function getVisibleQuestions(
  answers: CustomerProfileDraft,
): OnboardingQuestionData[] {
  return onboardingQuestions.filter((question) => {
    if (question.id === "city") return answers.country === "jordan";
    if (question.id !== "hasDrivenEvOrHybrid") return true;
    return !ownsEvOrHybrid(answers.ownershipStatus);
  });
}

function hasDraftAnswers(answers: CustomerProfileDraft) {
  return Object.keys(answers).length > 0;
}

export function OnboardingFlow({ isAuthenticated }: { isAuthenticated?: boolean }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isOAuthReturn = searchParams.get("auth") === "oauth-success";

  const [flowState, setFlowState] = useState<FlowState>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<CustomerProfileDraft>({});
  const [hasHydrated, setHasHydrated] = useState(false);
  const [, setIsSavingProfile] = useState(false);
  const [flowNotice, setFlowNotice] = useState<string | null>(null);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [saveRetryCount, setSaveRetryCount] = useState(0);

  const nextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasAttemptedOAuthProfileSaveRef = useRef(false);

  const visibleQuestions = useMemo(() => getVisibleQuestions(answers), [answers]);
  const currentQuestion = visibleQuestions[currentQuestionIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] : undefined;

  const canContinue = useMemo(() => {
    if (!currentQuestion) return false;
    if (Array.isArray(currentAnswer)) return currentAnswer.length > 0;
    return Boolean(currentAnswer);
  }, [currentAnswer, currentQuestion]);

  const clearNextTimeout = () => {
    if (nextTimeoutRef.current) {
      clearTimeout(nextTimeoutRef.current);
      nextTimeoutRef.current = null;
    }
  };

  const goToNextStep = async () => {
    clearNextTimeout();
    if (currentQuestionIndex >= visibleQuestions.length - 1) {
      if (isAuthenticated) {
        setIsSavingProfile(true);
        const result = await saveOnboardingProfileAction(answers);
        if (result.ok) {
          clearOnboardingDraft();
          router.push("/assistant");
          router.refresh();
        } else {
          setIsSavingProfile(false);
          setFlowState("auth");
        }
      } else {
        setFlowState("auth");
      }
      return;
    }

    setCurrentQuestionIndex((index) => index + 1);
  };

  const goBack = () => {
    clearNextTimeout();
    if (flowState === "auth") {
      setFlowState("questions");
      setCurrentQuestionIndex(Math.max(0, visibleQuestions.length - 1));
      return;
    }

    setCurrentQuestionIndex((index) => Math.max(0, index - 1));
  };

  const handlePrivacyConsentAccepted = () => {
    saveOnboardingPrivacyConsent();
    setFlowState("questions");
    setCurrentQuestionIndex((index) => Math.max(0, index));
  };

  const retryProfileSave = () => {
    hasAttemptedOAuthProfileSaveRef.current = false;
    setProcessingError(null);
    setSaveRetryCount((count) => count + 1);
  };

  const returnToQuestionsAfterSaveFailure = () => {
    hasAttemptedOAuthProfileSaveRef.current = false;
    setProcessingError(null);
    setFlowState("questions");
    setCurrentQuestionIndex(Math.max(0, visibleQuestions.length - 1));
  };

  const handleSelect = (value: string) => {
    if (!currentQuestion) return;
    clearNextTimeout();

    setAnswers((previousAnswers) => {
      if (currentQuestion.type === "multi") {
        const previousValues = Array.isArray(previousAnswers[currentQuestion.id])
          ? (previousAnswers[currentQuestion.id] as string[])
          : [];
        const nextValues = previousValues.includes(value)
          ? previousValues.filter((item) => item !== value)
          : [...previousValues, value];

        return {
          ...previousAnswers,
          [currentQuestion.id]: nextValues,
        };
      }

      const nextAnswers = {
        ...previousAnswers,
        [currentQuestion.id]: value,
      };

      if (currentQuestion.id === "ownershipStatus") {
        if (ownsEvOrHybrid(value)) {
          nextAnswers.hasDrivenEvOrHybrid = "yes";
        } else {
          delete nextAnswers.hasDrivenEvOrHybrid;
        }
      }

      if (currentQuestion.id === "country" && value !== "jordan") {
        delete nextAnswers.city;
      }

      return nextAnswers;
    });
  };

  useEffect(() => {
    const storedDraft = loadOnboardingDraft();
    const storedProgress = loadOnboardingProgress();
    const hasPrivacyConsent = loadOnboardingPrivacyConsent();
    const nextAfterIntro: FlowState = hasPrivacyConsent ? "questions" : "consent";

    if (isOAuthReturn && isAuthenticated) {
      if (storedDraft && hasDraftAnswers(storedDraft)) {
        setAnswers(storedDraft);
        setFlowState("processing");
      } else {
        setFlowNotice("تم تسجيل الدخول. أكمل الأسئلة القصيرة حتى نجهّز ملفك.");
        setFlowState("questions");
        setCurrentQuestionIndex(0);
      }
      setHasHydrated(true);
      return () => { clearNextTimeout(); };
    }

    if (storedDraft) {
      setAnswers(storedDraft);
    }

    if (storedProgress) {
      setCurrentQuestionIndex(storedProgress.currentQuestionIndex);
      
      if (storedProgress.flowState === "intro") {
        const introTimeout = setTimeout(
          () => setFlowState(nextAfterIntro),
          getMotionDelay(1050),
        );
        setHasHydrated(true);
        return () => { clearTimeout(introTimeout); clearNextTimeout(); };
      }

      if (storedProgress.flowState === "questions" && !hasPrivacyConsent) {
        setFlowState("consent");
      } else {
        setFlowState(storedProgress.flowState);
      }
    } else {
      const introTimeout = setTimeout(
        () => setFlowState(nextAfterIntro),
        getMotionDelay(1050),
      );
      setHasHydrated(true);
      return () => { clearTimeout(introTimeout); clearNextTimeout(); };
    }

    setHasHydrated(true);
    return () => { clearNextTimeout(); };
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (hasDraftAnswers(answers)) {
      saveOnboardingDraft(answers);
    }
    if (flowState === "processing") return;
    saveOnboardingProgress({ flowState, currentQuestionIndex });
  }, [answers, flowState, currentQuestionIndex, hasHydrated]);

  useEffect(() => {
    if (currentQuestionIndex > visibleQuestions.length - 1) {
      setCurrentQuestionIndex(Math.max(0, visibleQuestions.length - 1));
    }
  }, [currentQuestionIndex, visibleQuestions.length]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    if (hasAttemptedOAuthProfileSaveRef.current) return;
    if (flowState !== "processing") return;
    if (!hasDraftAnswers(answers)) return;

    hasAttemptedOAuthProfileSaveRef.current = true;
    setIsSavingProfile(true);
    setProcessingError(null);

    saveOnboardingProfileAction(answers).then((result) => {
      if (result.ok) {
        clearOnboardingDraft();
        router.push("/assistant");
        router.refresh();
      } else {
        setIsSavingProfile(false);
        setProcessingError(
          "تم تسجيل الدخول، لكن تعذر حفظ ملفك الذكي. راجع إجاباتك وحاول مرة أخرى.",
        );
      }
    });
  }, [
    answers,
    flowState,
    hasHydrated,
    isAuthenticated,
    router,
    saveRetryCount,
  ]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || isOAuthReturn) return;
    if (flowState !== "auth") return;

    if (hasDraftAnswers(answers)) {
      setFlowState("processing");
      return;
    }

    setFlowNotice("تم تسجيل الدخول. أكمل الأسئلة القصيرة حتى نجهّز ملفك.");
    setFlowState("questions");
    setCurrentQuestionIndex(0);
  }, [answers, flowState, hasHydrated, isAuthenticated, isOAuthReturn]);

  return (
    <AnimatePresence mode="wait">
      {flowState === "intro" ? <OnboardingIntro key="intro" /> : null}

      {flowState === "consent" ? (
        <OnboardingPrivacyConsent
          key="consent"
          onAccept={handlePrivacyConsentAccepted}
        />
      ) : null}

      {flowState === "questions" && currentQuestion ? (
        <OnboardingQuestion
          key={currentQuestion.id}
          question={currentQuestion}
          questionIndex={currentQuestionIndex}
          totalQuestions={visibleQuestions.length}
          answer={currentAnswer}
          notice={flowNotice}
          canGoBack={currentQuestionIndex > 0}
          canContinue={canContinue}
          onSelect={handleSelect}
          onBack={goBack}
          onNext={goToNextStep}
        />
      ) : null}

      {flowState === "auth" ? (
        <OnboardingAuthPanel
          key="auth"
          answers={answers}
          notice={flowNotice}
          isAuthenticated={isAuthenticated}
        />
      ) : null}

      {flowState === "processing" ? (
        <OnboardingProcessing
          key="processing"
          error={processingError}
          onRetry={retryProfileSave}
          onReturnToQuestions={returnToQuestionsAfterSaveFailure}
        />
      ) : null}
    </AnimatePresence>
  );
}

function OnboardingProcessing({
  error,
  onRetry,
  onReturnToQuestions,
}: {
  error: string | null;
  onRetry: () => void;
  onReturnToQuestions: () => void;
}) {
  return (
    <motion.main
      className="grid min-h-dvh place-items-center bg-white px-6 py-10 text-[var(--voltjo-black)]"
      dir="rtl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <section className="w-full max-w-[520px] rounded-[28px] border border-[var(--voltjo-border)] bg-[var(--voltjo-surface)] px-6 py-7 text-center shadow-[0_16px_44px_rgba(13,13,13,0.06)] sm:px-8">
        <div
          className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[rgba(255,77,0,0.18)] border-t-[var(--voltjo-orange)]"
          aria-hidden="true"
        />
        <h1 className="mt-5 text-2xl font-black leading-tight">
          تم تسجيل الدخول. نجهّز ملفك الآن...
        </h1>
        {error ? (
          <>
            <p
              role="alert"
              className="mt-4 rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-7 text-red-700"
            >
              {error}
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onRetry}
                className="h-11 rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(13,13,13,0.2)] focus-visible:ring-offset-2"
              >
                إعادة المحاولة
              </button>
              <button
                type="button"
                onClick={onReturnToQuestions}
                className="h-11 rounded-full border border-[var(--voltjo-border)] bg-white px-5 text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[var(--voltjo-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,77,0,0.2)] focus-visible:ring-offset-2"
              >
                مراجعة الإجابات
              </button>
            </div>
          </>
        ) : (
          <p className="mt-3 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
            سننقلك إلى المساعد بعد حفظ إجاباتك.
          </p>
        )}
      </section>
    </motion.main>
  );
}
