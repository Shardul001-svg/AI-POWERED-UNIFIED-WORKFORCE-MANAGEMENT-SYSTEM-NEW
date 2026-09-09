import { requireAuth } from "@/lib/api/auth";
import { createActivity } from "@/lib/api/activity";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getMissingRequiredFields, parseJsonBody } from "@/lib/api/validation";

export async function GET() {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const baseQuery = auth.supabase.from("requests").select("*, employees!employee_id(id, profile_id, employee_code, department, position, profiles!profile_id(full_name, email, role))").order("created_at", { ascending: false });

  if (auth.role === "ADMIN" || auth.role === "HR") {
    const { data, error } = await baseQuery;

    if (error) {
      return apiError("Failed to load requests", 500);
    }

    return apiSuccess((data ?? []).map((row) => ({
      ...row,
      employee_name: row.employees?.profiles?.full_name ?? null,
      employee_email: row.employees?.profiles?.email ?? null,
      employee_role: row.employees?.profiles?.role ?? null,
      employee_code: row.employees?.employee_code ?? null,
      employee_department: row.employees?.department ?? null,
      employee_position: row.employees?.position ?? null,
    })));
  }

  const { data: employeeRecord, error: employeeError } = await auth.supabase
    .from("employees")
    .select("id")
    .eq("profile_id", auth.profile.id)
    .maybeSingle();

  if (employeeError) {
    return apiError("Failed to load your employee record", 500);
  }

  if (!employeeRecord) {
    return apiError("Employee profile not found", 403);
  }

  const { data, error } = await baseQuery.eq("employee_id", employeeRecord.id);

  if (error) {
    return apiError("Failed to load your requests", 500);
  }

  return apiSuccess((data ?? []).map((row) => ({
    ...row,
    employee_name: row.employees?.profiles?.full_name ?? null,
    employee_email: row.employees?.profiles?.email ?? null,
    employee_role: row.employees?.profiles?.role ?? null,
    employee_code: row.employees?.employee_code ?? null,
    employee_department: row.employees?.department ?? null,
    employee_position: row.employees?.position ?? null,
  })));
}

export async function POST(request: Request) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  if (auth.role !== "EMPLOYEE" && auth.role !== "ADMIN" && auth.role !== "HR") {
    return apiError("Only employees, HR, and admins can create requests", 403);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);

  if (!body) {
    return apiError("Invalid request payload", 400);
  }

  const missingFields = getMissingRequiredFields(body, ["type", "title"]);

  if (missingFields.length > 0) {
    return apiError(`Missing required fields: ${missingFields.join(", ")}`, 400);
  }

  let employeeId: string | null = null;

  if (auth.role === "EMPLOYEE") {
    const { data: employeeRecord, error: employeeError } = await auth.supabase
      .from("employees")
      .select("id")
      .eq("profile_id", auth.profile.id)
      .maybeSingle();

    if (employeeError) {
      return apiError("Failed to load your employee record", 500);
    }

    if (!employeeRecord) {
      return apiError("Employee profile not found", 403);
    }

    employeeId = employeeRecord.id;
  } else {
    employeeId = body.employee_id ? String(body.employee_id) : null;
  }

  if (!employeeId) {
    return apiError("Employee id is required", 400);
  }

  const payload = {
    employee_id: employeeId,
    type: String(body.type),
    title: String(body.title).trim(),
    description: body.description ? String(body.description).trim() : null,
    status: body.status && typeof body.status === "string" ? body.status : "PENDING",
  };

  const { data, error } = await auth.supabase.from("requests").insert(payload).select().single();

  if (error) {
    return apiError("Failed to create request record", 500);
  }

  await createActivity(auth.profile.id, "request_submitted", `Request ${payload.title} was submitted.`);

  return apiSuccess(data, 201);
}
