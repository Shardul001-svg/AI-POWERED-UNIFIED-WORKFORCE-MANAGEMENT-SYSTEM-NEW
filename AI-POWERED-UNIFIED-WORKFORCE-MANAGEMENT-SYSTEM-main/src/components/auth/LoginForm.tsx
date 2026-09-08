"use client";

import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/AuthProvider";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { configured, loading, user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = await signIn(email.trim(), password);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
      return;
    }

    router.replace(searchParams.get("next") || "/dashboard");
  };

  return (
    <main className="auth-page">
      <div className="auth-visual">
        <div className="auth-brand"><span>W</span><strong>workforce<span>OS</span></strong></div>
        <div className="auth-visual-copy"><p className="eyebrow">Unified workforce management</p><h1>Make every workday move with clarity.</h1><p>One calm place for people, requests, schedules, and the work that connects them.</p></div>
        <div className="auth-visual-footer"><ShieldCheck size={16} /> Secure access powered by Supabase Auth</div>
      </div>
      <section className="auth-panel" aria-labelledby="login-title">
        <div className="auth-panel-inner">
          <div className="mobile-auth-brand"><span>W</span><strong>workforce<span>OS</span></strong></div>
          <p className="eyebrow">Welcome back</p>
          <h2 id="login-title">Sign in to your workspace</h2>
          <p className="auth-subtitle">Sign in to manage your workforce, HR requests and workflows.</p>
          {!configured && <div className="setup-message" role="status"><strong>Authentication setup required</strong><span>Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to `.env.local` to enable sign in.</span></div>}
          {error && <div className="auth-error" role="alert">{error}</div>}
          <form className="login-form" onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <div className="input-wrap"><Mail size={17} /><input id="email" type="email" autoComplete="email" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} disabled={!configured || submitting} /></div>
            <label htmlFor="password">Password</label>
            <div className="input-wrap"><LockKeyhole size={17} /><input id="password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} disabled={!configured || submitting} /><button type="button" className="password-toggle" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div>
            <button className="login-button" type="submit" disabled={!configured || submitting}>{submitting ? "Signing in..." : "Sign in"}</button>
          </form>
          <p className="auth-footnote">Need access? Ask your workspace administrator to create your account.</p>
        </div>
      </section>
    </main>
  );
}