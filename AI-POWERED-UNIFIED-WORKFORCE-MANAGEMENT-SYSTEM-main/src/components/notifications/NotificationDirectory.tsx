"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bell, CheckCheck, CircleDashed, Loader2, Search } from "lucide-react";

type NotificationRow = {
  id: string;
  profile_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
};

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

export function NotificationDirectory() {
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load notifications.");
      }

      const rows: NotificationRow[] = Array.isArray(payload.data) ? payload.data : [];
      setNotifications(rows);
      if (selectedId && !rows.some((item: NotificationRow) => item.id === selectedId)) {
        setSelectedId(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load notifications.");
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) {
        return;
      }

      await fetchNotifications();
    };

    void load();

    return () => {
      active = false;
    };
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((notification) => !notification.is_read).length;

  const filteredNotifications = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return notifications;
    }

    return notifications.filter((notification) => {
      const haystack = [notification.title, notification.message, notification.type].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [notifications, search]);

  const selectedNotification = useMemo(
    () => notifications.find((notification) => notification.id === selectedId) ?? null,
    [notifications, selectedId],
  );

  const handleReadToggle = async (notificationId: string, nextValue: boolean) => {
    setUpdatingId(notificationId);
    setError(null);

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

      await fetchNotifications();
      setSelectedId(notificationId);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update notification.");
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
          throw new Error(payload.message ?? "Unable to mark notifications as read.");
        }
      }

      await fetchNotifications();
    } catch (markAllError) {
      setError(markAllError instanceof Error ? markAllError.message : "Unable to mark notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <div className="protected-page-content">
      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">Inbox</p>
          <h1>Notifications</h1>
          <p className="muted">Your latest updates and reminders from the workforce system.</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => void handleMarkAllRead()} disabled={markingAll || unreadCount === 0}>
          <CheckCheck size={15} />
          {markingAll ? "Updating..." : "Mark all read"}
        </button>
      </div>

      <div className="employees-toolbar">
        <div className="employees-count">
          <span>{notifications.length}</span>
          <small>notifications</small>
        </div>

        <div className="employees-search" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <label aria-label="Search notifications" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Search size={15} />
            <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search notifications" />
          </label>
          <span className="status-pill active">{unreadCount} unread</span>
        </div>
      </div>

      {error ? <div className="panel panel-warning"><p>{error}</p></div> : null}

      {loading ? (
        <div className="panel empty-panel">
          <Loader2 className="loading-spinner" size={18} />
          <span>Loading notifications...</span>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="panel empty-panel">
          <CircleDashed size={18} />
          <span>{notifications.length === 0 ? "No notifications yet." : "No notifications match your search."}</span>
        </div>
      ) : (
        <div className="employees-layout">
          <div className="panel table-panel">
            <div className="table-header">
              <span>Notification</span>
              <span>Type</span>
              <span>Sent</span>
            </div>
            <div className="table-body">
              {filteredNotifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  className={`employee-row ${selectedId === notification.id ? "active" : ""}`}
                  onClick={() => setSelectedId(notification.id)}
                  style={{ opacity: notification.is_read ? 0.8 : 1 }}
                >
                  <span className="employee-name-block">
                    <strong>{notification.title}</strong>
                    <small>{notification.message.length > 70 ? `${notification.message.slice(0, 70)}...` : notification.message}</small>
                  </span>
                  <span>
                    <span className={`status-pill ${notification.is_read ? "neutral" : "active"}`}>{notification.type}</span>
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
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => void handleReadToggle(selectedNotification.id, !selectedNotification.is_read)}
                    disabled={updatingId === selectedNotification.id}
                  >
                    {updatingId === selectedNotification.id
                      ? "Updating..."
                      : selectedNotification.is_read
                        ? "Mark unread"
                        : "Mark read"}
                  </button>
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

                <div className="field-row">
                  <label>
                    Message
                    <textarea rows={6} value={selectedNotification.message} readOnly />
                  </label>
                </div>
              </>
            ) : (
              <div className="detail-empty">
                <Bell size={20} />
                <p>Select a notification to read its details.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
