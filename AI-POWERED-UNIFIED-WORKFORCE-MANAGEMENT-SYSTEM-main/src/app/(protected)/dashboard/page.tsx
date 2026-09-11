"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarClock, CheckCircle2, Clock3, Loader2, Plus, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import WorkerChat from "@/components/workerchat";

interface DashboardStats {
  role?: string;
  // Admin stats
  activeEmployees?: number;
  totalEmployees?: number;
  totalCandidates?: number;
  scheduledInterviews?: number;
  pendingRequests?: number;
  activeTasks?: number;
  unreadNotifications?: number;
  // Employee stats
  myPendingRequests?: number;
  myApprovedRequests?: number;
  myTotalRequests?: number;
  myAssignedTasks?: number;
  employeeInfo?: {
    id: string;
    employee_code: string;
    department: string;
    position: string;
    status: string;
  } | null;
}

export default function DashboardPage() {
  const router = useRouter();
  const { profile, role } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const fetchStats = async () => {
      try {
        const res = await fetch("/api/dashboard/stats", { cache: "no-store" });
        const payload = await res.json();
        if (active && payload.success && payload.data) {
          setStats(payload.data);
        }
      } catch (err) {
        console.error("Failed to load dashboard stats:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    void fetchStats();

    return () => {
      active = false;
    };
  }, []);

  const todayFormatted = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  const firstName = profile?.full_name ? profile.full_name.split(" ")[0] : "";
  const isEmployee = role === "EMPLOYEE";

  if (loading) {
    return (
      <div className="protected-page-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 320 }}>
        <Loader2 className="loading-spinner" size={28} />
      </div>
    );
  }

  return (
    <>
      <div className="protected-page-content">
        {isEmployee ? (
          /* ====================================================== */
          /* EMPLOYEE DASHBOARD — PERSONAL WORKSPACE                */
          /* ====================================================== */
          <>
            <div className="protected-page-heading">
              <div>
                <p className="eyebrow">{todayFormatted}</p>
                <h1>Welcome back{firstName ? `, ${firstName}` : ""}.</h1>
                <p className="muted">
                  Here is your personal workspace and request status.
                  {stats?.employeeInfo ? ` (${stats.employeeInfo.department} · ${stats.employeeInfo.position})` : ""}
                </p>
              </div>
              <button type="button" className="primary-button" onClick={() => router.push("/requests")}>
                Submit request <Plus size={15} />
              </button>
            </div>

            <div className="protected-metric-grid">
              <button type="button" className="protected-metric-card" onClick={() => router.push("/requests")}>
                <div className="metric-icon yellow"><CheckCircle2 size={17} /></div>
                <span className="metric-label">My pending requests</span>
                <strong>{String(stats?.myPendingRequests ?? 0).padStart(2, "0")}</strong>
                <span className={`metric-change ${(stats?.myPendingRequests ?? 0) > 0 ? "warning" : "positive"}`}>
                  {(stats?.myPendingRequests ?? 0) > 0 ? "Awaiting review" : "All caught up"}
                </span>
              </button>

              <button type="button" className="protected-metric-card" onClick={() => router.push("/requests")}>
                <div className="metric-icon teal"><UsersRound size={17} /></div>
                <span className="metric-label">My approved requests</span>
                <strong>{String(stats?.myApprovedRequests ?? 0).padStart(2, "0")}</strong>
                <span className="metric-change positive">Confirmed & processed</span>
              </button>

              <button type="button" className="protected-metric-card" onClick={() => router.push("/requests")}>
                <div className="metric-icon blue"><CalendarClock size={17} /></div>
                <span className="metric-label">My assigned tasks</span>
                <strong>{String(stats?.myAssignedTasks ?? 0).padStart(2, "0")}</strong>
                <span className="metric-change positive">
                  {(stats?.myAssignedTasks ?? 0) > 0 ? "Action items" : "No open tasks"}
                </span>
              </button>

              <button type="button" className="protected-metric-card" onClick={() => router.push("/notifications")}>
                <div className="metric-icon coral"><Clock3 size={17} /></div>
                <span className="metric-label">Unread notifications</span>
                <strong>{String(stats?.unreadNotifications ?? 0).padStart(2, "0")}</strong>
                <span className={`metric-change ${(stats?.unreadNotifications ?? 0) > 0 ? "warning" : "positive"}`}>
                  {(stats?.unreadNotifications ?? 0) > 0 ? "Needs attention" : "All caught up"}
                </span>
              </button>
            </div>

            <section className="protected-panel">
              <div className="protected-panel-heading">
                <div>
                  <h2>My workspace focus</h2>
                  <p className="muted">A quick view of your active workforce requests and action items.</p>
                </div>
                <span className="panel-kicker">Personal workspace</span>
              </div>
              <div className="focus-grid">
                <div>
                  <span className="focus-number">{String(stats?.myPendingRequests ?? 0).padStart(2, "0")}</span>
                  <strong>pending requests</strong>
                  <p>Your submitted requests awaiting review by management.</p>
                </div>
                <div>
                  <span className="focus-number">{String(stats?.myApprovedRequests ?? 0).padStart(2, "0")}</span>
                  <strong>approved requests</strong>
                  <p>Confirmed leave, documentation, and query requests.</p>
                </div>
                <div>
                  <span className="focus-number">{String(stats?.unreadNotifications ?? 0).padStart(2, "0")}</span>
                  <strong>unread alerts</strong>
                  <p>Stay updated on request confirmations and administrative notices.</p>
                </div>
              </div>
            </section>
          </>
        ) : (
          /* ====================================================== */
          /* ADMIN & HR DASHBOARD — WORKFORCE / ORGANIZATION OVERVIEW */
          /* ====================================================== */
          <>
            <div className="protected-page-heading">
              <div>
                <p className="eyebrow">{todayFormatted}</p>
                <h1>Good morning{firstName ? `, ${firstName}` : ""}.</h1>
                <p className="muted">Here is what is happening across your workforce today.</p>
              </div>
              <button type="button" className="primary-button" onClick={() => router.push("/employees")}>
                Manage workforce <ArrowUpRight size={15} />
              </button>
            </div>

            <div className="protected-metric-grid">
              <button type="button" className="protected-metric-card" onClick={() => router.push("/employees")}>
                <div className="metric-icon teal"><UsersRound size={17} /></div>
                <span className="metric-label">Active workforce</span>
                <strong>{String(stats?.activeEmployees ?? 0).padStart(2, "0")}</strong>
                <span className="metric-change positive">{stats?.activeEmployees ?? 0} active personnel</span>
              </button>

              <button type="button" className="protected-metric-card" onClick={() => router.push("/interviews")}>
                <div className="metric-icon blue"><Clock3 size={17} /></div>
                <span className="metric-label">Scheduled interviews</span>
                <strong>{String(stats?.scheduledInterviews ?? 0).padStart(2, "0")}</strong>
                <span className="metric-change positive">Candidate evaluations</span>
              </button>

              <button type="button" className="protected-metric-card" onClick={() => router.push("/workflows")}>
                <div className="metric-icon coral"><CalendarClock size={17} /></div>
                <span className="metric-label">Workflow tasks</span>
                <strong>{String(stats?.activeTasks ?? 0).padStart(2, "0")}</strong>
                <span className={`metric-change ${(stats?.activeTasks ?? 0) > 0 ? "warning" : "positive"}`}>
                  {(stats?.activeTasks ?? 0) > 0 ? "Action items in progress" : "No open tasks"}
                </span>
              </button>

              <button type="button" className="protected-metric-card" onClick={() => router.push("/requests")}>
                <div className="metric-icon yellow"><CheckCircle2 size={17} /></div>
                <span className="metric-label">Requests to review</span>
                <strong>{String(stats?.pendingRequests ?? 0).padStart(2, "0")}</strong>
                <span className={`metric-change ${(stats?.pendingRequests ?? 0) > 0 ? "warning" : "positive"}`}>
                  {(stats?.pendingRequests ?? 0) > 0 ? `${stats?.pendingRequests} awaiting review` : "All caught up"}
                </span>
              </button>
            </div>

            <section className="protected-panel">
              <div className="protected-panel-heading">
                <div>
                  <h2>Today&apos;s focus</h2>
                  <p className="muted">A quick view of the workforce items that need attention.</p>
                </div>
                <span className="panel-kicker">Workspace overview</span>
              </div>
              <div className="focus-grid">
                <div>
                  <span className="focus-number">{String(stats?.scheduledInterviews ?? 0).padStart(2, "0")}</span>
                  <strong>interviews scheduled</strong>
                  <p>Keep candidate evaluations moving with clear next steps.</p>
                </div>
                <div>
                  <span className="focus-number">{String(stats?.pendingRequests ?? 0).padStart(2, "0")}</span>
                  <strong>requests to review</strong>
                  <p>Make time for workforce members waiting on a response today.</p>
                </div>
                <div>
                  <span className="focus-number">{String(stats?.activeTasks ?? 0).padStart(2, "0")}</span>
                  <strong>workflow tasks active</strong>
                  <p>Track team deliverables and operational milestones.</p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>

      {/* AI Assistant Section */}
      <section className="panel mt-8">
        <div className="panel-heading">
          <div>
            <h2>AI Assistant</h2>
            <p className="muted">Ask questions about shifts, policies, and more</p>
          </div>
        </div>
        <div className="panel-body">
          <WorkerChat />
        </div>
      </section>
    </>
  );
}