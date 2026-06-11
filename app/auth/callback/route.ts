import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { getSafeRedirectPath } from "@/lib/auth/redirect";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";

export const dynamic = "force-dynamic";

const CALLBACK_ERROR_PATH = "/start?auth_error=callback";
const DEFAULT_NEXT_PATH = "/start";
const SAFE_OAUTH_ERROR_RE = /[^a-zA-Z0-9_-]/g;
const MAX_OAUTH_ERROR_LEN = 80;

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

function sanitizeOAuthError(raw: string): string {
  return raw.replace(SAFE_OAUTH_ERROR_RE, "").slice(0, MAX_OAUTH_ERROR_LEN);
}

function buildFailurePath(reason: string, oauthError?: string) {
  const failureUrl = new URL(CALLBACK_ERROR_PATH, "http://voltjo.local");
  failureUrl.searchParams.set("reason", reason);
  if (oauthError) {
    failureUrl.searchParams.set("oauth_error", sanitizeOAuthError(oauthError));
  }

  return `${failureUrl.pathname}?${failureUrl.searchParams.toString()}`;
}

function buildSuccessPath(safeNextPath: string) {
  const successUrl = new URL(safeNextPath, "http://voltjo.local");

  if (successUrl.pathname === "/start") {
    successUrl.searchParams.set("auth", "oauth-success");
  }

  return `${successUrl.pathname}${successUrl.search}`;
}

function buildRedirectResponse({
  destination,
  requestUrl,
  cookiesToSet,
  responseHeaders,
}: {
  destination: string;
  requestUrl: string;
  cookiesToSet: CookieToSet[];
  responseHeaders: Record<string, string>;
}) {
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
  const requestUrl = new URL(request.url);
  const safeNextPath = getSafeRedirectPath(
    requestUrl.searchParams.get("next"),
    DEFAULT_NEXT_PATH,
  );
  const cookiesToSet: CookieToSet[] = [];
  const responseHeaders: Record<string, string> = {};

  const providerError = requestUrl.searchParams.get("error");
  if (providerError) {
    return buildRedirectResponse({
      destination: buildFailurePath("provider_error", providerError),
      requestUrl: request.url,
      cookiesToSet,
      responseHeaders,
    });
  }

  const code = requestUrl.searchParams.get("code");
  if (!code) {
    return buildRedirectResponse({
      destination: buildFailurePath("missing_code"),
      requestUrl: request.url,
      cookiesToSet,
      responseHeaders,
    });
  }

  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) {
    return buildRedirectResponse({
      destination: buildFailurePath("missing_client"),
      requestUrl: request.url,
      cookiesToSet,
      responseHeaders,
    });
  }

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

  const { error: exchangeError } =
    await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    return buildRedirectResponse({
      destination: buildFailurePath("exchange_failed"),
      requestUrl: request.url,
      cookiesToSet,
      responseHeaders,
    });
  }

  return buildRedirectResponse({
    destination: buildSuccessPath(safeNextPath),
    requestUrl: request.url,
    cookiesToSet,
    responseHeaders,
  });
}
