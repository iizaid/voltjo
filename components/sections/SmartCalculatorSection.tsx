import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";
import { SoftCard } from "@/components/ui/SoftCard";

const inputs = [
  ["السيارة", "BYD Song Plus DM-i"],
  ["المسافة اليومية", "45 كم"],
  ["الشحن", "منزلي"],
  ["الوقت", "خارج الذروة"],
];

const results = [
  ["تكلفة 100 كم", "0.68 د.أ"],
  ["التكلفة الشهرية التقريبية", "9.20 د.أ"],
  ["أفضل خيار للشحن", "منزلي خارج الذروة"],
];

const comparisons = [
  ["منزلي خارج الذروة", "0.68 د.أ"],
  ["منزلي وقت الذروة", "1.28 د.أ"],
  ["محطة عامة", "2.35 د.أ"],
];

export function SmartCalculatorSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <Container>
        <div className="mx-auto max-w-6xl text-center">
          <SectionLabel>حاسبة ذكية للتكلفة والتشغيل</SectionLabel>
          <h2 className="text-balance text-4xl font-bold leading-tight text-[var(--voltjo-black)] sm:text-[56px]">
            اعرف التكلفة <span className="orange-highlight">الحقيقية</span> قبل
            القرار
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-9 text-[var(--voltjo-muted)]">
            اختر السيارة، وطريقة الشحن، وعدد الكيلومترات اليومية — وشاهد تكلفة
            الشحن، تكلفة 100 كم، والتكلفة الشهرية التقريبية حسب استخدامك داخل
            الأردن.
          </p>
        </div>

        <SoftCard className="technical-panel mx-auto mt-10 max-w-6xl p-4 sm:p-6 lg:p-8">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {inputs.map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-[var(--voltjo-border-soft)] bg-[var(--voltjo-bg-soft)] p-4 text-right"
              >
                <p className="text-sm font-bold text-[var(--voltjo-muted)]">
                  {label}
                </p>
                <p className="mt-2 text-lg font-bold text-[var(--voltjo-black)]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-3 lg:grid-cols-3">
            {results.map(([label, value], index) => (
              <div
                key={label}
                className={`rounded-[24px] border p-5 text-right ${
                  index === 0
                    ? "border-[rgba(255,106,0,0.25)] bg-[var(--voltjo-orange-soft)]"
                    : "border-[var(--voltjo-border-soft)] bg-white"
                }`}
              >
                <p className="text-sm font-bold text-[var(--voltjo-muted)]">
                  {label}
                </p>
                <p className="mt-2 text-3xl font-bold text-[var(--voltjo-black)]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[24px] border border-[var(--voltjo-border-soft)] bg-white p-4">
            <div className="mb-4 text-right text-base font-bold text-[var(--voltjo-black)]">
              مقارنة طرق الشحن
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              {comparisons.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between rounded-2xl bg-[var(--voltjo-bg-soft)] px-4 py-3"
                >
                  <span className="text-sm font-bold text-[var(--voltjo-muted)]">
                    {label}
                  </span>
                  <span className="text-lg font-bold text-[var(--voltjo-black)]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </SoftCard>

        <div className="mx-auto mt-7 grid max-w-5xl gap-3 md:grid-cols-3">
          {["تكلفة 100 كم", "مقارنة بين طرق الشحن", "تقدير شهري واضح"].map(
            (feature) => (
              <div
                key={feature}
                className="rounded-2xl border border-[var(--voltjo-border)] bg-white/88 px-5 py-4 text-center text-base font-bold text-[var(--voltjo-black)]"
              >
                {feature}
              </div>
            ),
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/calculators">جرّب الحاسبة</Button>
          <Button href="/compare" variant="secondary">
            قارن بين سيارتين
          </Button>
        </div>
      </Container>
    </section>
  );
}
