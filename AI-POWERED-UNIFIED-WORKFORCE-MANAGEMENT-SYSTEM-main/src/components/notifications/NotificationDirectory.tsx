"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Bell, CheckCheck, CircleDashed, ExternalLink, Loader2, RefreshCw, Search, Trash2, Wifi } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useNotificationRealtime, type NotificationRealtimePayload, type RealtimeStatus } from "@/components/notifications/useNotificationRealtime";
import { useI18n } from "@/lib/i18n/I18nProvider";

type NotificationRow = {
  id: string;
  profile_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

type NotificationFilter = "all" | "unread" | "read";

function sortNotifications(rows: NotificationRow[]) {
  return [...rows].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

function dedupeNotifications(rows: NotificationRow[]) {
  const deduped = new Map<string, NotificationRow>();
  for (const row of rows) {
    deduped.set(row.id, row);
  }
  return sortNotifications(Array.from(deduped.values()));
}

function formatNotificationDate(value: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function getNotificationLink(type: string): { href: string; label: string } | null {
  const normalized = (type || "").toLowerCase().trim();
  switch (normalized) {
    case "request":
      return { href: "/requests", label: "View Requests" };
    case "task":
      return { href: "/tasks", label: "View Tasks" };
    case "interview":
      return { href: "/interviews", label: "View Interviews" };
    case "employee":
      return { href: "/employees", label: "View Employees" };
    case "candidate":
      return { href: "/candidates", label: "View Candidates" };
    case "schedule":
      return { href: "/schedules", label: "View Schedule" };
    default:
      return null;
  }
}

export function NotificationDirectory() {
  const { user } = useAuth();
  const { t } = useI18n();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<NotificationFilter>("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    toastTimeoutRef.current = window.setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const refreshNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }

    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load notifications.");
      }

      const rows: NotificationRow[] = Array.isArray(payload.data) ? payload.data : [];
      const deduped = dedupeNotifications(rows);
      setNotifications(deduped);
      setSelectedId((current) => {
        if (current && deduped.some((item) => item.id === current)) {
          return current;
        }
        return deduped[0]?.id ?? null;
      });
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
    }
  }, [user?.id]);

  const handleRealtimeEvent = useCallback(
    (payload: NotificationRealtimePayload) => {
      const eventType = (payload.eventType ?? payload.event ?? "") as string;
      const nextRow = (payload.new ?? null) as NotificationRow | null;
      const previousRow = (payload.old ?? null) as NotificationRow | null;

      if (!eventType || eventType === "*") {
        return;
      }

      setNotifications((current) => {
        if (eventType === "DELETE" && previousRow?.id) {
          const filtered = current.filter((item) => item.id !== previousRow.id);
          return dedupeNotifications(filtered);
        }

        if (!nextRow?.id) {
          return current;
        }

        const exists = current.some((item) => item.id === nextRow.id);

        if (eventType === "INSERT") {
          showToast(`🔔 New: ${nextRow.title}`);
        }

        const updatedList = exists
          ? current.map((item) => (item.id === nextRow.id ? { ...item, ...nextRow } : item))
          : [nextRow, ...current];

        return dedupeNotifications(updatedList);
      });
    },
    [showToast],
  );

  const realtimeStatus: RealtimeStatus = useNotificationRealtime(
    user?.id ?? null,
    handleRealtimeEvent,
  );

  useEffect(() => {
    let active = true;

    async function initialLoad() {
      if (!user?.id) {
        if (active) {
          setNotifications([]);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await fetch("/api/notifications", { cache: "no-store" });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load notifications.");
        }

        if (active) {
          const rows: NotificationRow[] = Array.isArray(payload.data) ? payload.data : [];
          const deduped = dedupeNotifications(rows);
          setNotifications(deduped);
          setSelectedId((current) => (current && deduped.some((item) => item.id === current) ? current : deduped[0]?.id ?? null));
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void initialLoad();

    return () => {
      active = false;
    };
  }, [user?.id]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.is_read).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    return sortNotifications(
      notifications.filter((notification) => {
        const matchesFilter =
          filter === "all"
            ? true
            : filter === "unread"
              ? !notification.is_read
              : notification.is_read;
        const matchesSearch =
          !query ||
          [notification.title, notification.message, notification.type]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(query);

        return matchesFilter && matchesSearch;
      }),
    );
  }, [filter, notifications, search]);

  const selectedNotification = useMemo(
    () => notifications.find((notification) => notification.id === selectedId) ?? null,
    [notifications, selectedId],
  );

  const handleReadToggle = async (notificationId: string, nextValue: boolean) => {
    setUpdatingId(notificationId);
    setError(null);

    // Optimistic UI update
    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, is_read: nextValue } : item)),
    );

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: nextValue }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to update notification.");
      }
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update notification.");
      void refreshNotifications();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((notification) => !notification.is_read);
    if (unread.length === 0) {
      return;
    }

    setMarkingAll(true);
    setError(null);

    // Optimistic UI update
    setNotifications((current) =>
      current.map((item) => (item.is_read ? item : { ...item, is_read: true })),
    );

    try {
      const results = await Promise.all(
        unread.map((notification) =>
          fetch(`/api/notifications/${notification.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_read: true }),
          }),
        ),
      );

      for (const result of results) {
        const payload = await result.json();
        if (!result.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to mark all notifications as read.");
        }
      }
    } catch (markAllError) {
      setError(markAllError instanceof Error ? markAllError.message : "Unable to mark all notifications as read.");
      void refreshNotifications();
    } finally {
      setMarkingAll(false);
    }
  };

  const handleDelete = async (notificationId: string) => {
    setDeletingId(notificationId);
    setError(null);

    // Optimistic UI update
    setNotifications((current) => current.filter((item) => item.id !== notificationId));
    if (selectedId === notificationId) {
      setSelectedId(null);
    }

    try {
      const response = await fetch(`/api/notifications/${notificationId}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to delete notification.");
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Unable to delete notification.");
      void refreshNotifications();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="protected-page-content">
      {toastMessage ? (
        <div
          style={{
            position: "fixed",
            bottom: "1.5rem",
            right: "1.5rem",
            zIndex: 999,
            backgroundColor: "#0f172a",
            color: "#ffffff",
            padding: "0.85rem 1.25rem",
            borderRadius: "0.5rem",
            boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
            fontSize: "0.9rem",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "0.5rem",
          }}
        >
          {toastMessage}
        </div>
      ) : null}

      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">{t.nav.workspace}</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <h1>{t.pages.notificationsTitle}</h1>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                fontSize: "0.75rem",
                padding: "0.2rem 0.6rem",
                borderRadius: "9999px",
                fontWeight: 600,
                backgroundColor:
                  realtimeStatus === "SUBSCRIBED"
                    ? "#dcfce7"
                    : realtimeStatus === "CONNECTING"
                      ? "#fef9c3"
                      : "#fee2e2",
                color:
                  realtimeStatus === "SUBSCRIBED"
                    ? "#15803d"
                    : realtimeStatus === "CONNECTING"
                      ? "#a16207"
                      : "#b91c1c",
              }}
            >
              <Wifi size={12} />
              {realtimeStatus === "SUBSCRIBED"
                ? "Realtime active"
                : realtimeStatus === "CONNECTING"
                  ? `${t.actions.loading}`
                  : "Disconnected"}
            </span>
          </div>
          <p className="muted">{t.pages.notificationsSubtitle}</p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void refreshNotifications()}
            title={t.actions.refresh}
          >
            <RefreshCw size={15} />
            {t.actions.refresh}
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => void handleMarkAllRead()}
            disabled={markingAll || unreadCount === 0}
          >
            <CheckCheck size={15} />
            {markingAll ? t.actions.saving : t.actions.markAllRead}
          </button>
        </div>
      </div>

      <div className="employees-toolbar">
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div className="employees-count">
            <span>{notifications.length}</span>
            <small>{t.actions.all}</small>
          </div>
          <div className="status-pill active" style={{ fontSize: "0.825rem", padding: "0.3rem 0.75rem" }}>
            {unreadCount} {t.actions.unread}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "0.25rem", backgroundColor: "var(--subtle-bg, #f1f5f9)", padding: "0.2rem", borderRadius: "0.375rem" }}>
            <button
              type="button"
              className={filter === "all" ? "secondary-button active" : "secondary-button"}
              onClick={() => setFilter("all")}
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem", height: "auto" }}
            >
              {t.actions.all} ({notifications.length})
            </button>
            <button
              type="button"
              className={filter === "unread" ? "secondary-button active" : "secondary-button"}
              onClick={() => setFilter("unread")}
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem", height: "auto" }}
            >
              {t.actions.unread} ({unreadCount})
            </button>
            <button
              type="button"
              className={filter === "read" ? "secondary-button active" : "secondary-button"}
              onClick={() => setFilter("read")}
              style={{ fontSize: "0.8rem", padding: "0.25rem 0.6rem", height: "auto" }}
            >
              {t.actions.read} ({notifications.length - unreadCount})
            </button>
          </div>

          <div className="employees-search">
            <label aria-label="Search notifications" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Search size={15} />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t.actions.search}
              />
            </label>
          </div>
        </div>
      </div>

      {error ? (
        <div className="panel panel-warning" style={{ marginBottom: "1rem" }}>
          <p>{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="panel empty-panel">
          <Loader2 className="loading-spinner" size={18} />
          <span>Loading real-time notifications...</span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="panel empty-panel">
          <CircleDashed size={18} />
          <span>
            {notifications.length === 0
              ? "No notifications yet. New events will appear here in real-time."
              : "No notifications match your current search or filter."}
          </span>
        </div>
      ) : (
        <div className="employees-layout">
          <div className="panel table-panel">
            <div className="table-header">
              <span>Notification</span>
              <span>Type</span>
              <span>Received</span>
            </div>
            <div className="table-body">
              {filteredNotifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`employee-row ${selectedId === notification.id ? "active" : ""}`}
                  onClick={() => setSelectedId(notification.id)}
                  style={{
                    opacity: notification.is_read ? 0.75 : 1,
                    fontWeight: notification.is_read ? 400 : 600,
                  }}
                >
                  <span className="employee-name-block">
                    <strong style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      {!notification.is_read ? (
                        <span
                          style={{
                            width: "7px",
                            height: "7px",
                            borderRadius: "50%",
                            backgroundColor: "#2563eb",
                            display: "inline-block",
                            flexShrink: 0,
                          }}
                        />
                      ) : null}
                      {notification.title}
                    </strong>
                    <small>
                      {notification.message.length > 70
                        ? `${notification.message.slice(0, 70)}...`
                        : notification.message}
                    </small>
                  </span>
                  <span>
                    <span className={`status-pill ${notification.is_read ? "neutral" : "active"}`}>
                      {notification.type}
                    </span>
                  </span>
                  <span>{formatNotificationDate(notification.created_at)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel detail-panel">
            {selectedNotification ? (
              <>
                <div className="detail-header">
                  <div>
                    <p className="eyebrow">Notification detail</p>
                    <h2>{selectedNotification.title}</h2>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() =>
                        void handleReadToggle(selectedNotification.id, !selectedNotification.is_read)
                      }
                      disabled={updatingId === selectedNotification.id}
                    >
                      {updatingId === selectedNotification.id
                        ? "Updating..."
                        : selectedNotification.is_read
                          ? "Mark unread"
                          : "Mark read"}
                    </button>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => void handleDelete(selectedNotification.id)}
                      disabled={deletingId === selectedNotification.id}
                      title="Delete notification"
                      style={{ color: "#ef4444" }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="employee-detail-grid">
                  <div className="detail-stat">
                    <span className="detail-label">Type</span>
                    <strong>{selectedNotification.type}</strong>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-label">Status</span>
                    <strong>{selectedNotification.is_read ? "Read" : "Unread"}</strong>
                  </div>
                  <div className="detail-stat">
                    <span className="detail-label">Received</span>
                    <strong>{formatNotificationDate(selectedNotification.created_at)}</strong>
                  </div>
                </div>

                <div className="field-row" style={{ marginTop: "1rem" }}>
                  <label>
                    Message
                    <textarea rows={6} value={selectedNotification.message} readOnly />
                  </label>
                </div>

                {getNotificationLink(selectedNotification.type) ? (
                  <div style={{ marginTop: "1.25rem" }}>
                    {(() => {
                      const linkInfo = getNotificationLink(selectedNotification.type);
                      if (!linkInfo) return null;
                      return (
                        <Link
                          href={linkInfo.href}
                          className="secondary-button"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            textDecoration: "none",
                          }}
                        >
                          <ExternalLink size={15} />
                          {linkInfo.label}
                        </Link>
                      );
                    })()}
                  </div>
                ) : null}
              </>
            ) : (
              <div className="detail-empty">
                <Bell size={20} />
                <p>Select a notification to view its full details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
