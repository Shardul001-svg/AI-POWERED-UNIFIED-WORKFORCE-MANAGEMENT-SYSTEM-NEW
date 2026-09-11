"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Loader2, Trash2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { EmployeeEditRow } from "./EditEmployeeModal";

type Props = {
  isOpen: boolean;
  employee: EmployeeEditRow | null;
  onClose: () => void;
  onSuccess: (deletedId: string) => void;
};

export function DeleteConfirmationModal({ isOpen, employee, onClose, onSuccess }: Readonly<Props>) {
  const { t } = useI18n();
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !deleting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, deleting, onClose]);

  if (!isOpen || !employee) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);

    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "DELETE",
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.message || payload.error || t.employees.loadError);
      }

      onSuccess(employee.id);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t.errors.somethingWentWrong);
    } finally {
      setDeleting(false);
    }
  };

  const displayName = employee.full_name || employee.employee_code || "—";

  return (
    <div
      className="modal-overlay"
      onClick={() => !deleting && onClose()}
      role="presentation"
    >
      <div
        className="modal-container delete-confirmation-modal"
        style={{ width: "calc(100% - 32px)", maxWidth: "500px", padding: 0 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <div className="modal-header" style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="danger-icon-badge">
              <AlertTriangle size={20} />
            </div>
            <h2 id="delete-dialog-title" style={{ fontSize: "20px", margin: 0 }}>
              {t.employees.deleteModalTitle}
            </h2>
          </div>
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            disabled={deleting}
            aria-label={t.actions.close}
          >
            <X size={18} />
          </button>
        </div>

        {error ? (
          <div className="auth-error" style={{ margin: "16px 24px 0" }}>
            {error}
          </div>
        ) : null}

        <div
          id="delete-dialog-description"
          style={{
            padding: "24px",
            color: "var(--muted)",
            fontSize: "15px",
            lineHeight: 1.5,
          }}
        >
          {t.employees.deleteConfirmQuestion}{" "}
          <strong style={{ color: "var(--ink)", fontWeight: 600 }}>{displayName}</strong>? {t.employees.deletePermanentWarning}
        </div>

        <div className="modal-actions" style={{ padding: "16px 24px 20px", marginTop: 0, borderTop: "1px solid var(--line)" }}>
          <button
            type="button"
            className="secondary-button"
            onClick={onClose}
            disabled={deleting}
            style={{ height: "44px", padding: "0 20px" }}
          >
            {t.actions.cancel}
          </button>
          <button
            type="button"
            className="danger-button"
            onClick={handleDelete}
            disabled={deleting}
            style={{ height: "44px", padding: "0 20px" }}
          >
            {deleting ? (
              <>
                <Loader2 className="loading-spinner" size={16} /> {t.actions.deleting}
              </>
            ) : (
              <>
                <Trash2 size={16} /> {t.employees.deleteEmployee}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
