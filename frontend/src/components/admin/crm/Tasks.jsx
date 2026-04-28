import { useEffect, useState } from "react";
import CrmPanel from "./CrmPanel";
import { crmList, crmCreate, crmUpdate, crmDelete } from "@/lib/api";
import { fmtDate, TASK_STATUSES, TASK_PRIORITIES, labelFrom } from "./crmUtils";

export default function Tasks({ token, projectId = null, projects: projectsProp = null, compact = false }) {
  const [projects, setProjects] = useState(projectsProp || []);

  useEffect(() => {
    if (projectsProp) return;
    crmList(token, "projects").then(setProjects).catch(() => {});
  }, [token, projectsProp]);

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const fields = [
    { name: "title",       label: "Title",       type: "text", required: true, full: true, placeholder: "Wireframe dashboard" },
    { name: "project_id",  label: "Project",     type: "select",
      options: [{ value: "", label: "— General —" }, ...projects.map((p) => ({ value: p.id, label: p.name }))] },
    { name: "assignee",    label: "Assignee",    type: "text", placeholder: "Developer / Designer name" },
    { name: "priority",    label: "Priority",    type: "select", options: TASK_PRIORITIES.map((p) => ({ value: p.k, label: p.label })) },
    { name: "status",      label: "Status",      type: "select", options: TASK_STATUSES.map((p) => ({ value: p.k, label: p.label })) },
    { name: "due_date",    label: "Due date",    type: "date" },
    { name: "description", label: "Description", type: "textarea", full: true, rows: 4 },
  ];

  const columns = [
    { key: "title",      label: "Task",      render: (r) => <div className="font-semibold">{r.title}</div> },
    !projectId && { key: "project_id", label: "Project",   render: (r) => projectMap[r.project_id] || "— General —" },
    { key: "assignee",   label: "Assignee",  render: (r) => r.assignee || "—" },
    { key: "priority",   label: "Priority",  render: (r) => <PriorityTag k={r.priority} /> },
    { key: "due_date",   label: "Due",       render: (r) => <span className="font-mono text-xs">{fmtDate(r.due_date)}</span> },
    { key: "status",     label: "Status",    render: (r) => <StatusBadge k={r.status} /> },
  ].filter(Boolean);

  return (
    <CrmPanel
      title={compact ? "Tasks" : "Tasks"}
      entityName="tasks"
      description={compact ? undefined : "General tasks plus anything scoped to a specific project."}
      fields={fields}
      columns={columns}
      list={(p) => crmList(token, "tasks", { ...p, ...(projectId ? { project_id: projectId } : {}) })}
      create={(p) => crmCreate(token, "tasks", { ...p, ...(projectId ? { project_id: projectId } : {}) })}
      update={(id, p) => crmUpdate(token, "tasks", id, p)}
      remove={(id) => crmDelete(token, "tasks", id)}
      filters={[{ key: "status", label: "Status", options: TASK_STATUSES }]}
      initialForm={{ status: "todo", priority: "medium", project_id: projectId || "" }}
      extraParams={projectId ? { project_id: projectId } : {}}
    />
  );
}

function StatusBadge({ k }) {
  const s = TASK_STATUSES.find((x) => x.k === k) || TASK_STATUSES[0];
  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-black/10 text-[11px] font-mono uppercase tracking-[0.1em]">
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function PriorityTag({ k }) {
  const p = TASK_PRIORITIES.find((x) => x.k === k) || TASK_PRIORITIES[1];
  return <span className={`text-[11px] font-mono uppercase tracking-[0.1em] font-bold ${p.color}`}>{p.label}</span>;
}
