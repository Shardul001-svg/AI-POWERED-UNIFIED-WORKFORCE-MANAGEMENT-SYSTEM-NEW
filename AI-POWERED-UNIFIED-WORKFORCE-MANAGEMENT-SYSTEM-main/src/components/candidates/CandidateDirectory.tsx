"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, BriefcaseBusiness, Loader2, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/AuthProvider";

type CandidateStatus = "APPLIED" | "SCREENING" | "INTERVIEW" | "SELECTED" | "REJECTED";

type CandidateRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  position_applied: string;
  experience: number;
  status: CandidateStatus;
  created_at: string;
};

type CandidateFormState = {
  full_name: string;
  email: string;
  phone: string;
  position_applied: string;
  experience: number;
  status: CandidateStatus;
};

const candidateStatusOptions: CandidateStatus[] = ["APPLIED", "SCREENING", "INTERVIEW", "SELECTED", "REJECTED"];

const emptyForm: CandidateFormState = {
  full_name: "",
  email: "",
  phone: "",
  position_applied: "",
  experience: 0,
  status: "APPLIED",
};

export function CandidateDirectory() {
  const router = useRouter();
  const { role } = useAuth();
  const canManageCandidates = role === "ADMIN" || role === "HR";

  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [formState, setFormState] = useState<CandidateFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchCandidates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/candidates", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load candidates.");
      }

      const rows = Array.isArray(payload.data) ? payload.data : [];
      setCandidates(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load candidates.");
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadCandidates = async () => {
      if (!active) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/candidates", { cache: "no-store" });
        const payload = await response.json();

        if (!active) {
          return;
        }

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load candidates.");
        }

        setCandidates(Array.isArray(payload.data) ? payload.data : []);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load candidates.");
        setCandidates([]);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadCandidates();

    return () => {
      active = false;
    };
  }, []);

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return candidates;
    }

    return candidates.filter((candidate) => {
      const haystack = [candidate.full_name, candidate.email, candidate.position_applied, candidate.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [candidates, search]);

  const openAddModal = () => {
    setFormState(emptyForm);
    setFormError(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openCandidateDetail = async (candidateId: string) => {
    setSelectedCandidateId(candidateId);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const response = await fetch(`/api/candidates/${candidateId}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load candidate details.");
      }

      setSelectedCandidate(payload.data as CandidateRow);
    } catch (detailLoadError) {
      setDetailError(detailLoadError instanceof Error ? detailLoadError.message : "Unable to load candidate details.");
      setSelectedCandidate(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedCandidateId(null);
    setSelectedCandidate(null);
    setDetailError(null);
    setIsEditing(false);
  };

  const handleCreateCandidate = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const missing = [formState.full_name, formState.email, formState.position_applied, formState.experience].some((value) => {
      if (typeof value === "number") {
        return Number.isNaN(value) || value < 0;
      }

      return !String(value).trim();
    });

    if (missing) {
      setFormError("Full name, email, position, and experience are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: formState.full_name,
          email: formState.email,
          phone: formState.phone || null,
          position_applied: formState.position_applied,
          experience: Number(formState.experience),
          status: formState.status,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to create candidate.");
      }

      setIsModalOpen(false);
      setFormState(emptyForm);
      await fetchCandidates();
      setSelectedCandidateId(null);
      setSelectedCandidate(null);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Unable to create candidate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCandidate = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!selectedCandidate) {
      return;
    }

    event.preventDefault();

    setIsSubmitting(true);
    setDetailError(null);

    try {
      const response = await fetch(`/api/candidates/${selectedCandidate.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: selectedCandidate.full_name,
          email: selectedCandidate.email,
          phone: selectedCandidate.phone,
          position_applied: selectedCandidate.position_applied,
          experience: Number(selectedCandidate.experience),
          status: selectedCandidate.status,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to update candidate.");
      }

      setIsEditing(false);
      await openCandidateDetail(selectedCandidate.id);
      await fetchCandidates();
    } catch (updateError) {
      setDetailError(updateError instanceof Error ? updateError.message : "Unable to update candidate.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCandidate = async () => {
    if (!selectedCandidate || !canManageCandidates) {
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedCandidate.full_name}?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/candidates/${selectedCandidate.id}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to delete candidate.");
      }

      closeDetail();
      await fetchCandidates();
    } catch (deleteError) {
      setDetailError(deleteError instanceof Error ? deleteError.message : "Unable to delete candidate.");
    }
  };

  return (
    <div className="protected-page-content candidates-page">
      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">Recruitment</p>
          <h1>Candidates</h1>
          <p className="muted">Talent pipeline and hiring pipeline from first application to final decision.</p>
        </div>
        {canManageCandidates ? (
          <button type="button" className="primary-button" onClick={openAddModal}>
            <Plus size={15} /> Add Candidate
          </button>
        ) : null}
      </div>

      <div className="employees-toolbar">
        <div className="employees-count">
          <span>{filteredCandidates.length}</span>
          <small>candidates</small>
        </div>

        <label className="employees-search" aria-label="Search candidates">
          <Search size={15} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search candidates"
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
          <span>Loading candidates...</span>
        </div>
      ) : filteredCandidates.length === 0 ? (
        <div className="panel empty-panel">
          <UserRound size={18} />
          <span>No candidates match your search.</span>
        </div>
      ) : (
        <div className="employees-layout">
          <div className="panel table-panel">
            <div className="table-header">
              <span>Name</span>
              <span>Position</span>
              <span>Status</span>
              <span>Experience</span>
            </div>
            <div className="table-body">
              {filteredCandidates.map((candidate) => (
                <button
                  type="button"
                  className={`employee-row ${selectedCandidateId === candidate.id ? "active" : ""}`}
                  key={candidate.id}
                  onClick={() => void openCandidateDetail(candidate.id)}
                >
                  <span className="employee-name-block">
                    <strong>{candidate.full_name}</strong>
                    <small>{candidate.email}</small>
                  </span>
                  <span>{candidate.position_applied}</span>
                  <span>
                    <span className={`status-pill ${candidate.status.toLowerCase()}`}>
                      {candidate.status}
                    </span>
                  </span>
                  <span>{candidate.experience} yrs</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel detail-panel">
            {detailLoading ? (
              <div className="detail-loading">
                <Loader2 className="loading-spinner" size={18} />
                <span>Loading candidate...</span>
              </div>
            ) : selectedCandidate ? (
              <>
                <div className="detail-header">
                  <div>
                    <p className="eyebrow">Candidate profile</p>
                    <h2>{selectedCandidate.full_name}</h2>
                  </div>
                  {canManageCandidates ? (
                    <div className="detail-actions">
                      <button type="button" className="secondary-button" onClick={() => setIsEditing((open) => !open)}>
                        <Pencil size={14} /> {isEditing ? "Close" : "Edit"}
                      </button>
                      <button type="button" className="danger-button" onClick={handleDeleteCandidate}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  ) : null}
                </div>

                {detailError ? <div className="panel-warning detail-warning"><p>{detailError}</p></div> : null}

                {isEditing ? (
                  <form className="employee-form" onSubmit={handleUpdateCandidate}>
                    <div className="field-row">
                      <label>
                        Full name
                        <input value={selectedCandidate.full_name} onChange={(event) => setSelectedCandidate({ ...selectedCandidate, full_name: event.target.value })} />
                      </label>
                      <label>
                        Email
                        <input type="email" value={selectedCandidate.email} onChange={(event) => setSelectedCandidate({ ...selectedCandidate, email: event.target.value })} />
                      </label>
                    </div>

                    <div className="field-row">
                      <label>
                        Phone
                        <input value={selectedCandidate.phone ?? ""} onChange={(event) => setSelectedCandidate({ ...selectedCandidate, phone: event.target.value || null })} />
                      </label>
                      <label>
                        Status
                        <select value={selectedCandidate.status} onChange={(event) => setSelectedCandidate({ ...selectedCandidate, status: event.target.value as CandidateStatus })}>
                          {candidateStatusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="field-row">
                      <label>
                        Position applied
                        <input value={selectedCandidate.position_applied} onChange={(event) => setSelectedCandidate({ ...selectedCandidate, position_applied: event.target.value })} />
                      </label>
                      <label>
                        Experience (years)
                        <input type="number" min={0} value={selectedCandidate.experience} onChange={(event) => setSelectedCandidate({ ...selectedCandidate, experience: Number(event.target.value) })} />
                      </label>
                    </div>

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
                      <span className="detail-label">Email</span>
                      <strong>{selectedCandidate.email}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Phone</span>
                      <strong>{selectedCandidate.phone || "Not provided"}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Position applied</span>
                      <strong>{selectedCandidate.position_applied}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Experience</span>
                      <strong>{selectedCandidate.experience} years</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Status</span>
                      <strong>{selectedCandidate.status}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Application date</span>
                      <strong>{new Date(selectedCandidate.created_at).toLocaleDateString()}</strong>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="detail-empty">
                <BriefcaseBusiness size={18} />
                <p>Select a candidate to view details.</p>
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
                <p className="eyebrow">Create candidate</p>
                <h3>Add candidate</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)} aria-label="Close dialog">
                ×
              </button>
            </div>

            <form className="employee-form" onSubmit={handleCreateCandidate}>
              {formError ? <div className="panel-warning"><p>{formError}</p></div> : null}

              <div className="field-row">
                <label>
                  Full name
                  <input value={formState.full_name} onChange={(event) => setFormState({ ...formState, full_name: event.target.value })} placeholder="Jane Doe" />
                </label>
                <label>
                  Email
                  <input type="email" value={formState.email} onChange={(event) => setFormState({ ...formState, email: event.target.value })} placeholder="jane@example.com" />
                </label>
              </div>

              <div className="field-row">
                <label>
                  Phone
                  <input value={formState.phone} onChange={(event) => setFormState({ ...formState, phone: event.target.value })} placeholder="+1 555 123 4567" />
                </label>
                <label>
                  Status
                  <select value={formState.status} onChange={(event) => setFormState({ ...formState, status: event.target.value as CandidateStatus })}>
                    {candidateStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="field-row">
                <label>
                  Position applied
                  <input value={formState.position_applied} onChange={(event) => setFormState({ ...formState, position_applied: event.target.value })} placeholder="Operations Manager" />
                </label>
                <label>
                  Experience (years)
                  <input type="number" min={0} value={formState.experience} onChange={(event) => setFormState({ ...formState, experience: Number(event.target.value) })} />
                </label>
              </div>

              <div className="detail-footer modal-footer">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Create candidate"}
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
