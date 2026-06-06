"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence } from "motion/react";
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

type FlowState = "intro" | "consent" | "questions" | "auth";

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
    saveOnboardingProgress({ flowState, currentQuestionIndex });
  }, [answers, flowState, currentQuestionIndex, hasHydrated]);

  useEffect(() => {
    if (currentQuestionIndex > visibleQuestions.length - 1) {
      setCurrentQuestionIndex(Math.max(0, visibleQuestions.length - 1));
    }
  }, [currentQuestionIndex, visibleQuestions.length]);

  useEffect(() => {
    if (!hasHydrated || !isAuthenticated || !isOAuthReturn) return;
    if (hasAttemptedOAuthProfileSaveRef.current) return;
    if (!hasDraftAnswers(answers)) return;

    hasAttemptedOAuthProfileSaveRef.current = true;
    setIsSavingProfile(true);

    saveOnboardingProfileAction(answers).then((result) => {
      if (result.ok) {
        clearOnboardingDraft();
        router.push("/assistant");
        router.refresh();
      } else {
        setIsSavingProfile(false);
        setFlowNotice("تم تسجيل الدخول، لكن تعذر حفظ ملفك الذكي. حاول مرة أخرى.");
        setFlowState("auth");
      }
    });
  }, [hasHydrated, isAuthenticated, isOAuthReturn, answers, router]);

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
          canGoBack={currentQuestionIndex > 0}
          canContinue={canContinue}
          onSelect={handleSelect}
          onBack={goBack}
          onNext={goToNextStep}
        />
      ) : null}

      {flowState === "auth" ? (
        <OnboardingAuthPanel key="auth" answers={answers} notice={flowNotice} onBack={goBack} />
      ) : null}
    </AnimatePresence>
  );
}
