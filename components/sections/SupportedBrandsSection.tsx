import { supportedBrands } from "@/data/supported-brands";
import { Container } from "@/components/ui/Container";
import { BrandMarquee } from "@/components/ui/BrandMarquee";

export function SupportedBrandsSection() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
      <Container>
        <div className="technical-panel mx-auto max-w-[1120px] overflow-hidden rounded-[32px] border border-[rgba(13,13,13,0.07)] bg-white/70 p-6 text-center shadow-[0_18px_55px_rgba(13,13,13,0.045)] backdrop-blur-sm sm:p-8">
          <h2 className="text-3xl font-bold text-[var(--voltjo-black)] sm:text-4xl">
            العلامات المدعومة
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-8 text-[var(--voltjo-muted)]">
            استكشف أشهر السيارات الكهربائية والهايبرد التي يدعمها الموقع في
            السوق الأردني.
          </p>

          <BrandMarquee brands={supportedBrands} />
        </div>
      </Container>
    </section>
  );
}
