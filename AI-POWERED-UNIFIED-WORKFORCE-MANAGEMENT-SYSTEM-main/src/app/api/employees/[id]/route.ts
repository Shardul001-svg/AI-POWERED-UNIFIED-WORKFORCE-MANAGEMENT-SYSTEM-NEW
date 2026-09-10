import { requireAuth, requireRole } from "@/lib/api/auth";
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
    .from("employees")
    .select("*, profiles!profile_id(full_name, email, role)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return apiError("Failed to load employee", 500);
  }

  if (!data) {
    return apiError("Employee not found", 404);
  }

  const withProfile = {
    ...data,
    full_name: data.profiles?.full_name ?? null,
    email: data.profiles?.email ?? null,
    role: data.profiles?.role ?? null,
  };

  if (auth.role === "ADMIN" || auth.role === "HR") {
    return apiSuccess(withProfile);
  }

  if (auth.role === "EMPLOYEE" && data.profile_id === auth.profile.id) {
    return apiSuccess(withProfile);
  }

  return apiError("You do not have access to this employee record", 403);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { data: existing, error: fetchError } = await auth.supabase.from("employees").select("*").eq("id", id).maybeSingle();

  if (fetchError) {
    return apiError("Failed to load employee", 500);
  }

  if (!existing) {
    return apiError("Employee not found", 404);
  }

  if (auth.role !== "ADMIN" && auth.role !== "HR" && !(auth.role === "EMPLOYEE" && existing.profile_id === auth.profile.id)) {
    return apiError("You do not have access to update this employee record", 403);
  }

  if (auth.role === "EMPLOYEE" && existing.profile_id !== auth.profile.id) {
    return apiError("You can only update your own employee record", 403);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);

  if (!body) {
    return apiError("Invalid request payload", 400);
  }

  const updates: Record<string, string | null> = {};

  if (body.department !== undefined) updates.department = String(body.department).trim();
  if (body.position !== undefined) updates.position = String(body.position).trim();
  if (body.phone !== undefined) updates.phone = body.phone ? String(body.phone).trim() : null;
  if (body.status !== undefined) updates.status = String(body.status);
  if (body.employee_code !== undefined) updates.employee_code = String(body.employee_code).trim();
  if (body.joining_date !== undefined) updates.joining_date = String(body.joining_date).trim();

  // Update associated profile if full_name or email are provided
  if (body.full_name !== undefined || body.email !== undefined) {
    const profileUpdates: Record<string, string> = {};
    if (body.full_name !== undefined) profileUpdates.full_name = String(body.full_name).trim();
    if (body.email !== undefined) profileUpdates.email = String(body.email).trim().toLowerCase();

    if (Object.keys(profileUpdates).length > 0 && existing.profile_id) {
      const { error: profErr } = await auth.supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", existing.profile_id);

      if (profErr) {
        return apiError(`Failed to update user profile: ${profErr.message}`, 400);
      }
    }
  }

  if (Object.keys(updates).length > 0) {
    const { error: empErr } = await auth.supabase.from("employees").update(updates).eq("id", id);

    if (empErr) {
      if (empErr.code === "23505" || empErr.message?.includes("unique")) {
        return apiError(`An employee with code '${updates.employee_code || existing.employee_code}' already exists.`, 400);
      }
      return apiError(empErr.message || "Failed to update employee record", 500);
    }
  }

  const { data: updatedEmp, error: fetchUpdatedErr } = await auth.supabase
    .from("employees")
    .select("*, profiles!profile_id(full_name, email, role)")
    .eq("id", id)
    .single();

  if (fetchUpdatedErr || !updatedEmp) {
    return apiError("Employee updated, but failed to reload details", 500);
  }

  const result = {
    ...updatedEmp,
    full_name: updatedEmp.profiles?.full_name ?? null,
    email: updatedEmp.profiles?.email ?? null,
    role: updatedEmp.profiles?.role ?? null,
  };

  await createActivity(auth.profile.id, "employee_updated", `Employee ${id} was updated.`);

  return apiSuccess(result);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(["ADMIN"]);

  if (!auth) {
    return apiError("Administrator access required", 403);
  }

  const { id } = await params;
  const { data: existing, error: fetchError } = await auth.supabase.from("employees").select("*").eq("id", id).maybeSingle();

  if (fetchError) {
    return apiError("Failed to load employee", 500);
  }

  if (!existing) {
    return apiError("Employee not found", 404);
  }

  const { error } = await auth.supabase.from("employees").delete().eq("id", id);

  if (error) {
    return apiError("Failed to delete employee record", 500);
  }

  await createActivity(auth.profile.id, "employee_deleted", `Employee ${existing.employee_code} was deleted.`);

  return apiSuccess({ id, deleted: true });
}
