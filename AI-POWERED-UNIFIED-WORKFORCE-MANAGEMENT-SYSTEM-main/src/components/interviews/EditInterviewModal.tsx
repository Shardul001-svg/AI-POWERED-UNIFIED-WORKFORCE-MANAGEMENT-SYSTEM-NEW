"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { InterviewerOption, InterviewStatus } from "./ScheduleInterviewModal";

export type InterviewEditRow = {
  id: string;
  candidate_id: string;
  interviewer: string | null;
  interview_date: string;
  interview_time: string;
  status: InterviewStatus;
  notes: string | null;
  candidate_name?: string | null;
  candidate_email?: string | null;
  interviewer_name?: string | null;
};

type Props = {
  isOpen: boolean;
  interview: InterviewEditRow | null;
  onClose: () => void;
  onSuccess: (updated: InterviewEditRow) => void;
};

export function EditInterviewModal({ isOpen, interview, onClose, onSuccess }: Readonly<Props>) {
  const { t } = useI18n();

  const [interviewers, setInterviewers] = useState<InterviewerOption[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  const [interviewerId, setInterviewerId] = useState(interview?.interviewer || "");
  const [interviewDate, setInterviewDate] = useState(interview?.interview_date || "");
  const [interviewTime, setInterviewTime] = useState(interview?.interview_time || "");
  const [status, setStatus] = useState<InterviewStatus>(interview?.status || "SCHEDULED");
  const [notes, setNotes] = useState(interview?.notes || "");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadInterviewers = async () => {
      if (!isOpen) return;
      setLoadingRefs(true);

      try {
        const empRes = await fetch("/api/employees", { cache: "no-store" });
        if (!active) return;

        const empPayload = empRes.ok ? await empRes.json() : null;
        const empList: InterviewerOption[] = Array.isArray(empPayload?.data)
          ? empPayload.data.map((e: Partial<InterviewerOption & { profile_id?: string; profiles?: { full_name?: string | null; email?: string | null } }>) => ({
              id: e.profile_id ?? e.id ?? "",
              full_name: e.full_name ?? e.profiles?.full_name ?? "Unknown interviewer",
              email: e.email ?? e.profiles?.email ?? "",
              position: e.position ?? "",
              department: e.department ?? "",
            }))
          : [];

        setInterviewers(empList);
      } catch (err: unknown) {
        if (!active) return;
        console.error("Failed to load interviewers:", err);
      } finally {
        if (active) setLoadingRefs(false);
      }
    };

    void loadInterviewers();

    return () => {
      active = false;
    };
  }, [isOpen]);

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

  if (!isOpen || !interview) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!interviewDate) {
      setError("Interview date is required.");
      return;
    }
    if (!interviewTime) {
      setError("Interview time is required.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/interviews/${interview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_date: interviewDate,
          interview_time: interviewTime,
          interviewer: interviewerId || null,
          status,
          notes: notes.trim() || null,
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.message || payload.error || "Failed to update interview");
      }

      const assignedInterviewer = interviewers.find((i) => i.id === interviewerId);

      onSuccess({
        ...interview,
        interview_date: interviewDate,
        interview_time: interviewTime,
        interviewer: interviewerId || null,
        interviewer_name: assignedInterviewer ? assignedInterviewer.full_name : interview.interviewer_name,
        status,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const candidateDisplayName = interview.candidate_name || "Candidate";

  return (
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{t.interviews.editModalTitle} — {candidateDisplayName}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t.actions.cancel}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="edit-int-interviewer">{t.interviews.interviewerLabel}</label>
            {loadingRefs ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, fontSize: 13, color: "var(--muted)" }}>
                <Loader2 className="loading-spinner" size={14} /> {t.actions.loading}
              </div>
            ) : (
              <select
                id="edit-int-interviewer"
                value={interviewerId}
                onChange={(e) => setInterviewerId(e.target.value)}
              >
                <option value="">{t.interviews.selectInterviewer}</option>
                {interviewers.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.full_name} ({emp.department} - {emp.position})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-int-date">{t.interviews.dateLabel} *</label>
              <input
                id="edit-int-date"
                type="date"
                required
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-int-time">{t.interviews.timeLabel} *</label>
              <input
                id="edit-int-time"
                type="time"
                required
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="edit-int-status">{t.interviews.statusLabel} *</label>
            <select
              id="edit-int-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as InterviewStatus)}
            >
              <option value="SCHEDULED">{t.statuses.scheduled}</option>
              <option value="COMPLETED">{t.statuses.completed}</option>
              <option value="CANCELLED">{t.statuses.cancelled}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="edit-int-notes">{t.interviews.notesLabel}</label>
            <textarea
              id="edit-int-notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
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
