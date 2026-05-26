"use client";

import {
  BatteryCharging,
  Calculator,
  Car,
  Gauge,
  Home,
  Landmark,
  Route,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

type ChargingMode = {
  id: string;
  label: string;
  detail: string;
  icon: LucideIcon;
  cost100: string;
  monthly: string;
  best: string;
};

const inputNodes = [
  { label: "السيارة", value: "BYD Song Plus DM-i", icon: Car },
  { label: "المسافة اليومية", value: "45 كم", icon: Route },
  { label: "طريقة الشحن", value: "تتغير حسب اختيارك", icon: BatteryCharging },
];

const chargingModes: ChargingMode[] = [
  {
    id: "home-off-peak",
    label: "منزلي خارج الذروة",
    detail: "الأقل تكلفة في هذا المثال",
    icon: Home,
    cost100: "0.68 د.أ",
    monthly: "9.20 د.أ",
    best: "منزلي خارج الذروة",
  },
  {
    id: "home-peak",
    label: "منزلي وقت الذروة",
    detail: "أعلى من خارج الذروة",
    icon: Zap,
    cost100: "1.28 د.أ",
    monthly: "17.30 د.أ",
    best: "خارج الذروة أوفر",
  },
  {
    id: "public",
    label: "محطة عامة",
    detail: "مناسب للرحلات والطوارئ",
    icon: Landmark,
    cost100: "2.35 د.أ",
    monthly: "31.70 د.أ",
    best: "المنزلي أوفر غالبًا",
  },
];

const featurePoints = [
  {
    icon: Gauge,
    title: "تقدير سريع قبل الشراء",
    description: "اعرف صورة تقريبية عن تكلفة التشغيل قبل اختيار السيارة.",
  },
  {
    icon: BatteryCharging,
    title: "مقارنة طرق الشحن",
    description: "بدّل بين الشحن المنزلي، وقت الذروة، والمحطات العامة.",
  },
  {
    icon: Route,
    title: "مبني على استخدامك",
    description: "المسافة اليومية وطريقة الشحن تغير النتيجة بشكل واضح.",
  },
];

function FlowLines() {
  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 hidden h-full w-full text-[var(--voltjo-orange)] lg:block"
      viewBox="0 0 780 540"
      fill="none"
      preserveAspectRatio="none"
    >
      <path
        d="M660 88 C560 88 548 202 438 226"
        stroke="currentColor"
        strokeOpacity="0.42"
        strokeWidth="2"
      />
      <path
        d="M662 198 C566 202 548 244 438 258"
        stroke="currentColor"
        strokeOpacity="0.32"
        strokeWidth="2"
      />
      <path
        d="M662 310 C558 306 544 286 438 278"
        stroke="currentColor"
        strokeOpacity="0.26"
        strokeWidth="2"
      />
      <path
        d="M338 255 C250 254 238 128 120 118"
        stroke="currentColor"
        strokeOpacity="0.42"
        strokeWidth="2"
      />
      <path
        d="M338 270 C250 272 238 260 120 260"
        stroke="currentColor"
        strokeOpacity="0.34"
        strokeWidth="2"
      />
      <path
        d="M338 286 C250 290 238 398 120 408"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="2"
      />
      {[660, 438, 338, 120].map((x, index) => (
        <circle
          key={`${x}-${index}`}
          cx={x}
          cy={[88, 226, 255, 118][index]}
          r="4"
          fill="currentColor"
          fillOpacity="0.42"
        />
      ))}
    </svg>
  );
}

