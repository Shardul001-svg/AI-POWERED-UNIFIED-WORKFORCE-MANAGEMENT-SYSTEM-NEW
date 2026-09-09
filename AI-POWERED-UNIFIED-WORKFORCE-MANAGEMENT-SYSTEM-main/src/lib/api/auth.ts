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

  console.log("[api-auth] getUser", {
    userId: user?.id ?? null,
    userEmail: user?.email ?? null,
    userError: userError ? { code: userError.code, message: userError.message } : null,
  });

  if (userError || !user) {
    return null;
  }

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  console.log("[api-auth] profileLookup", {
    userId: user.id,
    detectedProfile: profileData ? { id: profileData.id, role: profileData.role, email: profileData.email } : null,
    profileError: profileError ? { code: profileError.code, message: profileError.message, details: profileError.details } : null,
  });

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
