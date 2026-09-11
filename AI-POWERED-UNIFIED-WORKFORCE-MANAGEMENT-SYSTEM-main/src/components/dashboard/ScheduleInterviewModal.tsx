"use client";

import { UserPlus, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onOpenAddCandidate: () => void;
};

type CandidateOption = { id: string; full_name: string; position_applied: string };
type EmployeeOption = { profile_id: string; full_name: string; department: string };

export function ScheduleInterviewModal({ isOpen, onClose, onSuccess, onOpenAddCandidate }: Readonly<Props>) {
  const { t } = useI18n();
  const [candidates, setCandidates] = useState<CandidateOption[]>([]);
  const [interviewers, setInterviewers] = useState<EmployeeOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);

  const [selectedCandidate, setSelectedCandidate] = useState("");
  const [selectedInterviewer, setSelectedInterviewer] = useState("");
  const [interviewDate, setInterviewDate] = useState(new Date().toISOString().split("T")[0]);
  const [interviewTime, setInterviewTime] = useState("10:00");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const fetchOptions = async () => {
      setLoadingOptions(true);
      try {
        const [candRes, empRes] = await Promise.all([
          fetch("/api/candidates"),
          fetch("/api/employees"),
        ]);

        const candData = await candRes.json();
        const empData = await empRes.json();

        if (isMounted) {
          const validCandidates: CandidateOption[] = candData.success && Array.isArray(candData.data)
            ? candData.data.map((item: { id: string; full_name: string; position_applied: string }) => ({
                id: item.id,
                full_name: item.full_name,
                position_applied: item.position_applied,
              }))
            : [];

          const validInterviewers: EmployeeOption[] = empData.success && Array.isArray(empData.data)
            ? empData.data.map((item: { profile_id: string; full_name: string; department: string }) => ({
                profile_id: item.profile_id,
                full_name: item.full_name || "Employee",
                department: item.department,
              }))
            : [];

          setCandidates(validCandidates);
          setInterviewers(validInterviewers);

          if (validCandidates.length > 0) {
            setSelectedCandidate(validCandidates[0].id);
          }
          if (validInterviewers.length > 0) {
            setSelectedInterviewer(validInterviewers[0].profile_id);
          }
        }
      } catch {
        // Handle fetch error silently
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    };

    void fetchOptions();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!selectedCandidate) {
      setError("Please select a candidate.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: selectedCandidate,
          interviewer: selectedInterviewer || null,
          interview_date: interviewDate,
          interview_time: interviewTime,
          notes: notes.trim() || null,
          status: "SCHEDULED",
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.error || "Failed to schedule interview");
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
          <h2>{t.interviews.scheduleModalTitle}</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label={t.actions.cancel}>
            <X size={18} />
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        {loadingOptions ? (
          <div className="auth-loading" style={{ minHeight: "180px" }}>
            <span className="loading-spinner" />
            {t.actions.loading}
          </div>
        ) : candidates.length === 0 ? (
          <div className="empty-modal-state">
            <UserPlus size={32} />
            <p>{t.interviews.emptyNoRecordsDesc}</p>
            <button
              type="button"
              className="primary-button"
              onClick={() => {
                onClose();
                onOpenAddCandidate();
              }}
            >
              + {t.candidates.addCandidate}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-group">
              <label htmlFor="int-candidate">{t.interviews.candidateLabel} *</label>
              <select
                id="int-candidate"
                required
                value={selectedCandidate}
                onChange={(e) => setSelectedCandidate(e.target.value)}
              >
                {candidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} — {c.position_applied}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="int-interviewer">{t.interviews.interviewerLabel}</label>
              <select
                id="int-interviewer"
                value={selectedInterviewer}
                onChange={(e) => setSelectedInterviewer(e.target.value)}
              >
                <option value="">{t.interviews.selectInterviewer}</option>
                {interviewers.map((emp) => (
                  <option key={emp.profile_id} value={emp.profile_id}>
                    {emp.full_name} ({emp.department})
                  </option>
                ))}
              </select>
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
              <label htmlFor="int-notes">{t.interviews.notesLabel}</label>
              <textarea
                id="int-notes"
                rows={3}
                placeholder="Technical interview and system design review..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>
                {t.actions.cancel}
              </button>
              <button type="submit" className="primary-button" disabled={submitting}>
                {submitting ? t.actions.submitting : t.actions.save}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
