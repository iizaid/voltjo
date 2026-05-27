"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseEnv, getSupabaseEnvOrThrow } from "@/lib/supabase/env";

export function createClient(): SupabaseClient<Database> | null {
  if (process.env.NODE_ENV === "development") {
    const { url, anonKey } = getSupabaseEnvOrThrow();
    return createBrowserClient<Database>(url, anonKey);
  }

  const { url, anonKey } = getSupabaseEnv();
  if (!url || !anonKey) return null;

  return createBrowserClient<Database>(url, anonKey);
}
