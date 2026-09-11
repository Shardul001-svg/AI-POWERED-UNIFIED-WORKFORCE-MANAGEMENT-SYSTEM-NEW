import { requireAuth } from "@/lib/api/auth";
import { apiError, apiSuccess } from "@/lib/api/response";

export async function GET() {
  const auth = await requireAuth();

  if (!auth) {
    return apiError("Authentication required", 401);
  }

  const supabase = auth.supabase;

  if (auth.role === "EMPLOYEE") {
    const { data: employeeRecord } = await supabase
      .from("employees")
      .select("id, employee_code, department, position, status")
      .eq("profile_id", auth.profile.id)
      .maybeSingle();

    const employeeId = employeeRecord?.id;

    const [
      pendingRequestsRes,
      approvedRequestsRes,
      totalRequestsRes,
      assignedTasksRes,
      notificationsRes,
      recentRequestsRes,
      activitiesRes,
    ] = await Promise.all([
      employeeId
        ? supabase.from("requests").select("*", { count: "exact", head: true }).eq("employee_id", employeeId).eq("status", "PENDING")
        : Promise.resolve({ count: 0 }),
      employeeId
        ? supabase.from("requests").select("*", { count: "exact", head: true }).eq("employee_id", employeeId).eq("status", "APPROVED")
        : Promise.resolve({ count: 0 }),
      employeeId
        ? supabase.from("requests").select("*", { count: "exact", head: true }).eq("employee_id", employeeId)
        : Promise.resolve({ count: 0 }),
      supabase.from("tasks").select("*", { count: "exact", head: true }).eq("assigned_to", auth.profile.id).neq("status", "COMPLETED"),
      supabase.from("notifications").select("*", { count: "exact", head: true }).eq("profile_id", auth.profile.id).eq("is_read", false),
      employeeId
        ? supabase.from("requests").select("*").eq("employee_id", employeeId).order("created_at", { ascending: false }).limit(4)
        : Promise.resolve({ data: [] }),
      supabase.from("activities").select("*").eq("profile_id", auth.profile.id).order("created_at", { ascending: false }).limit(5),
    ]);

    return apiSuccess({
      role: auth.role,
      myPendingRequests: pendingRequestsRes.count ?? 0,
      myApprovedRequests: approvedRequestsRes.count ?? 0,
      myTotalRequests: totalRequestsRes.count ?? 0,
      myAssignedTasks: assignedTasksRes.count ?? 0,
      unreadNotifications: notificationsRes.count ?? 0,
      recentRequests: recentRequestsRes.data ?? [],
      recentActivities: activitiesRes.data ?? [],
      employeeInfo: employeeRecord ?? null,
    });
  }

  // Admin and HR roles
  const [
    activeEmployeesRes,
    totalEmployeesRes,
    candidatesRes,
    interviewsRes,
    requestsRes,
    activeTasksRes,
    notificationsRes,
    todayInterviewsRes,
    activitiesRes,
  ] = await Promise.all([
    supabase.from("employees").select("*", { count: "exact", head: true }).eq("status", "ACTIVE"),
    supabase.from("employees").select("*", { count: "exact", head: true }),
    supabase.from("candidates").select("*", { count: "exact", head: true }),
    supabase.from("interviews").select("*", { count: "exact", head: true }).eq("status", "SCHEDULED"),
    supabase.from("requests").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabase.from("tasks").select("*", { count: "exact", head: true }).neq("status", "COMPLETED"),
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

  return apiSuccess({
    role: auth.role,
    activeEmployees: activeEmployeesRes.count ?? 0,
    totalEmployees: totalEmployeesRes.count ?? 0,
    totalCandidates: candidatesRes.count ?? 0,
    scheduledInterviews: interviewsRes.count ?? 0,
    pendingRequests: requestsRes.count ?? 0,
    activeTasks: activeTasksRes.count ?? 0,
    unreadNotifications: notificationsRes.count ?? 0,
    todayInterviews: todayInterviewsRes.data ?? [],
    recentActivities: activitiesRes.data ?? [],
  });
}
