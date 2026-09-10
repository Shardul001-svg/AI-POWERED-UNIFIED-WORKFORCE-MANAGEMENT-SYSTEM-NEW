"use client";

import { useEffect, useState } from "react";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export type NotificationRealtimePayload = {
  eventType?: "INSERT" | "UPDATE" | "DELETE" | "*";
  event?: "INSERT" | "UPDATE" | "DELETE" | "*";
  new?: Record<string, unknown> | null;
  old?: Record<string, unknown> | null;
};

export type RealtimeStatus = "SUBSCRIBED" | "TIMED_OUT" | "CLOSED" | "CHANNEL_ERROR" | "CONNECTING";

type ChannelEntry = {
  channel: ReturnType<NonNullable<ReturnType<typeof createBrowserSupabaseClient>>["channel"]>;
  listeners: Set<(payload: NotificationRealtimePayload) => void>;
  statusListeners: Set<(status: RealtimeStatus) => void>;
  status: RealtimeStatus;
};

const channelStore = new Map<string, ChannelEntry>();

export function useNotificationRealtime(
  userId: string | null,
  onNotificationEvent?: (payload: NotificationRealtimePayload) => void,
  onStatusChange?: (status: RealtimeStatus) => void,
) {
  const [currentStatus, setCurrentStatus] = useState<RealtimeStatus>(() => {
    if (!userId) return "CLOSED";
    const entry = channelStore.get(userId);
    return entry ? entry.status : "CONNECTING";
  });

  useEffect(() => {
    if (!userId) {
      return;
    }

    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return;
    }

    let entry = channelStore.get(userId);

    if (!entry) {
      const channel = supabase.channel(`notifications:${userId}`);

      entry = {
        channel,
        listeners: new Set(),
        statusListeners: new Set(),
        status: "CONNECTING",
      };
      channelStore.set(userId, entry);

      channel.on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `profile_id=eq.${userId}`,
        },
        (payload) => {
          const handled = payload as NotificationRealtimePayload;
          entry?.listeners.forEach((listener) => listener(handled));
        },
      );

      channel.subscribe((status) => {
        const nextStatus = (status as RealtimeStatus) || "CLOSED";
        if (entry) {
          entry.status = nextStatus;
          entry.statusListeners.forEach((listener) => listener(nextStatus));
        }
      });
    }

    if (onNotificationEvent) {
      entry.listeners.add(onNotificationEvent);
    }

    const handleStatus = (status: RealtimeStatus) => {
      setCurrentStatus(status);
      onStatusChange?.(status);
    };

    entry.statusListeners.add(handleStatus);

    return () => {
      if (entry) {
        if (onNotificationEvent) {
          entry.listeners.delete(onNotificationEvent);
        }
        entry.statusListeners.delete(handleStatus);

        if (entry.listeners.size === 0 && entry.statusListeners.size === 0) {
          void entry.channel.unsubscribe();
          channelStore.delete(userId);
        }
      }
    };
  }, [onNotificationEvent, onStatusChange, userId]);

  return currentStatus;
}
