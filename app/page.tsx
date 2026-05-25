import { AiAssistantSection } from "@/components/sections/AiAssistantSection";
import { FinalCtaSection } from "@/components/sections/FinalCtaSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { SmartCalculatorSection } from "@/components/sections/SmartCalculatorSection";
import { SupportedBrandsSection } from "@/components/sections/SupportedBrandsSection";

export default function Home() {
  return (
    <>
      <HeroSection />
      <SupportedBrandsSection />
      <SmartCalculatorSection />
      <AiAssistantSection />
      <FinalCtaSection />
    </>
  );
}