export function SmartCostCalculatorSection() {
  const [activeMode, setActiveMode] = useState(chargingModes[0]);

  const results = [
    { label: "تكلفة 100 كم", value: activeMode.cost100 },
    { label: "التكلفة الشهرية", value: activeMode.monthly },
    { label: "أفضل خيار للشحن", value: activeMode.best },
  ];

  return (
    <section className="relative px-4 py-20 sm:px-6 lg:px-8 lg:py-28" dir="rtl">
      <Container>
        <div className="mx-auto max-w-[1220px]">
          <div className="grid items-end gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:gap-12">
            <div className="text-right">
              <span className="inline-flex rounded-full border border-[rgba(255,106,0,0.18)] bg-[rgba(255,106,0,0.07)] px-4 py-2 text-sm font-black text-[var(--voltjo-orange-dark)]">
                حاسبة التكلفة الذكية
              </span>
              <h2 className="mt-5 max-w-2xl text-balance text-4xl font-black leading-[1.25] text-[var(--voltjo-black)] sm:text-5xl">
                احسب تكلفة سيارتك قبل القرار
              </h2>
              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-[var(--voltjo-muted)] sm:text-lg">
                اختر السيارة، طريقة الشحن، وعدد الكيلومترات اليومية — وشاهد
                تقديرًا مبسطًا لتكلفة التشغيل داخل الأردن.
              </p>

              <div className="mt-8 grid gap-3">
                {featurePoints.map(({ icon: Icon, title, description }) => (
                  <div
                    key={title}
                    className="group flex gap-4 border-b border-[var(--voltjo-border-soft)] pb-4 last:border-b-0"
                  >
                    <span className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-[var(--voltjo-border-soft)] bg-white text-[var(--voltjo-black)] transition-colors group-hover:border-[rgba(255,106,0,0.32)] group-hover:text-[var(--voltjo-orange)]">
                      <Icon size={18} />
                    </span>
                    <div>
                      <h3 className="text-base font-black leading-7 text-[var(--voltjo-black)]">
                        {title}
                      </h3>
                      <p className="mt-1 text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Button href="/calculators?tool=charging-cost">
                  جرّب الحاسبة
                </Button>
                <Button href="/compare" variant="secondary">
                  قارن بين سيارتين
                </Button>
              </div>

              <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-[var(--voltjo-muted)]">
                الأرقام تقديرية وقد تختلف حسب التعرفة، طريقة القيادة، وحالة السيارة.
              </p>
            </div>

            <div className="relative min-h-[640px] overflow-hidden rounded-[28px] border border-[var(--voltjo-border)] bg-white shadow-[0_28px_90px_rgba(13,13,13,0.08)]">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(13,13,13,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(13,13,13,0.045)_1px,transparent_1px)] bg-[size:42px_42px]" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_54%_46%,rgba(255,106,0,0.12),transparent_30%)]" />
              <FlowLines />

              <div className="relative z-10 flex min-h-[640px] flex-col justify-between p-4 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-black text-[var(--voltjo-black)]">
                      لوحة تقدير تفاعلية
                    </p>
                    <p className="mt-1 text-xs font-semibold text-[var(--voltjo-muted)]">
                      اضغط طريقة الشحن لتغيير أرقام العرض التجريبية
                    </p>
                  </div>
                  <span className="grid h-11 w-11 place-items-center rounded-[12px] border border-[rgba(255,106,0,0.18)] bg-[rgba(255,106,0,0.08)] text-[var(--voltjo-orange)]">
                    <Calculator size={20} />
                  </span>
                </div>

                <div className="grid gap-4 lg:grid-cols-[1fr_180px_1fr] lg:items-center">
                  <div className="grid gap-3">
                    {results.map((result) => (
                      <div
                        key={result.label}
                        className="rounded-[16px] border border-[rgba(255,106,0,0.18)] bg-white/92 px-4 py-4 shadow-[0_10px_30px_rgba(13,13,13,0.04)]"
                      >
                        <p className="text-xs font-bold leading-6 text-[var(--voltjo-muted)]">
                          {result.label}
                        </p>
                        <p className="mt-1 text-xl font-black leading-8 text-[var(--voltjo-orange)]">
                          {result.value}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="relative mx-auto my-3 grid h-40 w-40 place-items-center rounded-full border border-[rgba(255,106,0,0.24)] bg-white/86 shadow-[0_20px_60px_rgba(255,106,0,0.12)] lg:my-0">
                    <div className="absolute inset-4 rounded-full border border-[rgba(13,13,13,0.08)]" />
                    <div className="absolute inset-8 rounded-full bg-[rgba(255,106,0,0.08)]" />
                    <div className="relative grid h-20 w-20 place-items-center rounded-full bg-[var(--voltjo-black)] text-white">
                      <Zap size={28} />
                    </div>
                  </div>

                  <div className="grid gap-3">
                    {inputNodes.map(({ icon: Icon, label, value }) => (
                      <div
                        key={label}
                        className="flex items-center gap-3 rounded-[16px] border border-[var(--voltjo-border-soft)] bg-white/92 px-4 py-3 shadow-[0_10px_30px_rgba(13,13,13,0.035)]"
                      >
                        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] border border-[var(--voltjo-border-soft)] bg-[#fafafa] text-[var(--voltjo-black)]">
                          <Icon size={17} />
                        </span>
                        <div>
                          <p className="text-xs font-bold text-[var(--voltjo-muted)]">
                            {label}
                          </p>
                          <p className="mt-1 text-sm font-black leading-6 text-[var(--voltjo-black)]">
                            {value}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[18px] border border-[var(--voltjo-border-soft)] bg-white/90 p-3">
                  <p className="mb-3 px-1 text-sm font-black text-[var(--voltjo-black)]">
                    اختر طريقة الشحن للمعاينة
                  </p>
                  <div className="grid gap-2 sm:grid-cols-3">
                    {chargingModes.map((mode) => {
                      const Icon = mode.icon;
                      const isActive = activeMode.id === mode.id;

                      return (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => setActiveMode(mode)}
                          className={`rounded-[14px] border px-3 py-3 text-right transition-all ${
                            isActive
                              ? "border-[rgba(255,106,0,0.42)] bg-[rgba(255,106,0,0.08)]"
                              : "border-[var(--voltjo-border-soft)] bg-white hover:border-[rgba(255,106,0,0.22)]"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <Icon
                              size={16}
                              className={
                                isActive
                                  ? "text-[var(--voltjo-orange)]"
                                  : "text-[var(--voltjo-black)]"
                              }
                            />
                            <span className="text-sm font-black leading-6 text-[var(--voltjo-black)]">
                              {mode.label}
                            </span>
                          </span>
                          <span className="mt-1 block text-xs font-semibold leading-6 text-[var(--voltjo-muted)]">
                            {mode.detail}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
