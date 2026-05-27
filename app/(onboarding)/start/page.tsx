import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";
import { getCurrentUser } from "@/lib/auth/session";

export default async function StartPage() {
  const user = await getCurrentUser();
  return <OnboardingFlow isAuthenticated={!!user} />;
}
