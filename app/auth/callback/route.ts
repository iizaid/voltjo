import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";

const AUTH_ERROR_REDIRECT_PATH = "/start?auth_error=callback";
const OAUTH_INCOMPLETE_PROFILE_PATH = "/start?auth=oauth-success";
const AUTHENTICATED_REDIRECT_PATH = "/assistant";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function buildRedirectResponse(
  destination: string,
  requestUrl: string,
  cookiesToSet: CookieToSet[],
  responseHeaders: Record<string, string>,
) {
  const logDestination = destination.startsWith("/assistant")
    ? "/assistant"
    : destination.startsWith("/start")
      ? "/start"
      : destination;

  console.log(
    `OAuth redirect destination: ${logDestination}`,
  );

  const response = NextResponse.redirect(new URL(destination, requestUrl));

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  Object.entries(responseHeaders).forEach(([name, value]) => {
    response.headers.set(name, value);
  });

  return response;
}

export async function GET(request: NextRequest) {
  console.log("OAuth callback started");

  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));
  const cookiesToSet: CookieToSet[] = [];
  const responseHeaders: Record<string, string> = {};
  const { url, anonKey } = getSupabaseEnv();

  if (!url || !anonKey) {
    return buildRedirectResponse(
      AUTH_ERROR_REDIRECT_PATH,
      request.url,
      cookiesToSet,
      responseHeaders,
    );
  }

  if (code) {
    const supabase = createServerClient<Database>(url, anonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(supabaseCookiesToSet, headers) {
          cookiesToSet.push(...supabaseCookiesToSet);
          Object.assign(responseHeaders, headers);
        },
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.log("OAuth exchange failed");
      return buildRedirectResponse(
        AUTH_ERROR_REDIRECT_PATH,
        request.url,
        cookiesToSet,
        responseHeaders,
      );
    }

    const { data: { user } } = await supabase.auth.getUser();
    console.log(`OAuth user resolved: ${Boolean(user)}`);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile?.onboarding_completed) {
        return buildRedirectResponse(
          OAUTH_INCOMPLETE_PROFILE_PATH,
          request.url,
          cookiesToSet,
          responseHeaders,
        );
      }

      return buildRedirectResponse(
        AUTHENTICATED_REDIRECT_PATH,
        request.url,
        cookiesToSet,
        responseHeaders,
      );
    }

    return buildRedirectResponse(
      AUTH_ERROR_REDIRECT_PATH,
      request.url,
      cookiesToSet,
      responseHeaders,
    );
  }

  return buildRedirectResponse(next, request.url, cookiesToSet, responseHeaders);
}
