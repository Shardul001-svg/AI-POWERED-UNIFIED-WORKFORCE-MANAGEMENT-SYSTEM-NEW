"use client";

import { X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function AddEmployeeModal({ isOpen, onClose, onSuccess }: Readonly<Props>) {
  const { t } = useI18n();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [employeeCode, setEmployeeCode] = useState("EMP-808");
  const [phone, setPhone] = useState("");

  const [department, setDepartment] = useState("Operations");
  const [position, setPosition] = useState("Operations Associate");
  const [joiningDate, setJoiningDate] = useState(new Date().toISOString().split("T")[0]);
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

  if (!isOpen) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!fullName.trim() || !email.trim() || !employeeCode.trim() || !department.trim() || !position.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/employees", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim(),
          employee_code: employeeCode.trim(),
          phone: phone.trim() || null,
          department: department.trim(),
          position: position.trim(),
          joining_date: joiningDate,
          status: "ACTIVE",
        }),
      });

      const payload = await res.json();

      if (!res.ok || !payload.success) {
        throw new Error(payload.message || payload.error || "Failed to create employee");
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
          <h2>+ {t.actions.add} Employee</h2>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="emp-name">Full Name *</label>
            <input
              id="emp-name"
              type="text"
              required
              placeholder="e.g. Alex Morgan"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="emp-email">Email Address *</label>
            <input
              id="emp-email"
              type="email"
              required
              placeholder="alex.morgan@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="emp-code">Employee Code *</label>
              <input
                id="emp-code"
                type="text"
                required
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="emp-phone">Phone Number</label>
              <input
                id="emp-phone"
                type="text"
                placeholder="+1 555-0199"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="emp-dept">Department *</label>
              <select id="emp-dept" value={department} onChange={(e) => setDepartment(e.target.value)}>
                <option value="Customer Success">Customer Success</option>
                <option value="Operations">Operations</option>
                <option value="Field Services">Field Services</option>
                <option value="People Operations">People Operations</option>
                <option value="Engineering">Engineering</option>
                <option value="Finance">Finance</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="emp-pos">Position *</label>
              <input
                id="emp-pos"
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="emp-date">Joining Date *</label>
            <input
              id="emp-date"
              type="date"
              required
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={onClose} disabled={submitting}>
              {t.actions.cancel}
            </button>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? t.actions.submitting : "+ Add Employee"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
