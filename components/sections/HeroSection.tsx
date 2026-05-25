import Link from "next/link";
import { ArrowUpLeft, Search } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";

const trustItems = ["بيانات موثوقة", "رؤى محلية", "دعم للملكية"];
const quickActions = ["مقارنة السيارات", "تكلفة الشحن", "اسأل المساعد", "دليل السوق"];

export function HeroSection() {
  return (
    <section className="px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-28">
      <Container>
        <div className="technical-panel mx-auto max-w-6xl rounded-[42px] px-2 py-10 text-center sm:px-8 lg:px-12">
          <div className="fade-up">
            <Badge>منصة أردنية للسيارات الكهربائية والهايبرد</Badge>
            <h1 className="mx-auto mt-6 max-w-5xl text-balance text-[42px] font-bold leading-[1.28] tracking-normal text-[var(--voltjo-black)] sm:text-[62px] lg:text-[70px]">
              اعرف السيارة الأنسب لك في الأردن
              <br />
              <span className="orange-highlight block pt-1 sm:pt-2">
                بثقة وبمعلومات دقيقة
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg font-medium leading-9 text-[var(--voltjo-muted)] sm:text-xl">
              قارن بين السيارات، احسب تكلفة الشحن، وافهم الدعم والضمان
              والمواصفات قبل الشراء — كل ذلك في مكان واحد مصمم للسوق الأردني.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              {trustItems.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center rounded-full border border-[var(--voltjo-border)] bg-white/92 px-4 py-2 text-sm font-bold text-[var(--voltjo-muted)]"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="input-glow mx-auto mt-8 max-w-4xl rounded-[34px] border border-[var(--voltjo-border)] bg-white p-3 text-right soft-shadow transition sm:p-4">
            <div className="flex flex-col gap-3 rounded-[26px] border border-[var(--voltjo-border-soft)] bg-[var(--voltjo-bg-soft)] p-3 sm:flex-row sm:items-center">
              <div className="flex min-h-14 flex-1 items-center gap-3 rounded-2xl bg-white px-4">
                <Search className="text-[var(--voltjo-muted)]" size={21} />
                <input
                  aria-label="سؤال VoltJo"
                  className="w-full bg-transparent text-base font-bold text-[var(--voltjo-black)] outline-none placeholder:text-[var(--voltjo-muted)]"
                  placeholder="اسأل عن سيارة، قارن بين موديلين، أو احسب تكلفة الشحن..."
                />
              </div>
              <Button href="/assistant" className="min-h-14 px-7">
                <span className="inline-flex items-center gap-2">
                  ابدأ
                  <ArrowUpLeft size={18} />
                </span>
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action}
                  href={action === "تكلفة الشحن" ? "/calculators" : "/assistant"}
                  className="inline-flex items-center rounded-full border border-[var(--voltjo-border)] bg-white px-4 py-2 text-sm font-bold text-[var(--voltjo-muted)] transition hover:border-[var(--voltjo-border-strong)] hover:text-[var(--voltjo-black)]"
                >
                  {action}
                </Link>
              ))}
            </div>
          </div>

          <p className="mx-auto mt-5 max-w-2xl text-sm font-bold leading-7 text-[var(--voltjo-muted)]">
            ابدأ سؤالك الآن — وسيتم نقلك إلى حسابك أو إنشاء حساب لمتابعة داخل
            المساعد الذكي.
          </p>
        </div>
      </Container>
    </section>
  );
}
