"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { RequestType, RequestStatus, TYPE_LABELS } from "./CreateRequestModal";

export type RequestEditRow = {
  id: string;
  type: RequestType;
  title: string;
  description: string | null;
  status: RequestStatus;
  employee_name?: string | null;
};

type Props = {
  isOpen: boolean;
  request: RequestEditRow | null;
  onClose: () => void;
  onSuccess: (updated: RequestEditRow) => void;
};

export function EditRequestModal({ isOpen, request, onClose, onSuccess }: Readonly<Props>) {
  const { t } = useI18n();
  const { role } = useAuth();
  const canManageRequests = role === "ADMIN" || role === "HR";

  const [type, setType] = useState<RequestType>(request?.type ?? "LEAVE");
  const [title, setTitle] = useState(request?.title ?? "");
  const [description, setDescription] = useState(request?.description ?? "");
  const [status, setStatus] = useState<RequestStatus>(request?.status ?? "PENDING");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);



  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Request title is required."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: title.trim(),
          description: description.trim() || null,
          status,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message || "Failed to update request");
      onSuccess({ ...request, type, title: title.trim(), description: description.trim() || null, status });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally { setSubmitting(false); }
  };

  const getLocalizedType = (val: RequestType) => {
      switch (val) {
        case "LEAVE": return t.requests.typeLeave;
        case "HR_QUERY": return t.requests.typeHrQuery;
        case "DOCUMENT": return t.requests.typeDocument;
        case "OTHER": return t.requests.typeOther;
        default: return val;
      }
    };

    return (
      <div className="modal-overlay" onClick={onClose} role="presentation">
        <div className="modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
          <div className="modal-header">
            <h2>{t.requests.editModalTitle} — {request.employee_name ?? "Employee"}</h2>
            <button type="button" className="icon-button" onClick={onClose} aria-label={t.actions.cancel}><X size={18} /></button>
          </div>
          {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="edit-req-type">{t.requests.typeLabel} *</label>
                <select id="edit-req-type" value={type} onChange={(e) => setType(e.target.value as RequestType)}>
                  {(Object.keys(TYPE_LABELS) as RequestType[]).map((v) => (
                    <option key={v} value={v}>{getLocalizedType(v)}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="edit-req-status">{t.requests.statusLabel} *</label>
                <select id="edit-req-status" value={status} onChange={(e) => setStatus(e.target.value as RequestStatus)} disabled={!canManageRequests}>
                  <option value="PENDING">{t.statuses.pending}</option>
                  <option value="APPROVED">{t.statuses.approved}</option>
                  <option value="REJECTED">{t.statuses.rejected}</option>
                  <option value="COMPLETED">{t.statuses.completed}</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="edit-req-title">{t.requests.titleLabel} *</label>
              <input id="edit-req-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="edit-req-desc">{t.requests.descriptionLabel}</label>
              <textarea id="edit-req-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>{t.actions.cancel}</button>
              <button type="submit" className="primary-button" disabled={submitting}>
                {submitting ? <><Loader2 className="loading-spinner" size={14} /> {t.actions.saving}</> : t.actions.save}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
