"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type CandidateStatus = "APPLIED" | "SCREENING" | "INTERVIEW" | "SELECTED" | "REJECTED";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddCandidateModal({ isOpen, onClose, onSuccess }: Readonly<Props>) {
  const { t } = useI18n();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [positionApplied, setPositionApplied] = useState("");
  const [experience, setExperience] = useState<number | "">(0);
  const [status, setStatus] = useState<CandidateStatus>("APPLIED");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError("Full name is required.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!positionApplied.trim()) {
      setError("Please specify the position applied for.");
      return;
    }
    if (experience === "" || Number(experience) < 0) {
      setError("Experience must be a non-negative number.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          position_applied: positionApplied.trim(),
          experience: Number(experience),
          status,
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.message || payload.error || "Failed to create candidate");
      }

      setFullName("");
      setEmail("");
      setPhone("");
      setPositionApplied("");
      setExperience(0);
      setStatus("APPLIED");

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>+ {t.actions.add} Candidate</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="cand-name">Full Name *</label>
            <input
              id="cand-name"
              type="text"
              required
              placeholder="e.g. Sarah Jenkins"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cand-email">Email Address *</label>
            <input
              id="cand-email"
              type="email"
              required
              placeholder="sarah.jenkins@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cand-pos">Position Applied *</label>
              <input
                id="cand-pos"
                type="text"
                required
                placeholder="e.g. Senior Frontend Engineer"
                value={positionApplied}
                onChange={(e) => setPositionApplied(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cand-exp">Experience (Years) *</label>
              <input
                id="cand-exp"
                type="number"
                min={0}
                required
                value={experience}
                onChange={(e) => setExperience(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cand-phone">Phone Number</label>
              <input
                id="cand-phone"
                type="text"
                placeholder="+1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cand-status">Pipeline Status *</label>
              <select
                id="cand-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as CandidateStatus)}
              >
                <option value="APPLIED">{t.statuses.applied}</option>
                <option value="SCREENING">{t.statuses.screening}</option>
                <option value="INTERVIEW">{t.statuses.interview}</option>
                <option value="SELECTED">{t.statuses.selected}</option>
                <option value="REJECTED">{t.statuses.rejected}</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>
              {t.actions.cancel}
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="loading-spinner" size={14} /> {t.actions.submitting}
                </>
              ) : (
                `+ ${t.actions.add} Candidate`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
