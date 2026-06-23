import { listUserChatConversations } from "@/lib/chat/server-persistence";
import { getCurrentUser } from "@/lib/server/auth";
import { apiError, apiSuccess } from "@/lib/server/api-response";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;

/** GET /api/chat/conversations — list the signed-in user's conversations. */
export async function GET() {
  const { user } = await getCurrentUser();
  if (!user) {
    return apiError({
      code: "UNAUTHENTICATED",
      message: "يجب تسجيل الدخول لعرض المحادثات.",
      status: 401,
      headers: NO_STORE,
    });
  }

  const result = await listUserChatConversations();
  if (!result.ok) {
    return apiError({
      code: "CONVERSATIONS_LOAD_FAILED",
      message: "تعذر تحميل المحادثات.",
      status: 500,
      headers: NO_STORE,
    });
  }

  return apiSuccess({ conversations: result.data }, { headers: NO_STORE });
}
