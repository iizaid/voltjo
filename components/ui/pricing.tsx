"use client";

import NumberFlow from "@number-flow/react";
import { CheckCheck } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "مجاني",
    description:
      "جرّب VoltJo وافهم أساسيات السيارات الكهربائية والهايبرد.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    priceLabel: "مجاني",
    period: "للبداية",
    yearlyPeriod: "للبداية",
    buttonText: "قريبًا",
    secondaryButtonText: "تعرّف على الخطة",
    buttonVariant: "outline" as const,
    includes: [
      "الخطة المجانية تشمل:",
      "أسئلة محدودة للمساعد الإرشادي التجريبي",
      "تصفح بيانات السيارات الأولية",
      "معلومات عامة عن الشحن والدعم",
      "وصول أساسي إلى بيانات موديلات قيد المراجعة",
    ],
  },
  {
    name: "Plus",
    description:
      "لمن يفكر بشراء سيارة ويريد مزايا أوسع عند اكتمال الإطلاق.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    priceLabel: "قريبًا",
    period: "قيد التحضير",
    yearlyPeriod: "قيد التحضير",
    buttonText: "سجّل اهتمامك لاحقًا",
    secondaryButtonText: "الخطط قيد التحضير",
    buttonVariant: "default" as const,
    popular: true,
    includes: [
      "كل ما تحتاجه قبل قرار الشراء:",
      "أسئلة أكثر للمساعد الإرشادي",
      "تقديرات تكلفة تشغيل أولية",
      "حفظ ملفك وتفضيلاتك",
      "اقتراحات مبدئية حسب استخدامك اليومي",
      "دعم موديلات إضافية بعد المراجعة",
    ],
  },
  {
    name: "Pro",
    description:
      "لمن يريد متابعة أعمق قبل الشراء وبعد امتلاك السيارة.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    priceLabel: "قريبًا",
    period: "قيد التحضير",
    yearlyPeriod: "قيد التحضير",
    buttonText: "قريبًا",
    secondaryButtonText: "سجّل اهتمامك",
    buttonVariant: "outline" as const,
    includes: [
      "للمتابعة المتقدمة:",
      "كل مزايا Plus",
      "تقارير تمهيدية أوضح عن التكلفة والملكية",
      "دعم أوسع للسيارات والموديلات بعد التحقق",
      "تنبيهات وتحديثات مستقبلية",
      "مميزات قادمة لأصحاب السيارات",
    ],
  },
];

