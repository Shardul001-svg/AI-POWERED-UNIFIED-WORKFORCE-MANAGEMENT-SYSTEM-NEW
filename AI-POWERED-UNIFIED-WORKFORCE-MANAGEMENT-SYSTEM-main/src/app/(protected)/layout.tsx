import type { Metadata } from "next";
import "../globals.css";

import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { AuthProvider } from "@/lib/auth/AuthProvider";

export const metadata: Metadata = {
  title: "Pune West Properties",
  description: "Find Your Dream Home in Wakad, Tathawade, Punawale & More",
};

export default function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthProvider>
      <ProtectedShell>{children}</ProtectedShell>
    </AuthProvider>
  );
}