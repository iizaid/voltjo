export const AUTH_DEBUG_STORAGE_KEY = "voltjo_auth_debug_events";

const MAX_EVENTS = 80;
const MAX_STRING_LEN = 120;

export function isAuthDebugEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AUTH_DEBUG === "true";
}

export type AuthDebugEvent = {
  id: string;
  timestamp: string;
  stage: string;
  provider?: "google" | "github" | "email" | "unknown";
  path?: string;
  reason?: string;
  oauthError?: string;
  codePresent?: boolean;
  errorPresent?: boolean;
  sessionPresent?: boolean;
  profilePresent?: boolean;
  onboardingCompleted?: boolean | null;
  cookieCount?: number;
  hasSupabaseCookieNamePrefix?: boolean;
  hasSupabaseAuthTokenCookie?: boolean;
  hasSupabaseCodeVerifierCookie?: boolean;
  exchangeErrorName?: string;
  exchangeErrorStatus?: number | string;
  exchangeErrorCode?: string;
  note?: string;
};

function safeStr(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.slice(0, MAX_STRING_LEN);
}

export function createAuthDebugId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function appendAuthDebugEvent(event: AuthDebugEvent): void {
  if (!isAuthDebugEnabled()) return;
  if (typeof sessionStorage === "undefined") return;
  try {
    const raw = sessionStorage.getItem(AUTH_DEBUG_STORAGE_KEY);
    const events: AuthDebugEvent[] = raw ? (JSON.parse(raw) as AuthDebugEvent[]) : [];
    const safe: AuthDebugEvent = {
      ...event,
      stage: safeStr(event.stage) ?? event.stage,
      reason: safeStr(event.reason),
      oauthError: safeStr(event.oauthError),
      path: safeStr(event.path),
      exchangeErrorName: safeStr(event.exchangeErrorName),
      exchangeErrorCode: safeStr(event.exchangeErrorCode),
      note: safeStr(event.note),
    };
    events.push(safe);
    sessionStorage.setItem(
      AUTH_DEBUG_STORAGE_KEY,
      JSON.stringify(events.slice(-MAX_EVENTS)),
    );
  } catch {
    // sessionStorage quota or parse error — non-fatal
  }
}

export function readAuthDebugEvents(): AuthDebugEvent[] {
  if (typeof sessionStorage === "undefined") return [];
  try {
    const raw = sessionStorage.getItem(AUTH_DEBUG_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AuthDebugEvent[];
  } catch {
    return [];
  }
}

export function clearAuthDebugEvents(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.removeItem(AUTH_DEBUG_STORAGE_KEY);
  } catch {
    // non-fatal
  }
}
