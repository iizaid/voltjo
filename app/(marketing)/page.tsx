import { AiAssistantSection } from "@/components/sections/AiAssistantSection";
import { FinalCtaSection } from "@/components/sections/FinalCtaSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { SupportedBrandsSection } from "@/components/sections/SupportedBrandsSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <SupportedBrandsSection />
      <AiAssistantSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCtaSection />
    </>
  );
}
