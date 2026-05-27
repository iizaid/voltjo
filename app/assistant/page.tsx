import { ChatShell } from "@/components/chat/ChatShell";
import { getCurrentUserAndProfile } from "@/lib/auth/session";

export default async function AssistantPage() {
  const { user, profile } = await getCurrentUserAndProfile();
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
