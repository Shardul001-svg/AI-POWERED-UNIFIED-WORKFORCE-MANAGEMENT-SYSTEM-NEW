import { requireAuth } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  let query = auth.supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (auth.role === "EMPLOYEE") {
    query = query.eq("profile_id", auth.profile.id);
  }

  const { data, error } = await query;

  if (error) {
    return apiError("Failed to load activities", 500);
  }

  return apiSuccess(data ?? []);
}
