import Pricing from "@/components/ui/pricing";

export function PricingSection() {
  return (
    <section id="pricing" className="relative z-10 py-24 sm:py-28">
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8">
        <Pricing />
      </div>
    </section>
  );
}
