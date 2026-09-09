import { requireAuth } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { data, error } = await auth.supabase
    .from("activities")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return apiError("Failed to load activities", 500);
  }

  return apiSuccess(data ?? []);
}
