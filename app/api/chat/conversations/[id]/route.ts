import {
  deleteChatConversation,
  listConversationMessages,
  renameChatConversation,
} from "@/lib/chat/server-persistence";
import { getCurrentUser } from "@/lib/server/auth";
import { apiError, apiSuccess } from "@/lib/server/api-response";
import { readJsonWithByteLimit } from "@/lib/server/request-body";

const NO_STORE = { "Cache-Control": "no-store, max-age=0" } as const;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Ctx = { params: Promise<{ id: string }> };

async function requireUserAndId(ctx: Ctx) {
  const { user } = await getCurrentUser();
  if (!user) {
    return { error: apiError({ code: "UNAUTHENTICATED", message: "سجّل الدخول أولًا.", status: 401, headers: NO_STORE }) };
  }
  const { id } = await ctx.params;
  if (!UUID_PATTERN.test(id)) {
    return { error: apiError({ code: "INVALID_CONVERSATION_ID", message: "معرّف المحادثة غير صالح.", status: 400, headers: NO_STORE }) };
  }
  return { id };
}

/** GET — messages of a conversation. RLS scopes rows to the owner. */
export async function GET(_request: Request, ctx: Ctx) {
  const gate = await requireUserAndId(ctx);
  if (gate.error) return gate.error;

  const result = await listConversationMessages(gate.id);
  if (!result.ok) {
    return apiError({ code: "MESSAGES_LOAD_FAILED", message: "تعذر تحميل الرسائل.", status: 500, headers: NO_STORE });
  }
  // Empty array is valid (RLS hides non-owned rows → looks like an empty thread).
  return apiSuccess({ messages: result.data }, { headers: NO_STORE });
}

/** PATCH — rename a conversation. */
export async function PATCH(request: Request, ctx: Ctx) {
  const gate = await requireUserAndId(ctx);
  if (gate.error) return gate.error;

  const body = await readJsonWithByteLimit(request, 2 * 1024);
  if (!body.ok) {
    return apiError({ code: "INVALID_JSON", message: "تعذر قراءة الطلب.", status: 400, headers: NO_STORE });
  }
  const title = (body.data as { title?: unknown })?.title;
  if (typeof title !== "string" || !title.trim()) {
    return apiError({ code: "INVALID_TITLE", message: "العنوان غير صالح.", status: 400, headers: NO_STORE });
  }

  const result = await renameChatConversation(gate.id, title);
  if (!result.ok) {
    return apiError({ code: "RENAME_FAILED", message: "تعذر إعادة التسمية.", status: 500, headers: NO_STORE });
  }
  return apiSuccess({ conversation: result.data }, { headers: NO_STORE });
}

/** DELETE — remove a conversation (cascades to its messages via FK). */
export async function DELETE(_request: Request, ctx: Ctx) {
  const gate = await requireUserAndId(ctx);
  if (gate.error) return gate.error;

  const result = await deleteChatConversation(gate.id);
  if (!result.ok) {
    return apiError({ code: "DELETE_FAILED", message: "تعذر حذف المحادثة.", status: 500, headers: NO_STORE });
  }
  return apiSuccess({ deleted: true }, { headers: NO_STORE });
}
