import { requireAuth } from "@/lib/api/auth";
import { createNotificationForProfile } from "@/lib/api/notifications";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getMissingRequiredFields, parseJsonBody } from "@/lib/api/validation";

export async function GET() {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { data, error } = await auth.supabase
    .from("tasks")
    .select("*, profiles!assigned_to(full_name, email, role)")
    .order("created_at", { ascending: false });

  if (error) {
    return apiError("Failed to load tasks", 500);
  }

  return apiSuccess(
    (data ?? []).map((task) => ({
      ...task,
      assignee_name: task.profiles?.full_name ?? null,
      assignee_email: task.profiles?.email ?? null,
      assignee_role: task.profiles?.role ?? null,
    })),
  );
}

export async function POST(request: Request) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  if (auth.role !== "ADMIN" && auth.role !== "HR" && auth.role !== "EMPLOYEE") {
    return apiError("Access denied", 403);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);

  if (!body) {
    return apiError("Invalid request payload", 400);
  }

  const missingFields = getMissingRequiredFields(body, ["title"]);

  if (missingFields.length > 0) {
    return apiError(`Missing required fields: ${missingFields.join(", ")}`, 400);
  }

  const payload = {
    title: String(body.title).trim(),
    description: body.description ? String(body.description).trim() : null,
    assigned_to: body.assigned_to ? String(body.assigned_to) : null,
    related_type: body.related_type ? String(body.related_type) : null,
    related_id: body.related_id ? String(body.related_id) : null,
    status: body.status && typeof body.status === "string" ? body.status : "TODO",
    due_date: body.due_date ? String(body.due_date) : null,
  };

  const { data, error } = await auth.supabase.from("tasks").insert(payload).select().single();

  if (error) {
    return apiError("Failed to create task record", 500);
  }

  const notificationTarget = payload.assigned_to || auth.profile.id;
  await createNotificationForProfile(auth.supabase, notificationTarget, "New task assigned", `A new task, “${payload.title}”, was assigned to you.`, "task");

  return apiSuccess(data, 201);
}
