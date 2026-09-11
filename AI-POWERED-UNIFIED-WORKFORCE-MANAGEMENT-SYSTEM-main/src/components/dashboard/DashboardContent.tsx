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
  const { formatDate } = useI18n();
  const formattedDate = formatDate(new Date(), {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? t.dashboard.goodMorning : hour < 17 ? t.dashboard.goodAfternoon : t.dashboard.goodEvening;

  return (
    <div className="protected-page-content">
      {/* Header Greeting & Live Status */}
      <div className="protected-page-heading">
        <div>
          <div className="dashboard-eyebrow-wrap">
            <p className="eyebrow">{formattedDate}</p>
            <span className={`live-badge ${isLive ? "active" : "connecting"}`}>
              <Radio size={12} />
              {isLive ? t.dashboard.liveUpdates : t.dashboard.reconnecting}
            </span>
          </div>
          <h1>{greeting}, {greetingName.split(" ")[0]}.</h1>
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
                <UserPlus size={14} /> {t.dashboard.addEmployeeBtn}
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => setAddCandidateOpen(true)}
              >
                <UserPlus size={14} /> {t.dashboard.addCandidateBtn}
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={() => setScheduleInterviewOpen(true)}
              >
                <CalendarDays size={14} /> {t.dashboard.scheduleInterviewBtn}
              </button>
            </>
          )}
          {role === "EMPLOYEE" && (
            <button
              type="button"
              className="primary-button"
              onClick={() => setCreateRequestOpen(true)}
            >
              <Plus size={14} /> {t.dashboard.createRequestBtn}
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
          <span className="metric-label">{t.dashboard.totalRegisteredUsers}</span>
          <strong>{loading ? "..." : (stats?.totalUsers ?? 0)}</strong>
          <span className="metric-change positive">{t.dashboard.registeredProfiles}</span>
        </button>

        <button
          type="button"
          className="protected-metric-card"
          onClick={() => router.push("/employees")}
        >
          <div className="metric-icon teal">
            <UsersRound size={17} />
          </div>
          <span className="metric-label">{t.dashboard.employeesMetric}</span>
          <strong>{loading ? "..." : (stats?.totalEmployees ?? 0)}</strong>
          <span className="metric-change positive">{t.dashboard.activeWorkforce}</span>
        </button>

        <button
          type="button"
          className="protected-metric-card"
          onClick={() => router.push("/candidates")}
        >
          <div className="metric-icon blue">
            <FileSpreadsheet size={17} />
          </div>
          <span className="metric-label">{t.dashboard.candidatesMetric}</span>
          <strong>{loading ? "..." : (stats?.totalCandidates ?? 0)}</strong>
          <span className="metric-change neutral">{t.dashboard.recruitmentPipeline}</span>
        </button>

        <button
          type="button"
          className="protected-metric-card"
          onClick={() => router.push("/interviews")}
        >
          <div className="metric-icon coral">
            <CalendarClock size={17} />
          </div>
          <span className="metric-label">{t.dashboard.interviewsScheduledMetric}</span>
          <strong>{loading ? "..." : (stats?.scheduledInterviews ?? 0)}</strong>
          <span className="metric-change warning">{t.dashboard.upcomingSessions}</span>
        </button>

        <button
          type="button"
          className="protected-metric-card"
          onClick={() => router.push("/requests")}
        >
          <div className="metric-icon yellow">
            <CheckCircle2 size={17} />
          </div>
          <span className="metric-label">{t.dashboard.pendingRequestsMetric}</span>
          <strong>{loading ? "..." : (stats?.pendingRequests ?? 0)}</strong>
          <span className="metric-change warning">{t.dashboard.requiresReview}</span>
        </button>

        <button
          type="button"
          className="protected-metric-card"
          onClick={() => router.push("/notifications")}
        >
          <div className="metric-icon coral">
            <Bell size={17} />
          </div>
          <span className="metric-label">{t.dashboard.unreadNotificationsMetric}</span>
          <strong>{loading ? "..." : (stats?.unreadNotifications ?? 0)}</strong>
          <span className="metric-change neutral">{t.dashboard.needsAttention}</span>
        </button>
      </div>

      {/* Main Content Dashboard Panels */}
      <div className="dashboard-grid">
        {/* Today's Schedule Section */}
        <section className="protected-panel schedule-panel">
          <div className="protected-panel-heading">
            <div>
              <h2>{t.dashboard.todaySchedule}</h2>
              <p className="muted">{t.pages.interviewsSubtitle}</p>
            </div>
            <button
              type="button"
              className="text-link"
              onClick={() => router.push("/interviews")}
            >
              {t.dashboard.viewAllInterviews} <ArrowUpRight size={15} />
            </button>
          </div>

          <div className="schedule-list">
            {loading ? (
              <div className="empty-state">
                <span className="loading-spinner" /> {t.actions.loading}
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
                    {t.statuses[item.status.toLowerCase() as keyof typeof t.statuses] || item.status}
                  </span>
                </div>
              ))
            ) : (
              <div className="empty-state">
                {t.dashboard.noInterviewsToday}
              </div>
            )}
          </div>

          <button
            type="button"
            className="panel-footer-link"
            onClick={() => router.push("/interviews")}
          >
            {t.dashboard.viewAllInterviews} <ArrowUpRight size={14} />
          </button>
        </section>

        {/* Recent Activity Section */}
        <section className="protected-panel coverage-panel">
          <div className="protected-panel-heading">
            <div>
              <h2>{t.dashboard.recentActivity}</h2>
              <p className="muted">{t.dashboard.workspaceOverview}</p>
            </div>
            <span className="panel-kicker">{t.dashboard.liveUpdates}</span>
          </div>

          <div className="activity-list">
            {loading ? (
              <div className="empty-state">
                <span className="loading-spinner" /> {t.actions.loading}
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
              <div className="empty-state">{t.dashboard.noRecentActivity}</div>
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