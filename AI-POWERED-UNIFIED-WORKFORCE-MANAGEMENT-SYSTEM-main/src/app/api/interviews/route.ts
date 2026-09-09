import { requireAuth } from "@/lib/api/auth";
import { createActivity } from "@/lib/api/activity";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getMissingRequiredFields, parseJsonBody } from "@/lib/api/validation";

export async function GET() {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const { data, error } = await auth.supabase.from("interviews").select("*\n").order("interview_date", { ascending: true });

  if (error) {
    return apiError("Failed to load interviews", 500);
  }

  return apiSuccess(data ?? []);
}

export async function POST(request: Request) {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  if (auth.role !== "ADMIN" && auth.role !== "HR") {
    return apiError("Only admins and HR can schedule interviews", 403);
  }

  const body = await parseJsonBody<Record<string, unknown>>(request);

  if (!body) {
    return apiError("Invalid request payload", 400);
  }

  const missingFields = getMissingRequiredFields(body, ["candidate_id", "interview_date", "interview_time"]);

  if (missingFields.length > 0) {
    return apiError(`Missing required fields: ${missingFields.join(", ")}`, 400);
  }

  const payload = {
    candidate_id: String(body.candidate_id),
    interviewer: body.interviewer ? String(body.interviewer) : auth.profile.id,
    interview_date: String(body.interview_date),
    interview_time: String(body.interview_time),
    status: body.status && typeof body.status === "string" ? body.status : "SCHEDULED",
    notes: body.notes ? String(body.notes).trim() : null,
  };

  const { data, error } = await auth.supabase.from("interviews").insert(payload).select().single();

  if (error) {
    return apiError("Failed to create interview record", 500);
  }

  await createActivity(auth.profile.id, "interview_scheduled", `Interview for candidate ${payload.candidate_id} was scheduled.`);

  return apiSuccess(data, 201);
}
