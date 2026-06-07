"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  isAuthDebugEnabled,
  appendAuthDebugEvent,
  createAuthDebugId,
  type AuthDebugEvent,
} from "@/lib/auth/auth-debug";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

const SAFE_OAUTH_ERROR_RE = /[^a-zA-Z0-9_-]/g;
const MAX_OAUTH_ERROR_LEN = 80;

function sanitizeOAuthError(raw: string): string {
  return raw.replace(SAFE_OAUTH_ERROR_RE, "").slice(0, MAX_OAUTH_ERROR_LEN);
}

function dbg(
  stage: string,
  extra: Partial<Omit<AuthDebugEvent, "id" | "timestamp" | "stage">> = {},
) {
  if (!isAuthDebugEnabled()) return;
  appendAuthDebugEvent({
    id: createAuthDebugId(),
    timestamp: new Date().toISOString(),
    stage,
    path: typeof window !== "undefined" ? window.location.pathname : undefined,
    ...extra,
  });
}

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      const error = searchParams.get("error");
      const debugId = createAuthDebugId();

      function fail(reason: string, oauthError?: string) {
        dbg("redirecting_oauth_failure", { reason, oauthError });
        const params = new URLSearchParams({ auth_error: "callback", reason });
        if (oauthError) params.set("oauth_error", oauthError);
        if (isAuthDebugEnabled()) params.set("debug_id", debugId);
        router.replace(`/start?${params.toString()}`);
      }

      try {
        dbg("callback_loaded", {
          codePresent: Boolean(code),
          errorPresent: Boolean(error),
        });

        if (error) {
          const safeProviderError = sanitizeOAuthError(error);
          if (process.env.NODE_ENV === "development") {
            console.warn(
              "[auth] provider error present:",
              Boolean(safeProviderError),
              "access_denied:",
              safeProviderError === "access_denied",
            );
          }
          dbg("provider_error", {
            oauthError: safeProviderError,
            errorPresent: true,
          });
          const params = new URLSearchParams({
            auth_error: "callback",
            reason: "provider_error",
            oauth_error: safeProviderError,
          });
          if (isAuthDebugEnabled()) params.set("debug_id", debugId);
          window.location.replace(`/start?${params.toString()}`);
          return;
        }

        const supabase = createClient();
        if (!supabase) {
          dbg("supabase_client_missing");
          fail("missing_client");
          return;
        }
        dbg("supabase_client_created");

        // Check whether a session was already set before we do anything else.
        // This handles the race where Supabase's browser client auto-detects the
        // URL fragment and persists the session before our effect runs.
        dbg("existing_session_check_started");
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();
        if (existingSession) {
          dbg("existing_session_found", { sessionPresent: true });
          dbg("redirecting_oauth_success");
          window.location.replace("/start?auth=oauth-success");
          return;
        }

        if (code) {
          dbg("code_present", { codePresent: true });
          dbg("exchange_started");
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            dbg("exchange_failed", {
              exchangeErrorName: exchangeError.name,
              exchangeErrorStatus: (exchangeError as { status?: number }).status,
              exchangeErrorCode: (exchangeError as { code?: string }).code,
            });
            // Exchange failed — wait briefly in case cookies land asynchronously
            await sleep(500);
            const {
              data: { session: retrySession },
            } = await supabase.auth.getSession();
            if (retrySession) {
              dbg("retry_session_found", { sessionPresent: true });
              dbg("redirecting_oauth_success");
              window.location.replace("/start?auth=oauth-success");
            } else {
              dbg("retry_session_missing", { sessionPresent: false });
              fail("exchange_failed");
            }
            return;
          }

          dbg("exchange_succeeded");
          // Exchange succeeded — read session immediately
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            dbg("session_after_exchange_found", { sessionPresent: true });
            dbg("redirecting_oauth_success");
            window.location.replace("/start?auth=oauth-success");
            return;
          }

          dbg("session_after_exchange_missing");
          // No session yet — one short retry in case persistence is async
          await sleep(500);
          const {
            data: { session: delayedSession },
          } = await supabase.auth.getSession();
          if (delayedSession) {
            dbg("retry_session_found", {
              sessionPresent: true,
              note: "delayed",
            });
            dbg("redirecting_oauth_success");
            window.location.replace("/start?auth=oauth-success");
          } else {
            dbg("retry_session_missing", {
              sessionPresent: false,
              note: "delayed",
            });
            fail("no_session_after_exchange");
          }
          return;
        }

        // No code in URL — give the Supabase browser client time to
        // auto-detect the session from the URL hash before giving up.
        dbg("code_missing_waiting_for_auto_detect", { codePresent: false });
        await sleep(800);
        const {
          data: { session: waitSession },
        } = await supabase.auth.getSession();
        if (waitSession) {
          dbg("redirecting_oauth_success", { sessionPresent: true });
          window.location.replace("/start?auth=oauth-success");
        } else {
          fail("missing_code");
        }
      } catch (err) {
        dbg("unexpected_error", {
          note: err instanceof Error ? err.name : "unknown",
        });
        fail("unexpected_error");
      }
    }

    handleCallback();
  }, []);

  return (
    <main
      className="grid min-h-dvh place-items-center bg-white px-6"
      dir="rtl"
    >
      <p className="text-lg font-bold text-[var(--voltjo-black)]">
        نُكمل تسجيل الدخول...
      </p>
    </main>
  );
}
