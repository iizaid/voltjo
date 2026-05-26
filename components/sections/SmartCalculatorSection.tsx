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
          <div className="grid gap-px overflow-hidden rounded-[8px] border border-[var(--voltjo-border-soft)] bg-[var(--voltjo-border-soft)] sm:grid-cols-2 lg:grid-cols-4">
            {inputs.map(([label, value]) => (
              <div
                key={label}
                className="bg-white p-4 text-right transition-colors hover:bg-[var(--voltjo-bg-soft)]"
              >
                <p className="text-xs font-semibold tracking-wide text-[var(--voltjo-muted)]">
                  {label}
                </p>
                <p className="mt-1 text-base font-bold text-[var(--voltjo-black)]">
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-3">
            {results.map(([label, value], index) => (
              <div
                key={label}
                className={`rounded-[8px] border p-5 text-right transition-all ${
                  index === 0
                    ? "border-[rgba(255,106,0,0.3)] bg-[var(--voltjo-orange-soft)]/20 shadow-sm"
                    : "border-[var(--voltjo-border-soft)] bg-white"
                }`}
              >
                <p className="text-xs font-semibold tracking-wide text-[var(--voltjo-muted)]">
                  {label}
                </p>
                <p className={`mt-2 text-2xl font-black ${index === 0 ? "text-[var(--voltjo-orange)]" : "text-[var(--voltjo-black)]"}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-[8px] border border-[var(--voltjo-border-soft)] bg-white p-4">
            <div className="mb-3 text-right text-xs font-bold uppercase tracking-wider text-[var(--voltjo-muted)]">
              مقارنة طرق الشحن
            </div>
            <div className="grid gap-px overflow-hidden rounded-[6px] border border-[var(--voltjo-border-soft)] bg-[var(--voltjo-border-soft)] md:grid-cols-3">
              {comparisons.map(([label, value]) => (
                <div
                  key={label}
                  className="flex items-center justify-between bg-white px-4 py-3"
                >
                  <span className="text-xs font-semibold text-[var(--voltjo-muted)]">
                    {label}
                  </span>
                  <span className="text-sm font-bold text-[var(--voltjo-black)]">
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
                className="rounded-[8px] border border-[var(--voltjo-border)] bg-white/88 px-5 py-3 text-center text-sm font-bold text-[var(--voltjo-black)] shadow-sm"
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
