import { NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/auth/session";

export async function GET() {
  const { user, profile } = await getCurrentUserAndProfile();

  return NextResponse.json(
    {
      authenticated: Boolean(user),
      hasProfile: Boolean(profile),
      onboardingCompleted: profile ? Boolean(profile.onboarding_completed) : null,
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
