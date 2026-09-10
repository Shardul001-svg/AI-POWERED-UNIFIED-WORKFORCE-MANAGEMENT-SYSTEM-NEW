"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Eye, Loader2, MoreHorizontal, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";

import { AddEmployeeModal } from "@/components/dashboard/AddEmployeeModal";
import { useAuth } from "@/lib/auth/AuthProvider";
import { EditEmployeeModal, EmployeeEditRow } from "./EditEmployeeModal";
import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

type EmployeeProfileSummary = {
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
};

type EmployeeRow = {
  id: string;
  profile_id: string;
  employee_code: string;
  phone: string | null;
  department: string;
  position: string;
  joining_date: string;
  status: "ACTIVE" | "INACTIVE";
  created_at: string;
  profiles?: EmployeeProfileSummary | null;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
};

function normalizeEmployee(row: Partial<EmployeeRow>): EmployeeRow {
  const profile = row.profiles ?? {};

  return {
    id: row.id ?? "",
    profile_id: row.profile_id ?? "",
    employee_code: row.employee_code ?? "",
    phone: row.phone ?? null,
    department: row.department ?? "",
    position: row.position ?? "",
    joining_date: row.joining_date ?? "",
    status: (row.status as "ACTIVE" | "INACTIVE") ?? "ACTIVE",
    created_at: row.created_at ?? new Date().toISOString(),
    profiles: profile,
    full_name: row.full_name ?? profile.full_name ?? null,
    email: row.email ?? profile.email ?? null,
    role: row.role ?? profile.role ?? null,
  };
}

