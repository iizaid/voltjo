import { ChatShell } from "@/components/chat/ChatShell";
import { createClient } from "@/lib/supabase/server";

export default async function AssistantPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = supabase
    ? await supabase.auth.getUser()
    : { data: { user: null } };

  const { data: profile } =
    supabase && user
      ? await supabase
          .from("profiles")
          .select("full_name,onboarding_completed")
          .eq("id", user.id)
          .maybeSingle()
      : { data: null };

  const label = profile?.full_name || user?.email || undefined;

  return (
    <ChatShell
      account={
        user && label
          ? {
              label,
              sublabel: profile?.onboarding_completed
                ? "ملف ذكي محفوظ"
                : "أكمل ملفك الذكي",
              initial: label.trim().charAt(0).toUpperCase() || "V",
            }
          : null
      }
    />
  );
}
