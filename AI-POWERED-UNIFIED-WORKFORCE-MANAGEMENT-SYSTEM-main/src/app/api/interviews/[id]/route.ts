import { requireAuth } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { id } = await params;
  const { data, error } = await auth.supabase.from("interviews").select("*").eq("id", id).maybeSingle();

  if (error) {
    return apiError("Failed to load interview", 500);
  }

  if (!data) {
    return apiError("Interview not found", 404);
  }

  return apiSuccess(data);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  if (auth.role !== "ADMIN" && auth.role !== "HR") {
    return apiError("Only admins and HR can update interviews", 403);
  }

  const { id } = await params;
  const body = await parseJsonBody<Record<string, unknown>>(request);

  if (!body) {
    return apiError("Invalid request payload", 400);
  }

  const updates: Record<string, string | null> = {};

  if (body.interview_date !== undefined) updates.interview_date = String(body.interview_date);
  if (body.interview_time !== undefined) updates.interview_time = String(body.interview_time);
  if (body.status !== undefined) updates.status = String(body.status);
  if (body.notes !== undefined) updates.notes = body.notes ? String(body.notes).trim() : null;
  if (body.interviewer !== undefined) updates.interviewer = body.interviewer ? String(body.interviewer) : null;

  if (Object.keys(updates).length === 0) {
    return apiError("No update fields provided", 400);
  }

  const { data, error } = await auth.supabase.from("interviews").update(updates).eq("id", id).select().single();

  if (error) {
    return apiError("Failed to update interview record", 500);
  }

  return apiSuccess(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  if (auth.role !== "ADMIN" && auth.role !== "HR") {
    return apiError("Only admins and HR can delete interviews", 403);
  }

  const { id } = await params;
  const { error } = await auth.supabase.from("interviews").delete().eq("id", id);

  if (error) {
    return apiError("Failed to delete interview record", 500);
  }

  return apiSuccess({ id, deleted: true });
}
