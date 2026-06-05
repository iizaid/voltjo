import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "ابدأ تجربتك | VoltJo",
  description:
    "أنشئ ملفك الذكي في VoltJo وابدأ تجربة مخصصة لاستكشاف السيارات الكهربائية داخل الأردن.",
  openGraph: {
    title: "ابدأ تجربتك | VoltJo",
    description:
      "أنشئ ملفك الذكي وابدأ رحلتك نحو السيارات الكهربائية والهايبرد في الأردن.",
  },
};

export default async function StartPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (user && profile?.onboarding_completed) {
    redirect("/assistant");
  }

  return <OnboardingFlow isAuthenticated={!!user} />;
}
