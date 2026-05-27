"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp } from "lucide-react";

const quickActions = [
  {
    label: "مقارنة السيارات",
    prompt: "أريد مقارنة بين سيارتين من حيث التكلفة والمدى والدعم داخل الأردن.",
  },
  {
    label: "تكلفة الشحن",
    prompt: "احسب لي تكلفة شحن سيارة كهربائية أو هايبرد قابلة للشحن في الأردن.",
  },
  {
    label: "اسأل المساعد",
    prompt: "أريد مساعدة في اختيار سيارة كهربائية أو هايبرد مناسبة لاستخدامي.",
  },
  {
    label: "دليل السوق",
    prompt: "اشرح لي أهم الأشياء التي يجب الانتباه لها قبل شراء سيارة كهربائية أو هايبرد في الأردن.",
  },
];

export function HeroPromptBox() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleSubmit = (promptOverride?: string) => {
    const finalPrompt = (promptOverride ?? value).trim();
    if (!finalPrompt) {
      router.push("/assistant");
      return;
    }
    router.push(`/assistant?prompt=${encodeURIComponent(finalPrompt)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="mx-auto mt-10 max-w-3xl" dir="rtl">
      <div className="rounded-[20px] border border-[rgba(13,13,13,0.12)] bg-[#FEFEFC] p-3 shadow-[0_4px_16px_rgba(13,13,13,0.04)] transition-shadow focus-within:shadow-[0_4px_20px_rgba(13,13,13,0.08)]">
        {/* Textarea */}
        <textarea
          aria-label="سؤال VoltJo"
          className="min-h-[72px] w-full resize-none bg-transparent px-2 py-2 text-right text-[15px] font-medium leading-7 text-[var(--voltjo-black)] outline-none placeholder:text-[var(--voltjo-muted)]"
          placeholder="اسأل عن سيارة، قارن بين موديلين، أو احسب تكلفة الشحن..."
          rows={2}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />

        {/* Bottom row: quick chips + send button */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
          {/* Quick actions as light chips */}
          <div className="flex flex-wrap gap-1.5">
            {quickActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => handleSubmit(action.prompt)}
                className="inline-flex items-center rounded-lg border border-[rgba(13,13,13,0.08)] bg-white px-3 py-1.5 text-[13px] font-semibold text-[var(--voltjo-muted)] transition hover:border-[rgba(13,13,13,0.16)] hover:text-[var(--voltjo-black)]"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Send button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            aria-label="ابدأ"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--voltjo-orange)] text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:bg-[#e85e00]"
          >
            <ArrowUp size={17} />
          </button>
        </div>
      </div>

      {/* Helper text */}
      <p className="mt-4 text-center text-[12px] font-medium leading-6 text-[var(--voltjo-muted)]/70">
        ابدأ سؤالك الآن — وسيتم نقلك إلى حسابك أو إنشاء حساب لمتابعة داخل المساعد الذكي.
      </p>
    </div>
  );
}
