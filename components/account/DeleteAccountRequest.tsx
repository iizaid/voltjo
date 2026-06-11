"use client";

import { useEffect, useState, type FormEvent } from "react";

type Notice = {
  tone: "success" | "error" | "info";
  message: string;
};

type DeletionApiResponse = {
  ok: boolean;
  status?: "created" | "existing" | "none";
  message?: string;
};

const CONFIRMATION_TEXT = "حذف حسابي";

const dangerButtonClass =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-red-200 bg-white px-5 text-sm font-bold text-red-700 shadow-[0_1px_0_rgba(255,255,255,0.8)] transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px hover:border-red-300 hover:bg-red-50 hover:shadow-[0_6px_16px_rgba(185,28,28,0.08)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const secondaryButtonClass =
  "inline-flex min-h-11 shrink-0 items-center justify-center rounded-full border border-[rgba(38,38,38,0.08)] bg-white px-5 text-sm font-bold text-[var(--voltjo-black)] shadow-[0_1px_0_rgba(255,255,255,0.8)] transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px hover:border-[rgba(38,38,38,0.14)] hover:bg-[#F7F7F3] hover:shadow-[0_6px_16px_rgba(13,13,13,0.06)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

async function readDeletionResponse(response: Response) {
  try {
    return (await response.json()) as DeletionApiResponse;
  } catch {
    return {
      ok: false,
      message: "تعذر قراءة رد الخادم. حاول مرة أخرى.",
    };
  }
}

function getNoticeClass(tone: Notice["tone"]) {
  switch (tone) {
    case "success":
      return "bg-emerald-50 text-emerald-800 ring-emerald-200";
    case "info":
      return "bg-amber-50 text-amber-800 ring-amber-200";
    case "error":
      return "bg-red-50 text-red-700 ring-red-200";
  }
}

export function DeleteAccountRequest() {
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [reason, setReason] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const canSubmit =
    confirmationText.trim() === CONFIRMATION_TEXT &&
    !isPending &&
    !hasPendingRequest;

  useEffect(() => {
    let isMounted = true;

    async function loadPendingRequest() {
      try {
        const response = await fetch("/api/account/deletion-request", {
          method: "GET",
        });
        const result = await readDeletionResponse(response);

        if (!isMounted || !response.ok || !result.ok) return;

        if (result.status === "existing") {
          setHasPendingRequest(true);
          setNotice({
            tone: "info",
            message: result.message || "يوجد طلب حذف قيد المراجعة.",
          });
        }
      } catch {
        if (!isMounted) return;
      }
    }

    void loadPendingRequest();

    return () => {
      isMounted = false;
    };
  }, []);

  function openConfirmation() {
    if (hasPendingRequest) return;
    setIsConfirming(true);
    setNotice(null);
  }

  function closeConfirmation() {
    if (isPending) return;
    setIsConfirming(false);
    setConfirmationText("");
    setReason("");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;

    setIsPending(true);
    setNotice(null);

    try {
      const response = await fetch("/api/account/deletion-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reason: reason.trim() || null,
        }),
      });
      const result = await readDeletionResponse(response);

      if (!response.ok || !result.ok) {
        setNotice({
          tone: "error",
          message: result.message || "تعذر إرسال طلب حذف الحساب الآن.",
        });
        return;
      }

      setHasPendingRequest(true);
      setIsConfirming(false);
      setConfirmationText("");
      setReason("");
      setNotice({
        tone: result.status === "existing" ? "info" : "success",
        message:
          result.message ||
          (result.status === "existing"
            ? "يوجد طلب حذف قيد المراجعة."
            : "تم استلام طلب حذف الحساب داخل النظام."),
      });
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
            طلب حذف الحساب
          </p>
          <p className="mt-1 text-sm font-medium leading-6 text-red-700/85">
            هذا ليس حذفًا فوريًا ولا يستخدم البريد الإلكتروني. يتم تسجيل الطلب
            داخل النظام للمراجعة قبل أي إجراء على الحساب.
          </p>
        </div>

        <button
          type="button"
          disabled={hasPendingRequest}
          onClick={openConfirmation}
          className={dangerButtonClass}
        >
          {hasPendingRequest ? "طلب قيد المراجعة" : "طلب حذف الحساب"}
        </button>
      </div>

      {notice ? (
        <div
          role={notice.tone === "error" ? "alert" : "status"}
          aria-live={notice.tone === "error" ? "assertive" : "polite"}
          className={`mt-4 rounded-[18px] px-4 py-3 text-sm font-bold ring-1 ${getNoticeClass(
            notice.tone,
          )}`}
        >
          {notice.message}
        </div>
      ) : null}

      {isConfirming ? (
        <form
          onSubmit={handleSubmit}
          className="mt-4 space-y-4 rounded-[20px] bg-white p-4 ring-1 ring-red-100"
        >
          <label className="grid gap-2 text-sm font-bold text-red-800">
            اكتب "حذف حسابي" لتأكيد إرسال الطلب
            <input
              value={confirmationText}
              onChange={(event) => setConfirmationText(event.currentTarget.value)}
              disabled={isPending}
              autoComplete="off"
              className="h-11 rounded-[16px] border border-red-100 bg-white px-4 text-sm font-bold text-[var(--voltjo-black)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-red-200 focus:shadow-[0_0_0_4px_rgba(220,38,38,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <label className="grid gap-2 text-sm font-bold text-red-800">
            السبب اختياري
            <textarea
              value={reason}
              onChange={(event) => setReason(event.currentTarget.value)}
              disabled={isPending}
              rows={3}
              maxLength={1000}
              className="min-h-24 resize-y rounded-[16px] border border-red-100 bg-white px-4 py-3 text-sm font-semibold leading-6 text-[var(--voltjo-black)] outline-none transition-[border-color,box-shadow] duration-200 focus:border-red-200 focus:shadow-[0_0_0_4px_rgba(220,38,38,0.08)] disabled:cursor-not-allowed disabled:opacity-60"
            />
          </label>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <button
              type="submit"
              disabled={!canSubmit}
              className={dangerButtonClass}
            >
              {isPending ? "جارٍ إرسال الطلب…" : "تأكيد طلب الحذف"}
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
