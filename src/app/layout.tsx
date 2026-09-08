import type { Metadata } from "next";

import { AuthProvider } from "@/lib/auth/AuthProvider";

import "./globals.css";

export const metadata: Metadata = {
  title: "Workforce OS",
  description: "Unified workforce management for modern operations teams.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}