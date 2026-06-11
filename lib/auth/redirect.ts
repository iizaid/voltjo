const DEFAULT_REDIRECT_PATH = "/assistant";
const UNSAFE_PROTOCOL_RE = /(?:^|[^\w])(https?:|javascript:|data:)/i;
const ENCODED_BACKSLASH_RE = /%5c/i;

export function getSafeRedirectPath(
  nextParam: string | null,
  fallbackPath = DEFAULT_REDIRECT_PATH,
): string {
  if (!nextParam) return fallbackPath;

  const value = nextParam.trim();

  if (
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    ENCODED_BACKSLASH_RE.test(value) ||
    UNSAFE_PROTOCOL_RE.test(value)
  ) {
    return fallbackPath;
  }

  return value;
}
