import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createClient(): Promise<SupabaseClient<Database> | null> {
  const env = getSupabaseEnv();

  if (!env.url || !env.anonKey) return null;

  const cookieStore = await cookies();

  return createServerClient<Database>(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components cannot set cookies; middleware refreshes sessions.
        }
      },
    },
  });
}

let cachedPublicClient: SupabaseClient<Database> | null = null;

// Public client that does NOT read cookies and does not cause pages to opt out
// of static/ISR rendering. Scoped for read-only public queries.
export function createPublicClient(): SupabaseClient<Database> | null {
  if (cachedPublicClient) return cachedPublicClient;

  const env = getSupabaseEnv();
  if (!env.url || !env.anonKey) return null;

  cachedPublicClient = createSupabaseClient<Database>(env.url, env.anonKey, {
    auth: {
      persistSession: false,
    },
  });

  return cachedPublicClient;
}
