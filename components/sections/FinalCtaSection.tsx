import { ArrowUpLeft } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

export function FinalCtaSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8">
      <Container>
        <div className="technical-panel mx-auto max-w-5xl rounded-[34px] border border-[var(--voltjo-border)] bg-white px-7 py-10 text-center shadow-[var(--voltjo-shadow-soft)] sm:px-12 sm:py-12 lg:rounded-[999px] lg:px-16 lg:py-14">
          <h2 className="display-heading text-balance text-4xl font-black leading-tight text-[var(--voltjo-black)] sm:text-6xl">
            خلّي قرارك أوضح قبل الشراء
          </h2>
          <p className="mx-auto mt-5 max-w-3xl text-lg font-semibold leading-9 text-[var(--voltjo-muted)]">
            اسأل، قارن، واستعرض تقديرات الشحن في الأردن من مكان واحد مصمم
            ليساعدك ترتّب أسئلتك قبل التحقق من المصادر الرسمية.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button href="/assistant">
              <span className="inline-flex items-center gap-2">
                ابدأ الآن
                <ArrowUpLeft size={18} />
              </span>
            </Button>
          </div>
          <p className="mt-7 text-sm font-black text-[var(--voltjo-muted)]">
            معلومات محلية أولية • بيانات قيد المراجعة • خصوصيتك محمية
          </p>
        </div>
      </Container>
    </section>
  );
}
