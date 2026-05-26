"use client";

import { useEffect, useState } from "react";
import { TextType } from "@/components/ui/TextType";

const headlinePhrase = {
  lineOne: "مرجعك الذكي للسيارات الكهربائية",
  lineTwo: "والهايبرد في الأردن",
};

const fullHeadline = `${headlinePhrase.lineOne}\n${headlinePhrase.lineTwo}`;
const INITIAL_LOADER_KEY = "voltjo:initial-loader:seen";
const INITIAL_LOADER_COMPLETE_EVENT = "voltjo:initial-loader:complete";

function canStartHeroAnimation() {
  try {
    const status = window.sessionStorage.getItem(INITIAL_LOADER_KEY);
    return (
      status === "true" ||
      status === "complete" ||
      document.documentElement.dataset.voltjoInitialLoader === "complete"
    );
  } catch {
    return true;
  }
}

export function HeroHeadlineTextType() {
  const [canStart, setCanStart] = useState(false);

  useEffect(() => {
    if (canStartHeroAnimation()) {
      setCanStart(true);
      return undefined;
    }

    const handleLoaderComplete = () => setCanStart(true);
    const fallbackTimer = window.setTimeout(handleLoaderComplete, 3800);

    window.addEventListener(INITIAL_LOADER_COMPLETE_EVENT, handleLoaderComplete);

    return () => {
      window.clearTimeout(fallbackTimer);
      window.removeEventListener(
        INITIAL_LOADER_COMPLETE_EVENT,
        handleLoaderComplete,
      );
    };
  }, []);

  return (
    <TextType
      as="h1"
      text={fullHeadline}
      reducedMotionText={fullHeadline}
      typingSpeed={52}
      deletingSpeed={34}
      pauseDuration={1550}
      initialDelay={180}
      loop={false}
      start={canStart}
      cursorCharacter="|"
      className="display-heading mx-auto mt-6 min-h-[3.9em] max-w-5xl text-balance text-[42px] font-bold leading-[1.28] tracking-normal text-[var(--voltjo-black)] sm:min-h-[2.75em] sm:text-[62px] lg:text-[70px]"
      dir="rtl"
      aria-label={`${headlinePhrase.lineOne} ${headlinePhrase.lineTwo}`}
      render={({ displayedText, cursor }) => {
        const [lineOne = "", lineTwo = ""] = displayedText.split("\n");
        const isTypingSecondLine = displayedText.includes("\n");

        return (
          <>
            <span
              className="text-type-line block text-[var(--voltjo-black)]"
              dir="rtl"
            >
              {lineOne}
              {!isTypingSecondLine ? cursor : null}
            </span>
            <span
              className="text-type-line orange-highlight block pt-1 sm:pt-2"
              dir="rtl"
            >
              {lineTwo}
              {isTypingSecondLine ? cursor : null}
            </span>
          </>
        );
      }}
    />
  );
}
