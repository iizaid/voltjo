import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/lib/supabase/database.types";

type ChatConversationRow = Database["public"]["Tables"]["chat_conversations"]["Row"];
type ChatConversationInsert = Database["public"]["Tables"]["chat_conversations"]["Insert"];
type ChatMessageRow = Database["public"]["Tables"]["chat_messages"]["Row"];
type ChatMessageInsert = Database["public"]["Tables"]["chat_messages"]["Insert"];

type ServerResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function getAuthenticatedServerContext() {
  const supabase = await createClient();
  if (!supabase) {
    return { supabase: null, user: null, error: "Supabase client is unavailable." };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { supabase, user: null, error: "Authentication is required." };
  }

  return { supabase, user, error: null };
}

function sanitizeConversationTitle(title: string) {
  return title.trim().slice(0, 160);
}

async function touchChatConversation(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  conversationId: string,
  userId: string,
) {
  try {
    await supabase
      .from("chat_conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId)
      // Defense-in-depth: explicit ownership filter on top of RLS.
      .eq("user_id", userId);
  } catch {
    // Touching updated_at is best-effort only in this phase.
  }
}

export async function createChatConversation(input: {
  title: string;
  category?: string | null;
  modelId?: string;
  thinkingMode?: boolean;
  archived?: boolean;
}): Promise<ServerResult<ChatConversationRow>> {
  const { supabase, user, error } = await getAuthenticatedServerContext();
  if (!supabase || !user) {
    return { ok: false, error: error ?? "Authentication is required." };
  }

  const title = sanitizeConversationTitle(input.title);
  if (!title) {
    return { ok: false, error: "Conversation title is required." };
  }

  const payload: ChatConversationInsert = {
    user_id: user.id,
    title,
    category: input.category?.trim() || null,
    model_id: input.modelId ?? "voltjo",
    thinking_mode: input.thinkingMode ?? false,
    archived: input.archived ?? false,
  };

  const { data, error: insertError } = await supabase
    .from("chat_conversations")
    .insert(payload)
    .select("*")
    .single();

  if (insertError || !data) {
    return { ok: false, error: "Failed to create chat conversation." };
  }

  return { ok: true, data };
}

export async function createChatMessage(input: {
  conversationId: string;
  role: string;
  content?: string;
  bullets?: Json | null;
  metadata?: Json;
  attachment?: Json | null;
  status?: string;
}): Promise<ServerResult<ChatMessageRow>> {
  const { supabase, user, error } = await getAuthenticatedServerContext();
  if (!supabase || !user) {
    return { ok: false, error: error ?? "Authentication is required." };
  }

  const payload: ChatMessageInsert = {
    conversation_id: input.conversationId,
    user_id: user.id,
    role: input.role,
    content: input.content ?? "",
    bullets: input.bullets ?? null,
    metadata: input.metadata ?? {},
    attachment: input.attachment ?? null,
    status: input.status ?? "done",
  };

  const { data, error: insertError } = await supabase
    .from("chat_messages")
    .insert(payload)
    .select("*")
    .single();

  if (insertError || !data) {
    return { ok: false, error: "Failed to create chat message." };
  }

  await touchChatConversation(supabase, input.conversationId, user.id);

  return { ok: true, data };
}

export async function findOwnedChatConversation(
  conversationId: string,
): Promise<ServerResult<Pick<ChatConversationRow, "id"> | null>> {
  const { supabase, user, error } = await getAuthenticatedServerContext();
  if (!supabase || !user) {
    return { ok: false, error: error ?? "Authentication is required." };
  }

  const { data, error: selectError } = await supabase
    .from("chat_conversations")
    .select("id")
    .eq("id", conversationId)
    // Defense-in-depth: explicit ownership filter on top of RLS.
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) {
    return { ok: false, error: "Failed to load chat conversation." };
  }

  return { ok: true, data };
}

export async function listUserChatConversations(): Promise<
  ServerResult<ChatConversationRow[]>
> {
  const { supabase, user, error } = await getAuthenticatedServerContext();
  if (!supabase || !user) {
    return { ok: false, error: error ?? "Authentication is required." };
  }

  const { data, error: selectError } = await supabase
    .from("chat_conversations")
    .select("*")
    // Defense-in-depth: explicit ownership filter on top of RLS.
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (selectError || !data) {
    return { ok: false, error: "Failed to load chat conversations." };
  }

  return { ok: true, data };
}

export async function listConversationMessages(
  conversationId: string,
): Promise<ServerResult<ChatMessageRow[]>> {
  const { supabase, user, error } = await getAuthenticatedServerContext();
  if (!supabase || !user) {
    return { ok: false, error: error ?? "Authentication is required." };
  }

  const { data, error: selectError } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("conversation_id", conversationId)
    // Defense-in-depth: explicit ownership filter on top of RLS.
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (selectError || !data) {
    return { ok: false, error: "Failed to load chat messages." };
  }

  return { ok: true, data };
}

export async function deleteChatConversation(
  conversationId: string,
): Promise<ServerResult<null>> {
  const { supabase, user, error } = await getAuthenticatedServerContext();
  if (!supabase || !user) {
    return { ok: false, error: error ?? "Authentication is required." };
  }

  const { error: deleteError } = await supabase
    .from("chat_conversations")
    .delete()
    .eq("id", conversationId)
    // Defense-in-depth: explicit ownership filter on top of RLS.
    .eq("user_id", user.id);

  if (deleteError) {
    return { ok: false, error: "Failed to delete chat conversation." };
  }

  return { ok: true, data: null };
}

export async function renameChatConversation(
  conversationId: string,
  title: string,
): Promise<ServerResult<ChatConversationRow>> {
  const { supabase, user, error } = await getAuthenticatedServerContext();
  if (!supabase || !user) {
    return { ok: false, error: error ?? "Authentication is required." };
  }

  const nextTitle = sanitizeConversationTitle(title);
  if (!nextTitle) {
    return { ok: false, error: "Conversation title is required." };
  }

  const { data, error: updateError } = await supabase
    .from("chat_conversations")
    .update({ title: nextTitle })
    .eq("id", conversationId)
    // Defense-in-depth: explicit ownership filter on top of RLS.
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (updateError || !data) {
    return { ok: false, error: "Failed to rename chat conversation." };
  }

  return { ok: true, data };
}
