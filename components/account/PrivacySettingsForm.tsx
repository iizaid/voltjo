"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { PrivacySettings } from "@/lib/account/settings";

type Notice = {
  tone: "success" | "error";
  message: string;
};

type PrivacyApiResponse = {
  ok: boolean;
  message?: string;
  values?: PrivacySettings;
};

const primaryButtonClass =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--voltjo-black)] px-5 text-sm font-bold text-white shadow-[0_1px_0_rgba(255,255,255,0.16)_inset,0_1px_2px_rgba(13,13,13,0.16)] transition-[background-color,box-shadow,transform,opacity] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px hover:bg-[#171717] hover:shadow-[0_6px_16px_rgba(13,13,13,0.12)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

function arePrivacySettingsEqual(
  first: PrivacySettings,
  second: PrivacySettings,
) {
  return (
    first.allowSmartProfileRecommendations ===
      second.allowSmartProfileRecommendations &&
    first.showDataInAssistant === second.showDataInAssistant &&
    first.receiveImportantAccountEmails === second.receiveImportantAccountEmails
  );
}

function CheckboxRow({
  name,
  label,
  description,
  checked,
  disabled,
  onChange,
}: {
  name: keyof PrivacySettings;
  label: string;
  description: string;
  checked: boolean;
  disabled: boolean;
  onChange: (name: keyof PrivacySettings, checked: boolean) => void;
}) {
  return (
    <label className="group flex cursor-pointer items-start gap-3 rounded-[22px] bg-[#F7F7F3] p-4 ring-1 ring-[rgba(38,38,38,0.04)] transition-[background-color,box-shadow,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-px hover:bg-[#F4F4EF] focus-within:ring-[rgba(38,38,38,0.16)]">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(name, event.currentTarget.checked)}
        className="mt-1 h-5 w-5 rounded border-[rgba(38,38,38,0.22)] accent-[var(--voltjo-orange)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(38,38,38,0.16)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
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

async function readPrivacyResponse(response: Response) {
  try {
    return (await response.json()) as PrivacyApiResponse;
  } catch {
    return {
      ok: false,
      message: "تعذر قراءة رد الخادم. حاول مرة أخرى.",
    };
  }
}

export function PrivacySettingsForm({
  initialValues,
}: {
  initialValues: PrivacySettings;
}) {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [savedValues, setSavedValues] = useState(initialValues);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [isPending, setIsPending] = useState(false);

  const isDirty = useMemo(
    () => !arePrivacySettingsEqual(values, savedValues),
    [values, savedValues],
  );

  function updateValue(name: keyof PrivacySettings, checked: boolean) {
    setValues((current) => ({
      ...current,
      [name]: checked,
    }));
    setNotice(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || !isDirty) return;

    setIsPending(true);
    setNotice(null);

    try {
      const response = await fetch("/api/account/privacy-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });
      const result = await readPrivacyResponse(response);

      if (!response.ok || !result.ok) {
        setNotice({
          tone: "error",
          message: result.message || "تعذر حفظ إعدادات الخصوصية الآن.",
        });
        return;
      }

      const nextValues = result.values ?? values;
      setValues(nextValues);
      setSavedValues(nextValues);
      setNotice({
        tone: "success",
        message: result.message || "تم حفظ إعدادات الخصوصية.",
      });
      router.refresh();
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <CheckboxRow
        name="allowSmartProfileRecommendations"
        label="السماح باستخدام ملفي الذكي لتحسين التوصيات"
        description="يسمح باستخدام إجابات ملفك الذكي لتحسين ترتيب التوصيات داخل حسابك."
        checked={values.allowSmartProfileRecommendations}
        disabled={isPending}
        onChange={updateValue}
      />
      <CheckboxRow
        name="showDataInAssistant"
        label="إظهار بياناتي داخل تجربة المساعد"
        description="يسمح للمساعد باستخدام بيانات ملفك الذكي عند صياغة الردود داخل حسابك."
        checked={values.showDataInAssistant}
        disabled={isPending}
        onChange={updateValue}
      />
      <CheckboxRow
        name="receiveImportantAccountEmails"
        label="تلقي رسائل مهمة متعلقة بالحساب"
        description="يشمل ذلك الرسائل المرتبطة بالأمان والتحديثات الأساسية الخاصة بحسابك."
        checked={values.receiveImportantAccountEmails}
        disabled={isPending}
        onChange={updateValue}
      />

      {notice ? (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          aria-live={notice.tone === "error" ? "assertive" : "polite"}
          className={`text-sm font-bold ${
            notice.tone === "success" ? "text-emerald-700" : "text-red-700"
          }`}
        >
          {notice.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !isDirty}
        className={primaryButtonClass}
      >
        {isPending
          ? "جارٍ الحفظ…"
          : isDirty
            ? "حفظ إعدادات الخصوصية"
            : "تم الحفظ"}
      </button>
    </form>
  );
}
