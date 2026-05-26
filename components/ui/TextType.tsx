"use client";

import {
  createElement,
  type ElementType,
  type HTMLAttributes,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type VariableSpeed = {
  min: number;
  max: number;
};

type TextTypeRenderState = {
  displayedText: string;
  currentTextIndex: number;
  isDeleting: boolean;
  isComplete: boolean;
  cursor: ReactNode;
};

type TextTypeProps = Omit<HTMLAttributes<HTMLElement>, "children"> & {
  text: string | string[];
  as?: ElementType;
  typingSpeed?: number;
  initialDelay?: number;
  pauseDuration?: number;
  deletingSpeed?: number;
  loop?: boolean;
  className?: string;
  showCursor?: boolean;
  hideCursorWhileTyping?: boolean;
  cursorCharacter?: ReactNode;
  cursorClassName?: string;
  textColors?: string[];
  variableSpeed?: VariableSpeed;
  onSentenceComplete?: (sentence: string, index: number) => void;
  startOnVisible?: boolean;
  reducedMotionText?: string;
  start?: boolean;
  render?: (state: TextTypeRenderState) => ReactNode;
};

function segmentText(text: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const segmenter = new Intl.Segmenter("ar", { granularity: "grapheme" });
    return Array.from(segmenter.segment(text), (part) => part.segment);
  }

  return Array.from(text);
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);

    updatePreference();
    mediaQuery.addEventListener("change", updatePreference);

    return () => mediaQuery.removeEventListener("change", updatePreference);
  }, []);

  return prefersReducedMotion;
}

export function TextType({
  text,
  as: Component = "div",
  typingSpeed = 50,
  initialDelay = 0,
  pauseDuration = 2000,
  deletingSpeed = 30,
  loop = true,
  className = "",
  showCursor = true,
  hideCursorWhileTyping = false,
  cursorCharacter = "|",
  cursorClassName = "",
  textColors = [],
  variableSpeed,
  onSentenceComplete,
  startOnVisible = false,
  reducedMotionText,
  start = true,
  render,
  ...props
}: TextTypeProps) {
  const textArray = useMemo(() => (Array.isArray(text) ? text : [text]), [text]);
  const prefersReducedMotion = usePrefersReducedMotion();
  const [displayedText, setDisplayedText] = useState("");
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isVisible, setIsVisible] = useState(!startOnVisible);
  const containerRef = useRef<HTMLElement | null>(null);

  const getRandomSpeed = useCallback(() => {
    if (!variableSpeed) return typingSpeed;
    const { min, max } = variableSpeed;
    return Math.random() * (max - min) + min;
  }, [typingSpeed, variableSpeed]);

  useEffect(() => {
    if (!startOnVisible || !containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.1 },
    );

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [startOnVisible]);

  useEffect(() => {
    if (prefersReducedMotion) {
      setDisplayedText(reducedMotionText ?? textArray[0] ?? "");
      setCurrentTextIndex(0);
      setCurrentCharIndex(0);
      setIsDeleting(false);
      setIsComplete(true);
    }
  }, [prefersReducedMotion, reducedMotionText, textArray]);

  useEffect(() => {
    if (!start || !isVisible || prefersReducedMotion || isComplete) return;

    const currentText = textArray[currentTextIndex] ?? "";
    const processedSegments = segmentText(currentText);

    const delay = (() => {
      if (isDeleting) return deletingSpeed;
      if (currentCharIndex === 0 && displayedText === "") return initialDelay;
      if (currentCharIndex < processedSegments.length) {
        return variableSpeed ? getRandomSpeed() : typingSpeed;
      }
      return pauseDuration;
    })();

    const timeout = setTimeout(() => {
      if (isDeleting) {
        if (displayedText.length > 0) {
          setDisplayedText((previous) => segmentText(previous).slice(0, -1).join(""));
          return;
        }

        setIsDeleting(false);

        if (currentTextIndex === textArray.length - 1 && !loop) {
          return;
        }

        setCurrentTextIndex((previous) => (previous + 1) % textArray.length);
        setCurrentCharIndex(0);
        return;
      }

      if (currentCharIndex < processedSegments.length) {
        setDisplayedText((previous) => previous + processedSegments[currentCharIndex]);
        setCurrentCharIndex((previous) => previous + 1);
        return;
      }

      if (!loop && textArray.length === 1) {
        onSentenceComplete?.(currentText, currentTextIndex);
        setIsComplete(true);
        return;
      }

      if (textArray.length > 1) {
        onSentenceComplete?.(currentText, currentTextIndex);
        if (loop || currentTextIndex < textArray.length - 1) {
          setIsDeleting(true);
          setCurrentCharIndex(0);
        }
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [
    currentCharIndex,
    currentTextIndex,
    deletingSpeed,
    displayedText,
    getRandomSpeed,
    initialDelay,
    isDeleting,
    isVisible,
    isComplete,
    loop,
    onSentenceComplete,
    pauseDuration,
    prefersReducedMotion,
    textArray,
    typingSpeed,
    variableSpeed,
    start,
  ]);

  const shouldHideCursor =
    prefersReducedMotion ||
    isComplete ||
    (hideCursorWhileTyping &&
      (currentCharIndex < segmentText(textArray[currentTextIndex] ?? "").length ||
        isDeleting));

  const cursor =
    showCursor && !shouldHideCursor ? (
      <span
        aria-hidden="true"
        className={`text-type-cursor ${cursorClassName}`}
      >
        {cursorCharacter}
      </span>
    ) : null;

  if (render) {
    return createElement(
      Component,
      {
        ref: containerRef,
        className: `text-type ${className}`,
        ...props,
      },
      render({ displayedText, currentTextIndex, isDeleting, isComplete, cursor }),
    );
  }

  const currentTextColor =
    textColors.length > 0 ? textColors[currentTextIndex % textColors.length] : undefined;

  return createElement(
    Component,
    {
      ref: containerRef,
      className: `text-type ${className}`,
      ...props,
    },
    <span className="text-type-content" style={{ color: currentTextColor }}>
      {displayedText}
    </span>,
    cursor,
  );
}
