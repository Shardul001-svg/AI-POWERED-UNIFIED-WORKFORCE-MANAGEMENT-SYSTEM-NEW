import { requireAuth } from "@/lib/api/auth";
import { createActivity } from "@/lib/api/activity";
import { apiError, apiSuccess } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { id } = await params;
  const { data, error } = await auth.supabase
    .from("requests")
    .select("*, employees!employee_id(id, profile_id, employee_code, department, position, profiles!profile_id(full_name, email, role))")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return apiError("Failed to load request", 500);
  }

  if (!data) {
    return apiError("Request not found", 404);
  }

  const employeeMatch = data.employees?.profile_id === auth.profile.id;

  if (auth.role === "ADMIN" || auth.role === "HR" || employeeMatch) {
    return apiSuccess({
      ...data,
      employee_name: data.employees?.profiles?.full_name ?? null,
      employee_email: data.employees?.profiles?.email ?? null,
      employee_role: data.employees?.profiles?.role ?? null,
      employee_code: data.employees?.employee_code ?? null,
      employee_department: data.employees?.department ?? null,
      employee_position: data.employees?.position ?? null,
    });
  }

  return apiError("You do not have access to this request", 403);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { id } = await params;
  const { data: existing, error: fetchError } = await auth.supabase.from("requests").select("*").eq("id", id).maybeSingle();

  if (fetchError) {
    return apiError("Failed to load request", 500);
  }

  if (!existing) {
    return apiError("Request not found", 404);
  }

  const { data: currentEmployee, error: employeeError } = await auth.supabase
    .from("employees")
    .select("id")
    .eq("profile_id", auth.profile.id)
    .maybeSingle();

  if (employeeError) {
    return apiError("Failed to validate employee access", 500);
  }

  if (auth.role !== "ADMIN" && auth.role !== "HR" && existing.employee_id !== currentEmployee?.id) {
    return apiError("You do not have access to update this request", 403);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);

  if (!body) {
    return apiError("Invalid request payload", 400);
  }

  const updates: Record<string, string | null> = {};

  if (body.type !== undefined) updates.type = String(body.type);
  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() : null;
  if (body.status !== undefined) updates.status = String(body.status);

  if (Object.keys(updates).length === 0) {
    return apiError("No update fields provided", 400);
  }

  const { data, error } = await auth.supabase.from("requests").update({ ...updates, updated_at: new Date().toISOString() }).eq("id", id).select().single();

  if (error) {
    return apiError("Failed to update request record", 500);
  }

  if (body.status !== undefined) {
    await createActivity(auth.profile.id, "request_status_updated", `Request ${id} status updated to ${body.status}.`);
  }

  return apiSuccess(data);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { id } = await params;
  const { data: existing, error: fetchError } = await auth.supabase.from("requests").select("*").eq("id", id).maybeSingle();

  if (fetchError) {
    return apiError("Failed to load request", 500);
  }

  if (!existing) {
    return apiError("Request not found", 404);
  }

  const { data: currentEmployee, error: employeeError } = await auth.supabase
    .from("employees")
    .select("id")
    .eq("profile_id", auth.profile.id)
    .maybeSingle();

  if (employeeError) {
    return apiError("Failed to validate employee access", 500);
  }

  if (auth.role !== "ADMIN" && auth.role !== "HR" && existing.employee_id !== currentEmployee?.id) {
    return apiError("You do not have access to delete this request", 403);
  }

  const { error } = await auth.supabase.from("requests").delete().eq("id", id);

  if (error) {
    return apiError("Failed to delete request record", 500);
  }

  await createActivity(auth.profile.id, "request_deleted", `Request ${id} was deleted.`);

  return apiSuccess({ id, deleted: true });
}
