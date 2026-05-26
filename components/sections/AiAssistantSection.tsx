import { Plus, SendHorizontal, Settings, Share2 } from "lucide-react";
import { VoltJoLogo } from "@/components/brand/VoltJoLogo";
import { Container } from "@/components/ui/Container";
import { SectionLabel } from "@/components/ui/SectionLabel";

const valuePoints = [
  {
    title: "مدرّب على السيارات المدعومة",
    text: "يفهم الموديلات والفئات المنتشرة في السوق الأردني.",
  },
  {
    title: "إجابات مرتبطة بالأردن",
    text: "يعتمد على معلومات محلية حول الشحن، الدعم، الضمان، والاستخدام.",
  },
  {
    title: "أوضح من الذكاء العام لهذه المهمة",
    text: "يركز على أسئلتك الخاصة بالسيارات بدل الإجابات العامة والمشتتة.",
  },
];

const chips = ["مقارنة", "تكلفة الشحن", "الدعم والضمان", "المشاكل الشائعة"];

export function AiAssistantSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <Container>
        <div className="grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <SectionLabel>المساعد الذكي</SectionLabel>
            <h2 className="text-balance text-4xl font-bold leading-tight text-[var(--voltjo-black)] sm:text-[56px]">
              اسأل عن سيارتك
              <br />
              بمساعد يفهم السوق الأردني
            </h2>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-9 text-[var(--voltjo-muted)]">
              ليس مساعداً عاماً. مساعد VoltJo متخصص في السيارات الكهربائية
              والهايبرد التي يدعمها الموقع، ويعتمد على معلومات محلية تساعدك على
              فهم الشحن، المقارنة، الدعم، والملكية بثقة.
            </p>

            <div className="mt-7 overflow-hidden rounded-[8px] border border-[var(--voltjo-border)] bg-white">
              {valuePoints.map((point, index) => (
                <div
                  key={point.title}
                  className={`flex items-start gap-4 px-5 py-4 text-right ${
                    index !== valuePoints.length - 1 ? "border-b border-[var(--voltjo-border-soft)]" : ""
                  }`}
                >
                  <span className="latin text-xs font-bold text-[var(--voltjo-orange)]">
                    0{index + 1}
                  </span>
                  <div>
                    <span className="block text-sm font-bold text-[var(--voltjo-black)]">
                      {point.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-[var(--voltjo-muted)]">
                      {point.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[12px] border border-[var(--voltjo-border)] bg-white p-2.5 shadow-sm">
            <div className="flex min-h-[620px] overflow-hidden rounded-[10px] border border-[var(--voltjo-border-soft)] bg-[var(--voltjo-bg-soft)]">
              <aside className="hidden w-44 shrink-0 border-l border-[var(--voltjo-border-soft)] bg-white p-4 md:block">
                <VoltJoLogo compact />
                <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-[6px] bg-[var(--voltjo-black)] px-3 py-2 text-xs font-bold on-dark-fg transition-all hover:bg-black/90">
                  <Plus size={14} />
                  محادثة جديدة
                </button>
                <div className="mt-5 space-y-2">
                  {["BYD Song Plus", "تكلفة الشحن", "مقارنة Toyota"].map((item) => (
                    <div
                      key={item}
                      className="latin truncate rounded-[6px] border border-[var(--voltjo-border-soft)] bg-white px-3 py-1.5 text-left text-xs font-semibold text-[var(--voltjo-muted)] transition-colors hover:bg-[var(--voltjo-bg-soft)]"
                      dir="ltr"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </aside>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--voltjo-border-soft)] bg-white px-4 py-3">
                  <div className="flex items-center gap-3">
                    <VoltJoLogo compact />
                    <div>
                      <p className="latin text-left text-sm font-black text-[var(--voltjo-black)]" dir="ltr">
                        VoltJo Assistant
                      </p>
                      <p className="text-[10px] font-bold text-[var(--voltjo-muted)]">
                        مساعد متخصص للسوق الأردني
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[
                      ["إعدادات", Settings],
                      ["مشاركة", Share2],
                      ["محادثة جديدة", Plus],
                    ].map(([label, Icon]) => (
                      <button
                        key={label as string}
                        className="inline-flex items-center gap-1 rounded-[6px] border border-[var(--voltjo-border)] bg-white px-2.5 py-1.5 text-[11px] font-bold text-[var(--voltjo-muted)] hover:text-[var(--voltjo-orange)] transition-colors"
                      >
                        <Icon size={12} />
                        <span className="hidden sm:inline">{label as string}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 space-y-5 p-4 sm:p-5">
                  <div className="mr-auto max-w-[82%] rounded-[8px] bg-[var(--voltjo-black)] px-4 py-3 text-right text-xs font-semibold leading-6 on-dark-fg shadow-sm">
                    هل سيارة BYD Song Plus DM-i مناسبة للاستخدام اليومي في الأردن؟
                  </div>

                  <div className="max-w-[88%] rounded-[8px] border border-[var(--voltjo-border-soft)] bg-white p-4 text-right shadow-sm">
                    <p className="text-xs font-semibold leading-6 text-[var(--voltjo-muted)]">
                      نعم، BYD Song Plus DM-i مناسبة جدًا للاستخدام اليومي في
                      الأردن، خاصة إذا كان لديك إمكانية الشحن المنزلي.
                    </p>
                    <ul className="mt-3 space-y-2 text-xs font-semibold leading-6 text-[var(--voltjo-muted)]">
                      <li>• مدى كهربائي مناسب للاستخدام داخل المدن.</li>
                      <li>• نظام هايبرد يقلل استهلاك الوقود على الطرق الطويلة.</li>
                      <li>• تكلفة تشغيل منخفضة مقارنة بسيارات البنزين.</li>
                    </ul>
                    <p className="mt-3 text-xs font-semibold leading-6 text-[var(--voltjo-muted)]">
                      يمكنني أيضًا مقارنتها مع موديلات أخرى أو تقدير تكلفة الشحن
                      الشهرية بناءً على مكانك.
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {chips.map((chip) => (
                      <button
                        key={chip}
                        className="rounded-[6px] border border-[var(--voltjo-border)] bg-white px-3 py-1.5 text-[11px] font-bold text-[var(--voltjo-muted)] hover:border-[rgba(255,106,0,0.35)] hover:text-[var(--voltjo-orange)] transition-colors"
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-[var(--voltjo-border-soft)] bg-white p-3">
                  <div className="flex items-center gap-2 rounded-[8px] border border-[var(--voltjo-border)] bg-[var(--voltjo-bg-soft)] p-1.5">
                    <input
                      aria-label="رسالة المساعد"
                      className="min-h-10 flex-1 bg-transparent px-3 text-xs font-semibold outline-none placeholder:text-[var(--voltjo-muted)]"
                      placeholder="اسأل عن سيارتك، الشحن، التكلفة، الدعم..."
                    />
                    <button
                      aria-label="إرسال"
                      className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-[var(--voltjo-orange)] on-dark-fg transition-all hover:opacity-90"
                    >
                      <SendHorizontal size={15} />
                    </button>
                  </div>
                  <p className="mt-2.5 text-center text-[10px] font-bold text-[var(--voltjo-muted)]">
                    قد تختلف النتائج حسب البيانات المتاحة — راجع التفاصيل داخل
                    لوحة السيارة.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
