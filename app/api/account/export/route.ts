import { NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      { error: "الخدمة غير جاهزة حاليًا." },
      { status: 503 },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "غير مصرح." }, { status: 401 });
  }

  const rateLimit = checkRateLimit({
    key: user.id,
    action: "account-export",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { error: "محاولات كثيرة. حاول بعد قليل." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))),
        },
      },
    );
  }

  // Safe server-side logging for optional export queries. We never expose raw
  // Supabase errors to the user, but a silent failure hides export problems in
  // production. Logs include only the query name, the authenticated user id, and
  // the error code/message — never message content, email, or the export payload.
  function logExportQueryWarning(
    query: string,
    userId: string,
    error: { code?: string | null; message?: string | null },
  ) {
    console.warn("account-export: optional query failed", {
      query,
      userId,
      code: error.code ?? null,
      message: error.message ?? null,
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "id,full_name,avatar_path,age_range,country,city,ownership_status,has_driven_ev_or_hybrid,main_goal,driving_pattern,home_charging_access,priorities,privacy_settings,location_preferences,onboarding_completed,onboarding_completed_at,profile_version,created_at,updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    logExportQueryWarning("profiles", user.id, profileError);
  }

  // Chat history. RLS already scopes these to the current user; the explicit
  // user_id filter is defense-in-depth. user.id comes from the authenticated
  // session (supabase.auth.getUser), never from the client request body.
  const { data: conversations, error: conversationsError } = await supabase
    .from("chat_conversations")
    .select(
      "id,title,category,model_id,thinking_mode,archived,created_at,updated_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (conversationsError) {
    logExportQueryWarning("chat_conversations", user.id, conversationsError);
  }

  const { data: messages, error: messagesError } = await supabase
    .from("chat_messages")
    .select(
      "id,conversation_id,role,content,bullets,metadata,attachment,status,created_at",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (messagesError) {
    logExportQueryWarning("chat_messages", user.id, messagesError);
  }

  const payload = {
    account: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
      email_confirmed_at: user.email_confirmed_at ?? null,
    },
    profile,
    chat_conversations: conversations ?? [],
    chat_messages: messages ?? [],
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="voltjo-account-data.json"',
    },
  });
}
