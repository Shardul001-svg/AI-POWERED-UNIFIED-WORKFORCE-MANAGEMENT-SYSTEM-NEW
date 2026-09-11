"use client";

import { X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

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
  const [positionApplied, setPositionApplied] = useState("Software Engineer");
  const [experience, setExperience] = useState(3);
  const [status, setStatus] = useState("APPLIED");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !positionApplied.trim()) {
      setError(t.validation.fillRequiredFields);
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
        throw new Error(payload.message || payload.error || t.candidates.loadError);
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.errors.somethingWentWrong);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t.candidates.addModalTitle}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t.actions.close}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="cand-name">{t.candidates.fullName} *</label>
            <input
              id="cand-name"
              type="text"
              required
              placeholder="e.g. Nora Patel"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cand-email">{t.candidates.emailAddress} *</label>
            <input
              id="cand-email"
              type="email"
              required
              placeholder="nora.patel@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cand-phone">{t.candidates.phone}</label>
              <input
                id="cand-phone"
                type="text"
                placeholder="+1 555-0299"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cand-exp">{t.candidates.yearsOfExperience} *</label>
              <input
                id="cand-exp"
                type="number"
                min="0"
                max="40"
                required
                value={experience}
                onChange={(e) => setExperience(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cand-pos">{t.candidates.positionApplied} *</label>
              <input
                id="cand-pos"
                type="text"
                required
                value={positionApplied}
                onChange={(e) => setPositionApplied(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="cand-status">{t.candidates.applicationStatus} *</label>
              <select id="cand-status" value={status} onChange={(e) => setStatus(e.target.value)}>
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
              {submitting ? t.actions.submitting : t.candidates.addCandidate}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
