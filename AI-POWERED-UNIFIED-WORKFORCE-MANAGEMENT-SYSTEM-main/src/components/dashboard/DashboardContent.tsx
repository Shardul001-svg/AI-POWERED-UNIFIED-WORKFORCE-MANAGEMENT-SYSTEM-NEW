"use client";

import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarClock,
  CalendarDays,
  CheckCircle2,
  Clock3,
  FileSpreadsheet,
  Plus,
  Radio,
  UserPlus,
  Users,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";

import { AddCandidateModal } from "./AddCandidateModal";
import { AddEmployeeModal } from "./AddEmployeeModal";
import { CreateRequestModal } from "./CreateRequestModal";
import { ScheduleInterviewModal } from "./ScheduleInterviewModal";
import { useDashboardRealtime } from "./useDashboardRealtime";

type DashboardStats = {
  totalUsers: number;
  totalEmployees: number;
  totalCandidates: number;
  scheduledInterviews: number;
  pendingRequests: number;
  unreadNotifications: number;
  todayInterviews: Array<{
    id: string;
    interview_date: string;
    interview_time: string;
    status: string;
    candidates?: { full_name?: string; position_applied?: string } | null;
    profiles?: { full_name?: string } | null;
  }>;
  recentActivities: Array<{
    id: string;
    action: string;
    description: string;
    created_at: string;
    profiles?: { full_name?: string } | null;
  }>;
};

