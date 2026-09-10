"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

export const STATUS_LABELS: Record<TaskStatus, string> = {
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
};

type ProfileOption = {
  id: string;
  full_name: string;
  email: string;
  department?: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateTaskModal({ isOpen, onClose, onSuccess }: Readonly<Props>) {
  const { t } = useI18n();
  const { role, profile } = useAuth();

  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<TaskStatus>("TODO");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
              .filter((e: Partial<{ profile_id: string; full_name: string; email: string; department: string }>) => e.profile_id)
              .map((e: Partial<{ profile_id: string; full_name: string; email: string; department: string }>) => ({
                id: e.profile_id ?? "",
                full_name: e.full_name ?? "Unknown",
                email: e.email ?? "",
                department: e.department ?? "",
              }))
          : [];
        setProfiles(list);
        if (role === "EMPLOYEE" && profile?.id) {
          setAssignedTo(profile.id);
        } else if (list.length > 0 && !assignedTo) {
          setAssignedTo("");
        }
      } catch { /* non-blocking */ } finally {
        if (active) setLoadingProfiles(false);
      }
    };
    void loadProfiles();
    return () => { active = false; };
  }, [isOpen, role, profile?.id, assignedTo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { setError("Task title is required."); return; }
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
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
      if (!res.ok || !payload.success) throw new Error(payload.message || "Failed to create task");
      onSuccess(); onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally { setSubmitting(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>+ Create Task</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="task-title">Title *</label>
            <input id="task-title" type="text" required placeholder="e.g. Review onboarding checklist" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select id="task-status" value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
                {(Object.keys(STATUS_LABELS) as TaskStatus[]).map((v) => (
                  <option key={v} value={v}>{STATUS_LABELS[v]}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="task-due">Due Date</label>
              <input id="task-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="task-assignee">Assign To</label>
            {loadingProfiles ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, fontSize: 13, color: "var(--muted)" }}>
                <Loader2 className="loading-spinner" size={14} /> Loading profiles...
              </div>
            ) : (
              <select id="task-assignee" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} disabled={role === "EMPLOYEE"}>
                <option value="">Unassigned</option>
                {profiles.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name}{p.department ? ` — ${p.department}` : ""}</option>
                ))}
              </select>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="task-desc">Description (Optional)</label>
            <textarea id="task-desc" rows={4} placeholder="Describe the task in detail..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>{t.actions.cancel}</button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? <><Loader2 className="loading-spinner" size={14} /> Creating...</> : "+ Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
