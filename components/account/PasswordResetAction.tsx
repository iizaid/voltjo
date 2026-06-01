"use client";

import { useActionState } from "react";
import { sendPasswordResetLinkAction } from "@/lib/auth/actions";

const initialState = {
  ok: false,
  message: "",
};

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
        className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "جارٍ الإرسال..." : "إرسال رابط تغيير كلمة المرور"}
      </button>

      {state.message ? (
        <p
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
