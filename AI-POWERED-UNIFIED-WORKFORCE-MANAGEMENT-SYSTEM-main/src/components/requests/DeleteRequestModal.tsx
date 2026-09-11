"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { RequestEditRow } from "./EditRequestModal";

type Props = {
  isOpen: boolean;
  request: RequestEditRow | null;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
};

export function DeleteRequestModal({ isOpen, request, onClose, onSuccess }: Readonly<Props>) {
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !deleting) onClose(); };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, deleting, onClose]);

  if (!isOpen || !request) return null;

  const handleDelete = async () => {
    setDeleting(true); setError(null);
    try {
      const res = await fetch(`/api/requests/${request.id}`, { method: "DELETE" });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message || "Failed to delete request");
      onSuccess(request.id); onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally { setDeleting(false); }
  };

  const displayName = request.employee_name || "this employee";

  return (
    <div className="modal-overlay" onClick={() => !deleting && onClose()} role="presentation">
      <div
        className="modal-container delete-confirmation-modal"
        style={{ width: "calc(100% - 32px)", maxWidth: "500px", padding: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-req-title"
        aria-describedby="delete-req-desc"
      >
        <div className="modal-header" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="danger-icon-badge"><AlertTriangle size={20} /></div>
            <h2 id="delete-req-title" style={{ fontSize: "20px", margin: 0 }}>Delete request?</h2>
          </div>
          <button type="button" className="icon-button" onClick={onClose} disabled={deleting} aria-label="Close"><X size={18} /></button>
        </div>

        {error && <div className="auth-error" style={{ margin: "16px 24px 0" }}>{error}</div>}

        <div id="delete-req-desc" style={{ padding: "24px", color: "var(--muted)", fontSize: "15px", lineHeight: 1.5 }}>
          Are you sure you want to delete the request{" "}
          <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{'"'}{request.title}{'"'}</strong>{" "}
          from {displayName}? This action cannot be undone.
        </div>

        <div className="modal-actions" style={{ padding: "16px 24px 20px", marginTop: 0, borderTop: "1px solid var(--line)" }}>
          <button type="button" className="secondary-button" onClick={onClose} disabled={deleting} style={{ height: "44px", padding: "0 20px" }}>
            {t.actions.cancel}
          </button>
          <button type="button" className="danger-button" onClick={handleDelete} disabled={deleting} style={{ height: "44px", padding: "0 20px" }}>
            {deleting ? <><Loader2 className="loading-spinner" size={16} /> {t.actions.deleting}</> : <><Trash2 size={16} /> {t.actions.delete} request</>}
          </button>
        </div>
      </div>
    </div>
  );
}
