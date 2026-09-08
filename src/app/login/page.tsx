import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return <Suspense fallback={<div className="auth-loading"><span className="loading-spinner" />Loading sign in...</div>}><LoginForm /></Suspense>;
}