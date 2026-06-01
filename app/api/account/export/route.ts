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

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id,full_name,avatar_path,age_range,country,city,ownership_status,has_driven_ev_or_hybrid,main_goal,driving_pattern,home_charging_access,priorities,privacy_settings,onboarding_completed,onboarding_completed_at,profile_version,created_at,updated_at",
    )
    .eq("id", user.id)
    .maybeSingle();

  const payload = {
    account: {
      id: user.id,
      email: user.email ?? null,
      created_at: user.created_at ?? null,
      email_confirmed_at: user.email_confirmed_at ?? null,
    },
    profile,
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
