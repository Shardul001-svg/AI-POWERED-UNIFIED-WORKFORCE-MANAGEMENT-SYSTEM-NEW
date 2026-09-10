import { requireAuth, requireRole } from "@/lib/api/auth";
import { createActivity } from "@/lib/api/activity";
import { createNotificationForProfiles, getProfileIdsByRoles } from "@/lib/api/notifications";
import { apiError, apiSuccess } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { id } = await params;
  const { data, error } = await auth.supabase.from("candidates").select("*").eq("id", id).maybeSingle();

  if (error) {
    return apiError("Failed to load candidate", 500);
  }

  if (!data) {
    return apiError("Candidate not found", 404);
  }

  if (auth.role === "ADMIN" || auth.role === "HR") {
    return apiSuccess(data);
  }

  if (auth.role === "CANDIDATE" && data.email === (auth.user?.email ?? "")) {
    return apiSuccess(data);
  }

  return apiError("You do not have access to this candidate record", 403);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { data: existing, error: fetchError } = await auth.supabase.from("candidates").select("*").eq("id", id).maybeSingle();

  if (fetchError) {
    return apiError("Failed to load candidate", 500);
  }

  if (!existing) {
    return apiError("Candidate not found", 404);
  }

  const canUpdate = auth.role === "ADMIN" || auth.role === "HR" || (auth.role === "CANDIDATE" && existing.email === (auth.user?.email ?? ""));

  if (!canUpdate) {
    return apiError("You do not have access to update this candidate record", 403);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);

  if (!body) {
    return apiError("Invalid request payload", 400);
  }

  const updates: Record<string, string | number | null> = {};

  if (body.full_name !== undefined) updates.full_name = String(body.full_name).trim();
  if (body.email !== undefined) updates.email = String(body.email).trim();
  if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).trim() : null;
  if (body.position_applied !== undefined) updates.position_applied = String(body.position_applied).trim();
  if (body.experience !== undefined) updates.experience = Number(body.experience);
  if (body.status !== undefined) updates.status = String(body.status);

  if (Object.keys(updates).length === 0) {
    return apiError("No update fields provided", 400);
  }

  const { data, error } = await auth.supabase.from("candidates").update(updates).eq("id", id).select().single();

  if (error) {
    return apiError("Failed to update candidate record", 500);
  }

  await createActivity(auth.profile.id, "candidate_updated", `Candidate ${id} was updated.`);

  if (body.status !== undefined && existing.status !== body.status) {
    const adminHrIds = await getProfileIdsByRoles(auth.supabase, ["ADMIN", "HR"]);
    if (adminHrIds.length > 0) {
      await createNotificationForProfiles(
        auth.supabase,
        adminHrIds,
        "Candidate status updated",
        `Candidate ${data.full_name || existing.full_name} status updated to ${body.status}.`,
        "candidate",
      );
    }
  }

  return apiSuccess(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN", "HR"]);

  if (!auth) {
    return apiError("Administrator or HR access required", 403);
  }

  const { id } = await params;
  const { data: existing, error: fetchError } = await auth.supabase.from("candidates").select("*").eq("id", id).maybeSingle();

  if (fetchError) {
    return apiError("Failed to load candidate", 500);
  }

  if (!existing) {
    return apiError("Candidate not found", 404);
  }

  const { error } = await auth.supabase.from("candidates").delete().eq("id", id);

  if (error) {
    return apiError("Failed to delete candidate record", 500);
  }

  await createActivity(auth.profile.id, "candidate_deleted", `Candidate ${existing.full_name} was deleted.`);

  return apiSuccess({ id, deleted: true });
}
