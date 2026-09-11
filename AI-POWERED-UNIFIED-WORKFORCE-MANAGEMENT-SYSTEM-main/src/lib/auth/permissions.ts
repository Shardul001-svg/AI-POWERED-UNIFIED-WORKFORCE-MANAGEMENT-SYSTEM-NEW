import type { ProfileRole } from "@/types/database";

export const protectedNavigation = [
  { label: "Dashboard", href: "/dashboard", icon: "layout-dashboard", roles: ["ADMIN", "HR", "EMPLOYEE", "CANDIDATE"] },
  { label: "Employees", href: "/employees", icon: "users", roles: ["ADMIN", "HR"] },
  { label: "Candidates", href: "/candidates", icon: "contact-round", roles: ["ADMIN", "HR"] },
  { label: "Interviews", href: "/interviews", icon: "calendar-days", roles: ["ADMIN", "HR", "CANDIDATE"] },
  { label: "Requests", href: "/requests", icon: "inbox", roles: ["ADMIN", "HR"] },
  { label: "My requests", href: "/requests", icon: "clipboard-list", roles: ["EMPLOYEE"] },
  { label: "Workflows", href: "/workflows", icon: "workflow", roles: ["ADMIN", "HR"] },
  { label: "Notifications", href: "/notifications", icon: "bell", roles: ["ADMIN", "HR", "EMPLOYEE", "CANDIDATE"] },
  { label: "Settings", href: "/settings", icon: "settings", roles: ["ADMIN", "HR", "EMPLOYEE", "CANDIDATE"] },
] as const;

const rolePermissions: Record<ProfileRole, readonly string[]> = {
  ADMIN: ["/dashboard", "/employees", "/candidates", "/interviews", "/requests", "/workflows", "/chat", "/notifications", "/settings"],
  HR: ["/dashboard", "/employees", "/candidates", "/interviews", "/requests", "/workflows", "/chat", "/notifications", "/settings"],
  EMPLOYEE: ["/dashboard", "/requests", "/chat", "/notifications", "/settings"],
  CANDIDATE: ["/dashboard", "/interviews", "/chat", "/notifications", "/settings"],
};

export function isProfileRole(value: unknown): value is ProfileRole {
  return value === "ADMIN" || value === "HR" || value === "EMPLOYEE" || value === "CANDIDATE";
}

export function canAccessPath(role: ProfileRole | null, pathname: string) {
  if (!role) {
    return false;
  }

  return rolePermissions[role].some((allowedPath) => pathname === allowedPath || pathname.startsWith(`${allowedPath}/`));
}

export function getNavigationForRole(role: ProfileRole | null) {
  if (!role) {
    return [];
  }

  return protectedNavigation.filter((item) => (item.roles as readonly ProfileRole[]).includes(role));
}