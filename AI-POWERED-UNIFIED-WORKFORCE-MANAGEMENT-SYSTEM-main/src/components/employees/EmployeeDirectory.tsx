"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Building2, Loader2, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth/AuthProvider";

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

type EmployeeFormState = {
  profile_id: string;
  employee_code: string;
  department: string;
  position: string;
  joining_date: string;
  phone: string;
  status: "ACTIVE" | "INACTIVE";
};

const emptyForm: EmployeeFormState = {
  profile_id: "",
  employee_code: "",
  department: "",
  position: "",
  joining_date: "",
  phone: "",
  status: "ACTIVE",
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
  const router = useRouter();
  const { role } = useAuth();
  const canManageEmployees = role === "ADMIN" || role === "HR";

  const [employees, setEmployees] = useState<EmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [formState, setFormState] = useState<EmployeeFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

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
      setEmployees(rows.map((row: Partial<EmployeeRow>) => normalizeEmployee(row)));
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
      if (!active) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/employees", { cache: "no-store" });
        const payload = await response.json();

        if (!active) {
          return;
        }

        if (!response.ok || !payload.success) {
          throw new Error(payload.message ?? "Unable to load employees.");
        }

        const rows = Array.isArray(payload.data) ? payload.data : [];
        setEmployees(rows.map((row: Partial<EmployeeRow>) => normalizeEmployee(row)));
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load employees.");
        setEmployees([]);
      } finally {
        if (active) {
          setLoading(false);
        }
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

  const openAddModal = () => {
    setFormState(emptyForm);
    setFormError(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

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
    setIsEditing(false);
  };

  const handleCreateEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const missing = [
      formState.profile_id,
      formState.employee_code,
      formState.department,
      formState.position,
      formState.joining_date,
    ].some((value) => !String(value).trim());

    if (missing) {
      setFormError("Profile ID, employee code, department, position, and joining date are required.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const response = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile_id: formState.profile_id,
          employee_code: formState.employee_code,
          department: formState.department,
          position: formState.position,
          joining_date: formState.joining_date,
          phone: formState.phone || null,
          status: formState.status,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to create employee.");
      }

      setIsModalOpen(false);
      setFormState(emptyForm);
      await fetchEmployees();
      setSelectedEmployeeId(null);
      setSelectedEmployee(null);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Unable to create employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateEmployee = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!selectedEmployee) {
      return;
    }

    event.preventDefault();

    setIsSubmitting(true);
    setDetailError(null);

    try {
      const response = await fetch(`/api/employees/${selectedEmployee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          department: selectedEmployee.department,
          position: selectedEmployee.position,
          phone: selectedEmployee.phone,
          status: selectedEmployee.status,
          employee_code: selectedEmployee.employee_code,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to update employee.");
      }

      setIsEditing(false);
      await openEmployeeDetail(selectedEmployee.id);
      await fetchEmployees();
    } catch (updateError) {
      setDetailError(updateError instanceof Error ? updateError.message : "Unable to update employee.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!selectedEmployee || !canManageEmployees) {
      return;
    }

    const confirmed = window.confirm(`Delete ${selectedEmployee.full_name || selectedEmployee.employee_code}?`);

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/employees/${selectedEmployee.id}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to delete employee.");
      }

      closeDetail();
      await fetchEmployees();
    } catch (deleteError) {
      setDetailError(deleteError instanceof Error ? deleteError.message : "Unable to delete employee.");
    }
  };

  return (
    <div className="protected-page-content employees-page">
      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">Workforce</p>
          <h1>Employees</h1>
          <p className="muted">People directory for the current workforce and hiring operations.</p>
        </div>
        {canManageEmployees ? (
          <button type="button" className="primary-button" onClick={openAddModal}>
            <Plus size={15} /> Add Employee
          </button>
        ) : null}
      </div>

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
            placeholder="Search employees"
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
          <span>Loading employees...</span>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="panel empty-panel">
          <UserRound size={18} />
          <span>No employees match your search.</span>
        </div>
      ) : (
        <div className="employees-layout">
          <div className="panel table-panel">
            <div className="table-header">
              <span>Name</span>
              <span>Department</span>
              <span>Position</span>
              <span>Status</span>
            </div>
            <div className="table-body">
              {filteredEmployees.map((employee) => (
                <button
                  type="button"
                  className={`employee-row ${selectedEmployeeId === employee.id ? "active" : ""}`}
                  key={employee.id}
                  onClick={() => void openEmployeeDetail(employee.id)}
                >
                  <span className="employee-name-block">
                    <strong>{employee.full_name || "Unnamed employee"}</strong>
                    <small>{employee.email || "No email on file"}</small>
                  </span>
                  <span>{employee.department}</span>
                  <span>{employee.position}</span>
                  <span>
                    <span className={`status-pill ${employee.status === "ACTIVE" ? "active" : "inactive"}`}>
                      {employee.status}
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
                <span>Loading employee...</span>
              </div>
            ) : selectedEmployee ? (
              <>
                <div className="detail-header">
                  <div>
                    <p className="eyebrow">Employee profile</p>
                    <h2>{selectedEmployee.full_name || "Unnamed employee"}</h2>
                  </div>
                  {canManageEmployees ? (
                    <div className="detail-actions">
                      <button type="button" className="secondary-button" onClick={() => setIsEditing((open) => !open)}>
                        <Pencil size={14} /> {isEditing ? "Close" : "Edit"}
                      </button>
                      <button type="button" className="danger-button" onClick={handleDeleteEmployee}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  ) : null}
                </div>

                {detailError ? <div className="panel-warning detail-warning"><p>{detailError}</p></div> : null}

                {isEditing ? (
                  <form className="employee-form" onSubmit={handleUpdateEmployee}>
                    <div className="field-row">
                      <label>
                        Employee code
                        <input value={selectedEmployee.employee_code} onChange={(event) => setSelectedEmployee({ ...selectedEmployee, employee_code: event.target.value })} />
                      </label>
                      <label>
                        Status
                        <select value={selectedEmployee.status} onChange={(event) => setSelectedEmployee({ ...selectedEmployee, status: event.target.value as "ACTIVE" | "INACTIVE" })}>
                          <option value="ACTIVE">ACTIVE</option>
                          <option value="INACTIVE">INACTIVE</option>
                        </select>
                      </label>
                    </div>

                    <div className="field-row">
                      <label>
                        Department
                        <input value={selectedEmployee.department} onChange={(event) => setSelectedEmployee({ ...selectedEmployee, department: event.target.value })} />
                      </label>
                      <label>
                        Position
                        <input value={selectedEmployee.position} onChange={(event) => setSelectedEmployee({ ...selectedEmployee, position: event.target.value })} />
                      </label>
                    </div>

                    <div className="field-row">
                      <label>
                        Joining date
                        <input type="date" value={selectedEmployee.joining_date ?? ""} onChange={(event) => setSelectedEmployee({ ...selectedEmployee, joining_date: event.target.value })} />
                      </label>
                      <label>
                        Phone
                        <input value={selectedEmployee.phone ?? ""} onChange={(event) => setSelectedEmployee({ ...selectedEmployee, phone: event.target.value || null })} />
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
                      <strong>{selectedEmployee.email || "No email on file"}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Employee code</span>
                      <strong>{selectedEmployee.employee_code}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Department</span>
                      <strong>{selectedEmployee.department}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Role/title</span>
                      <strong>{selectedEmployee.position}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Status</span>
                      <strong>{selectedEmployee.status}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Joining date</span>
                      <strong>{selectedEmployee.joining_date}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Phone</span>
                      <strong>{selectedEmployee.phone || "Not provided"}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Profile ID</span>
                      <strong>{selectedEmployee.profile_id}</strong>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="detail-empty">
                <Building2 size={18} />
                <p>Select an employee to view details.</p>
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
                <p className="eyebrow">Create employee</p>
                <h3>Add employee</h3>
              </div>
              <button type="button" className="modal-close" onClick={() => setIsModalOpen(false)} aria-label="Close dialog">
                ×
              </button>
            </div>

            <form className="employee-form" onSubmit={handleCreateEmployee}>
              {formError ? <div className="panel-warning"><p>{formError}</p></div> : null}

              <div className="field-row">
                <label>
                  Profile ID
                  <input value={formState.profile_id} onChange={(event) => setFormState({ ...formState, profile_id: event.target.value })} placeholder="Use an existing profile UUID" />
                </label>
                <label>
                  Employee code
                  <input value={formState.employee_code} onChange={(event) => setFormState({ ...formState, employee_code: event.target.value })} placeholder="EMP-001" />
                </label>
              </div>

              <div className="field-row">
                <label>
                  Department
                  <input value={formState.department} onChange={(event) => setFormState({ ...formState, department: event.target.value })} placeholder="Operations" />
                </label>
                <label>
                  Position
                  <input value={formState.position} onChange={(event) => setFormState({ ...formState, position: event.target.value })} placeholder="Team Lead" />
                </label>
              </div>

              <div className="field-row">
                <label>
                  Joining date
                  <input type="date" value={formState.joining_date} onChange={(event) => setFormState({ ...formState, joining_date: event.target.value })} />
                </label>
                <label>
                  Phone
                  <input value={formState.phone} onChange={(event) => setFormState({ ...formState, phone: event.target.value })} placeholder="+1 555 456 789" />
                </label>
              </div>

              <label>
                Status
                <select value={formState.status} onChange={(event) => setFormState({ ...formState, status: event.target.value as "ACTIVE" | "INACTIVE" })}>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                </select>
              </label>

              <div className="detail-footer modal-footer">
                <button type="button" className="secondary-button" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="primary-button" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Create employee"}
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
