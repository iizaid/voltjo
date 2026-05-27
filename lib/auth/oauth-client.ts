import { createClient } from "@/lib/supabase/client";

export type OAuthProvider = "google" | "github";

export async function signInWithOAuth(provider: OAuthProvider) {
  const supabase = createClient();
  if (!supabase) {
    throw new Error("Service unavailable");
  }

  const redirectTo = `${window.location.origin}/auth/callback?next=/start`;

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
    },
  });

  if (error) {
    throw error;
  }
}
