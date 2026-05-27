import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const DEFAULT_REDIRECT_PATH = "/assistant";
const AUTH_ERROR_REDIRECT_PATH = "/start?auth_error=callback";
const UNSAFE_PROTOCOL_RE = /(?:^|[^\w])(https?:|javascript:|data:)/i;
const ENCODED_BACKSLASH_RE = /%5c/i;

function getSafeRedirectPath(nextParam: string | null): string {
  if (!nextParam) return DEFAULT_REDIRECT_PATH;

  const value = nextParam.trim();

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    ENCODED_BACKSLASH_RE.test(value) ||
    UNSAFE_PROTOCOL_RE.test(value)
  ) {
    return DEFAULT_REDIRECT_PATH;
  }

  return value;
}

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
  }

  return NextResponse.redirect(new URL(next, request.url));
}
