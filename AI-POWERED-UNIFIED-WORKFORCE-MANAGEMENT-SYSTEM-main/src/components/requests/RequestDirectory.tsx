"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays, CheckCircle2, CircleDashed, Eye,
  FileText, Loader2, MoreHorizontal, Pencil,
  Plus, Search, Trash2, XCircle,
} from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { CreateRequestModal, RequestStatus, RequestType, TYPE_LABELS } from "./CreateRequestModal";
import { EditRequestModal, RequestEditRow } from "./EditRequestModal";
import { DeleteRequestModal } from "./DeleteRequestModal";

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

function getLocalizedType(type: RequestType, t: ReturnType<typeof useI18n>["t"]) {
  switch (type) {
    case "LEAVE": return t.requests.typeLeave;
    case "HR_QUERY": return t.requests.typeHrQuery;
    case "DOCUMENT": return t.requests.typeDocument;
    case "OTHER": return t.requests.typeOther;
    default: return type;
  }
}

function getStatusLabel(status: RequestStatus, t: ReturnType<typeof useI18n>["t"]) {
  switch (status) {
    case "PENDING": return t.statuses.pending;
    case "APPROVED": return t.statuses.approved;
    case "REJECTED": return t.statuses.rejected;
    case "COMPLETED": return t.statuses.completed;
    default: return status;
  }
}

function getStatusClass(status: RequestStatus) {
  switch (status) {
    case "PENDING": return "pending";
    case "APPROVED": return "approved";
    case "REJECTED": return "rejected";
    case "COMPLETED": return "completed";
    default: return "";
  }
}

