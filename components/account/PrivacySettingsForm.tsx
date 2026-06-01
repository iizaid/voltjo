"use client";

import { useActionState } from "react";
import { savePrivacySettingsAction } from "@/lib/auth/actions";
import type { PrivacySettings } from "@/lib/account/settings";

const initialState = {
  ok: false,
  message: "",
};

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
    <label className="flex items-start gap-3 rounded-[18px] border border-[rgba(13,13,13,0.08)] bg-[#FBFBF9] p-4">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="mt-1 h-4 w-4 rounded border-[rgba(13,13,13,0.18)] accent-[var(--voltjo-orange)]"
      />
      <span>
        <span className="block text-sm font-black text-[var(--voltjo-black)]">
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
        className="inline-flex h-11 items-center justify-center rounded-[14px] bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white disabled:cursor-wait disabled:opacity-70"
      >
        {isPending ? "جارٍ الحفظ..." : "حفظ إعدادات الخصوصية"}
      </button>
    </form>
  );
}
