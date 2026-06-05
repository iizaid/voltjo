import type { Metadata } from "next";
import { AiAssistantSection } from "@/components/sections/AiAssistantSection";
import { FinalCtaSection } from "@/components/sections/FinalCtaSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { PricingSection } from "@/components/sections/PricingSection";
import { SmartChargingCalculatorSection } from "@/components/sections/SmartChargingCalculatorSection";
import { SupportedBrandsSection } from "@/components/sections/SupportedBrandsSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";

export const metadata: Metadata = {
  title: "VoltJo | دليل السيارات الكهربائية والهايبرد في الأردن",
  description:
    "منصة أردنية لاستكشاف السيارات الكهربائية والهايبرد، وحساب تكلفة الشحن، والحصول على إجابات من المساعد الإرشادي التجريبي.",
  openGraph: {
    title: "VoltJo | دليل السيارات الكهربائية والهايبرد في الأردن",
    description:
      "منصة أردنية لاستكشاف السيارات الكهربائية والهايبرد وحساب تكلفة الشحن داخل الأردن.",
  },
};

export default function Home() {
  return (
    <>
      <HeroSection />
      <SupportedBrandsSection />
      <SmartChargingCalculatorSection />
      <AiAssistantSection />
      <TestimonialsSection />
      <PricingSection />
      <FinalCtaSection />
    </>
  );
}
