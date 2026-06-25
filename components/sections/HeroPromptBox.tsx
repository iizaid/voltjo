"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Sparkles, GitCompare, Zap, MessageSquare, Compass } from "lucide-react";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/chat/constants";

const quickActions = [
  {
    label: "مقارنة السيارات",
    prompt: "أريد مقارنة بين سيارتين من حيث التكلفة والمدى والدعم داخل الأردن.",
  },
  {
    label: "تكلفة الشحن",
    prompt: "قدّر لي تكلفة شحن سيارة كهربائية أو هايبرد قابلة للشحن في الأردن.",
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
      {/* Outer Shell (Double-Bezel) */}
      <div className="rounded-[32px] p-2 bg-neutral-100/60 border border-neutral-200/35 shadow-[0_12px_36px_rgba(13,13,13,0.03)] transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)] focus-within:bg-neutral-100/90 focus-within:border-[rgba(255,77,0,0.22)] focus-within:shadow-[0_20px_50px_rgba(255,77,0,0.06)]">
        {/* Inner Core */}
        <div className="bg-white rounded-[calc(32px-8px)] p-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] border border-neutral-100/80">
          
          {/* Textarea */}
          <textarea
            aria-label="سؤال VoltJo"
            className="min-h-[76px] w-full resize-none bg-transparent px-3 py-1 text-right text-[16px] font-bold leading-7 text-[var(--voltjo-black)] outline-none placeholder:text-neutral-400 placeholder:font-semibold transition-colors duration-200"
            placeholder="اسأل عن سيارة، مقارنة بين موديلين، أو قدّر تكلفة الشحن..."
            rows={2}
            maxLength={MAX_CHAT_MESSAGE_LENGTH}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
          />

          {/* Bottom row: quick chips + send button */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-1 pt-3 border-t border-neutral-100/60 mt-3">
            {/* Quick action chips with premium icons */}
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action) => {
                let Icon = Sparkles;
                if (action.label === "مقارنة السيارات") Icon = GitCompare;
                if (action.label === "تكلفة الشحن") Icon = Zap;
                if (action.label === "اسأل المساعد") Icon = MessageSquare;
                if (action.label === "دليل السوق") Icon = Compass;

                return (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => handleSubmit(action.prompt)}
                    className="group inline-flex items-center gap-1.5 rounded-full border border-neutral-200/80 bg-neutral-50 px-3.5 py-1.5 text-[13px] font-bold text-neutral-600 transition-all duration-300 hover:bg-neutral-100 hover:text-[var(--voltjo-black)] hover:border-neutral-300 active:scale-[0.96]"
                  >
                    <Icon className="size-3.5 text-neutral-400 group-hover:text-[var(--voltjo-orange)] transition-colors duration-300" />
                    <span>{action.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Send button with hover transition */}
            <button
              type="button"
              onClick={() => handleSubmit()}
              aria-label="ابدأ"
              className="group flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--voltjo-orange)] text-white shadow-lg shadow-orange-500/20 transition-all duration-500 hover:bg-[#e04300] hover:shadow-orange-500/35 active:scale-[0.95]"
            >
              <ArrowUp className="size-5 transition-transform duration-300 group-hover:-translate-y-0.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Helper text */}
      <p className="mt-4 text-center text-[12px] font-bold text-neutral-400/80">
        اكتب سؤالك الآن — وسيتم فتح المساعد الذكي مباشرة بنفس السؤال.
      </p>
    </div>
  );
}