export function EmployeeDirectory() {
  const { role } = useAuth();
  const canManageEmployees = role === "ADMIN" || role === "HR";

  const directoryRef = useRef<HTMLDivElement>(null);
  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  // Modals and action menus
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<EmployeeRow | null>(null);

  // Dismiss action menu on outside click or Escape
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

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/employees", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load employees.");
      }

      const rows = Array.isArray(payload.data) ? payload.data : [];
      const normalized = rows.map((row: Partial<EmployeeRow>) => normalizeEmployee(row));
      setEmployees(normalized);

      // Keep selection or select first employee
      if (normalized.length > 0) {
        setSelectedEmployeeId((prev) => {
          const match = normalized.find((e: EmployeeRow) => e.id === prev);
          if (match) {
            setSelectedEmployee(match);
            return match.id;
          }
          setSelectedEmployee(normalized[0]);
          return normalized[0].id;
        });
      } else {
        setSelectedEmployeeId(null);
        setSelectedEmployee(null);
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load employees.");
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;

    const loadEmployees = async () => {
      if (!active) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/employees", { cache: "no-store" });
        const payload = await response.json();

        if (!active) return;

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load employees.");
        }

        const rows = Array.isArray(payload.data) ? payload.data : [];
        const normalized = rows.map((row: Partial<EmployeeRow>) => normalizeEmployee(row));
        setEmployees(normalized);

        if (normalized.length > 0) {
          setSelectedEmployeeId((prev) => {
            const match = normalized.find((e: EmployeeRow) => e.id === prev);
            if (match) {
              setSelectedEmployee(match);
              return match.id;
            }
            setSelectedEmployee(normalized[0]);
            return normalized[0].id;
          });
        }
      } catch (loadError) {
        if (!active) return;
        setError(loadError instanceof Error ? loadError.message : "Unable to load employees.");
        setEmployees([]);
      } finally {
        if (active) setLoading(false);
      }
    };

    void loadEmployees();

    return () => {
      active = false;
    };
  }, []);

  const filteredEmployees = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return employees;
    }

    return employees.filter((employee) => {
      const haystack = [
        employee.full_name,
        employee.email,
        employee.department,
        employee.position,
        employee.employee_code,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [employees, search]);

  const openEmployeeDetail = async (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const response = await fetch(`/api/employees/${employeeId}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load employee details.");
      }

      const row = normalizeEmployee(payload.data as Partial<EmployeeRow>);
      setSelectedEmployee(row);
    } catch (detailLoadError) {
      setDetailError(detailLoadError instanceof Error ? detailLoadError.message : "Unable to load employee details.");
      setSelectedEmployee(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedEmployeeId(null);
    setSelectedEmployee(null);
    setDetailError(null);
  };

  const handleEditSuccess = (updated: EmployeeEditRow) => {
    if (selectedEmployee && selectedEmployee.id === updated.id) {
      setSelectedEmployee((prev) => (prev ? { ...prev, ...updated } : null));
    }
    void fetchEmployees();
  };

  const handleDeleteSuccess = (deletedId: string) => {
    if (selectedEmployeeId === deletedId) {
      closeDetail();
    }
    void fetchEmployees();
  };

  return (
    <div className="protected-page-content employees-page" ref={directoryRef}>
      {/* Header */}
      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">Workforce</p>
          <h1>Employees</h1>
          <p className="muted">People directory for the current workforce and hiring operations.</p>
        </div>
        {canManageEmployees ? (
          <button type="button" className="primary-button" onClick={() => setIsAddModalOpen(true)}>
            <Plus size={15} /> Add Employee
          </button>
        ) : null}
      </div>

      {/* Toolbar */}
      <div className="employees-toolbar">
        <div className="employees-count">
          <span>{filteredEmployees.length}</span>
          <small>employees</small>
        </div>

        <label className="employees-search" aria-label="Search employees">
          <Search size={15} />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search employees by name, email, department, code..."
          />
        </label>
      </div>

      {/* Empty / Error / Loading states */}
      {error ? (
        <div className="panel empty-state">
          <UserRound size={24} />
          <p>{error || "Unable to load employees."}</p>
          <button type="button" className="secondary-button" onClick={() => void fetchEmployees()}>
            Retry
          </button>
        </div>
      ) : loading ? (
        <div className="panel empty-state">
          <Loader2 className="loading-spinner" size={24} />
          <span>Loading employees...</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="panel empty-state">
          <UserRound size={28} />
          <p style={{ fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>No employees yet</p>
          <p style={{ margin: "4px 0 16px" }}>There are no employees registered in the workforce yet.</p>
          {canManageEmployees ? (
            <button type="button" className="primary-button" onClick={() => setIsAddModalOpen(true)}>
              <Plus size={15} /> Add Employee
            </button>
          ) : null}
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="panel empty-state">
          <Search size={24} />
          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>No employees match your search.</p>
          <p style={{ margin: "4px 0 16px" }}>No employee record matches &quot;{search}&quot;.</p>
          <button type="button" className="secondary-button" onClick={() => setSearch("")}>
            Clear search
          </button>
        </div>
      ) : (
        <div className="employees-layout">
          {/* Employee Table List */}
          <div className="panel table-panel">
            <div className="table-header">
              <span>Employee</span>
              <span>Department</span>
              <span>Position</span>
              <span>Status</span>
              <span style={{ textAlign: "right" }}>Actions</span>
            </div>
            <div className="table-body">
              {filteredEmployees.map((employee) => {
                const initials = (employee.full_name || employee.email || "E")
                  .split(" ")
                  .map((p) => p[0])
                  .join("")
                  .slice(0, 2)
                  .toUpperCase();

                const isSelected = selectedEmployeeId === employee.id;

                return (
                  <div
                    tabIndex={0}
                    role="button"
                    className={`table-row ${isSelected ? "selected" : ""}`}
                    key={employee.id}
                    onClick={() => void openEmployeeDetail(employee.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        void openEmployeeDetail(employee.id);
                      }
                    }}
                  >
                    <div className="cell-person">
                      <div className="avatar avatar-person">{initials}</div>
                      <div>
                        <strong>{employee.full_name || "Unnamed employee"}</strong>
                        <span>{employee.email || "No email on file"}</span>
                      </div>
                    </div>
                    <span>{employee.department}</span>
                    <span>{employee.position}</span>
                    <div>
                      <span className={`status-chip ${employee.status === "ACTIVE" ? "active" : "on_leave"}`}>
                        {employee.status}
                      </span>
                    </div>
                    <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="action-menu-trigger"
                        onClick={() => setActiveMenuId(activeMenuId === employee.id ? null : employee.id)}
                        aria-label={`Actions for ${employee.full_name || "employee"}`}
                        aria-expanded={activeMenuId === employee.id}
                      >
                        <MoreHorizontal size={18} />
                      </button>

                      {activeMenuId === employee.id && (
                        <div className="action-dropdown-menu" role="menu">
                          <button
                            type="button"
                            className="action-dropdown-item"
                            onClick={() => {
                              setActiveMenuId(null);
                              void openEmployeeDetail(employee.id);
                            }}
                          >
                            <Eye size={14} /> View details
                          </button>
                          {canManageEmployees && (
                            <>
                              <button
                                type="button"
                                className="action-dropdown-item"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setEditingEmployee(employee);
                                }}
                              >
                                <Pencil size={14} /> Edit
                              </button>
                              <button
                                type="button"
                                className="action-dropdown-item danger"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  setDeletingEmployee(employee);
                                }}
                              >
                                <Trash2 size={14} /> Delete
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

          {/* Selected Employee Detail Panel */}
          <div className="panel detail-panel">
            {detailLoading ? (
              <div className="empty-state">
                <Loader2 className="loading-spinner" size={20} />
                <span>Loading employee details...</span>
              </div>
            ) : selectedEmployee ? (
              <>
                <div className="detail-header">
                  <div className="detail-person">
                    <div className="avatar avatar-person" style={{ width: 44, height: 44, fontSize: 14 }}>
                      {(selectedEmployee.full_name || selectedEmployee.email || "E")
                        .split(" ")
                        .map((p) => p[0])
                        .join("")
                        .slice(0, 2)
                        .toUpperCase()}
                    </div>
                    <div>
                      <h2>{selectedEmployee.full_name || "Unnamed employee"}</h2>
                      <p>{selectedEmployee.email || "No email on file"}</p>
                    </div>
                  </div>
                </div>

                <div className="detail-body">
                  {detailError ? <div className="auth-error" style={{ marginBottom: 16 }}>{detailError}</div> : null}

                  <div className="info-grid">
                    <div className="info-item">
                      <label>Employee Code</label>
                      <span>{selectedEmployee.employee_code}</span>
                    </div>
                    <div className="info-item">
                      <label>Status</label>
                      <span>
                        <span className={`status-chip ${selectedEmployee.status === "ACTIVE" ? "active" : "on_leave"}`}>
                          {selectedEmployee.status}
                        </span>
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Department</label>
                      <span>{selectedEmployee.department}</span>
                    </div>
                    <div className="info-item">
                      <label>Position</label>
                      <span>{selectedEmployee.position}</span>
                    </div>
                    <div className="info-item">
                      <label>Phone Number</label>
                      <span>{selectedEmployee.phone || "Not provided"}</span>
                    </div>
                    <div className="info-item">
                      <label>Joining Date</label>
                      <span>{selectedEmployee.joining_date}</span>
                    </div>
                  </div>

                  {canManageEmployees && (
                    <div className="detail-actions" style={{ marginTop: 20, display: "flex", gap: 10 }}>
                      <button
                        type="button"
                        className="secondary-button"
                        onClick={() => setEditingEmployee(selectedEmployee)}
                      >
                        <Pencil size={14} /> Edit
                      </button>
                      <button
                        type="button"
                        className="danger-button"
                        onClick={() => setDeletingEmployee(selectedEmployee)}
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="empty-state">
                <Building2 size={24} />
                <p>Select an employee from the directory to view details.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => void fetchEmployees()}
      />

      {/* Edit Employee Modal */}
      <EditEmployeeModal
        key={editingEmployee?.id ?? "edit-modal"}
        isOpen={!!editingEmployee}
        employee={editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        key={deletingEmployee?.id ?? "delete-modal"}
        isOpen={!!deletingEmployee}
        employee={deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
