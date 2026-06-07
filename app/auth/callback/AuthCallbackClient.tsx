"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleCallback() {
      const code = searchParams.get("code");
      const error = searchParams.get("error");

      if (error || !code) {
        router.replace("/start?auth_error=callback");
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        router.replace("/start?auth_error=callback");
        return;
      }

      const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeError) {
        router.replace("/start?auth_error=callback");
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        router.replace("/start?auth=oauth-success");
      } else {
        router.replace("/start?auth_error=callback");
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
