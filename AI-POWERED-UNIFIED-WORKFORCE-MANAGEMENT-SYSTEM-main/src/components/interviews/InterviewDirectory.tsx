"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, CalendarDays, Loader2, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/AuthProvider";

type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

type CandidateOption = {
  id: string;
  full_name: string;
  email: string;
  position_applied: string;
};

type InterviewerOption = {
  id: string;
  full_name: string;
  email: string;
  position: string;
  department: string;
};

type InterviewRow = {
  id: string;
  candidate_id: string;
  interviewer: string | null;
  interview_date: string;
  interview_time: string;
  status: InterviewStatus;
  notes: string | null;
  created_at: string;
};

type InterviewFormState = {
  candidate_id: string;
  interviewer: string;
  interview_date: string;
  interview_time: string;
  status: InterviewStatus;
  notes: string;
};

const interviewStatusOptions: InterviewStatus[] = ["SCHEDULED", "COMPLETED", "CANCELLED"];

const emptyForm: InterviewFormState = {
  candidate_id: "",
  interviewer: "",
  interview_date: "",
  interview_time: "",
  status: "SCHEDULED",
  notes: "",
};

function formatInterviewDate(dateValue: string) {
  if (!dateValue) {
    return "—";
  }

  const [year, month, day] = dateValue.split("-");

  if (!year || !month || !day) {
    return dateValue;
  }

  const date = new Date(Number(year), Number(month) - 1, Number(day));

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatInterviewTime(timeValue: string) {
  if (!timeValue) {
    return "—";
  }

  const [hours, minutes] = timeValue.split(":");

  if (!hours || !minutes) {
    return timeValue;
  }

  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function InterviewDirectory() {
  const router = useRouter();
  const { role } = useAuth();
  const canManageInterviews = role === "ADMIN" || role === "HR";

  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [candidateOptions, setCandidateOptions] = useState<CandidateOption[]>([]);
  const [interviewerOptions, setInterviewerOptions] = useState<InterviewerOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<InterviewRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formState, setFormState] = useState<InterviewFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchInterviews = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/interviews", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load interviews.");
      }

      setInterviews(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load interviews.");
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  const loadReferenceOptions = async () => {
    const [candidateResponse, employeeResponse] = await Promise.all([
      fetch("/api/candidates", { cache: "no-store" }),
      fetch("/api/employees", { cache: "no-store" }),
    ]);

    const candidatePayload = candidateResponse.ok ? await candidateResponse.json() : null;
    const employeePayload = employeeResponse.ok ? await employeeResponse.json() : null;

    const nextCandidates = Array.isArray(candidatePayload?.data) ? candidatePayload.data : [];
    setCandidateOptions(nextCandidates.map((candidate: Partial<CandidateOption>) => ({
      id: candidate.id ?? "",
      full_name: candidate.full_name ?? "Unknown candidate",
      email: candidate.email ?? "",
      position_applied: candidate.position_applied ?? "",
    })));

    const nextEmployees = Array.isArray(employeePayload?.data) ? employeePayload.data : [];
    setInterviewerOptions(nextEmployees.map((employee: Partial<InterviewerOption & { profile_id?: string; profiles?: { full_name?: string | null; email?: string | null } }>) => ({
      id: employee.profile_id ?? employee.id ?? "",
      full_name: employee.full_name ?? employee.profiles?.full_name ?? "Unknown interviewer",
      email: employee.email ?? employee.profiles?.email ?? "",
      position: employee.position ?? "",
      department: employee.department ?? "",
    })));
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) {
        return;
      }

      try {
        const [interviewResponse, candidateResponse, employeeResponse] = await Promise.all([
          fetch("/api/interviews", { cache: "no-store" }),
          fetch("/api/candidates", { cache: "no-store" }),
          fetch("/api/employees", { cache: "no-store" }),
        ]);

        if (!active) {
          return;
        }

        const interviewPayload = await interviewResponse.json();
        const candidatePayload = candidateResponse.ok ? await candidateResponse.json() : null;
        const employeePayload = employeeResponse.ok ? await employeeResponse.json() : null;

        if (!interviewResponse.ok || !interviewPayload.success) {
          throw new Error(interviewPayload.message ?? "Unable to load interviews.");
        }

        setInterviews(Array.isArray(interviewPayload.data) ? interviewPayload.data : []);
        setCandidateOptions(Array.isArray(candidatePayload?.data) ? candidatePayload.data.map((candidate: Partial<CandidateOption>) => ({
          id: candidate.id ?? "",
          full_name: candidate.full_name ?? "Unknown candidate",
          email: candidate.email ?? "",
          position_applied: candidate.position_applied ?? "",
        })) : []);
        setInterviewerOptions(Array.isArray(employeePayload?.data) ? employeePayload.data.map((employee: Partial<InterviewerOption & { profile_id?: string; profiles?: { full_name?: string | null; email?: string | null } }>) => ({
          id: employee.profile_id ?? employee.id ?? "",
          full_name: employee.full_name ?? employee.profiles?.full_name ?? "Unknown interviewer",
          email: employee.email ?? employee.profiles?.email ?? "",
          position: employee.position ?? "",
          department: employee.department ?? "",
        })) : []);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load interviews.");
        setInterviews([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filteredInterviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return interviews;
    }

    return interviews.filter((interview) => {
      const candidateMatch = candidateOptions.find((candidate) => candidate.id === interview.candidate_id);
      const interviewerMatch = interviewerOptions.find((interviewer) => interviewer.id === interview.interviewer);
      const haystack = [
        candidateMatch?.full_name ?? "",
        candidateMatch?.email ?? "",
        interviewerMatch?.full_name ?? "",
        interviewerMatch?.department ?? "",
        interview.status,
        interview.notes ?? "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [candidateOptions, interviewerOptions, interviews, search]);

  const openAddModal = () => {
    setFormState(emptyForm);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openInterviewDetail = async (interviewId: string) => {
    setSelectedInterviewId(interviewId);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const response = await fetch(`/api/interviews/${interviewId}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load interview details.");
      }

      setSelectedInterview(payload.data as InterviewRow);
    } catch (loadError) {
      setDetailError(loadError instanceof Error ? loadError.message : "Unable to load interview details.");
      setSelectedInterview(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedInterviewId(null);
    setSelectedInterview(null);
    setDetailError(null);
    setIsEditing(false);
  };

  const handleCreateInterview = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const missing = [formState.candidate_id, formState.interview_date, formState.interview_time].some((value) => !String(value).trim());

    if (missing) {
      setFormError("Candidate, interview date, and interview time are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: formState.candidate_id,
          interviewer: formState.interviewer || undefined,
          interview_date: formState.interview_date,
          interview_time: formState.interview_time,
          status: formState.status,
          notes: formState.notes.trim() || null,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to create interview.");
      }

      setIsModalOpen(false);
      setFormState(emptyForm);
      await fetchInterviews();
      await loadReferenceOptions();
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Unable to create interview.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInterview = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!selectedInterview) {
      return;
    }

    event.preventDefault();

    setIsSubmitting(true);
    setDetailError(null);

    try {
      const response = await fetch(`/api/interviews/${selectedInterview.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interview_date: selectedInterview.interview_date,
          interview_time: selectedInterview.interview_time,
          interviewer: selectedInterview.interviewer,
          status: selectedInterview.status,
          notes: selectedInterview.notes ?? null,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to update interview.");
      }

      setIsEditing(false);
      await openInterviewDetail(selectedInterview.id);
      await fetchInterviews();
    } catch (updateError) {
      setDetailError(updateError instanceof Error ? updateError.message : "Unable to update interview.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInterview = async () => {
    if (!selectedInterview || !canManageInterviews) {
      return;
    }

    const confirmed = window.confirm(`Delete interview for ${candidateOptions.find((candidate) => candidate.id === selectedInterview.candidate_id)?.full_name ?? "selected candidate"}?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/interviews/${selectedInterview.id}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to delete interview.");
      }

      closeDetail();
      await fetchInterviews();
    } catch (deleteError) {
      setDetailError(deleteError instanceof Error ? deleteError.message : "Unable to delete interview.");
    }
  };

  const interviewCount = filteredInterviews.length;

  return (
    <div className="protected-page-content interviews-page">
      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">Recruitment</p>
          <h1>Interviews</h1>
          <p className="muted">Candidate conversations, scheduling, and follow-up coordination across the hiring pipeline.</p>
        </div>
        {canManageInterviews ? (
          <button type="button" className="primary-button" onClick={openAddModal}>
            <Plus size={15} /> Schedule Interview
          </button>
        ) : null}
      </div>

      <div className="interview-toolbar">
        <div className="employees-count">
          <span>{interviewCount}</span>
          <small>upcoming</small>
        </div>

        <label className="employees-search" aria-label="Search interviews">
          <Search size={15} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidate or interviewer"
          />
        </label>
      </div>

      {error ? (
        <div className="panel panel-warning">
          <p>{error}</p>
        </div>
      ) : null}

      {loading ? (
        <div className="panel empty-panel">
          <Loader2 className="loading-spinner" size={18} />
          <span>Loading interviews...</span>
        </div>
      ) : interviewCount === 0 ? (
        <div className="panel empty-panel">
          <CalendarDays size={18} />
          <span>No interviews scheduled yet.</span>
        </div>
      ) : (
        <div className="employees-layout">
          <div className="panel table-panel">
            <div className="table-header interview-table-header">
              <span>Candidate</span>
              <span>Date</span>
              <span>Interviewer</span>
              <span>Status</span>
            </div>
            <div className="table-body">
              {filteredInterviews.map((interview) => {
                const candidateMatch = candidateOptions.find((candidate) => candidate.id === interview.candidate_id);
                const interviewerMatch = interviewerOptions.find((interviewer) => interviewer.id === interview.interviewer);

                return (
                  <button
                    type="button"
                    key={interview.id}
                    className={`employee-row ${selectedInterviewId === interview.id ? "active" : ""}`}
                    onClick={() => void openInterviewDetail(interview.id)}
                  >
                    <span className="employee-name-block">
                      <strong>{candidateMatch?.full_name ?? interview.candidate_id}</strong>
                      <small>{candidateMatch?.position_applied ?? "Candidate profile"}</small>
                    </span>
                    <span>
                      <strong className="inline-date">{formatInterviewDate(interview.interview_date)}</strong>
                      <small>{formatInterviewTime(interview.interview_time)}</small>
                    </span>
                    <span>
                      <strong>{interviewerMatch?.full_name ?? (interview.interviewer ? "Assigned" : "Unassigned")}</strong>
                      <small>{interviewerMatch?.position ?? "Recruiting team"}</small>
                    </span>
                    <span>
                      <span className={`status-pill ${interview.status.toLowerCase()}`}>
                        {interview.status}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="panel detail-panel">
            {detailLoading ? (
              <div className="detail-loading">
                <Loader2 className="loading-spinner" size={18} />
                <span>Loading interview...</span>
              </div>
            ) : selectedInterview ? (
              <>
                <div className="detail-header">
                  <div>
                    <p className="eyebrow">Interview summary</p>
                    <h2>{candidateOptions.find((candidate) => candidate.id === selectedInterview.candidate_id)?.full_name ?? "Candidate interview"}</h2>
                  </div>
                  {canManageInterviews ? (
                    <div className="detail-actions">
                      <button type="button" className="secondary-button" onClick={() => setIsEditing((open) => !open)}>
                        <Pencil size={14} /> {isEditing ? "Close" : "Edit"}
                      </button>
                      <button type="button" className="danger-button" onClick={handleDeleteInterview}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  ) : null}
                </div>

                {detailError ? <div className="panel-warning detail-warning"><p>{detailError}</p></div> : null}

                {isEditing ? (
                  <form className="employee-form" onSubmit={handleUpdateInterview}>
                    <div className="field-row">
                      <label>
                        Interview date
                        <input type="date" value={selectedInterview.interview_date} onChange={(event) => setSelectedInterview({ ...selectedInterview, interview_date: event.target.value })} />
                      </label>
                      <label>
                        Interview time
                        <input type="time" value={selectedInterview.interview_time} onChange={(event) => setSelectedInterview({ ...selectedInterview, interview_time: event.target.value })} />
                      </label>
                    </div>

                    <div className="field-row">
                      <label>
                        Interviewer
                        <select value={selectedInterview.interviewer ?? ""} onChange={(event) => setSelectedInterview({ ...selectedInterview, interviewer: event.target.value || null })}>
                          <option value="">Unassigned</option>
                          {interviewerOptions.map((interviewer) => (
                            <option key={interviewer.id} value={interviewer.id}>{interviewer.full_name}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Status
                        <select value={selectedInterview.status} onChange={(event) => setSelectedInterview({ ...selectedInterview, status: event.target.value as InterviewStatus })}>
                          {interviewStatusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label>
                      Notes
                      <textarea value={selectedInterview.notes ?? ""} onChange={(event) => setSelectedInterview({ ...selectedInterview, notes: event.target.value || null })} rows={5} />
                    </label>

                    <div className="detail-footer">
                      <button type="button" className="secondary-button" onClick={() => setIsEditing(false)}>
                        Cancel
                      </button>
                      <button type="submit" className="primary-button" disabled={isSubmitting}>
                        {isSubmitting ? "Saving..." : "Save changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="employee-detail-grid">
                    <div className="detail-stat">
                      <span className="detail-label">Candidate</span>
                      <strong>{candidateOptions.find((candidate) => candidate.id === selectedInterview.candidate_id)?.full_name ?? selectedInterview.candidate_id}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Interviewer</span>
                      <strong>{interviewerOptions.find((interviewer) => interviewer.id === selectedInterview.interviewer)?.full_name ?? (selectedInterview.interviewer ? "Assigned" : "Unassigned")}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Date</span>
                      <strong>{formatInterviewDate(selectedInterview.interview_date)}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Time</span>
                      <strong>{formatInterviewTime(selectedInterview.interview_time)}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Status</span>
                      <strong>{selectedInterview.status}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Created</span>
                      <strong>{new Date(selectedInterview.created_at).toLocaleDateString()}</strong>
                    </div>
                    <div className="detail-stat detail-stat-wide">
                      <span className="detail-label">Notes</span>
                      <strong>{selectedInterview.notes || "No notes recorded."}</strong>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="detail-empty">
                <BriefcaseBusiness size={18} />
                <p>Select an interview to view details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen ? (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="eyebrow">Scheduling</p>
                <h3>Schedule interview</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)} aria-label="Close dialog">
                ×
              </button>
            </div>

            {candidateOptions.length === 0 && interviewerOptions.length === 0 ? (
              <div className="panel-warning">
                <p>No candidate or interviewer records are available yet. Add real candidates and employees in their modules before creating an interview.</p>
              </div>
            ) : null}

            <form className="employee-form" onSubmit={handleCreateInterview}>
              {formError ? <div className="panel-warning"><p>{formError}</p></div> : null}

              <div className="field-row">
                <label>
                  Candidate
                  <select value={formState.candidate_id} onChange={(event) => setFormState({ ...formState, candidate_id: event.target.value })} disabled={candidateOptions.length === 0}>
                    <option value="">Select candidate</option>
                    {candidateOptions.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>{candidate.full_name}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Interviewer
                  <select value={formState.interviewer} onChange={(event) => setFormState({ ...formState, interviewer: event.target.value })} disabled={interviewerOptions.length === 0}>
                    <option value="">Use current user</option>
                    {interviewerOptions.map((interviewer) => (
                      <option key={interviewer.id} value={interviewer.id}>{interviewer.full_name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="field-row">
                <label>
                  Interview date
                  <input type="date" value={formState.interview_date} onChange={(event) => setFormState({ ...formState, interview_date: event.target.value })} />
                </label>
                <label>
                  Interview time
                  <input type="time" value={formState.interview_time} onChange={(event) => setFormState({ ...formState, interview_time: event.target.value })} />
                </label>
              </div>

              <div className="field-row">
                <label>
                  Status
                  <select value={formState.status} onChange={(event) => setFormState({ ...formState, status: event.target.value as InterviewStatus })}>
                    {interviewStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Notes
                  <input value={formState.notes} onChange={(event) => setFormState({ ...formState, notes: event.target.value })} placeholder="Optional notes" />
                </label>
              </div>

              <div className="detail-footer modal-footer">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isSubmitting || candidateOptions.length === 0}>
                  {isSubmitting ? "Scheduling..." : "Create interview"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <button type="button" className="back-to-dashboard" onClick={() => router.push("/dashboard")}>
        <ArrowUpRight size={14} /> Back to dashboard
      </button>
    </div>
  );
}
