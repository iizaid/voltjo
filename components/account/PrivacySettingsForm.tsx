"use client";

import { useActionState } from "react";
import { savePrivacySettingsAction } from "@/lib/auth/actions";
import type { PrivacySettings } from "@/lib/account/settings";

const initialState = {
  ok: false,
  message: "",
};

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white shadow-[0_10px_22px_rgba(13,13,13,0.08)] transition-[background-color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:bg-[#111] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60";

function CheckboxRow({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: keyof PrivacySettings;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="group flex cursor-pointer items-start gap-3 rounded-[22px] bg-[#F7F7F3] p-4 ring-1 ring-[rgba(38,38,38,0.04)] transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-0.5 hover:bg-[#F4F4EF] focus-within:ring-[rgba(38,38,38,0.16)]">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-5 w-5 rounded border-[rgba(38,38,38,0.22)] accent-[var(--voltjo-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2"
      />
      <span>
        <span className="block text-sm font-extrabold text-[var(--voltjo-black)]">
          {label}
        </span>
        <span className="mt-1 block text-sm font-medium leading-6 text-[var(--voltjo-muted)]">
          {description}
        </span>
      </span>
    </label>
  );
}

export function PrivacySettingsForm({
  initialValues,
}: {
  initialValues: PrivacySettings;
}) {
  const [state, formAction, isPending] = useActionState(
    savePrivacySettingsAction,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <CheckboxRow
        name="allowSmartProfileRecommendations"
        label="السماح باستخدام ملفي الذكي لتحسين التوصيات"
        description="يسمح باستخدام إجابات ملفك الذكي لتحسين ترتيب التوصيات داخل حسابك."
        defaultChecked={initialValues.allowSmartProfileRecommendations}
      />
      <CheckboxRow
        name="showDataInAssistant"
        label="إظهار بياناتي داخل تجربة المساعد"
        description="يسمح للمساعد باستخدام بيانات ملفك الذكي عند صياغة الردود داخل حسابك."
        defaultChecked={initialValues.showDataInAssistant}
      />
      <CheckboxRow
        name="receiveImportantAccountEmails"
        label="تلقي رسائل مهمة متعلقة بالحساب"
        description="يشمل ذلك الرسائل المرتبطة بالأمان والتحديثات الأساسية الخاصة بحسابك."
        defaultChecked={initialValues.receiveImportantAccountEmails}
      />

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

      <button
        type="submit"
        disabled={isPending}
        className={primaryButtonClass}
      >
        {isPending ? "جارٍ الحفظ…" : "حفظ إعدادات الخصوصية"}
      </button>
    </form>
  );
}
