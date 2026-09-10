"use client";

import { useEffect, useState } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";

export function useDashboardRealtime(onDataChange: () => void) {
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    if (!supabase) {
      return;
    }

    const channel = supabase
      .channel("dashboard-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => onDataChange()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        () => onDataChange()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "candidates" },
        () => onDataChange()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "interviews" },
        () => onDataChange()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        () => onDataChange()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        () => onDataChange()
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities" },
        () => onDataChange()
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onDataChange]);

  return { isLive };
}
