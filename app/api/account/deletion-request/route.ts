import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type DeletionRequestSummary = {
  id: string;
  status: string;
  created_at: string;
};

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

function normalizeReason(input: unknown) {
  if (typeof input !== "string") return null;
  const trimmed = input.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, 1000);
}

async function getAuthenticatedUser() {
  const supabase = await createClient();

  if (!supabase) {
    return {
      supabase: null,
      response: jsonResponse(
        { ok: false, message: "الخدمة غير جاهزة الآن. حاول لاحقًا." },
        503,
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return {
      supabase,
      response: jsonResponse(
        { ok: false, message: "يجب تسجيل الدخول لإرسال طلب حذف الحساب." },
        401,
      ),
    };
  }

  return { supabase, user, response: null };
}

async function findPendingRequest(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
) {
  return supabase
    .from("account_deletion_requests")
    .select("id,status,created_at")
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle();
}

function existingResponse(request: DeletionRequestSummary) {
  return jsonResponse({
    ok: true,
    status: "existing",
    message: "يوجد طلب حذف قيد المراجعة.",
    request,
  });
}

export async function GET() {
  const auth = await getAuthenticatedUser();
  if (auth.response) return auth.response;

  const { data, error } = await findPendingRequest(auth.supabase, auth.user.id);

  if (error) {
    return jsonResponse(
      {
        ok: false,
        message: "تعذر قراءة حالة طلب حذف الحساب الآن.",
      },
      500,
    );
  }

  if (!data) {
    return jsonResponse({ ok: true, status: "none" });
  }

  return existingResponse(data);
}

export async function POST(request: Request) {
  const auth = await getAuthenticatedUser();
  if (auth.response) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (!isRecord(body)) {
    return jsonResponse(
      { ok: false, message: "صيغة الطلب غير صالحة." },
      400,
    );
  }

  const { data: existing, error: existingError } = await findPendingRequest(
    auth.supabase,
    auth.user.id,
  );

  if (existingError) {
    return jsonResponse(
      { ok: false, message: "تعذر قراءة حالة طلب حذف الحساب الآن." },
      500,
    );
  }

  if (existing) {
    return existingResponse(existing);
  }

  const { data, error } = await auth.supabase
    .from("account_deletion_requests")
    .insert({
      user_id: auth.user.id,
      email: auth.user.email ?? null,
      reason: normalizeReason(body.reason),
    })
    .select("id,status,created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      const { data: pending } = await findPendingRequest(
        auth.supabase,
        auth.user.id,
      );

      if (pending) return existingResponse(pending);
    }

    return jsonResponse(
      { ok: false, message: "تعذر إرسال طلب حذف الحساب الآن." },
      500,
    );
  }

  return jsonResponse({
    ok: true,
    status: "created",
    message: "تم استلام طلب حذف الحساب داخل النظام.",
    request: data,
  });
}
