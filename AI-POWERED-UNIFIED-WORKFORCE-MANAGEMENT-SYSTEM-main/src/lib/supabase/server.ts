import { createServerClient } from "@supabase/ssr";
import type { CookieMethodsServer } from "@supabase/ssr";

import { getSupabaseConfig } from "./env";

type SupabaseCookieStore = CookieMethodsServer & {
  set?: (name: string, value: string, options?: Record<string, unknown>) => void;
};

export function createServerSupabaseClient(cookies: SupabaseCookieStore) {
  const config = getSupabaseConfig();

  if (!config) {
    return null;
  }

  return createServerClient(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          if (typeof cookies.set === "function") {
            cookies.set(name, value, options);
          }
        });
      },
    },
  });
}