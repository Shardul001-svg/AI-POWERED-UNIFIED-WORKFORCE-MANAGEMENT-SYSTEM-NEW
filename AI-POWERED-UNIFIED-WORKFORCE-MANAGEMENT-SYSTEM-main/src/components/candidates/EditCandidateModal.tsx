"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { CandidateStatus } from "./AddCandidateModal";

export type CandidateEditRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position_applied: string;
  experience: number;
  status: CandidateStatus;
  created_at?: string;
};

type Props = {
  isOpen: boolean;
  candidate: CandidateEditRow | null;
  onClose: () => void;
  onSuccess: (updated: CandidateEditRow) => void;
};

export function EditCandidateModal({ isOpen, candidate, onClose, onSuccess }: Readonly<Props>) {
  const { t } = useI18n();

  const [fullName, setFullName] = useState(candidate?.full_name || "");
  const [email, setEmail] = useState(candidate?.email || "");
  const [phone, setPhone] = useState(candidate?.phone || "");
  const [positionApplied, setPositionApplied] = useState(candidate?.position_applied || "");
  const [experience, setExperience] = useState<number | "">(candidate?.experience ?? 0);
  const [status, setStatus] = useState<CandidateStatus>(candidate?.status || "APPLIED");

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

  if (!isOpen || !candidate) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!fullName.trim()) {
      setError(t.validation.fillRequiredFields);
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError(t.validation.invalidEmail);
      return;
    }
    if (!positionApplied.trim()) {
      setError(t.validation.fillRequiredFields);
      return;
    }
    if (experience === "" || Number(experience) < 0) {
      setError(t.validation.fillRequiredFields);
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/candidates/${candidate.id}`, {
        method: "PUT",
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
        throw new Error(payload.message || payload.error || t.candidates.loadError);
      }

      onSuccess({
        ...candidate,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || null,
        position_applied: positionApplied.trim(),
        experience: Number(experience),
        status,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.errors.somethingWentWrong);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{t.candidates.editModalTitle}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t.actions.close}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="edit-cand-name">{t.candidates.fullName} *</label>
            <input
              id="edit-cand-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-cand-email">{t.candidates.emailAddress} *</label>
            <input
              id="edit-cand-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-cand-pos">{t.candidates.positionApplied} *</label>
              <input
                id="edit-cand-pos"
                type="text"
                required
                value={positionApplied}
                onChange={(e) => setPositionApplied(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-cand-exp">{t.candidates.yearsOfExperience} *</label>
              <input
                id="edit-cand-exp"
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
              <label htmlFor="edit-cand-phone">{t.candidates.phone}</label>
              <input
                id="edit-cand-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-cand-status">{t.candidates.applicationStatus} *</label>
              <select
                id="edit-cand-status"
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
                  <Loader2 className="loading-spinner" size={14} /> {t.actions.saving}
                </>
              ) : (
                t.actions.save
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
