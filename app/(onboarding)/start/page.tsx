import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { redirect } from "next/navigation";
import { getCurrentUserAndProfile } from "@/lib/auth/session";

export default async function StartPage() {
  const { user, profile } = await getCurrentUserAndProfile();

  if (user && profile?.onboarding_completed) {
    redirect("/assistant");
  }

  return <OnboardingFlow isAuthenticated={!!user} />;
}
