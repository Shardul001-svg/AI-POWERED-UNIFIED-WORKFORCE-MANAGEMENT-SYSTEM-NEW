import { requireAuth } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const supabase = auth.supabase;

  const [
    profilesRes,
    employeesRes,
    candidatesRes,
    interviewsRes,
    requestsRes,
    notificationsRes,
    todayInterviewsRes,
    activitiesRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("employees").select("*", { count: "exact", head: true }),
    supabase.from("candidates").select("*", { count: "exact", head: true }),
    supabase.from("interviews").select("*", { count: "exact", head: true }).eq("status", "SCHEDULED"),
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("notifications").select("*", { count: "exact", head: true }).eq("profile_id", auth.profile.id).eq("is_read", false),
    supabase
      .from("interviews")
      .select("*, candidates(full_name, position_applied), profiles(full_name)")
      .order("interview_date", { ascending: true })
      .order("interview_time", { ascending: true })
      .limit(5),
    supabase
      .from("activities")
      .select("*, profiles(full_name)")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const stats = {
    totalUsers: profilesRes.count ?? 0,
    totalEmployees: employeesRes.count ?? 0,
    totalCandidates: candidatesRes.count ?? 0,
    scheduledInterviews: interviewsRes.count ?? 0,
    pendingRequests: requestsRes.count ?? 0,
    unreadNotifications: notificationsRes.count ?? 0,
    todayInterviews: todayInterviewsRes.data ?? [],
    recentActivities: activitiesRes.data ?? [],
  };

  return apiSuccess(stats);
}
