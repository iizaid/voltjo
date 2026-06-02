import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type LocationPayload = {
  latitude?: number;
  longitude?: number;
  accuracyMeters?: number | null;
  consent?: boolean;
};

function invalid(message: string, status = 400) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();

  if (!supabase) {
    return invalid("الخدمة غير جاهزة حاليًا.", 503);
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return invalid("سجّل الدخول أولًا لحفظ موقعك.", 401);
  }

  let body: LocationPayload;

  try {
    body = (await request.json()) as LocationPayload;
  } catch {
    return invalid("تعذر قراءة بيانات الموقع.");
  }

  const latitude = Number(body.latitude);
  const longitude = Number(body.longitude);
  const accuracyMeters =
    body.accuracyMeters == null ? null : Number(body.accuracyMeters);
  const consent = body.consent === true;

  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
    return invalid("إحداثيات الموقع غير صالحة.");
  }

  if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return invalid("إحداثيات الموقع غير صالحة.");
  }

  if (
    accuracyMeters != null &&
    (!Number.isFinite(accuracyMeters) || accuracyMeters < 0 || accuracyMeters > 100000)
  ) {
    return invalid("قيمة دقة الموقع غير صالحة.");
  }

  if (!consent) {
    return invalid("لا يمكن حفظ الموقع بدون موافقة صريحة.");
  }

  const locationPreferences = {
    latitude,
    longitude,
    accuracy_meters: accuracyMeters,
    captured_at: new Date().toISOString(),
    source: "browser_geolocation",
    consent: true,
  };

  const { error } = await supabase
    .from("profiles")
    .update({
      location_preferences: locationPreferences,
    })
    .eq("id", user.id);

  if (error) {
    return invalid("تعذر حفظ الموقع الآن. حاول مرة أخرى لاحقًا.", 500);
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
