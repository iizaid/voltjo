import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUserAndProfile } from "@/lib/auth/session";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

export async function GET() {
  const [{ user, profile }, cookieStore] = await Promise.all([
    getCurrentUserAndProfile(),
    cookies(),
  ]);

  const { url, anonKey } = getSupabaseEnv();
  const allCookies = cookieStore.getAll();

  return NextResponse.json(
    {
      authenticated: Boolean(user),
      hasProfile: Boolean(profile),
      onboardingCompleted: profile ? Boolean(profile.onboarding_completed) : null,
      hasSupabaseUrl: Boolean(url),
      hasSupabaseAnonKey: Boolean(anonKey),
      cookieCount: allCookies.length,
      hasSupabaseCookieNamePrefix: allCookies.some((c) =>
        c.name.startsWith("sb-"),
      ),
      hasSupabaseAuthTokenCookie: allCookies.some((c) =>
        c.name.includes("-auth-token"),
      ),
      hasSupabaseCodeVerifierCookie: allCookies.some((c) =>
        c.name.includes("-code-verifier"),
      ),
      timestamp: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}
