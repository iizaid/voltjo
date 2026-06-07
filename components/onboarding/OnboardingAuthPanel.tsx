"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { CheckCircle2 } from "lucide-react";
import { TurnstileWidget } from "@/components/auth/TurnstileWidget";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import { signInAction, signUpAction } from "@/lib/auth/actions";
import { signInWithOAuth, type OAuthProvider } from "@/lib/auth/oauth-client";
import { clearOnboardingDraft, saveOnboardingDraft } from "@/lib/onboarding/storage";
import type { CustomerProfileDraft } from "@/lib/onboarding/types";
import {
  isAuthDebugEnabled,
  appendAuthDebugEvent,
  createAuthDebugId,
} from "@/lib/auth/auth-debug";

type AuthMode = "signup" | "login";

export function OnboardingAuthPanel({
  answers,
  notice,
  isAuthenticated = false,
}: {
  answers: CustomerProfileDraft;
  notice?: string | null;
  isAuthenticated?: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [authMessage, setAuthMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(notice || null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);
  const serializedAnswers = useMemo(() => JSON.stringify(answers), [answers]);
  const isCaptchaEnabled = Boolean(
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim(),
  );
  const isSignup = mode === "signup";
  const isEmailSubmitDisabled =
    isSubmitting || (isCaptchaEnabled && !captchaToken);

  const handleCaptchaVerify = useCallback((token: string) => {
    setCaptchaToken(token);
  }, []);

  const handleCaptchaClear = useCallback(() => {
    setCaptchaToken("");
  }, []);

  useEffect(() => {
    setCaptchaToken("");
  }, [mode]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setAuthMessage(null);
    setAuthError(null);
    setEmailConfirmationRequired(false);

    if (isCaptchaEnabled && !captchaToken) {
      setAuthError("أكمل التحقق الآلي قبل المتابعة.");
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData(event.currentTarget);
    const result =
      mode === "signup"
        ? await signUpAction(formData)
        : await signInAction(formData);

    if (!result.ok) {
      setCaptchaToken("");
      setAuthError(
        result.needsOnboarding
          ? "أكمل أسئلة البداية حتى نجهّز ملفك الذكي قبل الدخول."
          : result.message,
      );
      setIsSubmitting(false);
      return;
    }

    if (result.emailConfirmationRequired) {
      saveOnboardingDraft(answers);
      setAuthMessage(result.message);
      setEmailConfirmationRequired(true);
      setIsSubmitting(false);
      return;
    }

    clearOnboardingDraft();
    setAuthMessage(result.message);
    setIsSubmitting(false);
    router.push("/assistant");
    router.refresh();
  };

  const handleCancel = () => {
    clearOnboardingDraft();
    router.push("/");
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    if (isSubmitting) return;
    if (isAuthenticated) return;
    setIsSubmitting(true);
    setAuthError(null);
    setAuthMessage(null);
    setEmailConfirmationRequired(false);

    if (isAuthDebugEnabled()) {
      const hasDraft = Object.keys(answers).length > 0;
      appendAuthDebugEvent({
        id: createAuthDebugId(),
        timestamp: new Date().toISOString(),
        stage: "oauth_button_clicked",
        provider,
        path: window.location.pathname,
        note: hasDraft ? "draft_present" : "no_draft",
      });
    }

    saveOnboardingDraft(answers);

    if (isAuthDebugEnabled()) {
      appendAuthDebugEvent({
        id: createAuthDebugId(),
        timestamp: new Date().toISOString(),
        stage: "oauth_redirect_start",
        provider,
        path: window.location.pathname,
      });
    }

    try {
      await signInWithOAuth(provider);
    } catch {
      setAuthError("تعذر بدء تسجيل الدخول. حاول مرة أخرى.");
      setIsSubmitting(false);
    }
  };

  return (
    // dir="ltr" on the outer grid keeps column 1 (form) on the left and column 2 (brand)
    // on the right regardless of the RTL document direction.
    // dir="rtl" is applied inside the form panel for Arabic content.
    <motion.div
      className="min-h-dvh lg:grid lg:grid-cols-2"
      dir="ltr"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
    >
      {/* ── Left column: flat white form ── */}
      <div
        className="flex min-h-dvh items-center justify-center bg-white px-6 py-14 sm:px-10"
        dir="rtl"
      >
        <div className="w-full max-w-[480px]">
          {/* Header */}
          <div className="flex items-center justify-start gap-4">
            <VoltJoLogo className="shrink-0" />
          </div>

          {/* Step label + title + subtitle */}
          <div className="mt-10">
            <p className="text-sm font-black text-[var(--voltjo-orange-dark)]">
              الخطوة الأخيرة
            </p>
            <h1 className="mt-3 text-3xl font-black leading-tight text-[var(--voltjo-black)] sm:text-4xl">
              {isSignup
                ? "إنشاء حسابك في VoltJo"
                : "تسجيل الدخول إلى VoltJo"}
            </h1>
            <p className="mt-3 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
              احفظ ملفك الذكي وتفضيلاتك لتجربة مخصصة يمكنك تعديلها لاحقًا.
            </p>
          </div>

          {isAuthenticated ? (
            <div
              role="status"
              aria-live="polite"
              className="mt-8 rounded-[20px] border border-[var(--voltjo-border)] bg-[var(--voltjo-surface-soft)] px-5 py-5 text-sm font-bold leading-7 text-[var(--voltjo-black)]"
            >
              تم تسجيل الدخول. نجهّز ملفك الآن...
            </div>
          ) : (
            <>

          {/* Mode toggle pill */}
          <div className="mt-8 grid grid-cols-2 rounded-full border border-[var(--voltjo-border)] bg-[var(--voltjo-surface-soft)] p-1">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`h-11 rounded-full text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,77,0,0.24)] ${
                mode === "signup"
                  ? "bg-white text-[var(--voltjo-black)] shadow-[0_2px_10px_rgba(13,13,13,0.06)]"
                  : "text-[var(--voltjo-muted)]"
              }`}
            >
              إنشاء حساب
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`h-11 rounded-full text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,77,0,0.24)] ${
                mode === "login"
                  ? "bg-white text-[var(--voltjo-black)] shadow-[0_2px_10px_rgba(13,13,13,0.06)]"
                  : "text-[var(--voltjo-muted)]"
              }`}
            >
              تسجيل الدخول
            </button>
          </div>

          {/* OAuth buttons */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-[16px] border border-[var(--voltjo-border)] bg-white text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[var(--voltjo-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,77,0,0.26)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              المتابعة باستخدام Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("github")}
              disabled={isSubmitting}
              className="flex h-12 w-full items-center justify-center gap-3 rounded-[16px] border border-[var(--voltjo-border)] bg-white text-sm font-bold text-[var(--voltjo-black)] transition hover:bg-[var(--voltjo-surface-soft)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(255,77,0,0.26)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-50"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
              </svg>
              المتابعة باستخدام GitHub
            </button>
          </div>

          {/* Email/password divider */}
          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-[var(--voltjo-border)]" />
            <span className="text-xs font-bold text-[var(--voltjo-muted)]">
              أو استخدم البريد الإلكتروني
            </span>
            <div className="h-px flex-1 bg-[var(--voltjo-border)]" />
          </div>

          {/* Email / password form */}
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <input
              type="hidden"
              name="onboardingAnswers"
              value={serializedAnswers}
            />

            {authError ? (
              <p
                role="alert"
                className="rounded-[14px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-7 text-red-700"
              >
                {authError}
              </p>
            ) : null}

            {authMessage ? (
              emailConfirmationRequired ? (
                <div
                  role="status"
                  aria-live="polite"
                  className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-4 text-right"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <CheckCircle2 size={20} strokeWidth={2.2} />
                    </span>
                    <div className="space-y-2">
                      <p className="text-sm font-extrabold leading-7 text-emerald-900">
                        تم إنشاء حسابك بنجاح. أرسلنا رابط التأكيد إلى بريدك
                        الإلكتروني. افتح الرابط لتفعيل حسابك، ثم عد إلى VoltJo
                        لتسجيل الدخول.
                      </p>
                      <p className="text-sm font-semibold leading-7 text-emerald-800/90">
                        قد يستغرق وصول الرسالة دقيقة، وتحقق من مجلد الرسائل
                        غير المرغوب فيها أو العروض الترويجية.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <p
                  role="status"
                  aria-live="polite"
                  className="rounded-[14px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-7 text-emerald-800"
                >
                  {authMessage}
                </p>
              )
            ) : null}

            {mode === "signup" ? (
              <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
                الاسم
                <input
                  required
                  name="name"
                  autoComplete="name"
                  className="h-12 rounded-[16px] border border-[var(--voltjo-border)] bg-white px-4 text-base font-medium outline-none transition focus:border-[rgba(255,77,0,0.42)] focus:ring-4 focus:ring-[rgba(255,77,0,0.08)]"
                />
              </label>
            ) : null}

            <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
              البريد الإلكتروني
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                className="h-12 rounded-[16px] border border-[var(--voltjo-border)] bg-white px-4 text-base font-medium outline-none transition focus:border-[rgba(255,77,0,0.42)] focus:ring-4 focus:ring-[rgba(255,77,0,0.08)]"
              />
            </label>

            <label className="grid gap-2 text-sm font-bold text-[var(--voltjo-black)]">
              كلمة المرور
              <input
                required
                name="password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                className="h-12 rounded-[16px] border border-[var(--voltjo-border)] bg-white px-4 text-base font-medium outline-none transition focus:border-[rgba(255,77,0,0.42)] focus:ring-4 focus:ring-[rgba(255,77,0,0.08)]"
              />
            </label>

            <TurnstileWidget
              key={mode}
              onVerify={handleCaptchaVerify}
              onClear={handleCaptchaClear}
            />

            <input type="hidden" name="captchaToken" value={captchaToken} />

            <button
              type="submit"
              disabled={isEmailSubmitDisabled}
              className="mt-2 h-12 rounded-full bg-[var(--voltjo-black)] px-6 text-sm font-bold text-white transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(13,13,13,0.2)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:bg-[#C9C4BA] disabled:hover:translate-y-0"
            >
              {isSubmitting
                ? "جاري التجهيز..."
                : mode === "signup"
                  ? "إنشاء الحساب"
                  : "تسجيل الدخول"}
            </button>

            <button
              type="button"
              onClick={handleCancel}
              className="h-10 rounded-full text-sm font-bold text-[var(--voltjo-muted)] transition hover:bg-[var(--voltjo-surface-soft)] hover:text-[var(--voltjo-black)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(13,13,13,0.16)]"
            >
              إلغاء والعودة للرئيسية
            </button>
          </form>
            </>
          )}
        </div>
      </div>

      {/* ── Right column: full-height orange brand panel ── */}
      <div
        className="relative hidden overflow-hidden bg-[var(--voltjo-orange)] lg:flex lg:items-center lg:justify-center"
        aria-hidden="true"
      >
        {/* Large white VoltJo mark — decorative only */}
        <img
          src="/logo/VoltJo%20logo%20shape.svg"
          alt=""
          aria-hidden="true"
          className="w-[75%] max-w-[540px] select-none [filter:brightness(0)_invert(1)]"
        />
      </div>
    </motion.div>
  );
}
