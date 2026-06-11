"use client";

import { useActionState } from "react";
import { sendPasswordResetLinkAction } from "@/lib/auth/actions";

const initialState = {
  ok: false,
  message: "",
};

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(13,13,13,0.08)] transition-[background-color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:bg-[#111] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function PasswordResetAction() {
  const [state, formAction, isPending] = useActionState(
    sendPasswordResetLinkAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-3">
      <button
        type="submit"
        disabled={isPending}
        className={primaryButtonClass}
      >
        {isPending ? "جارٍ الإرسال…" : "إرسال رابط تغيير كلمة المرور"}
      </button>

      {state.message ? (
        <p
          role={state.ok ? "status" : "alert"}
          aria-live={state.ok ? "polite" : "assertive"}
          className={`text-sm font-bold ${
            state.ok ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
