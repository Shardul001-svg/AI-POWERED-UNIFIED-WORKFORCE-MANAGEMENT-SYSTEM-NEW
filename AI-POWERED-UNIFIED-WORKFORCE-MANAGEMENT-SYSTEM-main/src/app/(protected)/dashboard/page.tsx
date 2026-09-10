"use client";

import { ArrowUpRight, CalendarClock, CheckCircle2, Clock3, UsersRound } from "lucide-react";
import { useRouter } from "next/navigation";
import WorkerChat from "@/components/workerchat";

const metrics = [
  { label: "Active today", value: "42", change: "+8.4% vs last week", icon: UsersRound, tone: "teal", href: "/employees" },
  { label: "Scheduled hours", value: "318h", change: "+3.2% vs last week", icon: Clock3, tone: "blue", href: "/interviews" },
  { label: "Open shifts", value: "06", change: "Needs attention", icon: CalendarClock, tone: "coral", href: "/workflows" },
  { label: "Requests to review", value: "04", change: "2 awaiting review", icon: CheckCircle2, tone: "yellow", href: "/requests" },
];

export default function DashboardPage() {
  const router = useRouter();

  return (
    <>
      <div className="protected-page-content">
        <div className="protected-page-heading">
          <div>
            <p className="eyebrow">Tuesday, September 8, 2026</p>
            <h1>Good morning.</h1>
            <p className="muted">Here is what is happening across your workforce today.</p>
          </div>
          <button type="button" className="primary-button" onClick={() => router.push("/interviews")}>
            View schedule <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="protected-metric-grid">
          {metrics.map(({ change, href, icon: Icon, label, tone, value }) => (
            <button type="button" className="protected-metric-card" key={label} onClick={() => router.push(href)}>
              <div className={`metric-icon ${tone}`}><Icon size={17} /></div>
              <span className="metric-label">{label}</span>
              <strong>{value}</strong>
              <span className={`metric-change ${tone === "coral" ? "warning" : "positive"}`}>{change}</span>
            </button>
          ))}
        </div>
        <section className="protected-panel">
          <div className="protected-panel-heading">
            <div>
              <h2>Today&apos;s focus</h2>
              <p className="muted">A quick view of the work that needs attention.</p>
            </div>
            <span className="panel-kicker">Workspace overview</span>
          </div>
          <div className="focus-grid">
            <div><span className="focus-number">02</span><strong>interviews scheduled</strong><p>Keep candidate conversations moving with clear next steps.</p></div>
            <div><span className="focus-number">04</span><strong>requests to review</strong><p>Make time for the people waiting on a response today.</p></div>
            <div><span className="focus-number">06</span><strong>open shifts</strong><p>Check coverage before the afternoon handoff.</p></div>
          </div>
        </section>
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