import { cookies } from "next/headers";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export async function createActivity(profileId: string, action: string, description?: string | null) {
  const cookieStore = await cookies();
  const supabase = createServerSupabaseClient(cookieStore);

  if (!supabase) {
    return;
  }

  const { error } = await supabase.from("activities").insert({
    profile_id: profileId,
    action,
    description: description ?? null,
  });

  if (error) {
    console.error("Failed to create activity log:", {
      profileId,
      action,
      description,
      message: error.message,
    });
  }
}
