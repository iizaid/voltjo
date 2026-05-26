"use client";

import { motion } from "motion/react";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";

export function OnboardingIntro() {
  return (
    <motion.section
      className="flex min-h-dvh items-center justify-center px-5"
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.985 }}
      transition={{ duration: 0.42, ease: "easeOut" }}
      dir="rtl"
    >
      <div className="relative mx-auto flex w-full max-w-xl flex-col items-center text-center">
        <div className="absolute inset-x-16 top-3 h-28 rounded-full bg-[rgba(255,106,0,0.12)] blur-3xl" />
        <div className="relative">
          <VoltJoLogo />
        </div>
        <h1 className="mt-10 text-3xl font-bold leading-tight text-[var(--voltjo-black)] sm:text-5xl">
          نجهّز تجربتك الذكية في VoltJo
        </h1>
        <p className="mt-5 max-w-lg text-base font-medium leading-8 text-[var(--voltjo-muted)] sm:text-lg">
          سنطرح عليك بعض الأسئلة القصيرة حتى يصبح المساعد أكثر فهمًا لاحتياجك
          قبل التسجيل.
        </p>
        <div className="mt-9 h-1.5 w-52 overflow-hidden rounded-full bg-[rgba(13,13,13,0.08)]">
          <motion.div
            className="h-full rounded-full bg-[var(--voltjo-orange)]"
            initial={{ x: "105%" }}
            animate={{ x: "-105%" }}
            transition={{ duration: 1.15, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </div>
    </motion.section>
  );
}
