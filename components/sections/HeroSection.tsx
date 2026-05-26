import Link from "next/link";
import { ArrowUp } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { HeroHeadlineTextType } from "@/components/ui/HeroHeadlineTextType";

const quickActions = [
  { label: "مقارنة السيارات", href: "/assistant" },
  { label: "تكلفة الشحن", href: "/calculators" },
  { label: "اسأل المساعد", href: "/assistant" },
  { label: "دليل السوق", href: "/assistant" },
];

export function HeroSection() {
  return (
    <section className="px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-28">
      <Container>
        <div className="technical-panel mx-auto max-w-5xl rounded-[14px] border border-[var(--voltjo-border)] bg-white/50 px-4 py-12 text-center sm:px-10 lg:px-16">
          <div className="fade-up">
            <HeroHeadlineTextType />
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-9 text-[var(--voltjo-muted)] sm:text-xl">
              قارن بين السيارات الكهربائية والهايبرد، احسب تكلفة الشحن الحقيقية، وافهم الدعم والضمان في السوق الأردني — قبل أي قرار شراء.
            </p>
          </div>

          {/* Chat-style composer box */}
          <div className="mx-auto mt-10 max-w-3xl" dir="rtl">
            <div className="rounded-[20px] border border-[rgba(13,13,13,0.12)] bg-[#FEFEFC] p-3 shadow-[0_4px_16px_rgba(13,13,13,0.04)] transition-shadow focus-within:shadow-[0_4px_20px_rgba(13,13,13,0.08)]">
              {/* Textarea */}
              <textarea
                aria-label="سؤال VoltJo"
                className="min-h-[72px] w-full resize-none bg-transparent px-2 py-2 text-right text-[15px] font-medium leading-7 text-[var(--voltjo-black)] outline-none placeholder:text-[var(--voltjo-muted)]"
                placeholder="اسأل عن سيارة، قارن بين موديلين، أو احسب تكلفة الشحن..."
                rows={2}
              />

              {/* Bottom row: quick chips + send button */}
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1">
                {/* Quick actions as light chips */}
                <div className="flex flex-wrap gap-1.5">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="inline-flex items-center rounded-lg border border-[rgba(13,13,13,0.08)] bg-white px-3 py-1.5 text-[13px] font-semibold text-[var(--voltjo-muted)] transition hover:border-[rgba(13,13,13,0.16)] hover:text-[var(--voltjo-black)]"
                    >
                      {action.label}
                    </Link>
                  ))}
                </div>

                {/* Send button */}
                <Link
                  href="/assistant"
                  aria-label="ابدأ"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--voltjo-orange)] text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:bg-[#e85e00]"
                >
                  <ArrowUp size={17} />
                </Link>
              </div>
            </div>

            {/* Helper text */}
            <p className="mt-4 text-center text-[12px] font-medium leading-6 text-[var(--voltjo-muted)]/70">
              ابدأ سؤالك الآن — وسيتم نقلك إلى حسابك أو إنشاء حساب لمتابعة داخل المساعد الذكي.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}
