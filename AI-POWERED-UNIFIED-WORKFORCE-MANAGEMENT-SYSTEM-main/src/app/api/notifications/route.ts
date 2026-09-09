import { requireAuth } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { data, error } = await auth.supabase
    .from("notifications")
    .select("*")
    .eq("profile_id", auth.profile.id)
    .order("created_at", { ascending: false });

  if (error) {
    return apiError("Failed to load notifications", 500);
  }

  return apiSuccess(data ?? []);
}
