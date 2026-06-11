import { NextResponse } from "next/server";
import { isAccountDeletionConfirmationValid } from "@/lib/account/account-deletion";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const AVATAR_BUCKET = "avatars";

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

function getString(input: unknown) {
  return typeof input === "string" ? input : "";
}

async function readBody(request: Request) {
  try {
    const body = await request.json();
    return isRecord(body) ? body : null;
  } catch {
    return null;
  }
}

async function collectAvatarPaths({
  admin,
  avatarPath,
  userId,
}: {
  admin: NonNullable<ReturnType<typeof createAdminClient>>;
  avatarPath: string | null | undefined;
  userId: string;
}) {
  const paths = new Set<string>();
  if (avatarPath) paths.add(avatarPath);

  const { data, error } = await admin.storage.from(AVATAR_BUCKET).list(userId, {
    limit: 1000,
  });

  if (error) {
    return { paths: Array.from(paths), error };
  }

  data?.forEach((item) => {
    if (item.name) {
      paths.add(`${userId}/${item.name}`);
    }
  });

  return { paths: Array.from(paths), error: null };
}

export async function DELETE(request: Request) {
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
      { ok: false, message: "يجب تسجيل الدخول لحذف الحساب." },
      401,
    );
  }

  const body = await readBody(request);
  if (!body) {
    return jsonResponse(
      { ok: false, message: "صيغة الطلب غير صالحة." },
      400,
    );
  }

  if (
    !isAccountDeletionConfirmationValid({
      confirmationText: getString(body.confirmationText),
      typedEmail: getString(body.email),
      currentEmail: user.email,
    })
  ) {
    return jsonResponse(
      { ok: false, message: "تأكيد حذف الحساب غير مطابق." },
      400,
    );
  }

  const admin = createAdminClient();
  if (!admin) {
    return jsonResponse(
      {
        ok: false,
        message:
          "حذف الحساب غير مهيأ بعد. أضف SUPABASE_SERVICE_ROLE_KEY كسر خادمي.",
      },
      503,
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    return jsonResponse(
      { ok: false, message: "تعذر تجهيز بيانات الحساب للحذف الآن." },
      500,
    );
  }

  const { paths: avatarPaths, error: avatarListError } =
    await collectAvatarPaths({
      admin,
      avatarPath: profile?.avatar_path,
      userId: user.id,
    });

  if (avatarListError && !profile?.avatar_path) {
    return jsonResponse(
      { ok: false, message: "تعذر تجهيز ملفات الحساب للحذف الآن." },
      500,
    );
  }

  if (avatarPaths.length > 0) {
    const { error: storageError } = await admin.storage
      .from(AVATAR_BUCKET)
      .remove(avatarPaths);

    if (storageError) {
      return jsonResponse(
        { ok: false, message: "تعذر حذف ملفات الحساب الآن." },
        500,
      );
    }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(
    user.id,
    false,
  );

  if (deleteError) {
    return jsonResponse(
      { ok: false, message: "تعذر حذف الحساب الآن. حاول مرة أخرى." },
      500,
    );
  }

  await supabase.auth.signOut();

  return jsonResponse({
    ok: true,
    message: "تم حذف الحساب نهائيًا.",
  });
}
