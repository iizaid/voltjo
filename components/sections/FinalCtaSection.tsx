import { ArrowUpLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function FinalCtaSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <Container>
        <div className="technical-panel mx-auto max-w-5xl rounded-[42px] border border-[rgba(255,106,0,0.18)] bg-white px-7 py-10 text-center shadow-[0_28px_90px_rgba(13,13,13,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] sm:rounded-[64px] sm:px-12 sm:py-12 lg:rounded-[999px] lg:px-16 lg:py-14">
          <h2 className="display-heading text-balance text-4xl font-black leading-tight text-[var(--voltjo-black)] sm:text-6xl">
            خلّي قرارك أوضح قبل الشراء
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-semibold leading-9 text-[var(--voltjo-muted)]">
            اسأل، قارن، واحسب تكلفة الشحن في الأردن من مكان واحد مصمم
            ليساعدك تختار بثقة وهدوء.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/assistant">
              <span className="inline-flex items-center gap-2">
                ابدأ الآن
                <ArrowUpLeft size={18} />
              </span>
            </Button>
            <Button href="/charging-calculator" variant="secondary">
              جرّب الحاسبة
            </Button>
          </div>
          <p className="mt-7 text-sm font-black text-[var(--voltjo-muted)]">
            معلومات محلية موثوقة • بيانات محدثة باستمرار • خصوصيتك محمية
          </p>
        </div>
      </Container>
    </section>
  );
}
