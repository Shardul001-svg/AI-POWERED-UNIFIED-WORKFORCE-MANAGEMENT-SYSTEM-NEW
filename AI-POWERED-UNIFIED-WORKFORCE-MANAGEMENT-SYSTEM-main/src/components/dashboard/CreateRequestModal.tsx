"use client";

import { X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateRequestModal({ isOpen, onClose, onSuccess }: Readonly<Props>) {
  const { t } = useI18n();
  const [type, setType] = useState<"LEAVE" | "HR_QUERY" | "DOCUMENT" | "OTHER">("LEAVE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Please enter a title for your request.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || null,
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Failed to submit request");
      }

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create Request</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="req-type">Request Type *</label>
            <select id="req-type" value={type} onChange={(e) => setType(e.target.value as typeof type)}>
              <option value="LEAVE">Annual / Personal Leave</option>
              <option value="HR_QUERY">HR & Benefits Query</option>
              <option value="DOCUMENT">Employment Document</option>
              <option value="OTHER">Equipment & Other Request</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="req-title">Request Title *</label>
            <input
              id="req-title"
              type="text"
              required
              placeholder="e.g. Annual Leave - 3 Days"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="req-desc">Description / Reason</label>
            <textarea
              id="req-desc"
              rows={3}
              placeholder="Provide details for your manager or HR team..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>
              {t.actions.cancel}
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? t.actions.submitting : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
