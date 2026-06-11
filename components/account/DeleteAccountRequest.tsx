"use client";

import { useMemo } from "react";

const SUPPORT_EMAIL = "support@voltjo.com";

const dangerButtonClass =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white px-5 text-sm font-bold text-red-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] transition-[background-color,border-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:bg-red-50 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2";

export function DeleteAccountRequest() {
  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent("طلب حذف حساب VoltJo");
    const body = encodeURIComponent(
      "مرحبًا فريق VoltJo،\n\nأرغب في تقديم طلب حذف حسابي ومراجعة البيانات المرتبطة به يدويًا.\n\nشكرًا لكم.",
    );

    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }, []);

  return (
    <div className="rounded-[22px] bg-red-50/70 p-4 ring-1 ring-red-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-red-700">
            طلب حذف الحساب
          </p>
          <p className="mt-1 text-sm font-medium leading-6 text-red-700/85">
            هذا ليس حذفًا فوريًا. يتم إرسال طلب يدوي للمراجعة حتى لا تُحذف
            بياناتك بالخطأ.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-2 inline-flex text-sm font-bold text-red-700 underline-offset-4 transition-[color] duration-200 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>

        <a
          href={mailtoHref}
          className={dangerButtonClass}
        >
          طلب حذف الحساب
        </a>
      </div>
    </div>
  );
}
