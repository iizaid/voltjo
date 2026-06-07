import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSafeRedirectPath } from "@/lib/auth/redirect";

const AUTH_ERROR_REDIRECT_PATH = "/start?auth_error=callback";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    if (!supabase) {
      return NextResponse.redirect(new URL(AUTH_ERROR_REDIRECT_PATH, request.url));
    }

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(AUTH_ERROR_REDIRECT_PATH, request.url));
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.onboarding_completed) {
        return NextResponse.redirect(new URL("/start?auth=oauth-success", request.url));
      }

      return NextResponse.redirect(new URL("/assistant", request.url));
    }
  }

  return NextResponse.redirect(new URL(next, request.url));
}
