import { requireAuth } from "@/lib/api/auth";
import { createActivity } from "@/lib/api/activity";
import { createNotificationForProfile } from "@/lib/api/notifications";
import { apiError, apiSuccess } from "@/lib/api/response";
import { getMissingRequiredFields, parseJsonBody } from "@/lib/api/validation";

export async function GET() {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  let query = auth.supabase
    .from("interviews")
    .select("*, candidates!candidate_id(full_name, email, position_applied), profiles!interviewer(full_name, email, role)")
    .order("interview_date", { ascending: true });

  if (auth.role === "EMPLOYEE") {
    query = query.eq("interviewer", auth.profile.id);
  }

  const { data, error } = await query;

  if (error) {
    return apiError("Failed to load interviews", 500);
  }

  const hydrated = (data ?? []).map((interview) => ({
    ...interview,
    candidate_name: interview.candidates?.full_name ?? null,
    candidate_email: interview.candidates?.email ?? null,
    candidate_position: interview.candidates?.position_applied ?? null,
    interviewer_name: interview.profiles?.full_name ?? null,
    interviewer_email: interview.profiles?.email ?? null,
  }));

  return apiSuccess(hydrated);
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
  await createNotificationForProfile(auth.supabase, auth.profile.id, "Interview scheduled", `Interview scheduled for ${payload.interview_date} at ${payload.interview_time}.`, "interview");

  return apiSuccess(data, 201);
}
