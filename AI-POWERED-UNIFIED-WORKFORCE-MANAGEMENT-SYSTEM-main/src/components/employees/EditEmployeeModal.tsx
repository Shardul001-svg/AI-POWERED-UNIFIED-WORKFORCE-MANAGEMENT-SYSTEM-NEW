"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2, X } from "lucide-react";

export type EmployeeEditRow = {
  id: string;
  profile_id: string;
  employee_code: string;
  phone: string | null;
  department: string;
  position: string;
  joining_date: string;
  status: "ACTIVE" | "INACTIVE";
  full_name?: string | null;
  email?: string | null;
};

type Props = {
  isOpen: boolean;
  employee: EmployeeEditRow | null;
  onClose: () => void;
  onSuccess: (updatedEmployee: EmployeeEditRow) => void;
};

export function EditEmployeeModal({ isOpen, employee, onClose, onSuccess }: Readonly<Props>) {
  const [fullName, setFullName] = useState(employee?.full_name || "");
  const [email, setEmail] = useState(employee?.email || "");
  const [employeeCode, setEmployeeCode] = useState(employee?.employee_code || "");
  const [phone, setPhone] = useState(employee?.phone || "");
  const [department, setDepartment] = useState(employee?.department || "");
  const [position, setPosition] = useState(employee?.position || "");
  const [joiningDate, setJoiningDate] = useState(employee?.joining_date || "");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">(employee?.status || "ACTIVE");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  if (!isOpen || !employee) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !employeeCode.trim() || !department.trim() || !position.trim() || !joiningDate.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/employees/${employee.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          employee_code: employeeCode.trim(),
          department: department.trim(),
          position: position.trim(),
          joining_date: joiningDate.trim(),
          phone: phone.trim() || null,
          status,
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.message || payload.error || "Failed to update employee");
      }

      onSuccess({
        ...employee,
        full_name: fullName.trim(),
        email: email.trim(),
        employee_code: employeeCode.trim(),
        department: department.trim(),
        position: position.trim(),
        joining_date: joiningDate.trim(),
        phone: phone.trim() || null,
        status,
      });
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
          <h2>Edit Employee</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {error && <div className="auth-error" style={{ marginBottom: 16 }}>{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="edit-emp-name">Full Name *</label>
            <input
              id="edit-emp-name"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="edit-emp-email">Email Address *</label>
            <input
              id="edit-emp-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-emp-code">Employee Code *</label>
              <input
                id="edit-emp-code"
                type="text"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-emp-phone">Phone Number</label>
              <input
                id="edit-emp-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-emp-dept">Department *</label>
              <input
                id="edit-emp-dept"
                type="text"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-emp-pos">Position *</label>
              <input
                id="edit-emp-pos"
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-emp-date">Joining Date *</label>
              <input
                id="edit-emp-date"
                type="date"
                required
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-emp-status">Status *</label>
              <select
                id="edit-emp-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as "ACTIVE" | "INACTIVE")}
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="loading-spinner" size={14} /> Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
