"use client";

import { useEffect, useState } from "react";
import { TextType } from "@/components/ui/TextType";

export function AssistantTypingText({
  text,
  animate,
  onComplete,
}: {
  text: string;
  animate: boolean;
  onComplete?: () => void;
}) {
  const [completed, setCompleted] = useState(!animate);

  useEffect(() => {
    if (!animate) return;

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches && !completed) {
      setCompleted(true);
      onComplete?.();
    }
  }, [animate, completed, onComplete]);

  if (!animate) {
    return (
      <span
        className="block w-full whitespace-pre-wrap break-words text-right [unicode-bidi:plaintext]"
        dir="rtl"
      >
        {text}
      </span>
    );
  }

  return (
    <TextType
      as="span"
      text={text}
      loop={false}
      showCursor={false}
      typingSpeed={14}
      reducedMotionText={text}
      dir="rtl"
      className="block w-full whitespace-pre-wrap break-words text-right [unicode-bidi:plaintext]"
      style={{ direction: "rtl", unicodeBidi: "plaintext", textAlign: "right" }}
      onSentenceComplete={() => {
        if (!completed) {
          setCompleted(true);
          onComplete?.();
        }
      }}
    />
  );
}
