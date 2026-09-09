import { requireAuth, requireRole } from "@/lib/api/auth";
import { createActivity } from "@/lib/api/activity";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getMissingRequiredFields, parseJsonBody } from "@/lib/api/validation";

export async function GET() {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  if (auth.role === "ADMIN" || auth.role === "HR") {
    const { data, error } = await auth.supabase.from("candidates").select("*").order("created_at", { ascending: false });

    if (error) {
      return apiError("Failed to load candidates", 500);
    }

    return apiSuccess(data ?? []);
  }

  if (auth.role === "EMPLOYEE") {
    return apiError("Candidate management is not available to employees", 403);
  }

  const userEmail = auth.user?.email ?? "";
  const { data, error } = await auth.supabase.from("candidates").select("*").eq("email", userEmail).order("created_at", { ascending: false });

  if (error) {
    return apiError("Failed to load your candidate profile", 500);
  }

  return apiSuccess(data ?? []);
}

export async function POST(request: Request) {
  const auth = await requireRole(["ADMIN", "HR"]);

  if (!auth) {
    return apiError("Administrator or HR access required", 403);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);

  if (!body) {
    return apiError("Invalid request payload", 400);
  }

  const missingFields = getMissingRequiredFields(body, ["full_name", "email", "position_applied", "experience"]);

  if (missingFields.length > 0) {
    return apiError(`Missing required fields: ${missingFields.join(", ")}`, 400);
  }

  const payload = {
    full_name: String(body.full_name).trim(),
    email: String(body.email).trim(),
    phone: body.phone ? String(body.phone).trim() : null,
    position_applied: String(body.position_applied).trim(),
    experience: Number(body.experience),
    status: body.status && typeof body.status === "string" ? body.status : "APPLIED",
  };

  const { data, error } = await auth.supabase.from("candidates").insert(payload).select().single();

  if (error) {
    return apiError("Failed to create candidate record", 500);
  }

  await createActivity(auth.profile.id, "candidate_created", `Candidate ${payload.full_name} was created.`);

  return apiSuccess(data, 201);
}