function getInitials(name: string | null | undefined) {
  if (!name) return "R";
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function RequestDirectory() {
  const { t, formatDate } = useI18n();
  const { role } = useAuth();
  const canManageRequests = role === "ADMIN" || role === "HR";
  const directoryRef = useRef<HTMLDivElement>(null);

  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [typeFilter, setTypeFilter] = useState<string>("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<RequestRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingRequest, setEditingRequest] = useState<RequestEditRow | null>(null);
  const [deletingRequest, setDeletingRequest] = useState<RequestEditRow | null>(null);

  // Close menu on outside click or Escape
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (directoryRef.current && !directoryRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveMenuId(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/requests", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message ?? t.actions.error);
      const rows: RequestRow[] = Array.isArray(payload.data) ? payload.data : [];
      setRequests(rows);
      if (rows.length > 0) {
        setSelectedRequestId((prev) => {
          const match = rows.find((r) => r.id === prev);
          if (match) { setSelectedRequest(match); return match.id; }
          setSelectedRequest(rows[0]); return rows[0].id;
        });
      } else {
        setSelectedRequestId(null); setSelectedRequest(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : t.actions.error);
      setRequests([]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!active) return;
      setLoading(true); setError(null);
      try {
        const response = await fetch("/api/requests", { cache: "no-store" });
        const payload = await response.json();
        if (!active) return;
        if (!response.ok || !payload.success) throw new Error(payload.message ?? t.actions.error);
        const rows: RequestRow[] = Array.isArray(payload.data) ? payload.data : [];
        setRequests(rows);
        if (rows.length > 0) {
          setSelectedRequestId((prev) => {
            const match = rows.find((r) => r.id === prev);
            if (match) { setSelectedRequest(match); return match.id; }
            setSelectedRequest(rows[0]); return rows[0].id;
          });
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : t.actions.error);
        setRequests([]);
      } finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [t.actions.error]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== "ALL" && r.status !== statusFilter) return false;
      if (typeFilter !== "ALL" && r.type !== typeFilter) return false;
      if (!query) return true;
      const haystack = [r.title, r.type, r.status, r.description ?? "", r.employee_name ?? "", r.employee_email ?? "", r.employee_department ?? ""]
        .filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [requests, search, statusFilter, typeFilter]);

  // Derived metrics
  const metrics = useMemo(() => ({
    total: requests.length,
    pending: requests.filter((r) => r.status === "PENDING").length,
    approved: requests.filter((r) => r.status === "APPROVED").length,
    completed: requests.filter((r) => r.status === "COMPLETED").length,
  }), [requests]);

  const openRequestDetail = async (requestId: string) => {
    setSelectedRequestId(requestId);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const response = await fetch(`/api/requests/${requestId}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.success) throw new Error(payload.message ?? t.actions.error);
      setSelectedRequest(payload.data as RequestRow);
    } catch (detailLoadError) {
      setDetailError(detailLoadError instanceof Error ? detailLoadError.message : t.actions.error);
      setSelectedRequest(null);
    } finally { setDetailLoading(false); }
  };

  const closeDetail = () => {
    setSelectedRequestId(null); setSelectedRequest(null); setDetailError(null);
  };

  const handleEditSuccess = (updated: RequestEditRow) => {
    if (selectedRequest?.id === updated.id) {
      setSelectedRequest((prev) => prev ? { ...prev, ...updated } : null);
    }
    void fetchRequests();
  };

  const handleDeleteSuccess = (deletedId: string) => {
    if (selectedRequestId === deletedId) closeDetail();
    void fetchRequests();
  };

  const clearFilters = () => { setSearch(""); setStatusFilter("ALL"); setTypeFilter("ALL"); };

  return (
    <div className="protected-page-content requests-page" ref={directoryRef}>
      {/* Header */}
      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">{t.requests.eyebrow}</p>
          <h1>{t.requests.title}</h1>
          <p className="muted">{t.requests.subtitle}</p>
        </div>
        <button type="button" id="open-create-request-btn" className="primary-button" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={15} /> + {t.requests.createRequest}
        </button>
      </div>

      {/* Metrics */}
      {!loading && !error && (
        <div className="metric-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
          <div className="metric-card">
            <div className="metric-icon blue"><FileText size={16} /></div>
            <span className="metric-label">{t.requests.title}</span>
            <strong>{metrics.total}</strong>
          </div>
          <div className="metric-card">
            <div className="metric-icon yellow"><CircleDashed size={16} /></div>
            <span className="metric-label">{t.statuses.pending}</span>
            <strong>{metrics.pending}</strong>
          </div>
          <div className="metric-card">
            <div className="metric-icon teal"><CheckCircle2 size={16} /></div>
            <span className="metric-label">{t.statuses.approved}</span>
            <strong>{metrics.approved}</strong>
          </div>
          <div className="metric-card">
            <div className="metric-icon coral"><XCircle size={16} /></div>
            <span className="metric-label">{t.statuses.completed}</span>
            <strong>{metrics.completed}</strong>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="employees-toolbar">
        <div className="employees-count">
          <span>{filteredRequests.length}</span>
          <small>{t.requests.countLabel}</small>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--ink)", outline: "none" }}
            aria-label={t.requests.typeLabel}
          >
            <option value="ALL">{t.requests.allTypes}</option>
            {(Object.keys(TYPE_LABELS) as RequestType[]).map((v) => (
              <option key={v} value={v}>{getLocalizedType(v, t)}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--ink)", outline: "none" }}
            aria-label={t.requests.statusLabel}
          >
            <option value="ALL">{t.requests.allStatuses}</option>
            <option value="PENDING">{t.statuses.pending}</option>
            <option value="APPROVED">{t.statuses.approved}</option>
            <option value="REJECTED">{t.statuses.rejected}</option>
            <option value="COMPLETED">{t.statuses.completed}</option>
          </select>
          <label className="employees-search" style={{ maxWidth: 300 }} aria-label={t.requests.searchPlaceholder}>
            <Search size={15} />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t.requests.searchPlaceholder}
            />
          </label>
        </div>
      </div>

      {/* States */}
      {error ? (
        <div className="panel empty-state">
          <FileText size={24} />
          <p>{error || t.requests.loadError}</p>
          <button type="button" className="secondary-button" onClick={() => void fetchRequests()}>{t.actions.refresh}</button>
        </div>
      ) : loading ? (
        <div className="panel empty-state">
          <Loader2 className="loading-spinner" size={24} />
          <span>{t.actions.loading}</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="panel empty-state">
          <CalendarDays size={28} />
          <p style={{ fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>{t.requests.emptyNoRecords}</p>
          <p style={{ margin: "4px 0 16px" }}>{t.requests.emptyNoRecordsDesc}</p>
          <button type="button" id="empty-create-request-btn" className="primary-button" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={15} /> + {t.requests.createRequest}
          </button>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="panel empty-state">
          <Search size={24} />
          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{t.requests.emptyNoMatch}</p>
          <p style={{ margin: "4px 0 16px" }}>{t.requests.emptyNoMatchDesc}</p>
          <button type="button" className="secondary-button" onClick={clearFilters}>{t.employees.clearSearch}</button>
        </div>
      ) : (
        <div className="employees-layout">
          {/* Request Table */}
          <div className="panel table-panel requests-table">
            <div className="table-header">
              <span>{t.requests.colRequest}</span>
              <span>{t.requests.colEmployee}</span>
              <span>{t.requests.colType}</span>
              <span>{t.requests.colStatus}</span>
              <span style={{ textAlign: "right" }}>{t.requests.colActions}</span>
            </div>
            <div className="table-body">
              {filteredRequests.map((request) => {
                const displayName = request.employee_name || "Unknown employee";
                const initials = getInitials(displayName);
                const isSelected = selectedRequestId === request.id;
                return (
                  <div
                    tabIndex={0}
                    role="button"
                    className={`table-row ${isSelected ? "selected" : ""}`}
                    key={request.id}
                    onClick={() => void openRequestDetail(request.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") void openRequestDetail(request.id); }}
                  >
                    <div className="cell-person">
                      <div className="avatar avatar-person">{initials}</div>
                      <div>
                        <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{request.title}</strong>
                        <span>{formatDate(request.created_at)}</span>
                      </div>
                    </div>
                    <div>
                      <strong>{displayName}</strong>
                      <span>{request.employee_department || request.employee_email || "—"}</span>
                    </div>
                    <div>
                      <span className={`status-chip req-type-${request.type.toLowerCase().replace("_", "-")}`}>
                        {getLocalizedType(request.type, t)}
                      </span>
                    </div>
                    <div>
                      <span className={`status-chip ${getStatusClass(request.status)}`}>
                        {getStatusLabel(request.status, t)}
                      </span>
                    </div>
                    <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="action-menu-trigger"
                        onClick={() => setActiveMenuId(activeMenuId === request.id ? null : request.id)}
                        aria-label={`Actions for ${request.title}`}
                        aria-expanded={activeMenuId === request.id}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {activeMenuId === request.id && (
                        <div className="action-dropdown-menu" role="menu">
                          <button
                            type="button"
                            className="action-dropdown-item"
                            onClick={() => { setActiveMenuId(null); void openRequestDetail(request.id); }}
                          >
                            <Eye size={14} /> {t.actions.viewDetails}
                          </button>
                          <button
                            type="button"
                            className="action-dropdown-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              setEditingRequest({
                                id: request.id, type: request.type, title: request.title,
                                description: request.description, status: request.status,
                                employee_name: request.employee_name,
                              });
                            }}
                          >
                            <Pencil size={14} /> {t.actions.edit}
                          </button>
                          {canManageRequests && (
                            <button
                              type="button"
                              className="action-dropdown-item danger"
                              onClick={() => {
                                setActiveMenuId(null);
                                setDeletingRequest({
                                  id: request.id, type: request.type, title: request.title,
                                  description: request.description, status: request.status,
                                  employee_name: request.employee_name,
                                });
                              }}
                            >
                              <Trash2 size={14} /> {t.actions.delete}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Detail Panel */}
          <div className="panel detail-panel">
            {detailLoading ? (
              <div className="empty-state">
                <Loader2 className="loading-spinner" size={20} />
                <span>{t.actions.loading}</span>
              </div>
            ) : selectedRequest ? (
              <>
                <div className="detail-header">
                  <div className="detail-person">
                    <div className="avatar avatar-person" style={{ width: 44, height: 44, fontSize: 14 }}>
                      {getInitials(selectedRequest.employee_name)}
                    </div>
                    <div>
                      <h2 style={{ fontSize: 18, margin: 0, overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {selectedRequest.title}
                      </h2>
                      <p>{selectedRequest.employee_name || "Unknown employee"}</p>
                    </div>
                  </div>
                </div>

                <div className="detail-body">
                  {detailError && <div className="auth-error" style={{ marginBottom: 16 }}>{detailError}</div>}
                  <div className="info-grid">
                    <div className="info-item">
                      <label>{t.requests.employeeLabel}</label>
                      <span>{selectedRequest.employee_name || "—"}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.employees.department}</label>
                      <span>{selectedRequest.employee_department || "—"}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.requests.typeLabel}</label>
                      <span>
                        <span className={`status-chip req-type-${selectedRequest.type.toLowerCase().replace("_", "-")}`}>
                          {getLocalizedType(selectedRequest.type, t)}
                        </span>
                      </span>
                    </div>
                    <div className="info-item">
                      <label>{t.requests.statusLabel}</label>
                      <span>
                        <span className={`status-chip ${getStatusClass(selectedRequest.status)}`}>
                          {getStatusLabel(selectedRequest.status, t)}
                        </span>
                      </span>
                    </div>
                    <div className="info-item">
                      <label>{t.requests.colCreated}</label>
                      <span>{formatDate(selectedRequest.created_at)}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.employees.joiningDate}</label>
                      <span>{formatDate(selectedRequest.updated_at)}</span>
                    </div>
                    <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                      <label>{t.requests.descriptionLabel}</label>
                      <span>{selectedRequest.description || t.interviews.noNotes}</span>
                    </div>
                  </div>

                  <div className="detail-actions" style={{ marginTop: 20, display: "flex", gap: 10 }}>
                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => setEditingRequest({
                        id: selectedRequest.id, type: selectedRequest.type,
                        title: selectedRequest.title, description: selectedRequest.description,
                        status: selectedRequest.status, employee_name: selectedRequest.employee_name,
                      })}
                    >
                      <Pencil size={14} /> {t.requests.editRequest}
                    </button>
                    {canManageRequests && (
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => setDeletingRequest({
                          id: selectedRequest.id, type: selectedRequest.type,
                          title: selectedRequest.title, description: selectedRequest.description,
                          status: selectedRequest.status, employee_name: selectedRequest.employee_name,
                        })}
                      >
                        <Trash2 size={14} /> {t.requests.deleteRequest}
                      </button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <FileText size={24} />
                <p>{t.requests.emptyNoRecordsDesc}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateRequestModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => void fetchRequests()}
      />
      <EditRequestModal
        key={editingRequest?.id ?? "edit-req-modal"}
        isOpen={!!editingRequest}
        request={editingRequest}
        onClose={() => setEditingRequest(null)}
        onSuccess={handleEditSuccess}
      />
      <DeleteRequestModal
        key={deletingRequest?.id ?? "delete-req-modal"}
        isOpen={!!deletingRequest}
        request={deletingRequest}
        onClose={() => setDeletingRequest(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
