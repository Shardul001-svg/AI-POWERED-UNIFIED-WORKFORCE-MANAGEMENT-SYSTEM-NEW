"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { BriefcaseBusiness, Eye, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { AddCandidateModal } from "./AddCandidateModal";
import { CandidateEditRow, EditCandidateModal } from "./EditCandidateModal";
import { DeleteCandidateConfirmationModal } from "./DeleteCandidateConfirmationModal";

type CandidateRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position_applied: string;
  experience: number;
  status: "APPLIED" | "SCREENING" | "INTERVIEW" | "SELECTED" | "REJECTED";
  created_at: string;
};

export function CandidateDirectory() {
  const { t, formatDate } = useI18n();
  const { role } = useAuth();
  const canManageCandidates = role === "ADMIN" || role === "HR";

  const directoryRef = useRef<HTMLDivElement>(null);
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Menus and modals
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingCandidate, setEditingCandidate] = useState<CandidateRow | null>(null);
  const [deletingCandidate, setDeletingCandidate] = useState<CandidateRow | null>(null);

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

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/candidates", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? t.actions.error);
      }

      const rows: CandidateRow[] = Array.isArray(payload.data) ? payload.data : [];
      setCandidates(rows);

      if (rows.length > 0) {
        setSelectedCandidateId((prev) => {
          const match = rows.find((c) => c.id === prev);
          if (match) {
            setSelectedCandidate(match);
            return match.id;
          }
          setSelectedCandidate(rows[0]);
          return rows[0].id;
        });
      } else {
        setSelectedCandidateId(null);
        setSelectedCandidate(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.actions.error);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadCandidates = async () => {
      if (!active) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/candidates", { cache: "no-store" });
        const payload = await response.json();

        if (!active) return;

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? t.actions.error);
        }

        const rows: CandidateRow[] = Array.isArray(payload.data) ? payload.data : [];
        setCandidates(rows);

        if (rows.length > 0) {
          setSelectedCandidateId((prev) => {
            const match = rows.find((c) => c.id === prev);
            if (match) {
              setSelectedCandidate(match);
              return match.id;
            }
            setSelectedCandidate(rows[0]);
            return rows[0].id;
          });
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : t.actions.error);
        setCandidates([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadCandidates();

    return () => {
      active = false;
    };
  }, [t.actions.error]);

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      const haystack = [
        candidate.full_name,
        candidate.email,
        candidate.position_applied,
        candidate.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [candidates, search]);

  const openCandidateDetail = async (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const response = await fetch(`/api/candidates/${candidateId}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? t.actions.error);
      }

      setSelectedCandidate(payload.data as CandidateRow);
    } catch (detailLoadError) {
      setDetailError(detailLoadError instanceof Error ? detailLoadError.message : t.actions.error);
      setSelectedCandidate(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedCandidateId(null);
    setSelectedCandidate(null);
    setDetailError(null);
  };

  const handleEditSuccess = (updated: CandidateEditRow) => {
    if (selectedCandidate && selectedCandidate.id === updated.id) {
      setSelectedCandidate((prev) => (prev ? { ...prev, ...updated } : null));
    }
    void fetchCandidates();
  };

  const handleDeleteSuccess = (deletedId: string) => {
    if (selectedCandidateId === deletedId) {
      closeDetail();
    }
    void fetchCandidates();
  };

  const getStatusLabel = (status: CandidateRow["status"]) => {
    switch (status) {
      case "APPLIED":
        return t.statuses.applied;
      case "SCREENING":
        return t.statuses.screening;
      case "INTERVIEW":
        return t.statuses.interview;
      case "SELECTED":
        return t.statuses.selected;
      case "REJECTED":
        return t.statuses.rejected;
      default:
        return status;
    }
  };

  return (
    <div className="protected-page-content employees-page" ref={directoryRef}>
      {/* Header */}
      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">{t.candidates.eyebrow}</p>
          <h1>{t.pages.candidatesTitle}</h1>
          <p className="muted">{t.pages.candidatesSubtitle}</p>
        </div>
        {canManageCandidates ? (
          <button type="button" className="primary-button" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={15} /> {t.candidates.addCandidate}
          </button>
        ) : null}
      </div>

      {/* Summary & Toolbar */}
      <div className="employees-toolbar">
        <div className="employees-count">
          <span>{filteredCandidates.length}</span>
          <small>{t.candidates.countLabel}</small>
        </div>

        <label className="employees-search" aria-label={t.candidates.searchPlaceholder}>
          <Search size={15} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder={t.candidates.searchPlaceholder}
          />
        </label>
      </div>

      {/* Empty / Loading / Error states */}
      {error ? (
        <div className="panel empty-state">
          <UserRound size={24} />
          <p>{error || t.candidates.loadError}</p>
          <button type="button" className="secondary-button" onClick={() => void fetchCandidates()}>
            {t.actions.refresh}
          </button>
        </div>
      ) : loading ? (
        <div className="panel empty-state">
          <Loader2 className="loading-spinner" size={24} />
          <span>{t.actions.loading}</span>
        </div>
      ) : candidates.length === 0 ? (
        <div className="panel empty-state">
          <UserRound size={28} />
          <p style={{ fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>{t.candidates.emptyNoRecords}</p>
          <p style={{ margin: "4px 0 16px" }}>{t.candidates.emptyNoRecordsDesc}</p>
          {canManageCandidates ? (
            <button type="button" className="primary-button" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={15} /> {t.candidates.addCandidate}
            </button>
          ) : null}
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="panel empty-state">
          <Search size={24} />
          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{t.candidates.emptyNoMatch}</p>
          <p style={{ margin: "4px 0 16px" }}>{t.candidates.emptyNoMatchDesc}</p>
          <button type="button" className="secondary-button" onClick={() => setSearch("")}>
            {t.employees.clearSearch}
          </button>
        </div>
      ) : (
        <div className="employees-layout">
          {/* Candidate Table List */}
          <div className="panel table-panel candidates-table">
            <div className="table-header">
              <span>{t.candidates.colCandidate}</span>
              <span>{t.candidates.colAppliedRole}</span>
              <span>{t.candidates.colExperience}</span>
              <span>{t.candidates.colStatus}</span>
              <span style={{ textAlign: "right" }}>{t.candidates.colActions}</span>
            </div>
            <div className="table-body">
              {filteredCandidates.map((candidate) => {
                const initials = (candidate.full_name || candidate.email || "C")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const isSelected = selectedCandidateId === candidate.id;

                return (
                  <div
                    tabIndex={0}
                    role="button"
                    className={`table-row ${isSelected ? "selected" : ""}`}
                    key={candidate.id}
                    onClick={() => void openCandidateDetail(candidate.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        void openCandidateDetail(candidate.id);
                      }
                    }}
                  >
                    <div className="cell-person">
                      <div className="avatar avatar-person">{initials}</div>
                      <div>
                        <strong>{candidate.full_name}</strong>
                        <span>{candidate.email}</span>
                      </div>
                    </div>
                    <span>{candidate.position_applied}</span>
                    <span>{candidate.experience} {t.candidates.yearsUnit}</span>
                    <div>
                      <span className={`status-chip ${candidate.status.toLowerCase()}`}>
                        {getStatusLabel(candidate.status)}
                      </span>
                    </div>
                    <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="action-menu-trigger"
                        onClick={() => setActiveMenuId(activeMenuId === candidate.id ? null : candidate.id)}
                        aria-label={t.candidates.colActions}
                        aria-expanded={activeMenuId === candidate.id}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeMenuId === candidate.id && (
                        <div className="action-dropdown-menu" role="menu">
                          <button
                            type="button"
                            className="action-dropdown-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              void openCandidateDetail(candidate.id);
                            }}
                          >
                            <Eye size={14} /> {t.actions.viewDetails}
                          </button>
                          {canManageCandidates && (
                            <>
                              <button
                                type="button"
                                className="action-dropdown-item"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setEditingCandidate(candidate);
                                }}
                              >
                                <Pencil size={14} /> {t.actions.edit}
                              </button>
                              <button
                                type="button"
                                className="action-dropdown-item danger"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setDeletingCandidate(candidate);
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

          {/* Selected Candidate Detail Panel */}
          <div className="panel detail-panel">
            {detailLoading ? (
              <div className="empty-state">
                <Loader2 className="loading-spinner" size={20} />
                <span>{t.actions.loading}</span>
              </div>
            ) : selectedCandidate ? (
              <>
                <div className="detail-header">
                  <div className="detail-person">
                    <div className="avatar avatar-person" style={{ width: 44, height: 44, fontSize: 14 }}>
                      {(selectedCandidate.full_name || selectedCandidate.email || "C")
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h2>{selectedCandidate.full_name}</h2>
                      <p>{selectedCandidate.email}</p>
                    </div>
                  </div>
                </div>

                <div className="detail-body">
                  {detailError ? <div className="auth-error" style={{ marginBottom: 16 }}>{detailError}</div> : null}

                  <div className="info-grid">
                    <div className="info-item">
                      <label>{t.candidates.positionApplied}</label>
                      <span>{selectedCandidate.position_applied}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.candidates.colStatus}</label>
                      <span>
                        <span className={`status-chip ${selectedCandidate.status.toLowerCase()}`}>
                          {getStatusLabel(selectedCandidate.status)}
                        </span>
                      </span>
                    </div>
                    <div className="info-item">
                      <label>{t.candidates.colExperience}</label>
                      <span>{selectedCandidate.experience} {t.candidates.yearsUnit}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.candidates.phone}</label>
                      <span>{selectedCandidate.phone || "—"}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.candidates.emailAddress}</label>
                      <span>{selectedCandidate.email}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.candidates.appliedOn}</label>
                      <span>{formatDate(selectedCandidate.created_at)}</span>
                    </div>
                  </div>

                  {canManageCandidates && (
                    <div className="detail-actions" style={{ marginTop: 20, display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setEditingCandidate(selectedCandidate)}
                      >
                        <Pencil size={14} /> {t.actions.edit}
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => setDeletingCandidate(selectedCandidate)}
                      >
                        <Trash2 size={14} /> {t.actions.delete}
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <BriefcaseBusiness size={24} />
                <p>{t.actions.noData}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => void fetchCandidates()}
      />

      {/* Edit Candidate Modal */}
      <EditCandidateModal
        key={editingCandidate?.id ?? "edit-cand-modal"}
        isOpen={!!editingCandidate}
        candidate={editingCandidate}
        onClose={() => setEditingCandidate(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Candidate Confirmation Modal */}
      <DeleteCandidateConfirmationModal
        key={deletingCandidate?.id ?? "delete-cand-modal"}
        isOpen={!!deletingCandidate}
        candidate={deletingCandidate}
        onClose={() => setDeletingCandidate(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
