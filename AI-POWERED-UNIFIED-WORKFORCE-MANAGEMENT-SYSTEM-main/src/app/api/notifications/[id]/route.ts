import { requireAuth } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { id } = await params;
  const { data: existing, error: fetchError } = await auth.supabase.from("notifications").select("*").eq("id", id).maybeSingle();

  if (fetchError) {
    return apiError("Failed to load notification", 500);
  }

  if (!existing) {
    return apiError("Notification not found", 404);
  }

  if (existing.profile_id !== auth.profile.id) {
    return apiError("You do not have access to this notification", 403);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);

  if (!body) {
    return apiError("Invalid request payload", 400);
  }

  const updates: Record<string, boolean> = {};

  if (body.is_read !== undefined) {
    updates.is_read = Boolean(body.is_read);
  }

  if (Object.keys(updates).length === 0) {
    return apiError("No update fields provided", 400);
  }

  const { data, error } = await auth.supabase.from("notifications").update(updates).eq("id", id).select().single();

  if (error) {
    return apiError("Failed to update notification", 500);
  }

  return apiSuccess(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { id } = await params;
  const { data: existing, error: fetchError } = await auth.supabase.from("notifications").select("*").eq("id", id).maybeSingle();

  if (fetchError) {
    return apiError("Failed to load notification", 500);
  }

  if (!existing) {
    return apiError("Notification not found", 404);
  }

  if (existing.profile_id !== auth.profile.id) {
    return apiError("You do not have access to this notification", 403);
  }

  const { error } = await auth.supabase.from("notifications").delete().eq("id", id);

  if (error) {
    return apiError("Failed to delete notification", 500);
  }

  return apiSuccess({ id, deleted: true });
}
