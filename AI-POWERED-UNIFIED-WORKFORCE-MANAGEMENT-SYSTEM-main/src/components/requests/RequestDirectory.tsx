"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleDashed, Loader2, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";

type RequestType = "LEAVE" | "HR_QUERY" | "DOCUMENT" | "OTHER";
type RequestStatus = "PENDING" | "APPROVED" | "REJECTED" | "COMPLETED";

type RequestRow = {
  id: string;
  employee_id: string;
  type: RequestType;
  title: string;
  description: string | null;
  status: RequestStatus;
  created_at: string;
  updated_at: string;
  employee_name?: string | null;
  employee_email?: string | null;
  employee_code?: string | null;
  employee_department?: string | null;
  employee_position?: string | null;
};

type RequestFormState = {
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  employee_id: string;
};

const requestTypeOptions: RequestType[] = ["LEAVE", "HR_QUERY", "DOCUMENT", "OTHER"];
const requestStatusOptions: RequestStatus[] = ["PENDING", "APPROVED", "REJECTED", "COMPLETED"];

const emptyForm: RequestFormState = {
  type: "LEAVE",
  title: "",
  description: "",
  status: "PENDING",
  employee_id: "",
};

function formatRequestDate(value: string) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function RequestDirectory() {
  const { role } = useAuth();
  const canManageRequests = role === "ADMIN" || role === "HR";

  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [employees, setEmployees] = useState<Array<{ id: string; full_name: string; email: string; department: string; position: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [formState, setFormState] = useState<RequestFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/requests", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load requests.");
      }

      const rows = Array.isArray(payload.data) ? payload.data : [];
      setRequests(rows);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load requests.");
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!active) {
        return;
      }

      try {
        const [requestsResponse, employeesResponse] = await Promise.all([
          fetch("/api/requests", { cache: "no-store" }),
          fetch("/api/employees", { cache: "no-store" }),
        ]);

        const requestPayload = await requestsResponse.json();
        const employeePayload = employeesResponse.ok ? await employeesResponse.json() : null;

        if (!active) {
          return;
        }

        if (!requestsResponse.ok || !requestPayload.success) {
          throw new Error(requestPayload.message ?? "Unable to load requests.");
        }

        setRequests(Array.isArray(requestPayload.data) ? requestPayload.data : []);
        setEmployees(Array.isArray(employeePayload?.data) ? employeePayload.data.map((employee: Partial<{ id: string; full_name: string; email: string; department: string; position: string }>) => ({
          id: employee.id ?? "",
          full_name: employee.full_name ?? "Unknown employee",
          email: employee.email ?? "",
          department: employee.department ?? "",
          position: employee.position ?? "",
        })) : []);
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load requests.");
        setRequests([]);
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

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return requests;
    }

    return requests.filter((request) => {
      const employee = employees.find((entry) => entry.id === request.employee_id);
      const haystack = [
        request.title,
        request.type,
        request.status,
        request.description ?? "",
        employee?.full_name ?? request.employee_name ?? "",
        employee?.email ?? request.employee_email ?? "",
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [employees, requests, search]);

  const visibleRequests = filteredRequests;

  const openAddModal = () => {
    setFormState({ ...emptyForm, employee_id: canManageRequests ? "" : "" });
    setFormError(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openRequestDetail = async (requestId: string) => {
    setSelectedRequestId(requestId);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const response = await fetch(`/api/requests/${requestId}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load request details.");
      }

      setSelectedRequest(payload.data as RequestRow);
    } catch (detailLoadError) {
      setDetailError(detailLoadError instanceof Error ? detailLoadError.message : "Unable to load request details.");
      setSelectedRequest(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedRequestId(null);
    setSelectedRequest(null);
    setDetailError(null);
    setIsEditing(false);
  };

  const handleCreateRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.title.trim() || !formState.type) {
      setFormError("Title and type are required.");
      return;
    }

    if (!canManageRequests && !formState.employee_id) {
      setFormError("Employee reference is required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: formState.type,
          title: formState.title,
          description: formState.description || null,
          status: formState.status,
          employee_id: formState.employee_id || undefined,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to create request.");
      }

      setIsModalOpen(false);
      setFormState(emptyForm);
      await fetchRequests();
      setSelectedRequestId(null);
      setSelectedRequest(null);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Unable to create request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRequest = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!selectedRequest) {
      return;
    }

    event.preventDefault();

    setIsSubmitting(true);
    setDetailError(null);

    try {
      const response = await fetch(`/api/requests/${selectedRequest.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: selectedRequest.type,
          title: selectedRequest.title,
          description: selectedRequest.description,
          status: selectedRequest.status,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to update request.");
      }

      setIsEditing(false);
      await openRequestDetail(selectedRequest.id);
      await fetchRequests();
    } catch (updateError) {
      setDetailError(updateError instanceof Error ? updateError.message : "Unable to update request.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!selectedRequest || !canManageRequests) {
      return;
    }

    const confirmed = window.confirm(`Delete request ${selectedRequest.title}?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/requests/${selectedRequest.id}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to delete request.");
      }

      closeDetail();
      await fetchRequests();
    } catch (deleteError) {
      setDetailError(deleteError instanceof Error ? deleteError.message : "Unable to delete request.");
    }
  };

  return (
    <div className="protected-page-content requests-page">
      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Requests</h1>
          <p className="muted">Track employee leave, HR questions, documents, and service requests.</p>
        </div>
        <button type="button" className="primary-button" onClick={openAddModal}>
          <Plus size={15} /> New request
        </button>
      </div>

      <div className="employees-toolbar">
        <div className="employees-count">
          <span>{visibleRequests.length}</span>
          <small>requests</small>
        </div>

        <label className="employees-search" aria-label="Search requests">
          <Search size={15} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search requests"
          />
        </label>
      </div>

      {error ? <div className="panel panel-warning"><p>{error}</p></div> : null}

      {loading ? (
        <div className="panel empty-panel">
          <Loader2 className="loading-spinner" size={18} />
          <span>Loading requests...</span>
        </div>
      ) : visibleRequests.length === 0 ? (
        <div className="panel empty-panel">
          <CircleDashed size={18} />
          <span>No requests match your search.</span>
        </div>
      ) : (
        <div className="employees-layout">
          <div className="panel table-panel">
            <div className="table-header">
              <span>Request</span>
              <span>Employee</span>
              <span>Type</span>
              <span>Status</span>
            </div>
            <div className="table-body">
              {visibleRequests.map((request) => (
                <button
                  type="button"
                  className={`employee-row ${selectedRequestId === request.id ? "active" : ""}`}
                  key={request.id}
                  onClick={() => void openRequestDetail(request.id)}
                >
                  <span className="employee-name-block">
                    <strong>{request.title}</strong>
                    <small>{formatRequestDate(request.created_at)}</small>
                  </span>
                  <span>{request.employee_name ?? request.employee_email ?? "Unknown employee"}</span>
                  <span>{request.type}</span>
                  <span>
                    <span className={`status-pill ${request.status === "PENDING" ? "neutral" : request.status === "APPROVED" ? "active" : request.status === "REJECTED" ? "inactive" : "neutral"}`}>
                      {request.status}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel detail-panel">
            {detailLoading ? (
              <div className="detail-loading">
                <Loader2 className="loading-spinner" size={18} />
                <span>Loading request...</span>
              </div>
            ) : selectedRequest ? (
              <>
                <div className="detail-header">
                  <div>
                    <p className="eyebrow">Request detail</p>
                    <h2>{selectedRequest.title}</h2>
                  </div>
                  {canManageRequests ? (
                    <div className="detail-actions">
                      <button type="button" className="secondary-button" onClick={() => setIsEditing((open) => !open)}>
                        <Pencil size={14} /> {isEditing ? "Close" : "Edit"}
                      </button>
                      <button type="button" className="danger-button" onClick={handleDeleteRequest}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  ) : null}
                </div>

                {detailError ? <div className="panel-warning detail-warning"><p>{detailError}</p></div> : null}

                {isEditing ? (
                  <form className="employee-form" onSubmit={handleUpdateRequest}>
                    <div className="field-row">
                      <label>
                        Type
                        <select value={selectedRequest.type} onChange={(event) => setSelectedRequest({ ...selectedRequest, type: event.target.value as RequestType })}>
                          {requestTypeOptions.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Status
                        <select value={selectedRequest.status} onChange={(event) => setSelectedRequest({ ...selectedRequest, status: event.target.value as RequestStatus })}>
                          {requestStatusOptions.map((value) => (
                            <option key={value} value={value}>{value}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="field-row">
                      <label>
                        Title
                        <input value={selectedRequest.title} onChange={(event) => setSelectedRequest({ ...selectedRequest, title: event.target.value })} />
                      </label>
                    </div>

                    <div className="field-row">
                      <label>
                        Description
                        <textarea value={selectedRequest.description ?? ""} onChange={(event) => setSelectedRequest({ ...selectedRequest, description: event.target.value || null })} rows={4} />
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
                      <span className="detail-label">Employee</span>
                      <strong>{selectedRequest.employee_name ?? "Unknown employee"}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Employee code</span>
                      <strong>{selectedRequest.employee_code ?? "—"}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Department</span>
                      <strong>{selectedRequest.employee_department ?? "—"}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Position</span>
                      <strong>{selectedRequest.employee_position ?? "—"}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Type</span>
                      <strong>{selectedRequest.type}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Status</span>
                      <strong>{selectedRequest.status}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Created at</span>
                      <strong>{formatRequestDate(selectedRequest.created_at)}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Updated at</span>
                      <strong>{formatRequestDate(selectedRequest.updated_at)}</strong>
                    </div>
                    <div className="detail-stat detail-stat-wide">
                      <span className="detail-label">Description</span>
                      <strong>{selectedRequest.description || "No description provided."}</strong>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="panel empty-panel">
                <UserRound size={18} />
                <span>Select a request to view details.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {isModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-card">
            <div className="modal-header">
              <div>
                <p className="eyebrow">Create request</p>
                <h3>New request</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form className="employee-form" onSubmit={handleCreateRequest}>
              <div className="field-row">
                <label>
                  Type
                  <select value={formState.type} onChange={(event) => setFormState({ ...formState, type: event.target.value as RequestType })}>
                    {requestTypeOptions.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Status
                  <select value={formState.status} onChange={(event) => setFormState({ ...formState, status: event.target.value as RequestStatus })}>
                    {requestStatusOptions.map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="field-row">
                <label>
                  Title
                  <input value={formState.title} onChange={(event) => setFormState({ ...formState, title: event.target.value })} />
                </label>
              </div>

              {canManageRequests ? (
                <div className="field-row">
                  <label>
                    Employee
                    <select value={formState.employee_id} onChange={(event) => setFormState({ ...formState, employee_id: event.target.value })}>
                      <option value="">Select employee</option>
                      {employees.map((employee) => (
                        <option key={employee.id} value={employee.id}>{employee.full_name} ({employee.department})</option>
                      ))}
                    </select>
                  </label>
                </div>
              ) : null}

              <div className="field-row">
                <label>
                  Description
                  <textarea value={formState.description} onChange={(event) => setFormState({ ...formState, description: event.target.value })} rows={4} />
                </label>
              </div>

              {formError ? <div className="panel-warning detail-warning"><p>{formError}</p></div> : null}

              <div className="detail-footer">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting ? "Creating..." : "Create request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
