"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarClock, CalendarDays, CheckCircle2,
  CircleDashed, Eye, Loader2, MoreHorizontal,
  Pencil, Plus, Search, Timer, Trash2,
} from "lucide-react";

import { useI18n } from "@/lib/i18n/I18nProvider";
import { CreateTaskModal, TaskStatus } from "./CreateTaskModal";
import { EditTaskModal, TaskEditRow } from "./EditTaskModal";
import { DeleteTaskModal } from "./DeleteTaskModal";

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

function getDueDateStatus(value: string | null): "overdue" | "today" | "upcoming" | null {
  if (!value) return null;
  const now = new Date();
  const due = new Date(value + "T00:00:00");
  if (Number.isNaN(due.getTime())) return null;
  const diffDays = Math.floor((due.getTime() - now.setHours(0, 0, 0, 0)) / 86400000);
  if (diffDays < 0) return "overdue";
  if (diffDays === 0) return "today";
  return "upcoming";
}

function getStatusClass(status: TaskStatus) {
  switch (status) {
    case "TODO": return "todo";
    case "IN_PROGRESS": return "in-progress";
    case "COMPLETED": return "completed";
    default: return "";
  }
}

function getInitials(name: string | null | undefined) {
  if (!name) return "T";
  return name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase();
}

export function WorkflowDirectory() {
  const { t, formatDate } = useI18n();

  const getTaskStatusLabel = (status: TaskStatus) => {
    switch (status) {
      case "TODO": return t.statuses.todo;
      case "IN_PROGRESS": return t.statuses.inProgress;
      case "COMPLETED": return t.statuses.completed;
      default: return status;
    }
  };

  const directoryRef = useRef<HTMLDivElement>(null);

  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskRow | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<TaskEditRow | null>(null);
  const [deletingTask, setDeletingTask] = useState<TaskEditRow | null>(null);

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

  const fetchTasks = async () => {
    setLoading(true); setError(null);
    try {
      const res = await fetch("/api/tasks", { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message ?? t.actions.error);
      const rows: TaskRow[] = Array.isArray(payload.data) ? payload.data : [];
      setTasks(rows);
      if (rows.length > 0) {
        setSelectedTaskId((prev) => {
          const match = rows.find((r) => r.id === prev);
          if (match) { setSelectedTask(match); return match.id; }
          setSelectedTask(rows[0]); return rows[0].id;
        });
      } else { setSelectedTaskId(null); setSelectedTask(null); }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.actions.error);
      setTasks([]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!active) return;
      setLoading(true); setError(null);
      try {
        const res = await fetch("/api/tasks", { cache: "no-store" });
        const payload = await res.json();
        if (!active) return;
        if (!res.ok || !payload.success) throw new Error(payload.message ?? t.actions.error);
        const rows: TaskRow[] = Array.isArray(payload.data) ? payload.data : [];
        setTasks(rows);
        if (rows.length > 0) {
          setSelectedTask(rows[0]); setSelectedTaskId(rows[0].id);
        }
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err.message : t.actions.error);
      } finally { if (active) setLoading(false); }
    };
    void load();
    return () => { active = false; };
  }, [t.actions.error]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    return tasks.filter((task) => {
      if (statusFilter !== "ALL" && task.status !== statusFilter) return false;
      if (!query) return true;
      const haystack = [task.title, task.description ?? "", task.status, task.assignee_name ?? "", task.assignee_email ?? ""]
        .filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [tasks, search, statusFilter]);

  const metrics = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter((t) => t.status === "TODO").length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t) => t.status === "COMPLETED").length,
  }), [tasks]);

  const openTaskDetail = async (taskId: string) => {
    setSelectedTaskId(taskId);
    setDetailError(null);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { cache: "no-store" });
      const payload = await res.json();
      if (!res.ok || !payload.success) throw new Error(payload.message ?? t.actions.error);
      setSelectedTask(payload.data as TaskRow);
    } catch (err) {
      setDetailError(err instanceof Error ? err.message : t.actions.error);
      setSelectedTask(null);
    } finally { setDetailLoading(false); }
  };

  const closeDetail = () => {
    setSelectedTaskId(null); setSelectedTask(null); setDetailError(null);
  };

  const handleEditSuccess = (updated: TaskEditRow) => {
    if (selectedTask?.id === updated.id) setSelectedTask((prev) => prev ? { ...prev, ...updated } : null);
    void fetchTasks();
  };

  const handleDeleteSuccess = (deletedId: string) => {
    if (selectedTaskId === deletedId) closeDetail();
    void fetchTasks();
  };

  const clearFilters = () => { setSearch(""); setStatusFilter("ALL"); };

  const toEditRow = (task: TaskRow): TaskEditRow => ({
    id: task.id, title: task.title, description: task.description,
    status: task.status, assigned_to: task.assigned_to, due_date: task.due_date,
    related_type: task.related_type, related_id: task.related_id,
    assignee_name: task.assignee_name,
  });

  return (
    <div className="protected-page-content workflows-page" ref={directoryRef}>
      {/* Header */}
      <div className="protected-page-heading">
        <div>
          <p className="eyebrow">{t.workflows.eyebrow}</p>
          <h1>{t.workflows.title}</h1>
          <p className="muted">{t.workflows.subtitle}</p>
        </div>
        <button type="button" className="primary-button" onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={15} /> + {t.workflows.createTask}
        </button>
      </div>

      {/* Metrics */}
      {!loading && !error && (
        <div className="metric-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: 20 }}>
          <div className="metric-card">
            <div className="metric-icon blue"><CalendarDays size={16} /></div>
            <span className="metric-label">{t.workflows.title}</span>
            <strong>{metrics.total}</strong>
          </div>
          <div className="metric-card">
            <div className="metric-icon yellow"><CircleDashed size={16} /></div>
            <span className="metric-label">{t.statuses.todo}</span>
            <strong>{metrics.todo}</strong>
          </div>
          <div className="metric-card">
            <div className="metric-icon teal"><Timer size={16} /></div>
            <span className="metric-label">{t.statuses.inProgress}</span>
            <strong>{metrics.inProgress}</strong>
          </div>
          <div className="metric-card">
            <div className="metric-icon coral"><CheckCircle2 size={16} /></div>
            <span className="metric-label">{t.statuses.completed}</span>
            <strong>{metrics.completed}</strong>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="employees-toolbar">
        <div className="employees-count">
          <span>{filteredTasks.length}</span>
          <small>{t.workflows.countLabel}</small>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", flex: 1, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ background: "var(--input-bg)", border: "1px solid var(--input-border)", borderRadius: 8, padding: "8px 12px", fontSize: 13, color: "var(--ink)", outline: "none" }}
            aria-label={t.workflows.statusLabel}
          >
            <option value="ALL">{t.workflows.allStatuses}</option>
            <option value="TODO">{t.statuses.todo}</option>
            <option value="IN_PROGRESS">{t.statuses.inProgress}</option>
            <option value="COMPLETED">{t.statuses.completed}</option>
          </select>
          <label className="employees-search" style={{ maxWidth: 300 }} aria-label={t.workflows.searchPlaceholder}>
            <Search size={15} />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t.workflows.searchPlaceholder} />
          </label>
        </div>
      </div>

      {/* States */}
      {error ? (
        <div className="panel empty-state">
          <CalendarDays size={24} />
          <p style={{ fontWeight: 600, color: "var(--ink)" }}>{t.workflows.loadError}</p>
          <p style={{ margin: "4px 0 16px" }}>{error}</p>
          <button type="button" className="secondary-button" onClick={() => void fetchTasks()}>{t.actions.refresh}</button>
        </div>
      ) : loading ? (
        <div className="panel empty-state">
          <Loader2 className="loading-spinner" size={24} />
          <span>{t.actions.loading}</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="panel empty-state">
          <CalendarDays size={28} />
          <p style={{ fontWeight: 600, fontSize: 16, color: "var(--ink)" }}>{t.workflows.emptyNoRecords}</p>
          <p style={{ margin: "4px 0 16px" }}>{t.workflows.emptyNoRecordsDesc}</p>
          <button type="button" className="primary-button" onClick={() => setIsCreateModalOpen(true)}>
            <Plus size={15} /> + {t.workflows.createTask}
          </button>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="panel empty-state">
          <Search size={24} />
          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)" }}>{t.workflows.emptyNoMatch}</p>
          <p style={{ margin: "4px 0 16px" }}>{t.workflows.emptyNoMatchDesc}</p>
          <button type="button" className="secondary-button" onClick={clearFilters}>{t.employees.clearSearch}</button>
        </div>
      ) : (
        <div className="employees-layout">
          {/* Task Table */}
          <div className="panel table-panel workflows-table">
            <div className="table-header">
              <span>{t.workflows.colTask}</span>
              <span>{t.workflows.colAssignedTo}</span>
              <span>{t.workflows.colStatus}</span>
              <span>{t.workflows.colDueDate}</span>
              <span style={{ textAlign: "right" }}>{t.workflows.colActions}</span>
            </div>
            <div className="table-body">
              {filteredTasks.map((task) => {
                const isSelected = selectedTaskId === task.id;
                const dueDateStatus = getDueDateStatus(task.due_date);
                return (
                  <div
                    tabIndex={0}
                    role="button"
                    className={`table-row ${isSelected ? "selected" : ""}`}
                    key={task.id}
                    onClick={() => void openTaskDetail(task.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") void openTaskDetail(task.id); }}
                  >
                    <div className="cell-person">
                      <div className={`avatar task-status-avatar ${getStatusClass(task.status)}`}>{getInitials(task.title)}</div>
                      <div>
                        <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "100%" }}>{task.title}</strong>
                        <span>{formatDate(task.created_at)}</span>
                      </div>
                    </div>
                    <div>
                      <strong>{task.assignee_name ?? t.workflows.unassigned}</strong>
                      {task.assignee_email && <span>{task.assignee_email}</span>}
                    </div>
                    <div>
                      <span className={`status-chip ${getStatusClass(task.status)}`}>{getTaskStatusLabel(task.status)}</span>
                    </div>
                    <div>
                      {task.due_date ? (
                        <span className={`due-date-label ${dueDateStatus ?? ""}`}>
                          {dueDateStatus === "overdue" && <CalendarClock size={13} style={{ display: "inline", marginRight: 4 }} />}
                          {formatDate(task.due_date)}
                        </span>
                      ) : "—"}
                    </div>
                    <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="action-menu-trigger"
                        onClick={() => setActiveMenuId(activeMenuId === task.id ? null : task.id)}
                        aria-label={`Actions for ${task.title}`}
                        aria-expanded={activeMenuId === task.id}
                      >
                        <MoreHorizontal size={18} />
                      </button>
                      {activeMenuId === task.id && (
                        <div className="action-dropdown-menu" role="menu">
                          <button type="button" className="action-dropdown-item" onClick={() => { setActiveMenuId(null); void openTaskDetail(task.id); }}>
                            <Eye size={14} /> {t.actions.viewDetails}
                          </button>
                          <button type="button" className="action-dropdown-item" onClick={() => { setActiveMenuId(null); setEditingTask(toEditRow(task)); }}>
                            <Pencil size={14} /> {t.actions.edit}
                          </button>
                          <button type="button" className="action-dropdown-item danger" onClick={() => { setActiveMenuId(null); setDeletingTask(toEditRow(task)); }}>
                            <Trash2 size={14} /> {t.actions.delete}
                          </button>
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
            ) : selectedTask ? (
              <>
                <div className="detail-header">
                  <div className="detail-person">
                    <div className={`avatar task-status-avatar ${getStatusClass(selectedTask.status)}`} style={{ width: 44, height: 44, fontSize: 14 }}>
                      {getInitials(selectedTask.title)}
                    </div>
                    <div>
                      <h2 style={{ fontSize: 17, margin: 0, wordBreak: "break-word" }}>{selectedTask.title}</h2>
                      <p>{selectedTask.assignee_name ? `Assigned to ${selectedTask.assignee_name}` : "Unassigned"}</p>
                    </div>
                  </div>
                </div>
                <div className="detail-body">
                  {detailError && <div className="auth-error" style={{ marginBottom: 16 }}>{detailError}</div>}
                  <div className="info-grid">
                    <div className="info-item">
                      <label>{t.workflows.statusLabel}</label>
                      <span><span className={`status-chip ${getStatusClass(selectedTask.status)}`}>{getTaskStatusLabel(selectedTask.status)}</span></span>
                    </div>
                    <div className="info-item">
                      <label>{t.workflows.dueDateLabel}</label>
                      <span>
                        {selectedTask.due_date ? (
                          <span className={`due-date-label ${getDueDateStatus(selectedTask.due_date) ?? ""}`}>{formatDate(selectedTask.due_date)}</span>
                        ) : "—"}
                      </span>
                    </div>
                    <div className="info-item">
                      <label>{t.workflows.assignedToLabel}</label>
                      <span>{selectedTask.assignee_name ?? t.workflows.unassigned}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.employees.emailAddress}</label>
                      <span>{selectedTask.assignee_email ?? "—"}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.requests.colCreated}</label>
                      <span>{formatDate(selectedTask.created_at)}</span>
                    </div>
                    <div className="info-item">
                      <label>{t.requests.typeLabel}</label>
                      <span>{selectedTask.related_type ?? "—"}</span>
                    </div>
                    <div className="info-item" style={{ gridColumn: "1 / -1" }}>
                      <label>{t.workflows.descriptionLabel}</label>
                      <span>{selectedTask.description || t.interviews.noNotes}</span>
                    </div>
                  </div>
                  <div className="detail-actions" style={{ marginTop: 20, display: "flex", gap: 10 }}>
                    <button type="button" className="secondary-button" onClick={() => setEditingTask(toEditRow(selectedTask))}>
                      <Pencil size={14} /> {t.workflows.editTask}
                    </button>
                    <button type="button" className="danger-button" onClick={() => setDeletingTask(toEditRow(selectedTask))}>
                      <Trash2 size={14} /> {t.workflows.deleteTask}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="empty-state">
                <CalendarDays size={24} />
                <p>{t.workflows.emptyNoRecordsDesc}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => void fetchTasks()}
      />
      <EditTaskModal
        key={editingTask?.id ?? "edit-task-modal"}
        isOpen={!!editingTask}
        task={editingTask}
        onClose={() => setEditingTask(null)}
        onSuccess={handleEditSuccess}
      />
      <DeleteTaskModal
        key={deletingTask?.id ?? "delete-task-modal"}
        isOpen={!!deletingTask}
        task={deletingTask}
        onClose={() => setDeletingTask(null)}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
