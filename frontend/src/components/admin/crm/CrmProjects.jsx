import { useEffect, useMemo, useState } from "react";
import CrmPanel from "./CrmPanel";
import { crmList, crmCreate, crmUpdate, crmDelete } from "@/lib/api";
import { INR, fmtDate, PROJECT_STATUSES } from "./crmUtils";
import { ArrowUpRight, ArrowLeft } from "lucide-react";
import ProjectDetail from "./ProjectDetail";

export default function CrmProjects({ token }) {
  const [selectedId, setSelectedId] = useState(null);
  const [leads, setLeads] = useState([]);

  useEffect(() => {
    crmList(token, "leads").then(setLeads).catch(() => {});
  }, [token]);

  const fields = useMemo(() => [
    { name: "name",        label: "Project name", type: "text", required: true, full: true, placeholder: "Vault Private Banking Platform" },
    { name: "client",      label: "Client",       type: "text", placeholder: "Vault Holdings" },
    { name: "lead_id",     label: "Linked lead",  type: "select",
      options: [{ value: "", label: "— None —" }, ...leads.map((l) => ({ value: l.id, label: `${l.name}${l.company ? ` · ${l.company}` : ""}` }))] },
    { name: "status",      label: "Status",       type: "select", options: PROJECT_STATUSES.map((s) => ({ value: s.k, label: s.label })) },
    { name: "start_date",  label: "Start date",   type: "date" },
    { name: "end_date",    label: "End date",     type: "date" },
    { name: "budget",      label: "Budget (₹)",   type: "money" },
    { name: "description", label: "Description",  type: "textarea", full: true, rows: 4 },
  ], [leads]);

  const columns = [
    {
      key: "name", label: "Project",
      render: (r) => (
        <button
          onClick={() => setSelectedId(r.id)}
          data-testid={`crm-open-project-${r.id}`}
          className="text-left"
        >
          <div className="font-semibold text-[#0a0a0a] hover:text-[#ff5722] transition-colors">{r.name}</div>
          {r.description && <div className="text-xs text-[#4a4a4a] truncate max-w-[24ch]">{r.description}</div>}
        </button>
      ),
    },
    { key: "client",     label: "Client",   render: (r) => r.client || "—" },
    { key: "status",     label: "Status",   render: (r) => <StatusBadge k={r.status} /> },
    { key: "start_date", label: "Start",    render: (r) => <span className="font-mono text-xs">{fmtDate(r.start_date)}</span> },
    { key: "end_date",   label: "End",      render: (r) => <span className="font-mono text-xs">{fmtDate(r.end_date)}</span> },
    { key: "budget",     label: "Budget",   render: (r) => <span className="font-mono">{INR(r.budget)}</span> },
    {
      key: "open", label: "", render: (r) => (
        <button
          onClick={() => setSelectedId(r.id)}
          data-testid={`crm-open-detail-${r.id}`}
          className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.15em] text-[#ff5722] hover:text-[#0a0a0a]"
        >
          Open <ArrowUpRight className="h-3 w-3" />
        </button>
      ),
    },
  ];

  if (selectedId) {
    return (
      <div>
        <button
          onClick={() => setSelectedId(null)}
          data-testid="crm-back-to-projects"
          className="inline-flex items-center gap-2 text-sm text-[#4a4a4a] hover:text-[#ff5722] mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> All projects
        </button>
        <ProjectDetail token={token} projectId={selectedId} />
      </div>
    );
  }

  return (
    <CrmPanel
      title="Reachvel Projects"
      entityName="projects"
      description="Internal delivery projects with tasks, expenses, vendor payments and invoices."
      fields={fields}
      columns={columns}
      list={(p) => crmList(token, "projects", p)}
      create={(p) => crmCreate(token, "projects", p)}
      update={(id, p) => crmUpdate(token, "projects", id, p)}
      remove={(id) => crmDelete(token, "projects", id)}
      filters={[{ key: "status", label: "Status", options: PROJECT_STATUSES }]}
      initialForm={{ status: "planning", budget: 0 }}
    />
  );
}

function StatusBadge({ k }) {
  const s = PROJECT_STATUSES.find((x) => x.k === k) || PROJECT_STATUSES[0];
  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-black/10 text-[11px] font-mono uppercase tracking-[0.1em]">
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
