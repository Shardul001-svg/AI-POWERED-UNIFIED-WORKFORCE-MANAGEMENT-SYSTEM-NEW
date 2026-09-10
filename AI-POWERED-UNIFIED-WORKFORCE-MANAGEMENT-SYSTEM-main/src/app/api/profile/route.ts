import { requireAuth } from "@/lib/api/auth";
import { createActivity } from "@/lib/api/activity";
import { apiError, apiSuccess } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";

export async function GET() {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  return apiSuccess(auth.profile);
}

export async function PUT(request: Request) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);

  if (!body) {
    return apiError("Invalid request payload", 400);
  }

  const fullName = body.full_name ? String(body.full_name).trim() : "";

  if (!fullName) {
    return apiError("Full name is required and cannot be empty", 400);
  }

  const { data, error } = await auth.supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", auth.profile.id)
    .select()
    .single();

  if (error) {
    return apiError("Failed to update profile", 500);
  }

  await createActivity(auth.profile.id, "profile_updated", `Updated profile name to ${fullName}.`);

  return apiSuccess(data);
}
