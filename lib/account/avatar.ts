import type { CurrentProfile } from "@/lib/auth/session";
import { getSupabaseEnv } from "@/lib/supabase/env";

const AVATAR_BUCKET = "avatars";

function encodeStoragePath(path: string) {
  return path
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function resolveAccountAvatarUrl(
  profile: Pick<CurrentProfile, "avatar_path" | "updated_at"> | null | undefined,
) {
  if (!profile?.avatar_path) {
    return null;
  }

  const { url } = getSupabaseEnv();
  if (!url) {
    return null;
  }

  try {
    const publicUrl = `${url.replace(/\/$/, "")}/storage/v1/object/public/${AVATAR_BUCKET}/${encodeStoragePath(profile.avatar_path)}`;
    const version = encodeURIComponent(profile.updated_at || "");
    return version ? `${publicUrl}?v=${version}` : publicUrl;
  } catch {
    return null;
  }
}
