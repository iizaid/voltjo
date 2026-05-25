import { ArrowUpLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function FinalCtaSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <Container>
        <div className="technical-panel mx-auto max-w-5xl rounded-[38px] border border-[rgba(255,106,0,0.18)] bg-white p-7 text-center soft-shadow sm:p-10 lg:p-14">
          <h2 className="text-balance text-4xl font-black leading-tight text-[var(--voltjo-black)] sm:text-6xl">
            جاهز تختار سيارتك بثقة؟
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-semibold leading-9 text-[var(--voltjo-muted)]">
            ابدأ مع مساعد VoltJo الذكي، قارن بين أي سيارتين، أو احسب تكلفة
            الشحن في الأردن خلال ثوانٍ.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/assistant">
              <span className="inline-flex items-center gap-2">
                ابدأ الآن
                <ArrowUpLeft size={18} />
              </span>
            </Button>
            <Button href="/calculators" variant="secondary">
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
