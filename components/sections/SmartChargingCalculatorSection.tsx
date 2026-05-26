import {
  BatteryCharging,
  Calculator,
  Car,
  Clock3,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

type InputItem = {
  title: string;
  value: string;
  icon: LucideIcon;
};

type ResultItem = {
  label: string;
  value: string;
  highlight?: boolean;
};

const inputItems: InputItem[] = [
  { title: "السيارة", value: "BYD Song Plus DM-i", icon: Car },
  { title: "المسافة اليومية", value: "45 كم", icon: Gauge },
  { title: "نوع الشحن", value: "شحن منزلي", icon: BatteryCharging },
  { title: "وقت الشحن", value: "خارج أوقات الذروة", icon: Clock3 },
];

const resultItems: ResultItem[] = [
  { label: "تكلفة 100 كم", value: "0.68 د.أ" },
  { label: "التكلفة الشهرية", value: "9.20 د.أ" },
  { label: "أفضل خيار", value: "منزلي خارج الذروة", highlight: true },
];

function ConnectorLines() {
  const inputLinePaths = [70, 160, 250, 340].map((y) => ({
    id: `input-${y}`,
    d: `M 320 ${y} C 410 ${y}, 438 215, 515 215`,
  }));
  const outputLinePath = "M 665 215 C 742 215, 780 215, 852 215";

  return (
    <svg
      aria-hidden="true"
      className="smart-calculator-line pointer-events-none absolute inset-0 hidden h-full w-full lg:block"
      viewBox="0 0 1180 430"
      fill="none"
      preserveAspectRatio="none"
    >
      {inputLinePaths.map((path) => (
        <path
          key={path.id}
          d={path.d}
          stroke="rgba(255,106,0,0.38)"
          strokeWidth="2"
          strokeLinecap="round"
        />
      ))}

      {inputLinePaths.map((path, index) => (
        <path
          key={`${path.id}-pulse`}
          d={path.d}
          className="smart-calculator-energy smart-calculator-energy-input"
          style={{ animationDelay: `${index * 0.34}s` }}
        />
      ))}

      {[70, 160, 250, 340].map((y) => (
        <circle
          key={`dot-${y}`}
          className="smart-calculator-node"
          cx="320"
          cy={y}
          r="4"
          fill="rgba(255,106,0,0.52)"
        />
      ))}

      <circle
        className="smart-calculator-node smart-calculator-node-core"
        cx="515"
        cy="215"
        r="5"
        fill="rgba(255,106,0,0.58)"
      />
      <path
        d={outputLinePath}
        stroke="rgba(255,106,0,0.62)"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d={outputLinePath}
        className="smart-calculator-energy smart-calculator-energy-output"
      />
      <circle
        className="smart-calculator-node smart-calculator-node-core"
        cx="665"
        cy="215"
        r="5"
        fill="rgba(255,106,0,0.58)"
      />
    </svg>
  );
}

export function SmartChargingCalculatorSection() {
  return (
    <section
      className="smart-calculator-section relative overflow-hidden px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
      dir="rtl"
    >
      <Container>
        <div className="mx-auto max-w-[1240px]">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="mt-5 text-balance text-4xl font-black leading-[1.25] text-[var(--voltjo-black)] sm:text-5xl">
              حوّل استخدامك اليومي إلى رقم واضح
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base font-semibold leading-8 text-[var(--voltjo-muted)] sm:text-lg">
              أدخل السيارة، المسافة، وطريقة الشحن — وشاهد تقديرًا مبسطًا
              لتكلفة التشغيل داخل الأردن.
            </p>
          </div>

          <div className="relative mt-12 rounded-[30px] border border-[var(--voltjo-border)] bg-white/86 p-4 shadow-[0_28px_90px_rgba(13,13,13,0.07)] sm:p-6">
            <div className="absolute inset-0 rounded-[inherit] bg-[linear-gradient(rgba(13,13,13,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(13,13,13,0.045)_1px,transparent_1px)] bg-[size:46px_46px] opacity-75" />
            <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_50%,rgba(255,106,0,0.08),transparent_32%)]" />
            <ConnectorLines />

            <div
              className="relative z-10 grid gap-8 lg:grid-cols-[320px_1fr_320px] lg:items-center"
              dir="ltr"
            >
              <div className="grid gap-4" dir="rtl">
                {inputItems.map(({ icon: Icon, title, value }) => (
                  <div
                    key={title}
                    className="smart-calculator-input group flex items-center gap-4 rounded-[18px] border border-[var(--voltjo-border-soft)] bg-white px-4 py-4 shadow-[0_10px_30px_rgba(13,13,13,0.035)] transition-all duration-200 hover:border-[rgba(255,106,0,0.28)] hover:shadow-[0_16px_40px_rgba(13,13,13,0.055)]"
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[13px] border border-[var(--voltjo-border-soft)] bg-[#fafafa] text-[var(--voltjo-black)] transition-colors group-hover:border-[rgba(255,106,0,0.28)] group-hover:text-[var(--voltjo-orange)]">
                      <Icon size={19} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold leading-6 text-[var(--voltjo-muted)]">
                        {title}
                      </p>
                      <p className="mt-1 rounded-[10px] border border-[var(--voltjo-border-soft)] bg-[#fbfbfb] px-3 py-2 text-sm font-black leading-6 text-[var(--voltjo-black)]">
                        {value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center justify-center" dir="rtl">
                <div className="smart-calculator-hub relative grid h-[210px] w-[210px] place-items-center rounded-full border border-[rgba(255,106,0,0.34)] bg-white shadow-[0_28px_80px_rgba(255,106,0,0.13)]">
                  <div className="absolute inset-[-18px] rounded-full border border-dashed border-[rgba(255,106,0,0.22)]" />
                  <div className="absolute inset-3 rounded-full border border-[rgba(13,13,13,0.08)]" />
                  <div className="absolute inset-8 rounded-full bg-[rgba(255,106,0,0.075)]" />
                  <div className="absolute h-[248px] w-[248px] rounded-full bg-[radial-gradient(circle,rgba(255,106,0,0.14),transparent_62%)]" />

                  <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="grid h-24 w-24 place-items-center rounded-full border border-white/70 bg-[var(--voltjo-black)] text-white shadow-[0_18px_45px_rgba(13,13,13,0.16)]">
                      <Calculator size={38} strokeWidth={1.8} />
                    </div>
                  </div>
                </div>

                <div className="mt-6 hidden h-16 w-px bg-gradient-to-b from-[var(--voltjo-orange)]/50 to-transparent max-lg:block" />
              </div>

              <div className="smart-calculator-result rounded-[22px] border border-[var(--voltjo-border)] bg-white p-5 shadow-[0_18px_60px_rgba(13,13,13,0.065)]" dir="rtl">
                <div className="mb-5 flex items-center justify-between gap-4 border-b border-[var(--voltjo-border-soft)] pb-4">
                  <div>
                    <p className="text-xl font-black text-[var(--voltjo-black)]">
                      النتيجة
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-6 text-[var(--voltjo-muted)]">
                      تقدير مبسط لقيم العرض فقط
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {resultItems.map((item) => (
                    <div
                      key={item.label}
                      className={`rounded-[16px] border px-4 py-4 ${
                        item.highlight
                          ? "border-[rgba(255,106,0,0.28)] bg-[rgba(255,106,0,0.07)]"
                          : "border-[var(--voltjo-border-soft)] bg-[#fbfbfb]"
                      }`}
                    >
                      <p className="text-xs font-bold leading-6 text-[var(--voltjo-muted)]">
                        {item.label}
                      </p>
                      <p
                        className={`mt-1 text-xl font-black leading-8 ${
                          item.highlight
                            ? "text-[var(--voltjo-black)]"
                            : "text-[var(--voltjo-orange)]"
                        }`}
                      >
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="mt-5 text-xs font-semibold leading-6 text-[var(--voltjo-muted)]">
                  الأرقام تقديرية وقد تختلف حسب التعرفة، طريقة القيادة، وحالة السيارة.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/calculators?tool=charging-cost">
              جرّب الحاسبة
            </Button>
            <Button href="/compare" variant="secondary">
              قارن بين سيارتين
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
