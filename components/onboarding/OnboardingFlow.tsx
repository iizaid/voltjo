"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import { OnboardingAuthPanel } from "@/components/onboarding/OnboardingAuthPanel";
import { OnboardingIntro } from "@/components/onboarding/OnboardingIntro";
import { OnboardingQuestion } from "@/components/onboarding/OnboardingQuestion";
import { onboardingQuestions } from "@/lib/onboarding/questions";
import { saveOnboardingProfileAction } from "@/lib/auth/actions";
import {
  loadOnboardingDraft,
  saveOnboardingDraft,
  loadOnboardingProgress,
  saveOnboardingProgress,
  clearOnboardingDraft,
} from "@/lib/onboarding/storage";
import type {
  CustomerProfileDraft,
  OnboardingQuestion as OnboardingQuestionData,
} from "@/lib/onboarding/types";

type FlowState = "intro" | "questions" | "auth";

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
  const [flowState, setFlowState] = useState<FlowState>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<CustomerProfileDraft>({});
  const [hasHydrated, setHasHydrated] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const nextTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

    if (storedDraft) {
      setAnswers(storedDraft);
    }

    if (storedProgress) {
      setFlowState(storedProgress.flowState);
      setCurrentQuestionIndex(storedProgress.currentQuestionIndex);
      
      if (storedProgress.flowState === "intro") {
        const introTimeout = setTimeout(
          () => setFlowState("questions"),
          getMotionDelay(1050),
        );
        setHasHydrated(true);
        return () => { clearTimeout(introTimeout); clearNextTimeout(); };
      }
    } else {
      const introTimeout = setTimeout(
        () => setFlowState("questions"),
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
    if (
      hasHydrated &&
      isAuthenticated &&
      flowState === "auth" &&
      hasDraftAnswers(answers) &&
      !isSavingProfile
    ) {
      setIsSavingProfile(true);
      saveOnboardingProfileAction(answers).then((result) => {
        if (result.ok) {
          clearOnboardingDraft();
          router.push("/assistant");
          router.refresh();
        } else {
          setIsSavingProfile(false);
        }
      });
    }
  }, [hasHydrated, isAuthenticated, flowState, answers, isSavingProfile, router]);

  return (
    <AnimatePresence mode="wait">
      {flowState === "intro" ? <OnboardingIntro key="intro" /> : null}

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
        <OnboardingAuthPanel key="auth" answers={answers} onBack={goBack} />
      ) : null}
    </AnimatePresence>
  );
}
