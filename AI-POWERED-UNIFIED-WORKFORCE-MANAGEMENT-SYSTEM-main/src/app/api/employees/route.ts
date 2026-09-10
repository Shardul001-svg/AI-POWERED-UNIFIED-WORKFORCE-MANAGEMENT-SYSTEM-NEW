import { requireAuth, requireRole } from "@/lib/api/auth";
import { createActivity } from "@/lib/api/activity";
import { createNotificationForProfile } from "@/lib/api/notifications";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getMissingRequiredFields, parseJsonBody } from "@/lib/api/validation";

export async function GET() {
  const auth = await requireAuth();

  console.log("[api-employees] authResult", {
    hasAuth: !!auth,
    userId: auth?.user?.id ?? null,
    email: auth?.user?.email ?? null,
    profileId: auth?.profile?.id ?? null,
    role: auth?.role ?? null,
  });

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const query = auth.supabase
    .from("employees")
    .select("*, profiles!profile_id(full_name, email, role)")
    .order("created_at", { ascending: false });

  if (auth.role === "EMPLOYEE") {
    const { data, error } = await query.eq("profile_id", auth.profile.id);

    if (error) {
      return apiError("Failed to load employee record", 500);
    }

    return apiSuccess((data ?? []).map((employee) => ({
      ...employee,
      full_name: employee.profiles?.full_name ?? null,
      email: employee.profiles?.email ?? null,
      role: employee.profiles?.role ?? null,
    })));
  }

  if (auth.role === "CANDIDATE") {
    return apiError("No employee management access", 403);
  }

  const { data, error } = await query;

  console.log("[api-employees] queryResult", {
    rowCount: data?.length ?? 0,
    error: error ? { code: error.code, message: error.message, details: error.details, hint: error.hint } : null,
  });

  if (error) {
    return apiError("Failed to load employees", 500);
  }

  return apiSuccess((data ?? []).map((employee) => ({
    ...employee,
    full_name: employee.profiles?.full_name ?? null,
    email: employee.profiles?.email ?? null,
    role: employee.profiles?.role ?? null,
  })));
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "HR"]);

  if (!auth) {
    return apiError("Authentication required or insufficient permissions", 401);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);

  if (!body) {
    return apiError("Invalid request payload", 400);
  }

  const missingFields = getMissingRequiredFields(body, ["profile_id", "employee_code", "department", "position", "joining_date"]);

  if (missingFields.length > 0) {
    return apiError(`Missing required fields: ${missingFields.join(", ")}`, 400);
  }

  const payload = {
    profile_id: body.profile_id,
    employee_code: String(body.employee_code).trim(),
    department: String(body.department).trim(),
    position: String(body.position).trim(),
    joining_date: String(body.joining_date),
    phone: body.phone ? String(body.phone).trim() : null,
    status: body.status && typeof body.status === "string" ? body.status : "ACTIVE",
  };

  const { data, error } = await auth.supabase.from("employees").insert(payload).select().single();

  if (error) {
    return apiError("Failed to create employee record", 500);
  }

  await createActivity(auth.profile.id, "employee_created", `Employee ${payload.employee_code} was created.`);
  await createNotificationForProfile(auth.supabase, auth.profile.id, "Employee profile created", `Employee ${payload.employee_code} was created successfully.`, "employee");

  return apiSuccess(data, 201);
}
