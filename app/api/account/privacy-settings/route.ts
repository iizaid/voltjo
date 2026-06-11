import { NextResponse } from "next/server";
import {
  DEFAULT_PRIVACY_SETTINGS,
  type PrivacySettings,
} from "@/lib/account/settings";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

function jsonResponse(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function isRecord(input: unknown): input is Record<string, unknown> {
  return Boolean(input) && typeof input === "object" && !Array.isArray(input);
}

function readPrivacySettings(input: Record<string, unknown>): PrivacySettings {
  return {
    allowSmartProfileRecommendations:
      input.allowSmartProfileRecommendations === true,
    showDataInAssistant: input.showDataInAssistant === true,
    receiveImportantAccountEmails:
      input.receiveImportantAccountEmails === true,
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();

  if (!supabase) {
    return jsonResponse(
      { ok: false, message: "الخدمة غير جاهزة الآن. حاول لاحقًا." },
      503,
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return jsonResponse(
      { ok: false, message: "يجب تسجيل الدخول لتحديث إعدادات الخصوصية." },
      401,
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonResponse(
      { ok: false, message: "صيغة الطلب غير صالحة." },
      400,
    );
  }

  if (!isRecord(body)) {
    return jsonResponse(
      { ok: false, message: "صيغة الطلب غير صالحة." },
      400,
    );
  }

  const values = readPrivacySettings(body);

  const { error } = await supabase
    .from("profiles")
    .update({
      privacy_settings: {
        ...DEFAULT_PRIVACY_SETTINGS,
        ...values,
      },
    })
    .eq("id", user.id);

  if (error) {
    return jsonResponse(
      { ok: false, message: "تعذر حفظ إعدادات الخصوصية الآن." },
      500,
    );
  }

  return jsonResponse({
    ok: true,
    message: "تم حفظ إعدادات الخصوصية.",
    values,
  });
}