const PricingSwitch = ({
  onSwitch,
  className,
}: {
  onSwitch: (value: string) => void;
  className?: string;
}) => {
  const [selected, setSelected] = useState("0");

  const handleSwitch = (value: string) => {
    setSelected(value);
    onSwitch(value);
  };

  return (
    <div className={cn("flex justify-center", className)}>
      <div className="relative z-10 mx-auto flex w-fit rounded-xl border border-gray-200 bg-neutral-50 p-1 shadow-[var(--voltjo-shadow-ring)]">
        <button
          type="button"
          onClick={() => handleSwitch("0")}
          className={cn(
            "relative z-10 h-12 w-fit cursor-pointer rounded-xl px-3 py-1 text-sm font-medium transition-colors sm:px-6 sm:py-2 sm:text-base",
            selected === "0"
              ? "text-white"
              : "text-muted-foreground hover:text-black",
          )}
        >
          {selected === "0" && (
            <motion.span
              layoutId="switch"
              className="absolute left-0 top-0 h-12 w-full rounded-xl border-4 border-orange-600 bg-gradient-to-t from-orange-500 via-orange-400 to-orange-600 shadow-sm shadow-orange-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative">شهري</span>
        </button>

        <button
          type="button"
          onClick={() => handleSwitch("1")}
          className={cn(
            "relative z-10 h-12 w-fit flex-shrink-0 cursor-pointer rounded-xl px-3 py-1 text-sm font-medium transition-colors sm:px-6 sm:py-2 sm:text-base",
            selected === "1"
              ? "text-white"
              : "text-muted-foreground hover:text-black",
          )}
        >
          {selected === "1" && (
            <motion.span
              layoutId="switch"
              className="absolute left-0 top-0 h-12 w-full rounded-xl border-4 border-orange-600 bg-gradient-to-t from-orange-500 via-orange-400 to-orange-600 shadow-sm shadow-orange-600"
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
          <span className="relative flex items-center gap-2">
            سنوي
            <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-medium text-black">
              قيد التحضير
            </span>
          </span>
        </button>
      </div>
    </div>
  );
};

export default function Pricing() {
  const [isYearly, setIsYearly] = useState(false);
  const [pricingNotice, setPricingNotice] = useState<string | null>(null);
  const pricingRef = useRef<HTMLDivElement>(null);

  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      transition: {
        delay: i * 0.4,
        duration: 0.5,
      },
    }),
    hidden: {
      y: -20,
      opacity: 0,
    },
  };

  const togglePricingPeriod = (value: string) =>
    setIsYearly(Number.parseInt(value) === 1);

  const showPricingNotice = () => {
    setPricingNotice("الخطط تمهيدية — الاشتراكات والدفع غير مفعّلين حتى الإطلاق الرسمي.");
    window.setTimeout(() => setPricingNotice(null), 3600);
  };

  return (
    <div
      className="relative mx-auto min-h-screen max-w-7xl px-4 pt-20"
      ref={pricingRef}
      dir="rtl"
    >
      <article className="mb-6 max-w-2xl space-y-4 text-right">
        <h2 className="display-heading mb-4 overflow-visible pb-3 text-4xl font-medium leading-[1.46] text-gray-900 md:text-6xl">
          <VerticalCutReveal
            splitBy="words"
            staggerDuration={0.15}
            staggerFrom="first"
            reverse
            containerClassName="justify-start overflow-visible pb-1"
            wordLevelClassName="overflow-visible py-2 -my-2"
            transition={{
              type: "spring",
              stiffness: 250,
              damping: 40,
              delay: 0,
            }}
          >
            خطط مرنة قبل إطلاق VoltJo الرسمي
          </VerticalCutReveal>
        </h2>

        <TimelineContent
          as="p"
          animationNum={0}
          timelineRef={pricingRef}
          customVariants={revealVariants}
          className="w-[86%] text-sm leading-7 text-gray-600 md:text-base md:leading-8"
        >
          تعرّف على الاتجاه المتوقع للخطط قبل الإطلاق. الاشتراكات والدفع غير
          مفعّلين بعد، والأسعار والمزايا قد تتغير قبل الاعتماد النهائي.
        </TimelineContent>

        <TimelineContent
          as="div"
          animationNum={1}
          timelineRef={pricingRef}
          customVariants={revealVariants}
        >
          <PricingSwitch onSwitch={togglePricingPeriod} className="w-fit" />
        </TimelineContent>
      </article>

      <div className="grid items-stretch gap-4 py-6 md:grid-cols-3">
        {plans.map((plan, index) => (
          <TimelineContent
            key={plan.name}
            as="div"
            animationNum={2 + index}
            timelineRef={pricingRef}
            customVariants={revealVariants}
            className="h-full"
          >
            <Card
              className={`relative flex h-full flex-col overflow-hidden transition-all duration-200 hover:-translate-y-1 ${
                plan.popular ? "border-[rgba(255,77,0,0.28)] bg-white ring-1 ring-[rgba(255,77,0,0.18)]" : "bg-white"
              }`}
            >
              <CardHeader className="h-[220px] flex flex-col justify-between space-y-0 text-right">
                <div>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <h3 className="pb-1 text-3xl font-semibold leading-[1.25] text-gray-900 md:text-2xl xl:text-3xl">
                      {plan.name}
                    </h3>
                    {plan.popular ? (
                      <span className="rounded-full bg-[var(--voltjo-orange)] px-3 py-1 text-sm font-medium text-white shadow-[0_0_0_5px_var(--voltjo-orange-glow)]">
                        تمهيدية
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm leading-7 text-gray-600 md:text-xs md:leading-6 xl:text-sm xl:leading-7">
                    {plan.description}
                  </p>
                </div>
                <div className="flex items-baseline justify-start">
                  <span className="text-4xl font-semibold text-gray-900">
                    {plan.priceLabel ? (
                      plan.priceLabel
                    ) : (
                      <>
                        <NumberFlow
                          value={isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                          format={{ minimumFractionDigits: 2, maximumFractionDigits: 2 }}
                          className="text-4xl font-semibold"
                        />
                        <span className="text-2xl"> د.أ</span>
                      </>
                    )}
                  </span>
                  <span className="mr-1 text-gray-600">
                    /{isYearly ? plan.yearlyPeriod : plan.period}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex flex-1 flex-col pt-0">
                <button
                  type="button"
                  onClick={showPricingNotice}
                  className={`mb-3 w-full rounded-xl px-4 py-3 text-base font-bold transition-all ${
                    plan.popular
                      ? "border border-transparent bg-[var(--voltjo-orange)] text-white shadow-[0_0_0_5px_var(--voltjo-orange-glow)] hover:-translate-y-0.5 hover:bg-[var(--voltjo-orange-dark)]"
                      : plan.buttonVariant === "outline"
                        ? "border border-[var(--voltjo-border)] bg-[var(--voltjo-black)] text-white shadow-sm hover:-translate-y-0.5"
                        : "border border-[var(--voltjo-border)] bg-white text-[var(--voltjo-black)] shadow-sm hover:-translate-y-0.5 hover:bg-[var(--voltjo-surface-soft)]"
                  }`}
                >
                  {plan.buttonText}
                </button>
                {plan.secondaryButtonText && (
                  <button
                    type="button"
                    onClick={showPricingNotice}
                    className="mb-6 w-full rounded-full border border-[var(--voltjo-border)] bg-white px-4 py-3 text-base font-bold text-[var(--voltjo-black)] shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[var(--voltjo-surface-soft)]"
                  >
                    {plan.secondaryButtonText}
                  </button>
                )}

                <div className="flex-1 space-y-3 border-t border-neutral-200 pt-4">
                  <h2 className="mb-3 text-xl font-semibold uppercase text-gray-900">
                    المزايا
                  </h2>
                  <h4 className="mb-3 text-base font-medium text-gray-900">
                    {plan.includes[0]}
                  </h4>
                  <ul className="space-y-2 font-semibold">
                    {plan.includes.slice(1).map((feature) => (
                      <li key={feature} className="flex items-center">
                        <span className="ml-3 mt-0.5 grid h-6 w-6 place-content-center rounded-full border border-[rgba(255,77,0,0.24)] bg-white">
                          <CheckCheck className="h-4 w-4 text-[var(--voltjo-orange)]" />
                        </span>
                        <span className="text-sm leading-6 text-gray-600">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TimelineContent>
        ))}
      </div>

      <p className="mx-auto mt-5 max-w-2xl text-center text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
        الخطط تمهيدية — لا توجد اشتراكات أو مدفوعات مفعّلة الآن، والأسعار والمزايا قابلة للتعديل قبل الإطلاق الرسمي.
      </p>
      {pricingNotice ? (
        <p
          role="status"
          aria-live="polite"
          className="mx-auto mt-3 max-w-2xl rounded-full border border-[rgba(255,77,0,0.18)] bg-[rgba(255,77,0,0.06)] px-4 py-2 text-center text-sm font-bold leading-7 text-[var(--voltjo-black)]"
        >
          {pricingNotice}
        </p>
      ) : null}
    </div>
  );
}
