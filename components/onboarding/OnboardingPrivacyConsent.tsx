"use client";

import Link from "next/link";
import { motion } from "motion/react";

export function OnboardingPrivacyConsent({ onAccept }: { onAccept: () => void }) {
  return (
    <motion.section
      className="flex min-h-dvh items-center justify-center px-5 py-8 sm:px-8"
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
      dir="rtl"
    >
      <div className="w-full max-w-[760px] rounded-[28px] border border-[var(--voltjo-border)] bg-white px-6 py-8 text-right shadow-[0_28px_80px_rgba(13,13,13,0.06)] sm:px-10 sm:py-10">
        <span className="inline-flex rounded-full border border-[rgba(255,77,0,0.18)] bg-[rgba(255,77,0,0.06)] px-4 py-2 text-sm font-bold text-[var(--voltjo-orange-dark)]">
          قبل بدء الأسئلة
        </span>

        <h1 className="mt-6 text-3xl font-black leading-tight text-[var(--voltjo-black)] sm:text-4xl">
          موافقة استخدام الإجابات
        </h1>

        <p className="mt-5 text-base font-semibold leading-8 text-[var(--voltjo-muted)]">
          يستخدم VoltJo إجاباتك لتخصيص الإرشاد المبدئي حول السيارات الكهربائية
          والهايبرد داخل الأردن. تتم معالجة البيانات وفق سياسة الخصوصية وشروط
          الاستخدام، ولا نضيف هنا أي تتبع تسويقي أو بيانات إضافية.
        </p>

        <p className="mt-4 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
          يمكنك مراجعة{" "}
          <Link
            href="/privacy"
            className="font-black text-[var(--voltjo-black)] underline decoration-[rgba(255,77,0,0.32)] underline-offset-4 hover:text-[var(--voltjo-orange-dark)]"
          >
            سياسة الخصوصية
          </Link>{" "}
          و{" "}
          <Link
            href="/terms"
            className="font-black text-[var(--voltjo-black)] underline decoration-[rgba(255,77,0,0.32)] underline-offset-4 hover:text-[var(--voltjo-orange-dark)]"
          >
            الشروط
          </Link>{" "}
          قبل المتابعة.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={onAccept}
            className="voltjo-action-button on-dark-fg inline-flex min-h-[46px] items-center justify-center rounded-full bg-[var(--voltjo-orange)] px-7 text-sm font-bold text-white shadow-[0_10px_22px_rgba(255,77,0,0.18)] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,77,0,0.28)] focus-visible:ring-offset-2"
          >
            <span className="voltjo-action-transition" aria-hidden="true" />
            <span className="voltjo-action-gradient" aria-hidden="true" />
            <span className="voltjo-action-label">أوافق وأبدأ</span>
          </button>
          <span className="text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
            لن يتم عرض هذه الرسالة مرة أخرى على نفس المتصفح بعد الموافقة.
          </span>
        </div>
      </div>
    </motion.section>
  );
}
