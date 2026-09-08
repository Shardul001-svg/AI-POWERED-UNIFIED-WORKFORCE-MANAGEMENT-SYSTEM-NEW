import { Bell, CalendarDays, ClipboardList, ContactRound, Inbox, LayoutDashboard, Settings, Sparkles, Users, Workflow } from "lucide-react";
import type { LucideIcon } from "lucide-react";

const icons: Record<string, LucideIcon> = { bell: Bell, "calendar-days": CalendarDays, "clipboard-list": ClipboardList, "contact-round": ContactRound, inbox: Inbox, "layout-dashboard": LayoutDashboard, settings: Settings, sparkles: Sparkles, users: Users, workflow: Workflow };

export function NavigationIcon({ name }: Readonly<{ name: string }>) {
  const Icon = icons[name] || LayoutDashboard;
  return <Icon size={16} strokeWidth={1.8} />;
}