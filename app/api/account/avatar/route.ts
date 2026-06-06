import { NextResponse } from "next/server";
import {
  ALLOWED_AVATAR_IMAGE_TYPES,
  getAvatarUploadFormat,
  MAX_AVATAR_IMAGE_SIZE_BYTES,
} from "@/lib/account/settings";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { createClient } from "@/lib/supabase/server";

const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_REQUEST_BYTES = MAX_AVATAR_IMAGE_SIZE_BYTES + 256 * 1024;

// The object path keeps the user id as the first folder segment so the storage
// RLS policy ((storage.foldername(name))[1] = auth.uid()::text) still applies,
// but uses a random filename so public avatar URLs are not guessable/enumerable.
// crypto.randomUUID() is a Node global in this (Node runtime) route — no new dependency.
function getAvatarPath(userId: string, extension: string) {
  return `${userId}/${crypto.randomUUID()}.${extension}`;
}

function getIpFromRequest(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const firstIp = forwardedFor.split(",")[0]?.trim();
    if (firstIp) return firstIp;
  }

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "unknown";
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

function hasValidImageSignature(buffer: Buffer, mimeType: string) {
  if (mimeType === "image/jpeg") {
    return (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    );
  }

  if (mimeType === "image/png") {
    return (
      buffer.length >= 8 &&
      buffer[0] === 0x89 &&
      buffer[1] === 0x50 &&
      buffer[2] === 0x4e &&
      buffer[3] === 0x47 &&
      buffer[4] === 0x0d &&
      buffer[5] === 0x0a &&
      buffer[6] === 0x1a &&
      buffer[7] === 0x0a
    );
  }

  if (mimeType === "image/webp") {
    return (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
      buffer.subarray(8, 12).toString("ascii") === "WEBP"
    );
  }

  return false;
}

export async function POST(request: Request) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength || !/^\d+$/.test(contentLength.trim())) {
    return NextResponse.json(
      { ok: false, message: "تعذر التحقق من حجم الرفع. أعد اختيار الصورة وحاول مرة أخرى." },
      { status: 400 },
    );
  }

  const parsedLength = Number.parseInt(contentLength, 10);
  if (!Number.isFinite(parsedLength) || parsedLength <= 0) {
    return NextResponse.json(
      { ok: false, message: "تعذر التحقق من حجم الرفع. أعد اختيار الصورة وحاول مرة أخرى." },
      { status: 400 },
    );
  }

  if (parsedLength > MAX_AVATAR_REQUEST_BYTES) {
    return NextResponse.json(
      { ok: false, message: "حجم الصورة أكبر من 3MB." },
      { status: 413 },
    );
  }

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

  const rateLimit = await checkRateLimit({
    key: user?.id || getIpFromRequest(request),
    action: "avatar-upload",
    limit: 5,
    windowMs: 10 * 60 * 1000,
  });

  if (!rateLimit.ok) {
    return NextResponse.json(
      { ok: false, message: "محاولات كثيرة. حاول بعد قليل." },
      {
        status: 429,
        headers: {
          "Retry-After": String(Math.max(1, Math.ceil((rateLimit.resetAt - Date.now()) / 1000))),
        },
      },
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

  const uploadFormat = getAvatarUploadFormat(file.type);
  if (!uploadFormat) {
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

  const nextPath = getAvatarPath(user.id, uploadFormat.extension);
  const buffer = Buffer.from(await file.arrayBuffer());

  if (!hasValidImageSignature(buffer, file.type)) {
    return NextResponse.json(
      {
        ok: false,
        message: "تعذر التحقق من نوع الصورة. استخدم JPG أو PNG أو WEBP فقط.",
      },
      { status: 400 },
    );
  }

  const { error: uploadError } = await supabase.storage
    .from(AVATAR_BUCKET)
    .upload(nextPath, buffer, {
      contentType: uploadFormat.contentType,
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
