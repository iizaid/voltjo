import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

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
  const response = NextResponse.redirect(new URL(destination, requestUrl));

  // Always prevent CDN/proxy caching of auth redirect responses.
  // Without this, Cloudflare can cache a redirect that carries Set-Cookie
  // headers and serve the cached (cookieless) response to the next user.
  response.headers.set(
    "Cache-Control",
    "private, no-cache, no-store, must-revalidate, max-age=0",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");

  cookiesToSet.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  // Apply headers emitted by @supabase/ssr (may override Cache-Control above
  // with an equivalent private/no-store variant — that is intentional).
  Object.entries(responseHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeRedirectPath(requestUrl.searchParams.get("next"));
  const cookiesToSet: CookieToSet[] = [];
  const responseHeaders: Record<string, string> = {};
  const { url, anonKey } = getSupabaseEnv();

  const hasCode = Boolean(code);
  const hasSupabaseEnv = Boolean(url && anonKey);
  console.log(`OAuth callback: hasCode=${hasCode} hasSupabaseEnv=${hasSupabaseEnv}`);

  if (!url || !anonKey) {
    console.log("OAuth callback: missing env – redirecting to error");
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
    const exchangeSucceeded = !error;
    const cookiesToSetCount = cookiesToSet.length;
    console.log(
      `OAuth callback: exchangeSucceeded=${exchangeSucceeded} cookiesToSetCount=${cookiesToSetCount}`,
    );

    if (error) {
      return buildRedirectResponse(
        AUTH_ERROR_REDIRECT_PATH,
        request.url,
        cookiesToSet,
        responseHeaders,
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userResolved = Boolean(user);
    console.log(`OAuth callback: userResolved=${userResolved}`);

    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", user.id)
        .maybeSingle();

      const onboardingComplete = Boolean(profile?.onboarding_completed);
      console.log(`OAuth callback: onboardingComplete=${onboardingComplete}`);

      if (!onboardingComplete) {
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
