"use client";

import { Bell, ChevronDown, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { canAccessPath, getNavigationForRole } from "@/lib/auth/permissions";

import { NavigationIcon } from "./NavigationIcon";

export function ProtectedShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { configured, error, loading, profile, profileLoaded, role, signOut, user } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!loading && configured && !user) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [configured, loading, pathname, router, user]);

  useEffect(() => {
    if (!loading && user && role && !canAccessPath(role, pathname)) {
      router.replace("/dashboard");
    }
  }, [loading, pathname, role, router, user]);

  if (!configured) {
    return <SetupRequired />;
  }

  if (loading || !user || !profile || !role || !canAccessPath(role, pathname)) {
    if (!loading && user && profileLoaded && !profile) {
      return <ProfileRequired message={error || "Your account does not have a workforce profile yet."} />;
    }

    return <div className="auth-loading"><span className="loading-spinner" />Checking your workspace access...</div>;
  }

  const navigation = getNavigationForRole(role);
  const initials = (profile.full_name || user.email || "U").split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  const handleLogout = async () => {
    setLoggingOut(true);
    const result = await signOut();
    if (!result.error) {
      router.replace("/login");
    } else {
      setLoggingOut(false);
    }
  };

  return (
    <main className="protected-app-shell">
      <aside className="protected-sidebar">
        <div className="protected-brand"><span>W</span><strong>workforce<span>OS</span></strong></div>
        <div className="workspace-switcher"><span className="workspace-dot" /> Northstar HQ <ChevronDown size={14} /></div>
        <nav className="protected-nav" aria-label="Workspace navigation">
          {navigation.map((item) => <a className={pathname === item.href ? "protected-nav-item active" : "protected-nav-item"} href={item.href} key={`${item.label}-${item.href}`}><NavigationIcon name={item.icon} />{item.label}</a>)}
        </nav>
        <div className="protected-sidebar-footer"><div className="protected-user"><div className="avatar avatar-small">{initials}</div><div><strong>{profile.full_name || "Workspace user"}</strong><span>{user.email}</span><em>{role}</em></div></div><button className="logout-button" onClick={handleLogout} disabled={loggingOut}><LogOut size={15} />{loggingOut ? "Signing out..." : "Sign out"}</button></div>
      </aside>
      <section className="protected-content-area">
        <header className="protected-topbar"><div className="protected-breadcrumb"><span>Workspace</span><b>/</b><strong>{navigation.find((item) => item.href === pathname)?.label || "Overview"}</strong></div><div className="protected-top-actions"><button className="protected-notification" aria-label="Notifications" onClick={() => router.push("/notifications")}><Bell size={18} /><i /></button><div className="protected-profile-summary"><div className="avatar">{initials}</div><div><strong>{profile.full_name || "Workspace user"}</strong><span>{role}</span></div></div></div></header>
        {children}
      </section>
    </main>
  );
}

function SetupRequired() {
  return <div className="auth-loading"><strong>Supabase authentication is not configured.</strong><span>Add the variables from `.env.example` to `.env.local`, then restart the development server.</span></div>;
}

function ProfileRequired({ message }: Readonly<{ message: string }>) {
  return <div className="auth-loading"><strong>Workforce profile required</strong><span>{message}</span><span>Ask an administrator to create a matching profile row with your Auth user ID and role.</span></div>;
}