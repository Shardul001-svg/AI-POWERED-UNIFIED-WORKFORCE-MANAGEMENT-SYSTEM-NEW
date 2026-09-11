"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";
import { useI18n } from "@/lib/i18n/I18nProvider";

export type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export type CandidateOption = {
  id: string;
  full_name: string;
  email: string;
  position_applied: string;
};

export type InterviewerOption = {
  id: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function ScheduleInterviewModal({ isOpen, onClose, onSuccess }: Readonly<Props>) {
  const { t } = useI18n();

  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [interviewers, setInterviewers] = useState<InterviewerOption[]>([]);
  const [loadingRefs, setLoadingRefs] = useState(false);

  const [candidateId, setCandidateId] = useState("");
  const [interviewerId, setInterviewerId] = useState("");
  const [interviewDate, setInterviewDate] = useState(new Date().toISOString().split("T")[0]);
  const [interviewTime, setInterviewTime] = useState("10:00");
  const [status, setStatus] = useState<InterviewStatus>("SCHEDULED");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadOptions = async () => {
      if (!isOpen) return;
      setLoadingRefs(true);
      setError(null);

      try {
        const [candRes, empRes] = await Promise.all([
          fetch("/api/candidates", { cache: "no-store" }),
          fetch("/api/employees", { cache: "no-store" }),
        ]);

        if (!active) return;

        const candPayload = candRes.ok ? await candRes.json() : null;
        const empPayload = empRes.ok ? await empRes.json() : null;

        const candList: CandidateOption[] = Array.isArray(candPayload?.data)
          ? candPayload.data.map((c: Partial<CandidateOption>) => ({
              id: c.id ?? "",
              full_name: c.full_name ?? "Unknown candidate",
              email: c.email ?? "",
              position_applied: c.position_applied ?? "",
            }))
          : [];

        const empList: InterviewerOption[] = Array.isArray(empPayload?.data)
          ? empPayload.data.map((e: Partial<InterviewerOption & { profile_id?: string; profiles?: { full_name?: string | null; email?: string | null } }>) => ({
              id: e.profile_id ?? e.id ?? "",
              full_name: e.full_name ?? e.profiles?.full_name ?? "Unknown interviewer",
              email: e.email ?? e.profiles?.email ?? "",
              position: e.position ?? "",
              department: e.department ?? "",
            }))
          : [];

        setCandidates(candList);
        setInterviewers(empList);

        if (candList.length > 0 && !candidateId) {
          setCandidateId(candList[0].id);
        }
        if (empList.length > 0 && !interviewerId) {
          setInterviewerId(empList[0].id);
        }
      } catch (err: unknown) {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Failed to load reference options.");
      } finally {
        if (active) setLoadingRefs(false);
      }
    };

    void loadOptions();

    return () => {
      active = false;
    };
  }, [isOpen, candidateId, interviewerId]);

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

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!candidateId) {
      setError("Please select a candidate.");
      return;
    }
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
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidateId,
          interviewer: interviewerId || undefined,
          interview_date: interviewDate,
          interview_time: interviewTime,
          status,
          notes: notes.trim() || null,
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.message || payload.error || "Failed to schedule interview");
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
    <div className="modal-overlay" onClick={onClose} role="presentation">
      <div className="modal-container" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>+ {t.interviews.scheduleModalTitle}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t.actions.cancel}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        {candidates.length === 0 && !loadingRefs ? (
          <div className="auth-error" style={{ marginBottom: 16, background: "var(--yellow-light)", color: "var(--yellow)" }}>
            {t.interviews.emptyNoRecordsDesc}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="int-candidate">{t.interviews.candidateLabel} *</label>
            {loadingRefs ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, fontSize: 13, color: "var(--muted)" }}>
                <Loader2 className="loading-spinner" size={14} /> {t.actions.loading}
              </div>
            ) : (
              <select
                id="int-candidate"
                required
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                disabled={candidates.length === 0}
              >
                {candidates.length === 0 ? (
                  <option value="">{t.candidates.emptyNoRecords}</option>
                ) : (
                  candidates.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name} ({c.position_applied})
                    </option>
                  ))
                )}
              </select>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="int-interviewer">{t.interviews.interviewerLabel}</label>
            {loadingRefs ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, fontSize: 13, color: "var(--muted)" }}>
                <Loader2 className="loading-spinner" size={14} /> {t.actions.loading}
              </div>
            ) : (
              <select
                id="int-interviewer"
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
              <label htmlFor="int-date">{t.interviews.dateLabel} *</label>
              <input
                id="int-date"
                type="date"
                required
                value={interviewDate}
                onChange={(e) => setInterviewDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="int-time">{t.interviews.timeLabel} *</label>
              <input
                id="int-time"
                type="time"
                required
                value={interviewTime}
                onChange={(e) => setInterviewTime(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="int-status">{t.interviews.statusLabel} *</label>
            <select
              id="int-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as InterviewStatus)}
            >
              <option value="SCHEDULED">{t.statuses.scheduled}</option>
              <option value="COMPLETED">{t.statuses.completed}</option>
              <option value="CANCELLED">{t.statuses.cancelled}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="int-notes">{t.interviews.notesLabel}</label>
            <textarea
              id="int-notes"
              rows={3}
              placeholder="e.g. Technical coding assessment & system design discussion"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>
              {t.actions.cancel}
            </button>
            <button type="submit" className="primary-button" disabled={submitting || candidates.length === 0}>
              {submitting ? (
                <>
                  <Loader2 className="loading-spinner" size={14} /> {t.actions.saving}
                </>
              ) : (
                `+ ${t.interviews.scheduleInterview}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
