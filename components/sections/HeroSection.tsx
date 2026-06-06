import { Container } from "@/components/ui/Container";
import { HeroHeadlineTextType } from "@/components/ui/HeroHeadlineTextType";
import { HeroPromptBox } from "@/components/sections/HeroPromptBox";

export function HeroSection() {
  return (
    <section className="px-4 pb-16 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-28">
      <Container>
        <div className="technical-panel mx-auto max-w-5xl rounded-[28px] border border-[var(--voltjo-border)] bg-white/78 px-4 py-12 text-center shadow-[var(--voltjo-shadow-ring)] sm:px-10 lg:px-16">
          <div className="fade-up">
            <HeroHeadlineTextType />
            <p className="mx-auto mt-5 max-w-2xl text-lg font-medium leading-9 text-[var(--voltjo-muted)] sm:text-xl">
              قارن بين السيارات الكهربائية والهايبرد، واستعرض تقديرات تكلفة الشحن، وافهم نقاط الدعم والضمان في السوق الأردني — قبل أي قرار شراء.
            </p>
          </div>

          <HeroPromptBox />
        </div>
      </Container>
    </section>
  );
}
