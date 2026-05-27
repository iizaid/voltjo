"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { motion } from "motion/react";
import styles from "./TrueFocus.module.css";

type FocusRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type FocusCssVars = CSSProperties & {
  "--border-color"?: string;
  "--glow-color"?: string;
};

export interface TrueFocusProps {
  sentence?: string;
  separator?: string;
  manualMode?: boolean;
  blurAmount?: number;
  borderColor?: string;
  glowColor?: string;
  animationDuration?: number;
  pauseBetweenAnimations?: number;
}

export default function TrueFocus({
  sentence = "True Focus",
  separator = " ",
  manualMode = false,
  blurAmount = 5,
  borderColor = "green",
  glowColor = "rgba(0, 255, 0, 0.6)",
  animationDuration = 0.5,
  pauseBetweenAnimations = 1,
}: TrueFocusProps) {
  const words = sentence.split(separator);
  const [currentIndex, setCurrentIndex] = useState<number | null>(0);
  const [lastActiveIndex, setLastActiveIndex] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [focusRect, setFocusRect] = useState<FocusRect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });

  useEffect(() => {
    if (manualMode || words.length === 0) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((prev) => {
        const safePrev = typeof prev === "number" ? prev : 0;
        return (safePrev + 1) % words.length;
      });
    }, (animationDuration + pauseBetweenAnimations) * 1000);

    return () => window.clearInterval(interval);
  }, [manualMode, animationDuration, pauseBetweenAnimations, words.length]);

  useEffect(() => {
    if (currentIndex === null || currentIndex === -1) return;

    const activeWord = wordRefs.current[currentIndex];
    const container = containerRef.current;
    if (!activeWord || !container) return;

    const parentRect = container.getBoundingClientRect();
    const activeRect = activeWord.getBoundingClientRect();

    setFocusRect({
      x: activeRect.left - parentRect.left,
      y: activeRect.top - parentRect.top,
      width: activeRect.width,
      height: activeRect.height,
    });
  }, [currentIndex, words.length]);

  const handleMouseEnter = (index: number) => {
    if (!manualMode) return;
    setLastActiveIndex(index);
    setCurrentIndex(index);
  };

  const handleMouseLeave = () => {
    if (!manualMode) return;
    setCurrentIndex(lastActiveIndex);
  };

  const cssVars: FocusCssVars = {
    "--border-color": borderColor,
    "--glow-color": glowColor,
  };

  return (
    <div className={styles.focusContainer} ref={containerRef}>
      {words.map((word, index) => {
        const isActive = index === currentIndex;
        const blurValue = isActive ? "blur(0px)" : `blur(${blurAmount}px)`;

        return (
          <span
            key={`${word}-${index}`}
            ref={(element) => {
              wordRefs.current[index] = element;
            }}
            className={[
              styles.focusWord,
              manualMode ? styles.manual : "",
              isActive && !manualMode ? styles.active : "",
            ]
              .filter(Boolean)
              .join(" ")}
            style={{
              ...cssVars,
              filter: blurValue,
              transition: `filter ${animationDuration}s ease`,
            }}
            onMouseEnter={() => handleMouseEnter(index)}
            onMouseLeave={handleMouseLeave}
          >
            {word}
          </span>
        );
      })}

      <motion.div
        className={styles.focusFrame}
        animate={{
          x: focusRect.x,
          y: focusRect.y,
          width: focusRect.width,
          height: focusRect.height,
          opacity: currentIndex !== null && currentIndex >= 0 ? 1 : 0,
        }}
        transition={{ duration: animationDuration }}
        style={cssVars}
      >
        <span className={`${styles.corner} ${styles.topLeft}`} />
        <span className={`${styles.corner} ${styles.topRight}`} />
        <span className={`${styles.corner} ${styles.bottomLeft}`} />
        <span className={`${styles.corner} ${styles.bottomRight}`} />
      </motion.div>
    </div>
  );
}