export function DashboardContent() {
  const router = useRouter();
  const { profile, role } = useAuth();
  const { t } = useI18n();

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal open states
  const [addEmployeeOpen, setAddEmployeeOpen] = useState(false);
  const [addCandidateOpen, setAddCandidateOpen] = useState(false);
  const [scheduleInterviewOpen, setScheduleInterviewOpen] = useState(false);
  const [createRequestOpen, setCreateRequestOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Unable to load dashboard stats");
      }

      setStats(payload.data);
      setError(null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unable to connect to database");
    } finally {
      setLoading(false);
    }
  }, []);

  const { isLive } = useDashboardRealtime(fetchStats);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
        const payload = await res.json();

        if (active) {
          if (!res.ok || !payload.success) {
            setError(payload.error || "Unable to load dashboard stats");
          } else {
            setStats(payload.data);
            setError(null);
          }
          setLoading(false);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : "Unable to connect to database");
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const greetingName = profile?.full_name || "Workspace user";
  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="protected-page-content">
      {/* Header Greeting & Live Status */}
      <div className="protected-page-heading">
        <div>
          <div className="dashboard-eyebrow-wrap">
            <p className="eyebrow">{formattedDate}</p>
            <span className={`live-badge ${isLive ? "active" : "connecting"}`}>
              <Radio size={12} />
              {isLive ? "Live updates" : "Reconnecting..."}
            </span>
          </div>
          <h1>Good morning, {greetingName.split(" ")[0]}.</h1>
          <p className="muted">{t.pages.dashboardSubtitle}</p>
        </div>

        {/* Quick Action Buttons */}
        <div className="dashboard-quick-actions">
          {(role === "ADMIN" || role === "HR") && (
            <>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setAddEmployeeOpen(true)}
              >
                <UserPlus size={14} /> + Add Employee
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setAddCandidateOpen(true)}
              >
                <UserPlus size={14} /> + Add Candidate
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => setScheduleInterviewOpen(true)}
              >
                <CalendarDays size={14} /> Schedule Interview
              </button>
            </>
          )}
          {role === "EMPLOYEE" && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setCreateRequestOpen(true)}
            >
              <Plus size={14} /> Create Request
            </button>
          )}
        </div>
      </div>

      {error && <div className="auth-error">{error}</div>}

      {/* Metrics Grid */}
      <div className="protected-metric-grid">
        <button
          type="button"
          className="protected-metric-card"
          onClick={() => router.push("/employees")}
        >
          <div className="metric-icon teal">
            <Users size={17} />
          </div>
          <span className="metric-label">Total registered users</span>
          <strong>{loading ? "..." : (stats?.totalUsers ?? 0)}</strong>
          <span className="metric-change positive">Registered profiles</span>
        </button>

        <button
          type="button"
          className="protected-metric-card"
          onClick={() => router.push("/employees")}
        >
          <div className="metric-icon teal">
            <UsersRound size={17} />
          </div>
          <span className="metric-label">Employees</span>
          <strong>{loading ? "..." : (stats?.totalEmployees ?? 0)}</strong>
          <span className="metric-change positive">Active workforce</span>
        </button>

        <button
          type="button"
          className="protected-metric-card"
          onClick={() => router.push("/candidates")}
        >
          <div className="metric-icon blue">
            <FileSpreadsheet size={17} />
          </div>
          <span className="metric-label">Candidates</span>
          <strong>{loading ? "..." : (stats?.totalCandidates ?? 0)}</strong>
          <span className="metric-change neutral">Recruitment pipeline</span>
        </button>

        <button
          type="button"
          className="protected-metric-card"
          onClick={() => router.push("/interviews")}
        >
          <div className="metric-icon coral">
            <CalendarClock size={17} />
          </div>
          <span className="metric-label">Interviews scheduled</span>
          <strong>{loading ? "..." : (stats?.scheduledInterviews ?? 0)}</strong>
          <span className="metric-change warning">Upcoming sessions</span>
        </button>

        <button
          type="button"
          className="protected-metric-card"
          onClick={() => router.push("/requests")}
        >
          <div className="metric-icon yellow">
            <CheckCircle2 size={17} />
          </div>
          <span className="metric-label">Pending requests</span>
          <strong>{loading ? "..." : (stats?.pendingRequests ?? 0)}</strong>
          <span className="metric-change warning">Awaiting review</span>
        </button>

        <button
          type="button"
          className="protected-metric-card"
          onClick={() => router.push("/notifications")}
        >
          <div className="metric-icon coral">
            <Bell size={17} />
          </div>
          <span className="metric-label">Unread notifications</span>
          <strong>{loading ? "..." : (stats?.unreadNotifications ?? 0)}</strong>
          <span className="metric-change neutral">Personal updates</span>
        </button>
      </div>

      {/* Main Content Dashboard Panels */}
      <div className="dashboard-grid">
        {/* Today's Schedule Section */}
        <section className="protected-panel schedule-panel">
          <div className="protected-panel-heading">
            <div>
              <h2>Schedule & Interviews</h2>
              <p className="muted">Upcoming candidate interviews and scheduled sessions.</p>
            </div>
            <button
              type="button"
              className="text-link"
              onClick={() => router.push("/interviews")}
            >
              View schedule <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="schedule-list">
            {loading ? (
              <div className="empty-state">
                <span className="loading-spinner" /> Loading schedule...
              </div>
            ) : stats?.todayInterviews && stats.todayInterviews.length > 0 ? (
              stats.todayInterviews.map((item) => (
                <div className="shift-row" key={item.id}>
                  <div className="avatar avatar-person">
                    {(item.candidates?.full_name || "C")
                      .split(" ")
                      .map((p) => p[0])
                      .join("")
                      .slice(0, 2)}
                  </div>
                  <div className="person-details">
                    <strong>{item.candidates?.full_name || "Candidate"}</strong>
                    <span>{item.candidates?.position_applied || "Interview"}</span>
                  </div>
                  <span className="shift-time">
                    <Clock3 size={12} style={{ display: "inline", marginRight: "4px" }} />
                    {item.interview_date} {item.interview_time}
                  </span>
                  <span className={`status ${item.status === "SCHEDULED" ? "status-on" : "status-soon"}`}>
                    <i />
                    {item.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                No interviews or scheduled activities for today.
              </div>
            )}
          </div>

          <button
            type="button"
            className="panel-footer-link"
            onClick={() => router.push("/interviews")}
          >
            Go to interview schedules <ArrowUpRight size={14} />
          </button>
        </section>

        {/* Recent Activity Section */}
        <section className="protected-panel coverage-panel">
          <div className="protected-panel-heading">
            <div>
              <h2>Recent Activity</h2>
              <p className="muted">Real audit stream from system operations.</p>
            </div>
            <span className="panel-kicker">Live Stream</span>
          </div>

          <div className="activity-list">
            {loading ? (
              <div className="empty-state">
                <span className="loading-spinner" /> Loading activities...
              </div>
            ) : stats?.recentActivities && stats.recentActivities.length > 0 ? (
              stats.recentActivities.map((act) => (
                <div className="activity-item" key={act.id}>
                  <div className="activity-icon">
                    <Activity size={14} />
                  </div>
                  <div className="activity-details">
                    <p>{act.description || act.action}</p>
                    <span className="activity-time">
                      {new Date(act.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">No recent activity.</div>
            )}
          </div>
        </section>
      </div>

      {/* Quick Action Modals */}
      <AddEmployeeModal
        isOpen={addEmployeeOpen}
        onClose={() => setAddEmployeeOpen(false)}
        onSuccess={() => void fetchStats()}
      />
      <AddCandidateModal
        isOpen={addCandidateOpen}
        onClose={() => setAddCandidateOpen(false)}
        onSuccess={() => void fetchStats()}
      />
      <ScheduleInterviewModal
        isOpen={scheduleInterviewOpen}
        onClose={() => setScheduleInterviewOpen(false)}
        onSuccess={() => void fetchStats()}
        onOpenAddCandidate={() => setAddCandidateOpen(true)}
      />
      <CreateRequestModal
        isOpen={createRequestOpen}
        onClose={() => setCreateRequestOpen(false)}
        onSuccess={() => void fetchStats()}
      />
    </div>
  );
}