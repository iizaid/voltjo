import type { CurrentProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const AVATAR_BUCKET = "avatars";

export async function resolveAccountAvatarUrl(
  profile: Pick<CurrentProfile, "avatar_path" | "updated_at"> | null | undefined,
) {
  if (!profile?.avatar_path) {
    return null;
  }

  const supabase = await createClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(profile.avatar_path);
    if (!data?.publicUrl) {
      return null;
    }

    const version = encodeURIComponent(profile.updated_at || "");
    return version ? `${data.publicUrl}?v=${version}` : data.publicUrl;
  } catch {
    return null;
  }
}
