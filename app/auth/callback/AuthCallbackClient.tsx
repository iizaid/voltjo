"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      function fail(reason: string) {
        router.replace(
          `/start?auth_error=callback&reason=${encodeURIComponent(reason)}`,
        );
      }

      try {
        if (error) {
          fail("provider_error");
          return;
        }

        const supabase = createClient();
        if (!supabase) {
          fail("missing_client");
          return;
        }

        // Check whether a session was already set before we do anything else.
        // This handles the race where Supabase's browser client auto-detects the
        // URL fragment and persists the session before our effect runs.
        const {
          data: { session: existingSession },
        } = await supabase.auth.getSession();
        if (existingSession) {
          router.replace("/start?auth=oauth-success");
          return;
        }

        if (code) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            // Exchange failed — wait briefly in case cookies land asynchronously
            await sleep(500);
            const {
              data: { session: retrySession },
            } = await supabase.auth.getSession();
            if (retrySession) {
              router.replace("/start?auth=oauth-success");
            } else {
              fail("exchange_failed");
            }
            return;
          }

          // Exchange succeeded — read session immediately
          const {
            data: { session },
          } = await supabase.auth.getSession();
          if (session) {
            router.replace("/start?auth=oauth-success");
            return;
          }

          // No session yet — one short retry in case persistence is async
          await sleep(500);
          const {
            data: { session: delayedSession },
          } = await supabase.auth.getSession();
          if (delayedSession) {
            router.replace("/start?auth=oauth-success");
          } else {
            fail("no_session_after_exchange");
          }
          return;
        }

        // No code in URL — give the Supabase browser client time to
        // auto-detect the session from the URL hash before giving up.
        await sleep(800);
        const {
          data: { session: waitSession },
        } = await supabase.auth.getSession();
        if (waitSession) {
          router.replace("/start?auth=oauth-success");
        } else {
          fail("missing_code");
        }
      } catch {
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
