import { requireAuth } from "@/lib/api/auth";
import { createNotificationForProfile } from "@/lib/api/notifications";
import { apiError, apiSuccess } from "@/lib/api/response";
import { parseJsonBody } from "@/lib/api/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { id } = await params;
  const { data, error } = await auth.supabase
    .from("tasks")
    .select("*, profiles!assigned_to(full_name, email, role)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return apiError("Failed to load task", 500);
  }

  if (!data) {
    return apiError("Task not found", 404);
  }

  if (auth.role !== "ADMIN" && auth.role !== "HR" && data.assigned_to !== auth.profile.id) {
    return apiError("You do not have access to this task", 403);
  }

  return apiSuccess({
    ...data,
    assignee_name: data.profiles?.full_name ?? null,
    assignee_email: data.profiles?.email ?? null,
    assignee_role: data.profiles?.role ?? null,
  });
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { id } = await params;
  const { data: existing, error: fetchError } = await auth.supabase.from("tasks").select("*").eq("id", id).maybeSingle();

  if (fetchError) {
    return apiError("Failed to load task", 500);
  }

  if (!existing) {
    return apiError("Task not found", 404);
  }

  if (auth.role !== "ADMIN" && auth.role !== "HR" && existing.assigned_to !== auth.profile.id) {
    return apiError("You do not have access to update this task", 403);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);

  if (!body) {
    return apiError("Invalid request payload", 400);
  }

  const updates: Record<string, string | null> = {};

  if (body.title !== undefined) updates.title = String(body.title).trim();
  if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() : null;
  if (body.assigned_to !== undefined) updates.assigned_to = body.assigned_to ? String(body.assigned_to) : null;
  if (body.related_type !== undefined) updates.related_type = body.related_type ? String(body.related_type) : null;
  if (body.related_id !== undefined) updates.related_id = body.related_id ? String(body.related_id) : null;
  if (body.status !== undefined) updates.status = String(body.status);
  if (body.due_date !== undefined) updates.due_date = body.due_date ? String(body.due_date) : null;

  if (Object.keys(updates).length === 0) {
    return apiError("No update fields provided", 400);
  }

  const { data, error } = await auth.supabase
    .from("tasks")
    .update(updates)
    .eq("id", id)
    .select("*, profiles!assigned_to(full_name, email, role)")
    .single();

  if (error) {
    return apiError("Failed to update task record", 500);
  }

  const targetAssignee = data.assigned_to;
  if (targetAssignee) {
    if (body.status !== undefined && existing.status !== body.status) {
      await createNotificationForProfile(
        auth.supabase,
        targetAssignee,
        "Task status updated",
        `Task “${data.title}” status was updated to ${body.status}.`,
        "task",
      );
    } else if (body.assigned_to !== undefined && existing.assigned_to !== body.assigned_to) {
      await createNotificationForProfile(
        auth.supabase,
        targetAssignee,
        "Task assigned",
        `You have been assigned to task “${data.title}”.`,
        "task",
      );
    }
  }

  return apiSuccess({
    ...data,
    assignee_name: data.profiles?.full_name ?? null,
    assignee_email: data.profiles?.email ?? null,
    assignee_role: data.profiles?.role ?? null,
  });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { id } = await params;
  const { data: existing, error: fetchError } = await auth.supabase.from("tasks").select("*").eq("id", id).maybeSingle();

  if (fetchError) {
    return apiError("Failed to load task", 500);
  }

  if (!existing) {
    return apiError("Task not found", 404);
  }

  if (auth.role !== "ADMIN" && auth.role !== "HR" && existing.assigned_to !== auth.profile.id) {
    return apiError("You do not have access to delete this task", 403);
  }

  const { error } = await auth.supabase.from("tasks").delete().eq("id", id);

  if (error) {
    return apiError("Failed to delete task record", 500);
  }

  return apiSuccess({ id, deleted: true });
}
