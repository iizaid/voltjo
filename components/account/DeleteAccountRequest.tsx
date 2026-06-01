"use client";

import { useMemo } from "react";

const SUPPORT_EMAIL = "support@voltjo.com";

export function DeleteAccountRequest() {
  const mailtoHref = useMemo(() => {
    const subject = encodeURIComponent("طلب حذف حساب VoltJo");
    const body = encodeURIComponent(
      "مرحبًا فريق VoltJo،\n\nأرغب في تقديم طلب حذف حسابي ومراجعة البيانات المرتبطة به يدويًا.\n\nشكرًا لكم.",
    );

    return `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  }, []);

  return (
    <div className="rounded-[18px] border border-red-200 bg-red-50/60 p-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-black text-red-700">طلب حذف الحساب</p>
          <p className="mt-1 text-sm font-medium leading-6 text-red-700/85">
            حذف الحساب غير متاح مباشرة من الواجهة لحماية بياناتك. يمكنك إرسال طلب
            حذف ليتم مراجعته يدويًا.
          </p>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="mt-2 inline-flex text-sm font-bold text-red-700 transition hover:underline"
          >
            {SUPPORT_EMAIL}
          </a>
        </div>

        <a
          href={mailtoHref}
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-[14px] border border-red-300 bg-white px-4 text-sm font-bold text-red-700 transition hover:bg-red-50"
        >
          طلب حذف الحساب
        </a>
      </div>
    </div>
  );
}
