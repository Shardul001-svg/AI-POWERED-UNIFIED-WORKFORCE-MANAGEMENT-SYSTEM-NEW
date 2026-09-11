"use client";

import { useState } from "react";
import { Check, Globe, KeyRound, Loader2, LogOut, Moon, Shield, Sun, Monitor, User, Palette } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { Language } from "@/lib/i18n";
import { useTheme } from "@/lib/theme/ThemeProvider";

type SettingsSection = "account" | "appearance" | "language" | "security";

export function SettingsDirectory() {
  const router = useRouter();
  const { profile, user, signOut, refreshProfile } = useAuth();
  const { language, setLanguage, t } = useI18n();
  const { theme, setTheme } = useTheme();

  const [activeSection, setActiveSection] = useState<SettingsSection>("account");
  const [draftName, setDraftName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const fullName = draftName !== null ? draftName : (profile?.full_name || "");

  const handleProfileSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim() }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? t.settings.profileUpdateError);
      }

      await refreshProfile();
      setDraftName(null);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t.settings.profileUpdateError);
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const result = await signOut();
    if (!result.error) {
      router.replace("/login");
    } else {
      setSigningOut(false);
    }
  };

  const initials = (fullName || user?.email || "U")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="protected-page-content">
      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">{t.nav.workspace}</p>
          <h1>{t.pages.settingsTitle}</h1>
          <p className="muted">{t.pages.settingsSubtitle}</p>
        </div>
      </div>

      <div className="employees-layout" style={{ gridTemplateColumns: "240px 1fr" }}>
        {/* Navigation Tabs Panel */}
        <div className="panel" style={{ padding: "0.75rem" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <button
              type="button"
              className={`secondary-button ${activeSection === "account" ? "active" : ""}`}
              onClick={() => setActiveSection("account")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                justifyContent: "flex-start",
                padding: "0.75rem 1rem",
                width: "100%",
                marginTop: 0,
                textAlign: "left",
                backgroundColor: activeSection === "account" ? "var(--teal)" : "transparent",
                color: activeSection === "account" ? "#ffffff" : "var(--ink)",
              }}
            >
              <User size={16} />
              <span>{t.settings.accountSection}</span>
            </button>

            <button
              type="button"
              className={`secondary-button ${activeSection === "appearance" ? "active" : ""}`}
              onClick={() => setActiveSection("appearance")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                justifyContent: "flex-start",
                padding: "0.75rem 1rem",
                width: "100%",
                marginTop: 0,
                textAlign: "left",
                backgroundColor: activeSection === "appearance" ? "var(--teal)" : "transparent",
                color: activeSection === "appearance" ? "#ffffff" : "var(--ink)",
              }}
            >
              <Palette size={16} />
              <span>{t.settings.appearanceSection}</span>
            </button>

            <button
              type="button"
              className={`secondary-button ${activeSection === "language" ? "active" : ""}`}
              onClick={() => setActiveSection("language")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                justifyContent: "flex-start",
                padding: "0.75rem 1rem",
                width: "100%",
                marginTop: 0,
                textAlign: "left",
                backgroundColor: activeSection === "language" ? "var(--teal)" : "transparent",
                color: activeSection === "language" ? "#ffffff" : "var(--ink)",
              }}
            >
              <Globe size={16} />
              <span>{t.settings.languageSection}</span>
            </button>

            <button
              type="button"
              className={`secondary-button ${activeSection === "security" ? "active" : ""}`}
              onClick={() => setActiveSection("security")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                justifyContent: "flex-start",
                padding: "0.75rem 1rem",
                width: "100%",
                marginTop: 0,
                textAlign: "left",
                backgroundColor: activeSection === "security" ? "var(--teal)" : "transparent",
                color: activeSection === "security" ? "#ffffff" : "var(--ink)",
              }}
            >
              <Shield size={16} />
              <span>{t.settings.securitySection}</span>
            </button>
          </div>
        </div>

        {/* Content Section Panel */}
        <div className="panel detail-panel" style={{ padding: "1.75rem" }}>
          {activeSection === "account" && (
            <div>
              <div className="detail-header" style={{ marginBottom: "1.5rem" }}>
                <div>
                  <h2>{t.settings.accountSection}</h2>
                  <p className="muted">{t.settings.accountDesc}</p>
                </div>
              </div>

              {saveSuccess ? (
                <div className="status-pill active" style={{ width: "100%", padding: "0.75rem", marginBottom: "1.25rem", borderRadius: "0.5rem" }}>
                  <Check size={16} style={{ marginRight: "0.5rem" }} />
                  {t.settings.profileUpdated}
                </div>
              ) : null}

              {saveError ? (
                <div className="panel-warning" style={{ marginBottom: "1.25rem" }}>
                  {saveError}
                </div>
              ) : null}

              <div style={{ display: "flex", alignItems: "center", gap: "1.25rem", marginBottom: "2rem" }}>
                <div className="avatar" style={{ width: "64px", height: "64px", fontSize: "1.25rem" }}>
                  {initials}
                </div>
                <div>
                  <strong style={{ fontSize: "1.1rem", display: "block" }}>{profile?.full_name || "Workspace User"}</strong>
                  <span className="muted" style={{ fontSize: "0.85rem" }}>{user?.email}</span>
                </div>
              </div>

              <form onSubmit={(e) => void handleProfileSave(e)} className="employee-form">
                <div className="field-row" style={{ gridTemplateColumns: "1fr" }}>
                  <label>
                    {t.settings.fullName}
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setDraftName(e.target.value)}
                      placeholder={t.settings.fullNamePlaceholder}
                      required
                    />
                  </label>
                </div>

                <div className="field-row">
                  <label>
                    {t.settings.email}
                    <input type="email" value={user?.email || ""} readOnly style={{ opacity: 0.7, cursor: "not-allowed" }} />
                    <small className="muted" style={{ marginTop: "0.25rem" }}>{t.settings.emailHelp}</small>
                  </label>

                  <label>
                    {t.settings.role}
                    <input type="text" value={profile?.role ? (t.roles[profile.role.toLowerCase() as keyof typeof t.roles] ?? profile.role) : ""} readOnly style={{ opacity: 0.7, cursor: "not-allowed" }} />
                    <small className="muted" style={{ marginTop: "0.25rem" }}>{t.settings.roleHelp}</small>
                  </label>
                </div>

                <div className="detail-footer" style={{ marginTop: "1.5rem" }}>
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={() => setDraftName(null)}
                    disabled={saving}
                  >
                    {t.actions.cancel}
                  </button>
                  <button
                    type="submit"
                    className="primary-button"
                    disabled={saving || !fullName.trim() || fullName.trim() === profile?.full_name}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="loading-spinner" size={15} />
                        {t.actions.saving}
                      </>
                    ) : (
                      t.actions.save
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeSection === "appearance" && (
            <div>
              <div className="detail-header" style={{ marginBottom: "1.5rem" }}>
                <div>
                  <h2>{t.settings.appearanceSection}</h2>
                  <p className="muted">{t.settings.appearanceDesc}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setTheme("light")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1.5rem",
                    borderRadius: "0.75rem",
                    border: theme === "light" ? "2px solid var(--teal)" : "1px solid var(--line)",
                    backgroundColor: "var(--card-bg)",
                    color: "var(--ink)",
                    cursor: "pointer",
                  }}
                >
                  <Sun size={28} style={{ color: "#eabe54" }} />
                  <strong>{t.settings.themeLight}</strong>
                  {theme === "light" ? <Check size={16} style={{ color: "var(--teal)" }} /> : null}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("dark")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1.5rem",
                    borderRadius: "0.75rem",
                    border: theme === "dark" ? "2px solid var(--teal)" : "1px solid var(--line)",
                    backgroundColor: "var(--card-bg)",
                    color: "var(--ink)",
                    cursor: "pointer",
                  }}
                >
                  <Moon size={28} style={{ color: "#38bdf8" }} />
                  <strong>{t.settings.themeDark}</strong>
                  {theme === "dark" ? <Check size={16} style={{ color: "var(--teal)" }} /> : null}
                </button>

                <button
                  type="button"
                  onClick={() => setTheme("system")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: "0.75rem",
                    padding: "1.5rem",
                    borderRadius: "0.75rem",
                    border: theme === "system" ? "2px solid var(--teal)" : "1px solid var(--line)",
                    backgroundColor: "var(--card-bg)",
                    color: "var(--ink)",
                    cursor: "pointer",
                  }}
                >
                  <Monitor size={28} style={{ color: "#94a3b8" }} />
                  <strong>{t.settings.themeSystem}</strong>
                  {theme === "system" ? <Check size={16} style={{ color: "var(--teal)" }} /> : null}
                </button>
              </div>
            </div>
          )}

          {activeSection === "language" && (
            <div>
              <div className="detail-header" style={{ marginBottom: "1.5rem" }}>
                <div>
                  <h2>{t.settings.languageSection}</h2>
                  <p className="muted">{t.settings.languageDesc}</p>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
                {(
                  [
                    { code: "en", name: t.settings.langEnglish },
                    { code: "hi", name: t.settings.langHindi },
                    { code: "mr", name: t.settings.langMarathi },
                  ] as Array<{ code: Language; name: string }>
                ).map((lang) => (
                  <button
                    type="button"
                    key={lang.code}
                    onClick={() => setLanguage(lang.code)}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.75rem",
                      padding: "1.5rem",
                      borderRadius: "0.75rem",
                      border: language === lang.code ? "2px solid var(--teal)" : "1px solid var(--line)",
                      backgroundColor: "var(--card-bg)",
                      color: "var(--ink)",
                      cursor: "pointer",
                    }}
                  >
                    <Globe size={28} style={{ color: "var(--teal)" }} />
                    <strong style={{ fontSize: "1rem" }}>{lang.name}</strong>
                    {language === lang.code ? <Check size={16} style={{ color: "var(--teal)" }} /> : null}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeSection === "security" && (
            <div>
              <div className="detail-header" style={{ marginBottom: "1.5rem" }}>
                <div>
                  <h2>{t.settings.securitySection}</h2>
                  <p className="muted">{t.settings.securityDesc}</p>
                </div>
              </div>

              <div className="employee-detail-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="detail-stat">
                  <span className="detail-label">{t.settings.securityStatus}</span>
                  <strong style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <Shield size={16} style={{ color: "var(--teal)" }} />
                    {t.settings.securityStatusVal}
                  </strong>
                </div>

                <div className="detail-stat">
                  <span className="detail-label">{t.settings.activeSession}</span>
                  <strong>{t.settings.activeSessionVal}</strong>
                </div>
              </div>

              <div className="detail-stat detail-stat-wide" style={{ marginBottom: "1.5rem" }}>
                <span className="detail-label" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <KeyRound size={14} /> {t.settings.passwordManagement}
                </span>
                <p className="muted" style={{ margin: "0.5rem 0 0" }}>
                  {t.settings.passwordInfo}
                </p>
              </div>

              <div style={{ paddingTop: "1rem", borderTop: "1px solid var(--line)" }}>
                <button
                  type="button"
                  className="danger-button"
                  onClick={() => void handleSignOut()}
                  disabled={signingOut}
                  style={{ width: "auto" }}
                >
                  <LogOut size={16} />
                  {signingOut ? t.nav.signingOut : t.nav.signOut}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
