"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { TaskStatus } from "./CreateTaskModal";

export type TaskEditRow = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  assigned_to: string | null;
  due_date: string | null;
  related_type: string | null;
  related_id: string | null;
  assignee_name?: string | null;
};

type ProfileOption = {
  id: string;
  full_name: string;
  email: string;
  department?: string;
};

type Props = {
  isOpen: boolean;
  task: TaskEditRow | null;
  onClose: () => void;
  onSuccess: (updated: TaskEditRow) => void;
};

export function EditTaskModal({ isOpen, task, onClose, onSuccess }: Readonly<Props>) {
  const { t } = useI18n();
  const { role } = useAuth();
  const canEditAll = role === "ADMIN" || role === "HR";

  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [status, setStatus] = useState<TaskStatus>(task?.status ?? "TODO");
  const [assignedTo, setAssignedTo] = useState(task?.assigned_to ?? "");
  const [dueDate, setDueDate] = useState(task?.due_date ?? "");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    if (!isOpen) return;
    const loadProfiles = async () => {
      setLoadingProfiles(true);
      try {
        const res = await fetch("/api/employees", { cache: "no-store" });
        const payload = res.ok ? await res.json() : null;
        if (!active) return;
        const list: ProfileOption[] = Array.isArray(payload?.data)
          ? payload.data
              .filter((e: Partial<{ profile_id: string }>) => e.profile_id)
              .map((e: Partial<{ profile_id: string; full_name: string; email: string; department: string }>) => ({
                id: e.profile_id ?? "",
                full_name: e.full_name ?? "Unknown",
                email: e.email ?? "",
                department: e.department ?? "",
              }))
          : [];
        if (active) setProfiles(list);
      } catch { /* non-blocking */ } finally {
        if (active) setLoadingProfiles(false);
      }
    };
    void loadProfiles();
    return () => { active = false; };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Task title is required."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          status,
          assigned_to: assignedTo || null,
          due_date: dueDate || null,
        }),
      });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message || "Failed to update task");
      onSuccess({
        ...task,
        title: title.trim(),
        description: description.trim() || null,
        status,
        assigned_to: assignedTo || null,
        due_date: dueDate || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{t.workflows.editModalTitle}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t.actions.cancel}><X size={18} /></button>
        </div>
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="edit-task-title">{t.workflows.titleLabel} *</label>
            <input id="edit-task-title" type="text" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-task-status">{t.workflows.statusLabel}</label>
              <select id="edit-task-status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                <option value="TODO">{t.statuses.todo}</option>
                <option value="IN_PROGRESS">{t.statuses.inProgress}</option>
                <option value="COMPLETED">{t.statuses.completed}</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="edit-task-due">{t.workflows.dueDateLabel}</label>
              <input id="edit-task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          {canEditAll && (
            <div className="form-group">
              <label htmlFor="edit-task-assignee">{t.workflows.assignedToLabel}</label>
              {loadingProfiles ? (
                <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, fontSize: 13, color: "var(--muted)" }}>
                  <Loader2 className="loading-spinner" size={14} /> {t.actions.loading}
                </div>
              ) : (
                <select id="edit-task-assignee" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                  <option value="">{t.workflows.unassigned}</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>{p.full_name}{p.department ? ` — ${p.department}` : ""}</option>
                  ))}
                </select>
              )}
            </div>
          )}
          <div className="form-group">
            <label htmlFor="edit-task-desc">{t.workflows.descriptionLabel}</label>
            <textarea id="edit-task-desc" rows={4} value={description} onChange={(e) => setDescription(e.target.value)} />
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
