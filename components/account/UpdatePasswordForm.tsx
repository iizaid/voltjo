"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export function UpdatePasswordForm() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error" | "info">(
    "info",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setMessage("الخدمة غير جاهزة حاليًا. حاول لاحقًا.");
      setMessageTone("error");
      return;
    }

    let isActive = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isActive) return;

      if (error || !data.session) {
        setMessage("افتح رابط التغيير من بريدك الإلكتروني أولًا، ثم أعد المحاولة.");
        setMessageTone("info");
        return;
      }

      setIsReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isActive) return;

      if (event === "PASSWORD_RECOVERY" || session) {
        setIsReady(true);
        setMessage("");
      }
    });

    return () => {
      isActive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setMessage("الخدمة غير جاهزة حاليًا. حاول لاحقًا.");
      setMessageTone("error");
      return;
    }

    if (
      password.length < MIN_PASSWORD_LENGTH ||
      password.length > MAX_PASSWORD_LENGTH
    ) {
      setMessage("كلمة المرور يجب أن تكون بين 8 و128 حرفًا.");
      setMessageTone("error");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("تأكيد كلمة المرور غير مطابق.");
      setMessageTone("error");
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setIsSubmitting(false);
      setMessage("تعذر تحديث كلمة المرور الآن. حاول مرة أخرى.");
      setMessageTone("error");
      return;
    }

    setMessage("تم تحديث كلمة المرور بنجاح. يمكنك الآن العودة إلى حسابك.");
    setMessageTone("success");
    setIsSubmitting(false);
    setPassword("");
    setConfirmPassword("");
    router.refresh();
  }

  return (
    <div className="mx-auto w-full max-w-[520px] rounded-[24px] border border-[rgba(13,13,13,0.08)] bg-white p-6 shadow-[0_12px_30px_rgba(13,13,13,0.04)] sm:p-8">
      <div className="space-y-2 text-right">
        <h1 className="text-[28px] font-black text-[var(--voltjo-black)]">
          تغيير كلمة المرور
        </h1>
        <p className="text-sm font-medium leading-7 text-[var(--voltjo-muted)]">
          أدخل كلمة المرور الجديدة بعد فتح رابط التغيير المرسل إلى بريدك
          الإلكتروني.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
          كلمة المرور الجديدة
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            disabled={!isReady || isSubmitting}
            className="h-12 rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none transition focus:border-[rgba(255,106,0,0.35)] disabled:bg-[#F7F6F1]"
          />
        </label>

        <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
          تأكيد كلمة المرور
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            disabled={!isReady || isSubmitting}
            className="h-12 rounded-[14px] border border-[rgba(13,13,13,0.08)] bg-white px-4 text-base font-semibold text-[var(--voltjo-black)] outline-none transition focus:border-[rgba(255,106,0,0.35)] disabled:bg-[#F7F6F1]"
          />
        </label>

        {message ? (
          <div
            className={`rounded-[16px] border px-4 py-3 text-sm font-bold ${
              messageTone === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : messageTone === "error"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-[rgba(13,13,13,0.08)] bg-[#FBFBF9] text-[var(--voltjo-muted)]"
            }`}
          >
            {message}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={!isReady || isSubmitting}
          className="inline-flex h-11 w-full items-center justify-center rounded-[14px] bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "جارٍ الحفظ..." : "حفظ كلمة المرور الجديدة"}
        </button>
      </form>
    </div>
  );
}
