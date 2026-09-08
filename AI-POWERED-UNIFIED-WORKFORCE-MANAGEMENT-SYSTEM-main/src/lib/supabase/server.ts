import { createServerClient } from "@supabase/ssr";
import type { CookieMethodsServer } from "@supabase/ssr";

import { getSupabaseConfig } from "./env";

export function createServerSupabaseClient(cookies: CookieMethodsServer) {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  return createServerClient(config.url, config.anonKey, { cookies });
}