"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence } from "motion/react";
import { OnboardingAuthPanel } from "@/components/onboarding/OnboardingAuthPanel";
import { OnboardingIntro } from "@/components/onboarding/OnboardingIntro";
import { OnboardingQuestion } from "@/components/onboarding/OnboardingQuestion";
import { onboardingQuestions } from "@/lib/onboarding/questions";
import {
  loadOnboardingDraft,
  saveOnboardingDraft,
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
  return ownershipStatus === "نعم، كهربائية" || ownershipStatus === "نعم، هايبرد";
}

function getVisibleQuestions(
  answers: CustomerProfileDraft,
): OnboardingQuestionData[] {
  return onboardingQuestions.filter((question) => {
    if (question.id !== "hasDrivenEvOrHybrid") return true;
    return !ownsEvOrHybrid(answers.ownershipStatus);
  });
}

export function OnboardingFlow() {
  const [flowState, setFlowState] = useState<FlowState>("intro");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<CustomerProfileDraft>({});
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

  const goToNextStep = () => {
    clearNextTimeout();
    if (currentQuestionIndex >= visibleQuestions.length - 1) {
      setFlowState("auth");
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
          nextAnswers.hasDrivenEvOrHybrid = "نعم";
        } else {
          delete nextAnswers.hasDrivenEvOrHybrid;
        }
      }

      return nextAnswers;
    });
  };

  useEffect(() => {
    const storedDraft = loadOnboardingDraft();
    if (storedDraft) {
      setAnswers(storedDraft);
    }

    const introTimeout = setTimeout(
      () => setFlowState("questions"),
      getMotionDelay(1050),
    );

    return () => {
      clearTimeout(introTimeout);
      clearNextTimeout();
    };
  }, []);

  useEffect(() => {
    saveOnboardingDraft(answers);
  }, [answers]);

  useEffect(() => {
    if (currentQuestionIndex > visibleQuestions.length - 1) {
      setCurrentQuestionIndex(Math.max(0, visibleQuestions.length - 1));
    }
  }, [currentQuestionIndex, visibleQuestions.length]);

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
