import { NextResponse } from "next/server";
import {
  ALLOWED_AVATAR_IMAGE_TYPES,
  MAX_AVATAR_IMAGE_SIZE_BYTES,
} from "@/lib/account/settings";
import { createClient } from "@/lib/supabase/server";

const AVATAR_BUCKET = "avatars";

function getAvatarPath(userId: string) {
  return `${userId}/avatar.webp`;
}

function isSchemaMissingError(error: { code?: string | null; message?: string | null }) {
  return (
    error.code === "42703" ||
    error.code === "PGRST204" ||
    error.message?.includes("avatar_path") === true
  );
}

function isBucketMissingError(error: { message?: string | null }) {
  const message = error.message?.toLowerCase() ?? "";
  return message.includes("bucket") && message.includes("not found");
}

function isPolicyDeniedError(error: {
  statusCode?: string | number | null;
  message?: string | null;
}) {
  return (
    error.statusCode === 403 ||
    error.statusCode === "403" ||
    error.message?.toLowerCase().includes("row-level security") === true ||
    error.message?.toLowerCase().includes("permission") === true
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json(
      { ok: false, message: "الخدمة غير جاهزة حاليًا. حاول لاحقًا." },
      { status: 503 },
    );
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { ok: false, message: "يجب تسجيل الدخول قبل حفظ الصورة." },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const file = formData.get("avatar");

  if (!(file instanceof File)) {
    return NextResponse.json(
      { ok: false, message: "اختر صورة صالحة قبل الحفظ." },
      { status: 400 },
    );
  }

  if (!ALLOWED_AVATAR_IMAGE_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_IMAGE_TYPES)[number])) {
    return NextResponse.json(
      {
        ok: false,
        message: "الملف غير مدعوم. استخدم JPG أو PNG أو WEBP فقط.",
      },
      { status: 400 },
    );
  }

  if (file.size > MAX_AVATAR_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { ok: false, message: "حجم الصورة أكبر من 3MB." },
      { status: 400 },
    );
  }

  const {
    data: currentProfile,
    error: profileLookupError,
  } = await supabase
    .from("profiles")
    .select("avatar_path")
    .eq("id", user.id)
    .maybeSingle();

  if (profileLookupError) {
    console.warn("account-avatar: profile lookup failed", {
      userId: user.id,
      code: profileLookupError.code,
    });

    if (isSchemaMissingError(profileLookupError)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "إعدادات الصورة الشخصية غير مكتملة بعد. شغّل ترقية قاعدة البيانات أولًا.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: false, message: "تعذر تجهيز الصورة الآن. حاول مرة أخرى." },
      { status: 500 },
    );
  }

  if (!currentProfile) {
    console.warn("account-avatar: missing profile row", { userId: user.id });
    return NextResponse.json(
      {
        ok: false,
        message: "الملف الشخصي غير مكتمل بعد. أكمل إعدادات البداية أولًا.",
      },
      { status: 409 },
    );
  }

  const nextPath = getAvatarPath(user.id);
  const buffer = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(nextPath, buffer, {
      contentType: "image/webp",
      cacheControl: "3600",
      upsert: true,
    });

  if (uploadError) {
    console.error("account-avatar: storage upload failed", {
      userId: user.id,
      message: uploadError.message,
      statusCode: uploadError.statusCode,
    });

    if (isBucketMissingError(uploadError)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "مساحة الصور غير مهيأة بعد. أنشئ bucket باسم avatars ثم أعد المحاولة.",
        },
        { status: 500 },
      );
    }

    if (isPolicyDeniedError(uploadError)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "صلاحية رفع الصورة غير مكتملة بعد. راجع سياسات تخزين الصور ثم أعد المحاولة.",
        },
        { status: 403 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: "تعذر حفظ الصورة الآن. حاول مرة أخرى بعد قليل.",
      },
      { status: 500 },
    );
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ avatar_path: nextPath })
    .eq("id", user.id);

  if (updateError) {
    console.error("account-avatar: profile update failed", {
      userId: user.id,
      code: updateError.code,
    });
    await supabase.storage.from(AVATAR_BUCKET).remove([nextPath]);

    if (isSchemaMissingError(updateError)) {
      return NextResponse.json(
        {
          ok: false,
          message:
            "إعدادات الصورة الشخصية غير مكتملة بعد. شغّل ترقية قاعدة البيانات أولًا.",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: false, message: "تم رفع الصورة لكن تعذر ربطها بالحساب الآن." },
      { status: 500 },
    );
  }

  if (currentProfile?.avatar_path && currentProfile.avatar_path !== nextPath) {
    await supabase.storage.from(AVATAR_BUCKET).remove([currentProfile.avatar_path]);
  }

  const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(nextPath);

  return NextResponse.json({
    ok: true,
    message: "تم حفظ الصورة الشخصية بنجاح.",
    avatarUrl: `${data.publicUrl}?v=${Date.now()}`,
  });
}
