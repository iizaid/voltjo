import { Container } from "@/components/ui/Container";
import { HeroHeadlineTextType } from "@/components/ui/HeroHeadlineTextType";
import { HeroPromptBox } from "@/components/sections/HeroPromptBox";

export function HeroSection() {
  return (
    <section className="px-4 pb-24 pt-20 sm:px-6 sm:pb-28 sm:pt-24 lg:px-8 lg:pb-36 lg:pt-32" dir="rtl">
      <Container>
        <div className="mx-auto max-w-4xl text-center">
          <div>
            <HeroHeadlineTextType />
            
            <p className="mx-auto mt-6 max-w-2xl text-[17px] font-bold leading-9 text-[var(--voltjo-muted)] sm:text-lg md:text-[20px] md:leading-10">
              قارن بين السيارات الكهربائية والهايبرد، واستعرض تقديرات تكلفة الشحن، وافهم نقاط الدعم والضمان في السوق الأردني — قبل أي قرار شراء.
            </p>
          </div>

          <HeroPromptBox />
        </div>
      </Container>
    </section>
  );
}
