"use client";

import { useState, type FormEvent } from "react";
import {
  ACCOUNT_DELETION_CONFIRMATION_TEXT,
  isAccountDeletionConfirmationValid,
} from "@/lib/account/account-deletion";

type Notice = {
  tone: "success" | "error";
  message: string;
};

type DeleteAccountResponse = {
  ok: boolean;
  message?: string;
};

const dangerButtonClass =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white px-5 text-sm font-bold text-red-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px hover:border-red-300 hover:bg-red-50 hover:shadow-[0_6px_16px_rgba(185,28,28,0.08)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClass =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[rgba(38,38,38,0.08)] bg-white px-5 text-sm font-bold text-[var(--voltjo-black)] shadow-[0_1px_0_rgba(255,255,255,0.8)] transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px hover:border-[rgba(38,38,38,0.14)] hover:bg-[#F7F7F3] hover:shadow-[0_6px_16px_rgba(13,13,13,0.06)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

async function readDeleteResponse(response: Response) {
  try {
    return (await response.json()) as DeleteAccountResponse;
  } catch {
    return {
      ok: false,
      message: "تعذر قراءة رد الخادم. حاول مرة أخرى.",
    };
  }
}

export function DeleteAccountRequest({
  userEmail,
}: {
  userEmail: string | null;
}) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [typedEmail, setTypedEmail] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isPending, setIsPending] = useState(false);

  const canSubmit =
    !isPending &&
    isAccountDeletionConfirmationValid({
      confirmationText,
      typedEmail,
      currentEmail: userEmail,
    });

  function openConfirmation() {
    setIsConfirming(true);
    setNotice(null);
  }

  function closeConfirmation() {
    if (isPending) return;
    setIsConfirming(false);
    setConfirmationText("");
    setTypedEmail("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsPending(true);
    setNotice(null);

    try {
      const response = await fetch("/api/account/delete", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmationText,
          email: typedEmail,
        }),
      });
      const result = await readDeleteResponse(response);

      if (!response.ok || !result.ok) {
        setNotice({
          tone: "error",
          message: result.message || "تعذر حذف الحساب الآن.",
        });
        return;
      }

      setNotice({
        tone: "success",
        message: result.message || "تم حذف الحساب نهائيًا.",
      });

      window.setTimeout(() => {
        window.location.assign("/?account_deleted=1");
      }, 600);
    } catch {
      setNotice({
        tone: "error",
        message: "تعذر الاتصال بالخادم. حاول مرة أخرى.",
      });
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className="rounded-[22px] bg-red-50/70 p-4 ring-1 ring-red-100">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-red-700">
            حذف الحساب
          </p>
          <p className="mt-1 text-sm font-medium leading-6 text-red-700/85">
            هذا إجراء نهائي. سيتم حذف حسابك وبياناته المرتبطة، ولن تحتاج إلى
            مراجعة يدوية من الإدارة.
          </p>
        </div>

        <button
          type="button"
          onClick={openConfirmation}
          className={dangerButtonClass}
        >
          حذف حسابي نهائيًا
        </button>
      </div>

      {notice ? (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          aria-live={notice.tone === "error" ? "assertive" : "polite"}
          className={`mt-4 rounded-[18px] px-4 py-3 text-sm font-bold ring-1 ${
            notice.tone === "success"
              ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
              : "bg-red-50 text-red-700 ring-red-200"
          }`}
        >
          {notice.message}
        </div>
      ) : null}

      {isConfirming ? (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-[20px] bg-white p-4 ring-1 ring-red-100"
        >
          <div className="rounded-[18px] bg-red-50 px-4 py-3 text-sm font-bold leading-7 text-red-800 ring-1 ring-red-100">
            سيتم حذف حساب Supabase Auth الحالي. بيانات الملف الشخصي والمحادثات
            وطلبات حذف الحساب تُحذف عبر cascade، وسيتم حذف ملفات الصورة الشخصية
            من التخزين قبل حذف الحساب.
          </div>

          <label className="grid gap-2 text-sm font-bold text-red-800">
            اكتب "{ACCOUNT_DELETION_CONFIRMATION_TEXT}" للتأكيد
            <input
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.currentTarget.value)}
              disabled={isPending}
              autoComplete="off"
              className="h-11 rounded-[16px] border border-red-100 bg-white px-4 text-sm font-bold text-[var(--voltjo-black)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-red-200 focus:shadow-[0_0_0_4px_rgba(220,38,38,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          {userEmail ? (
            <label className="grid gap-2 text-sm font-bold text-red-800">
              اكتب بريد الحساب للتأكيد
              <input
                type="email"
                dir="ltr"
                value={typedEmail}
                onChange={(event) => setTypedEmail(event.currentTarget.value)}
                disabled={isPending}
                autoComplete="off"
                placeholder={userEmail}
                className="h-11 rounded-[16px] border border-red-100 bg-white px-4 text-left text-sm font-bold text-[var(--voltjo-black)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-red-200 focus:shadow-[0_0_0_4px_rgba(220,38,38,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
              />
            </label>
          ) : null}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!canSubmit}
              className={dangerButtonClass}
            >
              {isPending ? "جارٍ حذف الحساب…" : "تأكيد الحذف النهائي"}
            </button>
            <button
              type="button"
              disabled={isPending}
              onClick={closeConfirmation}
              className={secondaryButtonClass}
            >
              إلغاء
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
