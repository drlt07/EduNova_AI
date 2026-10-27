"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { AUTH_MODE, SUPABASE_ANON_KEY, SUPABASE_URL } from "./config";

let client: SupabaseClient | null = null;

/** Client Supabase phía trình duyệt (phiên lưu trong cookie); null ở bản dùng thử. */
export function supabaseBrowser(): SupabaseClient | null {
  if (AUTH_MODE !== "supabase") return null;
  client ??= createBrowserClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  return client;
}
