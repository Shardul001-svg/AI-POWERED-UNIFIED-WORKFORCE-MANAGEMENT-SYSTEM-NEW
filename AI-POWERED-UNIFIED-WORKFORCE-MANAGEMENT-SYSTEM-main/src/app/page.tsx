"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Bell, LogOut, Search, Settings } from "lucide-react";

import WorkerChat from "@/components/workerchat";
import { useAuth } from "@/lib/auth/AuthProvider";

const shifts = [
  { initials: "AM", name: "Alex Morgan", role: "Customer success", time: "08:00 - 16:00", status: "On shift" },
  { initials: "JC", name: "Jordan Chen", role: "Operations lead", time: "09:00 - 17:00", status: "On shift" },
  { initials: "SR", name: "Sam Rivera", role: "Field technician", time: "10:00 - 18:00", status: "Starting soon" },
];

const navItems = [
  { label: "Overview", href: "/dashboard" },
  { label: "Schedule", href: "/interviews" },
  { label: "People", href: "/employees" },
  { label: "Time off", href: "/requests" },
  { label: "Reports", href: "/workflows" },
];

export default function Home() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, signOut, user } = useAuth();

  useEffect(() => {
    router.replace("/dashboard");
  }, [router]);

  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filteredShifts = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return shifts;
    }

    return shifts.filter((shift) => `${shift.name} ${shift.role}`.toLowerCase().includes(normalizedQuery));
  }, [query]);

  const displayName = profile?.full_name || user?.email || "Taylor Smith";
  const initials = (displayName || "TS").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    const result = await signOut();

    if (!result.error) {
      router.replace("/login");
    }
  };

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span>W</span><strong>workforce<span>OS</span></strong></div>
        <div className="workspace-switcher-wrap">
          <button type="button" className="workspace-switcher" onClick={() => setWorkspaceMenuOpen((open) => !open)} aria-expanded={workspaceMenuOpen}>
            <span className="workspace-dot" /> Northstar HQ <span className="chevron">⌄</span>
          </button>
          {workspaceMenuOpen ? (
            <div className="workspace-menu">
              <button type="button" onClick={() => setWorkspaceMenuOpen(false)}>Northstar HQ</button>
              <button type="button" onClick={() => setWorkspaceMenuOpen(false)}>Operations Hub</button>
            </div>
          ) : null}
        </div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Link className={pathname === item.href ? "nav-item active" : "nav-item"} href={item.href} key={item.label}>
              <span className={`nav-icon icon-${navItems.indexOf(item)}`} />{item.label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <Link className="nav-item" href="/settings"><span className="nav-icon icon-settings" />Settings</Link>
          <div className="user-card">
            <div className="avatar avatar-small">{initials}</div>
            <div><strong>{displayName}</strong><span>{profile?.role || "Administrator"}</span></div>
            <button type="button" className="more" onClick={() => setProfileMenuOpen((open) => !open)} aria-label="Open account menu">•••</button>
            {profileMenuOpen ? (
              <div className="profile-menu">
                <Link href="/settings" onClick={() => setProfileMenuOpen(false)}><Settings size={14} /> Settings</Link>
                <button type="button" onClick={() => { setProfileMenuOpen(false); void handleLogout(); }}><LogOut size={14} /> Logout</button>
              </div>
            ) : null}
          </div>
        </div>
      </aside>

      <section className="content-area">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>{navItems.find((item) => pathname === item.href)?.label || "Overview"}</strong></div><div className="top-actions">
          <div className="search-wrap">
            <button className="icon-button" aria-label="Search" onClick={() => setSearchOpen((open) => !open)}><Search size={18} /></button>
            {searchOpen ? <input aria-label="Search employees or shifts" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people or schedule" /> : null}
          </div>
          <button className="icon-button notification" aria-label="Notifications" onClick={() => router.push("/notifications")}><Bell size={18} /><i /></button>
          <button type="button" className="avatar" onClick={() => setProfileMenuOpen((open) => !open)} aria-label="Open profile menu">{initials}</button>
        </div></header>
        <div className="page-content">
          <div className="page-heading"><div><p className="eyebrow">Tuesday, September 8, 2026</p><h1>Good morning, {displayName.split(" ")[0]}.</h1><p className="muted">Here is what is happening across your workforce today.</p></div><button className="primary-button" type="button" onClick={() => router.push("/employees")}><span>+</span> Add person</button></div>
          <div className="metric-grid">
            <button type="button" className="metric-card" onClick={() => router.push("/employees")}><span className="metric-label">Active today</span><strong>42</strong><span className="metric-change positive">↗ 8.4% <em>vs last week</em></span></button>
            <button type="button" className="metric-card" onClick={() => router.push("/interviews")}><span className="metric-label">Scheduled hours</span><strong>318<span className="unit">h</span></strong><span className="metric-change positive">↗ 3.2% <em>vs last week</em></span></button>
            <button type="button" className="metric-card" onClick={() => router.push("/workflows")}><span className="metric-label">Open shifts</span><strong>06</strong><span className="metric-change warning">Needs attention</span></button>
            <button type="button" className="metric-card" onClick={() => router.push("/requests")}><span className="metric-label">Time off requests</span><strong>04</strong><span className="metric-change neutral">2 awaiting review</span></button>
          </div>
          <div className="dashboard-grid"><section className="panel schedule-panel"><div className="panel-heading"><div><h2>Today&apos;s schedule</h2><p className="muted">Tuesday, September 8</p></div><button type="button" className="text-link" onClick={() => router.push("/interviews")}>View schedule <span>→</span></button></div><div className="schedule-list">{filteredShifts.length > 0 ? filteredShifts.map((shift) => <div className="shift-row" key={shift.name}><div className="avatar avatar-person">{shift.initials}</div><div className="person-details"><strong>{shift.name}</strong><span>{shift.role}</span></div><span className="shift-time">{shift.time}</span><span className={`status ${shift.status === "On shift" ? "status-on" : "status-soon"}`}><i />{shift.status}</span><button type="button" className="row-menu" aria-label={`More options for ${shift.name}`} onClick={() => router.push("/employees")}>•••</button></div>) : <div className="empty-state">No people match your search.</div>}</div><button type="button" className="panel-footer-link" onClick={() => router.push("/employees")}>Show all 42 people <span>→</span></button></section><section className="panel coverage-panel"><div className="panel-heading"><div><h2>Coverage</h2><p className="muted">Staffing by team</p></div><button type="button" className="more-button" aria-label="Coverage options" onClick={() => router.push("/workflows")}>•••</button></div><div className="coverage-chart"><div className="donut"><div><strong>86%</strong><span>covered</span></div></div><div className="legend"><div><i className="legend-dot dot-teal" /><span>Customer success</span><b>94%</b></div><div><i className="legend-dot dot-coral" /><span>Operations</span><b>88%</b></div><div><i className="legend-dot dot-yellow" /><span>Field services</span><b>76%</b></div></div></div><div className="coverage-note"><span>!</span><p><strong>2 shifts need coverage</strong><br />Review the open shifts before 2:00 PM.</p></div></section></div>
          <section className="panel ai-agent-panel" aria-label="AI Agent preview">
            <WorkerChat />
          </section>
        </div>
      </section>
    </main>
  );
}