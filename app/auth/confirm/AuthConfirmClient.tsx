"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthConfirmClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function handleConfirm() {
      const tokenHash = searchParams.get("token_hash");
      const type = searchParams.get("type") as "email" | "recovery" | "invite" | null;
      const error = searchParams.get("error");

      if (error || !tokenHash || !type) {
        router.replace("/start?auth_error=callback");
        return;
      }

      const supabase = createClient();
      if (!supabase) {
        router.replace("/start?auth_error=callback");
        return;
      }

      const { error: verifyError, data } = await supabase.auth.verifyOtp({
        token_hash: tokenHash,
        type,
      });

      if (verifyError) {
        router.replace("/start?auth_error=callback");
        return;
      }

      if (data.session) {
        router.replace("/start?auth=oauth-success");
      } else {
        router.replace("/start?email_confirmed=true");
      }
    }

    handleConfirm();
  }, []);

  return (
    <main
      className="grid min-h-dvh place-items-center bg-white px-6"
      dir="rtl"
    >
      <p className="text-lg font-bold text-[var(--voltjo-black)]">
        نتحقق من بريدك الإلكتروني...
      </p>
    </main>
  );
}
