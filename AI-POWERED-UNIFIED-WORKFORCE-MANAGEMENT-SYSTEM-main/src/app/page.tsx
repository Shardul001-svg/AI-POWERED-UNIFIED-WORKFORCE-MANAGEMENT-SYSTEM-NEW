const shifts = [
  { initials: "AM", name: "Alex Morgan", role: "Customer success", time: "08:00 - 16:00", status: "On shift" },
  { initials: "JC", name: "Jordan Chen", role: "Operations lead", time: "09:00 - 17:00", status: "On shift" },
  { initials: "SR", name: "Sam Rivera", role: "Field technician", time: "10:00 - 18:00", status: "Starting soon" },
];

const navItems = ["Overview", "Schedule", "People", "Time off", "Reports"];

export default function Home() {
  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand-mark"><span>W</span><strong>workforce<span>OS</span></strong></div>
        <div className="workspace-switcher"><span className="workspace-dot" /> Northstar HQ <span className="chevron">⌄</span></div>
        <nav className="main-nav" aria-label="Main navigation">
          {navItems.map((item, index) => <a className={index === 0 ? "nav-item active" : "nav-item"} href="#" key={item}><span className={`nav-icon icon-${index}`} />{item}</a>)}
        </nav>
        <div className="sidebar-footer"><a className="nav-item" href="#"><span className="nav-icon icon-settings" />Settings</a><div className="user-card"><div className="avatar avatar-small">TS</div><div><strong>Taylor Smith</strong><span>Administrator</span></div><span className="more">•••</span></div></div>
      </aside>

      <section className="content-area">
        <header className="topbar"><div className="breadcrumb"><span>Workspace</span><b>/</b><strong>Overview</strong></div><div className="top-actions"><button className="icon-button" aria-label="Search">⌕</button><button className="icon-button notification" aria-label="Notifications">♢<i /></button><div className="avatar">TS</div></div></header>
        <div className="page-content">
          <div className="page-heading"><div><p className="eyebrow">Tuesday, September 8, 2026</p><h1>Good morning, Taylor.</h1><p className="muted">Here is what is happening across your workforce today.</p></div><button className="primary-button"><span>+</span> Add person</button></div>
          <div className="metric-grid"><article className="metric-card"><span className="metric-label">Active today</span><strong>42</strong><span className="metric-change positive">↗ 8.4% <em>vs last week</em></span></article><article className="metric-card"><span className="metric-label">Scheduled hours</span><strong>318<span className="unit">h</span></strong><span className="metric-change positive">↗ 3.2% <em>vs last week</em></span></article><article className="metric-card"><span className="metric-label">Open shifts</span><strong>06</strong><span className="metric-change warning">Needs attention</span></article><article className="metric-card"><span className="metric-label">Time off requests</span><strong>04</strong><span className="metric-change neutral">2 awaiting review</span></article></div>
          <div className="dashboard-grid"><section className="panel schedule-panel"><div className="panel-heading"><div><h2>Today&apos;s schedule</h2><p className="muted">Tuesday, September 8</p></div><a href="#" className="text-link">View schedule <span>→</span></a></div><div className="schedule-list">{shifts.map((shift) => <div className="shift-row" key={shift.name}><div className="avatar avatar-person">{shift.initials}</div><div className="person-details"><strong>{shift.name}</strong><span>{shift.role}</span></div><span className="shift-time">{shift.time}</span><span className={`status ${shift.status === "On shift" ? "status-on" : "status-soon"}`}><i />{shift.status}</span><button className="row-menu" aria-label={`More options for ${shift.name}`}>•••</button></div>)}</div><button className="panel-footer-link">Show all 42 people <span>→</span></button></section><section className="panel coverage-panel"><div className="panel-heading"><div><h2>Coverage</h2><p className="muted">Staffing by team</p></div><button className="more-button" aria-label="Coverage options">•••</button></div><div className="coverage-chart"><div className="donut"><div><strong>86%</strong><span>covered</span></div></div><div className="legend"><div><i className="legend-dot dot-teal" /><span>Customer success</span><b>94%</b></div><div><i className="legend-dot dot-coral" /><span>Operations</span><b>88%</b></div><div><i className="legend-dot dot-yellow" /><span>Field services</span><b>76%</b></div></div></div><div className="coverage-note"><span>!</span><p><strong>2 shifts need coverage</strong><br />Review the open shifts before 2:00 PM.</p></div></section></div>
        </div>
      </section>
    </main>
  );
}