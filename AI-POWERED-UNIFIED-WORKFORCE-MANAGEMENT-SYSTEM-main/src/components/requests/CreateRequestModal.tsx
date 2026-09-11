"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type RequestType = "LEAVE" | "HR_QUERY" | "DOCUMENT" | "OTHER";
export type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

type EmployeeOption = {
  id: string;
  full_name: string;
  email: string;
  department: string;
  position: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export const TYPE_LABELS: Record<RequestType, string> = {
  LEAVE: "Leave Request",
  HR_QUERY: "HR Inquiry",
  DOCUMENT: "Document Request",
  OTHER: "Other",
};

export function CreateRequestModal({ isOpen, onClose, onSuccess }: Readonly<Props>) {
  const { t } = useI18n();
  const { role } = useAuth();
  const canManageRequests = role === "ADMIN" || role === "HR";

  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  const [type, setType] = useState<RequestType>("LEAVE");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<RequestStatus>("PENDING");
  const [employeeId, setEmployeeId] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!isOpen || !canManageRequests) return;
    const loadEmployees = async () => {
      setLoadingEmployees(true);
      try {
        const res = await fetch("/api/employees", { cache: "no-store" });
        const payload = res.ok ? await res.json() : null;
        if (!active) return;
        const list: EmployeeOption[] = Array.isArray(payload?.data)
          ? payload.data.map((e: Partial<EmployeeOption & { profiles?: { full_name?: string; email?: string } }>) => ({
              id: e.id ?? "",
              full_name: e.full_name ?? e.profiles?.full_name ?? "Unknown",
              email: e.email ?? e.profiles?.email ?? "",
              department: e.department ?? "",
              position: e.position ?? "",
            }))
          : [];
        setEmployees(list);
        if (list.length > 0) setEmployeeId(list[0].id);
      } catch { /* non-blocking */ } finally {
        if (active) setLoadingEmployees(false);
      }
    };
    void loadEmployees();
    return () => { active = false; };
  }, [isOpen, canManageRequests]);



  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Request title is required."); return; }
    if (canManageRequests && !employeeId) { setError("Please select an employee for this request."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type, title: title.trim(),
          description: description.trim() || null,
          status,
          employee_id: canManageRequests ? employeeId : undefined,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message || "Failed to create request");
      onSuccess(); onClose();
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
          <h2>+ {t.requests.createModalTitle}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t.actions.cancel}><X size={18} /></button>
        </div>
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group" style={{ flex: canManageRequests ? 1 : "1 1 100%" }}>
              <label htmlFor="req-type">{t.requests.typeLabel} *</label>
              <select id="req-type" value={type} onChange={(e) => setType(e.target.value as RequestType)}>
                {(Object.keys(TYPE_LABELS) as RequestType[]).map((v) => (
                  <option key={v} value={v}>{getLocalizedType(v)}</option>
                ))}
              </select>
            </div>
            {canManageRequests && (
              <div className="form-group">
                <label htmlFor="req-status">{t.requests.statusLabel}</label>
                <select id="req-status" value={status} onChange={(e) => setStatus(e.target.value as RequestStatus)}>
                  <option value="PENDING">{t.statuses.pending}</option>
                  <option value="APPROVED">{t.statuses.approved}</option>
                  <option value="REJECTED">{t.statuses.rejected}</option>
                  <option value="COMPLETED">{t.statuses.completed}</option>
                </select>
              </div>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="req-title">{t.requests.titleLabel} *</label>
            <input id="req-title" type="text" required placeholder="e.g. Annual leave for December" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          {canManageRequests && (
            <div className="form-group">
              <label htmlFor="req-employee">{t.requests.employeeLabel} *</label>
              {loadingEmployees ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, fontSize: 13, color: "var(--muted)" }}>
                  <Loader2 className="loading-spinner" size={14} /> {t.actions.loading}
                </div>
              ) : (
                <select id="req-employee" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} disabled={employees.length === 0}>
                  {employees.length === 0 ? <option value="">{t.employees.emptyNoRecords}</option> : (
                    <>
                      <option value="">{t.employees.searchPlaceholder}</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.full_name} — {emp.department}</option>
                      ))}
                    </>
                  )}
                </select>
              )}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="req-desc">{t.requests.descriptionLabel}</label>
            <textarea id="req-desc" rows={4} placeholder="Provide additional details about your request..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>{t.actions.cancel}</button>
            <button type="submit" id="create-request-submit-btn" className="primary-button" disabled={submitting}>
              {submitting ? <><Loader2 className="loading-spinner" size={14} /> {t.actions.saving}</> : `+ ${t.requests.createRequest}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

