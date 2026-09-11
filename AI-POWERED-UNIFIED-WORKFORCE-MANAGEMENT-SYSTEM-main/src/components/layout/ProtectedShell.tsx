"use client";

import Link from "next/link";
import { Bell, ChevronDown, LogOut, MessageCircle, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { canAccessPath, getNavigationForRole } from "@/lib/auth/permissions";
import { useNotificationRealtime } from "@/components/notifications/useNotificationRealtime";
import { useI18n } from "@/lib/i18n/I18nProvider";

import { NavigationIcon } from "./NavigationIcon";

function getNavLabel(href: string, t: ReturnType<typeof useI18n>["t"], defaultLabel: string): string {
  switch (href) {
    case "/dashboard":
      return t.nav.dashboard;
    case "/employees":
      return t.nav.employees;
    case "/candidates":
      return t.nav.candidates;
    case "/interviews":
      return t.nav.interviews;
    case "/requests":
      return defaultLabel === "My requests" ? t.nav.myRequests : t.nav.requests;
    case "/workflows":
      return t.nav.workflows;
    case "/notifications":
      return t.nav.notifications;
    case "/chat":
      return t.nav.chat;
    case "/settings":
      return t.nav.settings;
    default:
      return defaultLabel;
  }
}

function getRoleLabel(role: string | null | undefined, t: ReturnType<typeof useI18n>["t"]): string {
  if (!role) return "";
  if (role in t.roles) {
    return t.roles[role as keyof typeof t.roles];
  }
  return role;
}

export function ProtectedShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const router = useRouter();
  const { configured, error, loading, profile, profileLoaded, role, signOut, user } = useAuth();
  const { t } = useI18n();

  const [loggingOut, setLoggingOut] = useState(false);
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const refreshUnreadCount = useCallback(async () => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success || !Array.isArray(payload.data)) {
        throw new Error("Unable to load notifications");
      }

      setUnreadCount(payload.data.filter((item: { is_read?: boolean }) => !item.is_read).length);
    } catch {
      setUnreadCount(0);
    }
  }, [user?.id]);

  useNotificationRealtime(
    user?.id ?? null,
    useCallback(() => {
      void refreshUnreadCount();
    }, [refreshUnreadCount]),
  );

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

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void refreshUnreadCount();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [refreshUnreadCount]);

  if (!configured) {
    return <SetupRequired />;
  }

  if (loading || !user || !profile || !role || !canAccessPath(role, pathname)) {
    if (!loading && user && profileLoaded && !profile) {
      return <ProfileRequired message={error || "Your account does not have a workforce profile yet."} />;
    }

    return (
      <div className="auth-loading">
        <span className="loading-spinner" />
        {t.actions.loading}
      </div>
    );
  }

  const navigation = getNavigationForRole(role);
  const initials = (profile.full_name || user.email || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const handleLogout = async () => {
    setLoggingOut(true);
    const result = await signOut();
    if (!result.error) {
      router.replace("/login");
    } else {
      setLoggingOut(false);
    }
  };

  const currentNavLabel = getNavLabel(
    pathname,
    t,
    navigation.find((item) => item.href === pathname)?.label || "Overview",
  );

  return (
    <main className="protected-app-shell">
      <aside className="protected-sidebar">
        <div className="protected-brand">
          <span>W</span>
          <strong>
            Apex<span>Estate</span>
          </strong>
        </div>
        <div className="workspace-switcher-wrap">
          <button
            type="button"
            className="workspace-switcher"
            onClick={() => setWorkspaceMenuOpen((open) => !open)}
            aria-expanded={workspaceMenuOpen}
          >
            <span className="workspace-dot" /> {t.nav.northstarHq} <ChevronDown size={14} />
          </button>
          {workspaceMenuOpen ? (
            <div className="workspace-menu">
              <button type="button" onClick={() => setWorkspaceMenuOpen(false)}>
                {t.nav.northstarHq}
              </button>
              <button type="button" onClick={() => setWorkspaceMenuOpen(false)}>
                {t.nav.operationsHub}
              </button>
            </div>
          ) : null}
        </div>
        <nav className="protected-nav" aria-label="Workspace navigation">
          {navigation.map((item) => {
            const translatedLabel = getNavLabel(item.href, t, item.label);
            return (
              <Link
                className={pathname === item.href ? "protected-nav-item active" : "protected-nav-item"}
                href={item.href}
                key={`${item.label}-${item.href}`}
              >
                <NavigationIcon name={item.icon} />
                {translatedLabel}
              </Link>
            );
          })}
        </nav>
        <div className="protected-sidebar-footer">
          <div className="protected-user">
            <div className="avatar avatar-small">{initials}</div>
            <div>
              <strong>{profile.full_name || "Workspace user"}</strong>
              <span>{user.email}</span>
              <em>{getRoleLabel(role, t)}</em>
            </div>
          </div>
          <button type="button" className="logout-button" onClick={() => void handleLogout()} disabled={loggingOut}>
            <LogOut size={15} />
            {loggingOut ? t.nav.signingOut : t.nav.signOut}
          </button>
        </div>
      </aside>
      <section className="protected-content-area">
        <header className="protected-topbar">
          <div className="protected-breadcrumb">
            <span>{t.nav.workspace}</span>
            <b>/</b>
            <strong>{currentNavLabel}</strong>
          </div>
          <div className="protected-top-actions">
            <a
              className="protected-whatsapp-link"
              href="https://wa.me/917058940814?text=Hello%20Apex%2C%20I%20need%20help%20with%20real%20estate%20property%20details%20and%20booking."
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open WhatsApp support"
            >
              <MessageCircle size={18} />
            </a>
            <button
              type="button"
              className="protected-notification"
              aria-label={t.nav.notifications}
              onClick={() => router.push("/notifications")}
            >
              <Bell size={18} />
              {unreadCount > 0 ? <i>{unreadCount > 9 ? "9+" : unreadCount}</i> : null}
            </button>
            <button
              type="button"
              className="protected-profile-summary"
              onClick={() => setProfileMenuOpen((open) => !open)}
            >
              <div className="avatar">{initials}</div>
              <div>
                <strong>{profile.full_name || "Workspace user"}</strong>
                <span>{getRoleLabel(role, t)}</span>
              </div>
            </button>
            {profileMenuOpen ? (
              <div className="profile-menu profile-menu-top">
                <Link href="/settings" onClick={() => setProfileMenuOpen(false)}>
                  <Settings size={14} /> {t.nav.settings}
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setProfileMenuOpen(false);
                    void handleLogout();
                  }}
                >
                  <LogOut size={14} /> {t.nav.signOut}
                </button>
              </div>
            ) : null}
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

function SetupRequired() {
  return (
    <div className="auth-loading">
      <strong>Supabase authentication is not configured.</strong>
      <span>Add the variables from `.env.example` to `.env.local`, then restart the development server.</span>
    </div>
  );
}

function ProfileRequired({ message }: Readonly<{ message: string }>) {
  return (
    <div className="auth-loading">
      <strong>Workforce profile required</strong>
      <span>{message}</span>
      <span>Ask an administrator to create a matching profile row with your Auth user ID and role.</span>
    </div>
  );
}