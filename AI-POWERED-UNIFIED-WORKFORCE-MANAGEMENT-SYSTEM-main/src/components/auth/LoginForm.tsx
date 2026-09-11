"use client";

import { Bot, Eye, EyeOff, Globe, LockKeyhole, Mail, ShieldCheck, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Language } from "@/lib/i18n";
import WorkerChat from "@/components/workerchat";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { configured, loading, user, signIn } = useAuth();
  const { t, language, setLanguage } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [loading, router, user]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError(t.auth.fillEmailPassword);
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
    <main className="auth-page centered-auth-layout">
      {/* Background Overlay */}
      <div className="auth-bg-overlay" />

      {/* Top Language Switcher */}
      <div
        style={{
          position: "fixed",
          top: "1.25rem",
          right: "1.5rem",
          zIndex: 40,
          display: "flex",
          alignItems: "center",
          gap: "0.4rem",
          background: "rgba(15, 23, 42, 0.75)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          borderRadius: "9999px",
          padding: "0.25rem 0.5rem",
        }}
      >
        <Globe size={14} style={{ color: "#38bdf8", marginLeft: "0.25rem" }} />
        {(
          [
            { code: "en", label: "EN" },
            { code: "hi", label: "हिंदी" },
            { code: "mr", label: "मराठी" },
          ] as Array<{ code: Language; label: string }>
        ).map((lang) => (
          <button
            key={lang.code}
            type="button"
            onClick={() => setLanguage(lang.code)}
            style={{
              background: language === lang.code ? "var(--teal, #0d9488)" : "transparent",
              color: "#ffffff",
              border: "none",
              borderRadius: "9999px",
              padding: "0.2rem 0.6rem",
              fontSize: "0.75rem",
              fontWeight: language === lang.code ? 600 : 400,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
          >
            {lang.label}
          </button>
        ))}
      </div>

      {/* Main Content Container */}
      <div className="auth-container">
        {/* Branding Header */}
        <header className="auth-header-brand">
          <div className="auth-brand">
            <span>W</span>
            <strong>
              workforce<span>OS</span>
            </strong>
          </div>
          <p className="auth-tagline">{t.auth.tagline}</p>
        </header>

        {/* Center-Bottom Glassmorphic Login Card */}
        <section className="auth-card-glass" aria-labelledby="login-title">
          <div className="auth-card-inner">
            <p className="eyebrow">{t.auth.welcomeBack}</p>
            <h2 id="login-title">{t.auth.signInTitle}</h2>
            <p className="auth-subtitle">{t.auth.signInSubtitle}</p>

            {!configured && (
              <div className="setup-message" role="status">
                <strong>{t.auth.setupRequired}</strong>
                <span>{t.auth.setupRequiredDesc}</span>
              </div>
            )}

            {error && <div className="auth-error" role="alert">{error}</div>}

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label htmlFor="email">{t.auth.emailLabel}</label>
                <div className="input-wrap">
                  <Mail size={17} />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder={t.auth.emailPlaceholder}
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    disabled={!configured || submitting}
                  />
                </div>
              </div>

              <div className="form-field">
                <label htmlFor="password">{t.auth.passwordLabel}</label>
                <div className="input-wrap">
                  <LockKeyhole size={17} />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder={t.auth.passwordPlaceholder}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    disabled={!configured || submitting}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    title={showPassword ? "Hide password" : "Show password"}
                    onClick={() => setShowPassword((visible) => !visible)}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
              </div>

              <button className="login-button" type="submit" disabled={!configured || submitting}>
                {submitting ? t.auth.signingIn : t.auth.signInButton}
              </button>
            </form>

            <p className="auth-footnote">{t.auth.askAdminNote}</p>

            <div className="auth-card-footer">
              <ShieldCheck size={14} /> {t.auth.protectedBySupabase}
            </div>
          </div>
        </section>
      </div>

      {/* Pre-Login Chatbot Launcher — Bottom Left Corner */}
      <aside className="prelogin-chatbot-wrap">
        {!chatOpen ? (
          <button
            type="button"
            className="prelogin-chatbot-trigger"
            onClick={() => setChatOpen(true)}
            aria-label={t.nav.chat}
          >
            <Bot size={20} />
            <span>{t.nav.chat}</span>
          </button>
        ) : (
          <div className="prelogin-chatbot-drawer">
            <div className="chatbot-drawer-header">
              <div className="chatbot-drawer-title">
                <Bot size={18} />
                <span>{t.pages.chatTitle}</span>
              </div>
              <button
                type="button"
                className="chatbot-drawer-close"
                onClick={() => setChatOpen(false)}
                aria-label={t.actions.close}
              >
                <X size={16} />
              </button>
            </div>
            <div className="chatbot-drawer-body">
              <WorkerChat />
            </div>
          </div>
        )}
      </aside>
    </main>
  );
}