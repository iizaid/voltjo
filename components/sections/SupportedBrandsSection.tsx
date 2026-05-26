import { supportedBrands } from "@/data/supported-brands";
import { Container } from "@/components/ui/Container";
import { LogoCloud } from "@/components/ui/LogoCloud";

export function SupportedBrandsSection() {
  return (
    <section className="px-4 py-14 sm:px-6 sm:py-[72px] lg:px-8 lg:py-20">
      <Container>
        <div className="mx-auto max-w-[1120px] text-center">
          <h2 className="text-2xl font-bold text-[var(--voltjo-black)] sm:text-3xl">
            العلامات المدعومة
          </h2>
          <p className="mx-auto mt-2 max-w-2xl text-sm font-bold leading-8 text-[var(--voltjo-muted)] sm:text-base">
            استكشف أشهر شركات السيارات الكهربائية والهايبرد التي يدعمها VoltJo في السوق الأردني.
          </p>

          <LogoCloud brands={supportedBrands} />
        </div>
      </Container>
    </section>
  );
}
