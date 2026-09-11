"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Eye, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { ScheduleInterviewModal } from "./ScheduleInterviewModal";
import { EditInterviewModal, InterviewEditRow } from "./EditInterviewModal";
import { DeleteInterviewConfirmationModal } from "./DeleteInterviewConfirmationModal";

type InterviewStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

type InterviewRow = {
  id: string;
  candidate_id: string;
  interviewer: string | null;
  interview_date: string;
  interview_time: string;
  status: InterviewStatus;
  notes: string | null;
  created_at: string;
  candidate_name?: string | null;
  candidate_email?: string | null;
  candidate_position?: string | null;
  interviewer_name?: string | null;
  interviewer_email?: string | null;
};

function formatInterviewDate(dateValue: string) {
  if (!dateValue) return "—";
  const [year, month, day] = dateValue.split("-");
  if (!year || !month || !day) return dateValue;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatInterviewTime(timeValue: string) {
  if (!timeValue) return "—";
  const [hours, minutes] = timeValue.split(":");
  if (!hours || !minutes) return timeValue;
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function InterviewDirectory() {
  const { t, formatDate } = useI18n();
  const { role } = useAuth();
  const canManageInterviews = role === "ADMIN" || role === "HR";

  const directoryRef = useRef<HTMLDivElement>(null);
  const [interviews, setInterviews] = useState<InterviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedInterviewId, setSelectedInterviewId] = useState<string | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<InterviewRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Menus and modals
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingInterview, setEditingInterview] = useState<InterviewRow | null>(null);
  const [deletingInterview, setDeletingInterview] = useState<InterviewRow | null>(null);

  // Close action menu on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (directoryRef.current && !directoryRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const fetchInterviews = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/interviews", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? t.actions.error);
      }

      const rows: InterviewRow[] = Array.isArray(payload.data) ? payload.data : [];
      setInterviews(rows);

      if (rows.length > 0) {
        setSelectedInterviewId((prev) => {
          const match = rows.find((i) => i.id === prev);
          if (match) {
            setSelectedInterview(match);
            return match.id;
          }
          setSelectedInterview(rows[0]);
          return rows[0].id;
        });
      } else {
        setSelectedInterviewId(null);
        setSelectedInterview(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.actions.error);
      setInterviews([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadInterviews = async () => {
      if (!active) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/interviews", { cache: "no-store" });
        const payload = await response.json();

        if (!active) return;

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? t.actions.error);
        }

        const rows: InterviewRow[] = Array.isArray(payload.data) ? payload.data : [];
        setInterviews(rows);

        if (rows.length > 0) {
          setSelectedInterviewId((prev) => {
            const match = rows.find((i) => i.id === prev);
            if (match) {
              setSelectedInterview(match);
              return match.id;
            }
            setSelectedInterview(rows[0]);
            return rows[0].id;
          });
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : t.actions.error);
        setInterviews([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadInterviews();

    return () => {
      active = false;
    };
  }, [t.actions.error]);

  const filteredInterviews = useMemo(() => {
    const query = search.trim().toLowerCase();

    return interviews.filter((interview) => {
      if (statusFilter !== "ALL" && interview.status !== statusFilter) {
        return false;
      }

      if (!query) return true;

      const haystack = [
        interview.candidate_name ?? "",
        interview.candidate_email ?? "",
        interview.candidate_position ?? "",
        interview.interviewer_name ?? "",
        interview.status,
        interview.notes ?? "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [interviews, search, statusFilter]);

  const openInterviewDetail = async (interviewId: string) => {
    setSelectedInterviewId(interviewId);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const response = await fetch(`/api/interviews/${interviewId}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? t.actions.error);
      }

      setSelectedInterview(payload.data as InterviewRow);
    } catch (detailLoadError) {
      setDetailError(detailLoadError instanceof Error ? detailLoadError.message : t.actions.error);
      setSelectedInterview(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedInterviewId(null);
    setSelectedInterview(null);
    setDetailError(null);
  };

  const handleEditSuccess = (updated: InterviewEditRow) => {
    if (selectedInterview && selectedInterview.id === updated.id) {
      setSelectedInterview((prev) => (prev ? { ...prev, ...updated } : null));
    }
    void fetchInterviews();
  };

  const handleDeleteSuccess = (deletedId: string) => {
    if (selectedInterviewId === deletedId) {
      closeDetail();
    }
    void fetchInterviews();
  };

  const getStatusLabel = (status: InterviewRow["status"]) => {
    switch (status) {
      case "SCHEDULED":
        return t.statuses.scheduled;
      case "COMPLETED":
        return t.statuses.completed;
      case "CANCELLED":
        return t.statuses.cancelled;
      default:
        return status;
    }
  };

  return (
    <div className="protected-page-content interviews-page" ref={directoryRef}>
      {/* Header */}
      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">{t.interviews.eyebrow}</p>
          <h1>{t.interviews.title}</h1>
          <p className="muted">{t.interviews.subtitle}</p>
        </div>
        {canManageInterviews ? (
          <button type="button" className="primary-button" onClick={() => setIsScheduleModalOpen(true)}>
            <Plus size={15} /> + {t.interviews.scheduleInterview}
          </button>
        ) : null}
      </div>

      {/* Toolbar & Filters */}
      <div className="employees-toolbar">
        <div className="employees-count">
          <span>{filteredInterviews.length}</span>
          <small>{t.interviews.countLabel}</small>
        </div>

        <div style={{ display: "flex", gap: 12, alignItems: "center", flex: 1, justifyContent: "flex-end" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              background: "var(--input-bg)",
              border: "1px solid var(--input-border)",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 13,
              color: "var(--ink)",
              outline: "none",
            }}
            aria-label="Filter interviews by status"
          >
            <option value="ALL">{t.interviews.allStatuses}</option>
            <option value="SCHEDULED">{t.statuses.scheduled}</option>
            <option value="COMPLETED">{t.statuses.completed}</option>
            <option value="CANCELLED">{t.statuses.cancelled}</option>
          </select>

          <label className="employees-search" style={{ maxWidth: 300 }} aria-label={t.interviews.searchPlaceholder}>
            <Search size={15} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t.interviews.searchPlaceholder}
            />
          </label>
        </div>
      </div>

      {/* Empty / Error / Loading states */}
      {error ? (
        <div className="panel empty-state">
          <UserRound size={24} />
          <p>{error || t.interviews.loadError}</p>
          <button type="button" className="secondary-button" onClick={() => void fetchInterviews()}>
            {t.actions.refresh}
          </button>
        </div>
      ) : loading ? (
        <div className="panel empty-state">
          <Loader2 className="loading-spinner" size={24} />
          <span>{t.actions.loading}</span>
        </div>
      ) : interviews.length === 0 ? (
        <div className="panel empty-state">
          <CalendarDays size={28} />
          <p style={{ fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>{t.interviews.emptyNoRecords}</p>
          <p style={{ margin: "4px 0 16px" }}>{t.interviews.emptyNoRecordsDesc}</p>
          {canManageInterviews ? (
            <button type="button" className="primary-button" onClick={() => setIsScheduleModalOpen(true)}>
              <Plus size={15} /> + {t.interviews.scheduleInterview}
            </button>
          ) : null}
        </div>
      ) : filteredInterviews.length === 0 ? (
        <div className="panel empty-state">
          <Search size={24} />
          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{t.interviews.emptyNoMatch}</p>
          <p style={{ margin: "4px 0 16px" }}>{t.interviews.emptyNoMatchDesc}</p>
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              setSearch("");
              setStatusFilter("ALL");
            }}
          >
            {t.employees.clearSearch}
          </button>
        </div>
      ) : (
        <div className="employees-layout">
          {/* Interview Table List */}
          <div className="panel table-panel interviews-table">
            <div className="table-header">
              <span>{t.interviews.colCandidate}</span>
              <span>{t.interviews.colDate} & {t.interviews.colTime}</span>
              <span>{t.interviews.colInterviewer}</span>
              <span>{t.interviews.colStatus}</span>
              <span style={{ textAlign: "right" }}>{t.interviews.colActions}</span>
            </div>
            <div className="table-body">
              {filteredInterviews.map((interview) => {
                const candidateDisplayName = interview.candidate_name || "Unnamed candidate";
                const interviewerDisplayName = interview.interviewer_name || (interview.interviewer ? "Assigned" : "Unassigned");
                const initials = (candidateDisplayName || "C")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const isSelected = selectedInterviewId === interview.id;

                return (
                  <div
                    tabIndex={0}
                    role="button"
                    className={`table-row ${isSelected ? "selected" : ""}`}
                    key={interview.id}
                    onClick={() => void openInterviewDetail(interview.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        void openInterviewDetail(interview.id);
                      }
                    }}
                  >
                    <div className="cell-person">
                      <div className="avatar avatar-person">{initials}</div>
                      <div>
                        <strong>{candidateDisplayName}</strong>
                        <span>{interview.candidate_email || "No email on file"}</span>
                      </div>
                    </div>
                    <div>
                      <strong>{formatInterviewDate(interview.interview_date)}</strong>
                      <span>{formatInterviewTime(interview.interview_time)}</span>
                    </div>
                    <div>
                      <strong>{interviewerDisplayName}</strong>
                      <span>{interview.interviewer_email || "Recruiting Team"}</span>
                    </div>
                    <div>
                      <span className={`status-chip ${interview.status.toLowerCase()}`}>
                        {getStatusLabel(interview.status)}
                      </span>
                    </div>
                    <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="action-menu-trigger"
                        onClick={() => setActiveMenuId(activeMenuId === interview.id ? null : interview.id)}
                        aria-label={`Actions for ${candidateDisplayName}`}
                        aria-expanded={activeMenuId === interview.id}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeMenuId === interview.id && (
                        <div className="action-dropdown-menu" role="menu">
                          <button
                            type="button"
                            className="action-dropdown-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              void openInterviewDetail(interview.id);
                            }}
                          >
                            <Eye size={14} /> {t.actions.viewDetails}
                          </button>
                          {canManageInterviews && (
                            <>
                              <button
                                type="button"
                                className="action-dropdown-item"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setEditingInterview(interview);
                                }}
                              >
                                <Pencil size={14} /> {t.actions.edit}
                              </button>
                              <button
                                type="button"
                                className="action-dropdown-item danger"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setDeletingInterview(interview);
                                }}
                              >
                                <Trash2 size={14} /> {t.actions.delete}
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Interview Detail Panel */}
          <div className="panel detail-panel">
            {detailLoading ? (
              <div className="empty-state">
                <Loader2 className="loading-spinner" size={20} />
                <span>{t.actions.loading}</span>
              </div>
            ) : selectedInterview ? (
              <>
                <div className="detail-header">
                  <div className="detail-person">
                    <div className="avatar avatar-person" style={{ width: 44, height: 44, fontSize: 14 }}>
                      {(selectedInterview.candidate_name || "C")
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h2>{selectedInterview.candidate_name || "Candidate Interview"}</h2>
                      <p>{selectedInterview.candidate_email || "No email on file"}</p>
                    </div>
                  </div>
                </div>

                <div className="detail-body">
                  {detailError ? <div className="auth-error" style={{ marginBottom: 16 }}>{detailError}</div> : null}

                  <div className="info-grid">
                    <div className="info-item">
                      <label>{t.interviews.candidateLabel}</label>
                      <span>{selectedInterview.candidate_name || "—"}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.interviews.interviewerLabel}</label>
                      <span>{selectedInterview.interviewer_name || (selectedInterview.interviewer ? t.statuses.pending : "—")}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.interviews.dateLabel}</label>
                      <span>{formatDate(selectedInterview.interview_date)}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.interviews.timeLabel}</label>
                      <span>{formatInterviewTime(selectedInterview.interview_time)}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.interviews.statusLabel}</label>
                      <span>
                        <span className={`status-chip ${selectedInterview.status.toLowerCase()}`}>
                          {getStatusLabel(selectedInterview.status)}
                        </span>
                      </span>
                    </div>
                    <div className="info-item">
                      <label>{t.employees.joiningDate}</label>
                      <span>{formatDate(selectedInterview.created_at)}</span>
                    </div>
                    <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                      <label>{t.interviews.notesLabel}</label>
                      <span>{selectedInterview.notes || t.interviews.noNotes}</span>
                    </div>
                  </div>

                  {canManageInterviews && (
                    <div className="detail-actions" style={{ marginTop: 20, display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setEditingInterview(selectedInterview)}
                      >
                        <Pencil size={14} /> {t.interviews.editInterview}
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => setDeletingInterview(selectedInterview)}
                      >
                        <Trash2 size={14} /> {t.interviews.deleteInterview}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <CalendarDays size={24} />
                <p>{t.interviews.emptyNoRecordsDesc}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Schedule Interview Modal */}
      <ScheduleInterviewModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        onSuccess={() => void fetchInterviews()}
      />

      {/* Edit Interview Modal */}
      <EditInterviewModal
        key={editingInterview?.id ?? "edit-int-modal"}
        isOpen={!!editingInterview}
        interview={editingInterview}
        onClose={() => setEditingInterview(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Interview Confirmation Modal */}
      <DeleteInterviewConfirmationModal
        key={deletingInterview?.id ?? "delete-int-modal"}
        isOpen={!!deletingInterview}
        interview={deletingInterview}
        onClose={() => setDeletingInterview(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
