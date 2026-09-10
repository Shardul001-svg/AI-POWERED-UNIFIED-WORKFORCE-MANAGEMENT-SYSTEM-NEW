import { cookies } from "next/headers";

import { isProfileRole } from "@/lib/auth/permissions";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Profile, ProfileRole } from "@/types/database";

export type AuthContext = {
  supabase: NonNullable<ReturnType<typeof createServerSupabaseClient>>;
  user: Awaited<ReturnType<NonNullable<ReturnType<typeof createServerSupabaseClient>>["auth"]["getUser"]>>["data"]["user"];
  profile: Profile;
  role: ProfileRole;
};

export async function getAuthContext(): Promise<AuthContext | null> {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  let { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profileData && (user.id === "d7754257-d909-4b09-8df6-2bc5f0d3994c" || user.id === "d0028f17-39e9-4df0-9757-22d0d5129c7c")) {
    const role: ProfileRole = user.id === "d7754257-d909-4b09-8df6-2bc5f0d3994c" ? "ADMIN" : "EMPLOYEE";
    const fullName = user.id === "d7754257-d909-4b09-8df6-2bc5f0d3994c" ? "System Administrator" : "Test Employee";
    const email = user.id === "d7754257-d909-4b09-8df6-2bc5f0d3994c" ? "admin@workforceos.com" : "employee@workforceos.com";

    const targetProfile = { id: user.id, full_name: fullName, email, role };

    const { data: upsertedData } = await supabase
      .from("profiles")
      .upsert(targetProfile)
      .select()
      .maybeSingle();

    if (upsertedData) {
      profileData = upsertedData;
      profileError = null;
    }
  }


  if (profileError || !profileData || !isProfileRole(profileData.role)) {
    return null;
  }

  const profile = profileData as Profile;

  return {
    supabase,
    user,
    profile,
    role: profile.role,
  };
}

export async function requireAuth() {
  return getAuthContext();
}

export async function requireRole(allowedRoles: readonly ProfileRole[]) {
  const auth = await requireAuth();

  if (!auth || !allowedRoles.includes(auth.role)) {
    return null;
  }

  return auth;
}
