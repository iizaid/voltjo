import { ChatShell } from "@/components/chat/ChatShell";
import { getCurrentUserAndProfile } from "@/lib/auth/session";
import { MAX_CHAT_MESSAGE_LENGTH } from "@/lib/chat/constants";

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AssistantPage({ searchParams }: Props) {
  const resolvedParams = await searchParams;
  const rawPrompt = Array.isArray(resolvedParams.prompt)
    ? resolvedParams.prompt[0]
    : resolvedParams.prompt;

  const trimmedPrompt = rawPrompt?.trim().slice(0, MAX_CHAT_MESSAGE_LENGTH) ?? "";
  const initialPrompt = trimmedPrompt.length > 0 ? trimmedPrompt : null;

  const { user, profile } = await getCurrentUserAndProfile();
  const label = profile?.full_name || user?.email || undefined;

  return (
    <ChatShell
      initialPrompt={initialPrompt}
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
