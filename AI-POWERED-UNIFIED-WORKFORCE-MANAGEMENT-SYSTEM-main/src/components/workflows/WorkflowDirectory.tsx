"use client";

import { useEffect, useMemo, useState } from "react";
import { CircleDashed, Loader2, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";

import { useAuth } from "@/lib/auth/AuthProvider";

type TaskStatus = "TODO" | "IN_PROGRESS" | "COMPLETED";

type AssigneeOption = {
  id: string;
  full_name: string;
  email: string;
};

type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string | null;
  related_type: string | null;
  related_id: string | null;
  status: TaskStatus;
  due_date: string | null;
  created_at: string;
  assignee_name?: string | null;
  assignee_email?: string | null;
  assignee_role?: string | null;
};

type TaskFormState = {
  title: string;
  description: string;
  assigned_to: string;
  status: TaskStatus;
  due_date: string;
  related_type: string;
  related_id: string;
};

const taskStatusOptions: TaskStatus[] = ["TODO", "IN_PROGRESS", "COMPLETED"];

const emptyForm: TaskFormState = {
  title: "",
  description: "",
  assigned_to: "",
  status: "TODO",
  due_date: "",
  related_type: "",
  related_id: "",
};

function formatDate(value: string | null) {
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

export function WorkflowDirectory() {
  const { role, profile } = useAuth();
  const canManageTasks = role === "ADMIN" || role === "HR" || role === "EMPLOYEE";

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [assigneeOptions, setAssigneeOptions] = useState<AssigneeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus>("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [formState, setFormState] = useState<TaskFormState>(emptyForm);
  const [formError, setFormError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load tasks.");
      }

      setTasks(Array.isArray(payload.data) ? payload.data : []);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load tasks.");
      setTasks([]);
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
        const [tasksResponse, employeeResponse] = await Promise.all([
          fetch("/api/tasks", { cache: "no-store" }),
          fetch("/api/employees", { cache: "no-store" }),
        ]);

        const taskPayload = await tasksResponse.json();
        const employeePayload = employeeResponse.ok ? await employeeResponse.json() : null;

        if (!active) {
          return;
        }

        if (!tasksResponse.ok || !taskPayload.success) {
          throw new Error(taskPayload.message ?? "Unable to load tasks.");
        }

        setTasks(Array.isArray(taskPayload.data) ? taskPayload.data : []);

        const nextOptions = Array.isArray(employeePayload?.data) ? employeePayload.data : [];
        setAssigneeOptions(
          nextOptions
            .map((employee: Partial<{ profile_id: string; full_name: string; email: string }>) => ({
              id: employee.profile_id ?? "",
              full_name: employee.full_name ?? "Unknown assignee",
              email: employee.email ?? "",
            }))
            .filter((entry: AssigneeOption) => entry.id),
        );
      } catch (loadError) {
        if (!active) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load tasks.");
        setTasks([]);
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

  const assigneeNames = useMemo(() => Array.from(new Set(tasks.map((task) => task.assignee_name).filter(Boolean) as string[])), [tasks]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();

    return tasks.filter((task) => {
      const matchesSearch = !query || [task.title, task.description ?? "", task.status, task.assignee_name ?? "", task.assignee_email ?? ""].filter(Boolean).join(" ").toLowerCase().includes(query);
      const matchesStatus = statusFilter === "ALL" || task.status === statusFilter;
      const matchesAssignee = assigneeFilter === "ALL" || task.assigned_to === assigneeFilter;

      return matchesSearch && matchesStatus && matchesAssignee;
    });
  }, [assigneeFilter, search, statusFilter, tasks]);

  const openAddModal = () => {
    setFormState({
      ...emptyForm,
      assigned_to: role === "EMPLOYEE" && profile?.id ? profile.id : "",
    });
    setFormError(null);
    setIsEditing(false);
    setIsModalOpen(true);
  };

  const openTaskDetail = async (taskId: string) => {
    setSelectedTaskId(taskId);
    setDetailError(null);
    setDetailLoading(true);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, { cache: "no-store" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to load task details.");
      }

      setSelectedTask(payload.data as TaskRow);
    } catch (detailLoadError) {
      setDetailError(detailLoadError instanceof Error ? detailLoadError.message : "Unable to load task details.");
      setSelectedTask(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedTaskId(null);
    setSelectedTask(null);
    setDetailError(null);
    setIsEditing(false);
  };

  const handleCreateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formState.title.trim()) {
      setFormError("Title is required.");
      return;
    }

    if (role === "EMPLOYEE" && !profile?.id) {
      setFormError("Your profile is missing. Please sign in again.");
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      const payload = {
        title: formState.title,
        description: formState.description || null,
        assigned_to: formState.assigned_to || (role === "EMPLOYEE" ? profile?.id ?? null : null),
        status: formState.status,
        due_date: formState.due_date || null,
        related_type: formState.related_type || null,
        related_id: formState.related_id || null,
      };

      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.message ?? "Unable to create task.");
      }

      setIsModalOpen(false);
      setFormState(emptyForm);
      await fetchTasks();
      setSelectedTaskId(null);
      setSelectedTask(null);
    } catch (submitError) {
      setFormError(submitError instanceof Error ? submitError.message : "Unable to create task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (event: React.FormEvent<HTMLFormElement>) => {
    if (!selectedTask) {
      return;
    }

    event.preventDefault();

    setIsSubmitting(true);
    setDetailError(null);

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedTask.title,
          description: selectedTask.description,
          assigned_to: selectedTask.assigned_to,
          status: selectedTask.status,
          due_date: selectedTask.due_date,
          related_type: selectedTask.related_type,
          related_id: selectedTask.related_id,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to update task.");
      }

      setIsEditing(false);
      await openTaskDetail(selectedTask.id);
      await fetchTasks();
    } catch (updateError) {
      setDetailError(updateError instanceof Error ? updateError.message : "Unable to update task.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!selectedTask || !canManageTasks) {
      return;
    }

    const confirmed = window.confirm(`Delete task ${selectedTask.title}?`);
    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}`, { method: "DELETE" });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message ?? "Unable to delete task.");
      }

      closeDetail();
      await fetchTasks();
    } catch (deleteError) {
      setDetailError(deleteError instanceof Error ? deleteError.message : "Unable to delete task.");
    }
  };

  return (
    <div className="protected-page-content workflows-page">
      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">Operations</p>
          <h1>Workflows</h1>
          <p className="muted">Track active tasks, assignments, and follow-ups across the workforce.</p>
        </div>
        <button type="button" className="primary-button" onClick={openAddModal}>
          <Plus size={15} /> New task
        </button>
      </div>

      <div className="employees-toolbar">
        <div className="employees-count">
          <span>{filteredTasks.length}</span>
          <small>tasks</small>
        </div>

        <div className="employees-search" style={{ display: "flex", gap: "0.75rem", alignItems: "center" }}>
          <label aria-label="Search workflows" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Search size={15} />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search workflows"
            />
          </label>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "ALL" | TaskStatus)}>
            <option value="ALL">All statuses</option>
            {taskStatusOptions.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
          <select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)}>
            <option value="ALL">All assignees</option>
            {assigneeNames.map((name) => (
              <option key={name} value={tasks.find((task) => task.assignee_name === name)?.assigned_to ?? ""}>{name}</option>
            ))}
          </select>
        </div>
      </div>

      {error ? <div className="panel panel-warning"><p>{error}</p></div> : null}

      {loading ? (
        <div className="panel empty-panel">
          <Loader2 className="loading-spinner" size={18} />
          <span>Loading workflows...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="panel empty-panel">
          <CircleDashed size={18} />
          <span>No workflows match your filters.</span>
        </div>
      ) : (
        <div className="employees-layout">
          <div className="panel table-panel">
            <div className="table-header">
              <span>Task</span>
              <span>Assignee</span>
              <span>Status</span>
              <span>Due</span>
            </div>
            <div className="table-body">
              {filteredTasks.map((task) => (
                <button
                  type="button"
                  className={`employee-row ${selectedTaskId === task.id ? "active" : ""}`}
                  key={task.id}
                  onClick={() => void openTaskDetail(task.id)}
                >
                  <span className="employee-name-block">
                    <strong>{task.title}</strong>
                    <small>{formatDate(task.created_at)}</small>
                  </span>
                  <span>{task.assignee_name ?? "Unassigned"}</span>
                  <span>
                    <span className={`status-pill ${task.status === "TODO" ? "neutral" : task.status === "IN_PROGRESS" ? "active" : "inactive"}`}>
                      {task.status}
                    </span>
                  </span>
                  <span>{formatDate(task.due_date)}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="panel detail-panel">
            {detailLoading ? (
              <div className="detail-loading">
                <Loader2 className="loading-spinner" size={18} />
                <span>Loading workflow...</span>
              </div>
            ) : selectedTask ? (
              <>
                <div className="detail-header">
                  <div>
                    <p className="eyebrow">Task detail</p>
                    <h2>{selectedTask.title}</h2>
                  </div>
                  {canManageTasks ? (
                    <div className="detail-actions">
                      <button type="button" className="secondary-button" onClick={() => setIsEditing((open) => !open)}>
                        <Pencil size={14} /> {isEditing ? "Close" : "Edit"}
                      </button>
                      <button type="button" className="danger-button" onClick={handleDeleteTask}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  ) : null}
                </div>

                {detailError ? <div className="panel-warning detail-warning"><p>{detailError}</p></div> : null}

                {isEditing ? (
                  <form className="employee-form" onSubmit={handleUpdateTask}>
                    <div className="field-row">
                      <label>
                        Title
                        <input value={selectedTask.title} onChange={(event) => setSelectedTask({ ...selectedTask, title: event.target.value })} />
                      </label>
                    </div>

                    <div className="field-row">
                      <label>
                        Status
                        <select value={selectedTask.status} onChange={(event) => setSelectedTask({ ...selectedTask, status: event.target.value as TaskStatus })}>
                          {taskStatusOptions.map((status) => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      </label>
                      <label>
                        Due date
                        <input type="date" value={selectedTask.due_date ?? ""} onChange={(event) => setSelectedTask({ ...selectedTask, due_date: event.target.value || null })} />
                      </label>
                    </div>

                    <div className="field-row">
                      <label>
                        Assignee
                        <select value={selectedTask.assigned_to ?? ""} onChange={(event) => setSelectedTask({ ...selectedTask, assigned_to: event.target.value || null })}>
                          <option value="">Unassigned</option>
                          {assigneeOptions.map((assignee) => (
                            <option key={assignee.id} value={assignee.id}>{assignee.full_name}</option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <div className="field-row">
                      <label>
                        Description
                        <textarea value={selectedTask.description ?? ""} onChange={(event) => setSelectedTask({ ...selectedTask, description: event.target.value || null })} rows={4} />
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
                      <span className="detail-label">Assignee</span>
                      <strong>{selectedTask.assignee_name ?? "Unassigned"}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Email</span>
                      <strong>{selectedTask.assignee_email ?? "—"}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Status</span>
                      <strong>{selectedTask.status}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Due date</span>
                      <strong>{formatDate(selectedTask.due_date)}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Created</span>
                      <strong>{formatDate(selectedTask.created_at)}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Related type</span>
                      <strong>{selectedTask.related_type ?? "—"}</strong>
                    </div>
                    <div className="detail-stat">
                      <span className="detail-label">Related ID</span>
                      <strong>{selectedTask.related_id ?? "—"}</strong>
                    </div>
                    <div className="detail-stat detail-stat-wide">
                      <span className="detail-label">Description</span>
                      <strong>{selectedTask.description ?? "No description provided."}</strong>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="panel empty-panel">
                <UserRound size={18} />
                <span>Select a workflow to view details.</span>
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
                <p className="eyebrow">Create task</p>
                <h3>New workflow task</h3>
              </div>
              <button type="button" className="icon-button" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form className="employee-form" onSubmit={handleCreateTask}>
              <div className="field-row">
                <label>
                  Title
                  <input value={formState.title} onChange={(event) => setFormState({ ...formState, title: event.target.value })} />
                </label>
              </div>

              <div className="field-row">
                <label>
                  Status
                  <select value={formState.status} onChange={(event) => setFormState({ ...formState, status: event.target.value as TaskStatus })}>
                    {taskStatusOptions.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </label>
                <label>
                  Due date
                  <input type="date" value={formState.due_date} onChange={(event) => setFormState({ ...formState, due_date: event.target.value })} />
                </label>
              </div>

              <div className="field-row">
                <label>
                  Assignee
                  <select value={formState.assigned_to} onChange={(event) => setFormState({ ...formState, assigned_to: event.target.value })}>
                    <option value="">Unassigned</option>
                    {assigneeOptions.map((assignee) => (
                      <option key={assignee.id} value={assignee.id}>{assignee.full_name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="field-row">
                <label>
                  Related type
                  <input value={formState.related_type} onChange={(event) => setFormState({ ...formState, related_type: event.target.value })} placeholder="request, candidate, interview" />
                </label>
                <label>
                  Related ID
                  <input value={formState.related_id} onChange={(event) => setFormState({ ...formState, related_id: event.target.value })} placeholder="UUID" />
                </label>
              </div>

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
                  {isSubmitting ? "Creating..." : "Create task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
