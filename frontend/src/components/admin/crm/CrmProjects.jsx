import { useEffect, useMemo, useState, useCallback } from "react";
import { Briefcase, Wallet, Receipt, ArrowDownCircle, ArrowUpCircle, ArrowUpRight, ArrowLeft, FolderKanban } from "lucide-react";
import CrmPanel from "./CrmPanel";
import SummaryCards from "./SummaryCards";
import StatusPill from "./StatusPill";
import { crmList, crmCreate, crmUpdate, crmDelete, crmProjectsSummary } from "@/lib/api";
import { INR, fmtDate, PROJECT_STATUSES, PROJECT_GROUPS, PROJECT_STATUS_TONE } from "./crmUtils";
import ProjectDetail from "./ProjectDetail";

export default function CrmProjects({ token }) {
  const [selectedId, setSelectedId] = useState(null);
  const [leads, setLeads] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(async () => {
    try { setSummary(await crmProjectsSummary(token)); } catch { /* noop */ }
  }, [token]);

  useEffect(() => {
    crmList(token, "leads").then(setLeads).catch(() => {});
    crmList(token, "vendors").then(setVendors).catch(() => {});
    loadSummary();
  }, [token, loadSummary]);

  const fields = useMemo(() => [
    { name: "name",          label: "Project name", type: "text", required: true, full: true, placeholder: "Vault Private Banking Platform" },
    { name: "client",        label: "Client",       type: "text", placeholder: "Vault Holdings" },
    { name: "project_group", label: "Project group", type: "select",
      options: [{ value: "", label: "— Select —" }, ...PROJECT_GROUPS.map((g) => ({ value: g.k, label: g.label }))] },
    { name: "gst_applicable", label: "GST", type: "select",
      options: [{ value: "true", label: "GST" }, { value: "false", label: "Non-GST" }],
      help: "Whether GST applies to this project's invoices/expenses." },
    { name: "lead_id",       label: "Linked lead",   type: "select",
      options: [{ value: "", label: "— None —" }, ...leads.map((l) => ({ value: l.id, label: `${l.name}${l.company ? ` · ${l.company}` : ""}` }))] },
    { name: "vendor_id",     label: "Primary vendor", type: "select",
      options: [{ value: "", label: "— None —" }, ...vendors.map((v) => ({ value: v.id, label: v.name || v.company || v.id }))] },
    { name: "status",        label: "Status",       type: "select", options: PROJECT_STATUSES.map((s) => ({ value: s.k, label: s.label })) },
    { name: "start_date",    label: "Start date",   type: "date" },
    { name: "end_date",      label: "End date",     type: "date" },
    { name: "budget",        label: "Project Budget (₹)", type: "money" },
    { name: "description",   label: "Description",  type: "textarea", full: true, rows: 4 },
  ], [leads, vendors]);

  // Coerce gst_applicable string→bool when saving
  const wrap = (fn) => async (payload) => {
    if (typeof payload.gst_applicable === "string") {
      payload.gst_applicable = payload.gst_applicable === "true";
    }
    return fn(payload);
  };

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
    { key: "client",        label: "Client", render: (r) => r.client || "—" },
    { key: "project_group", label: "Group",  render: (r) => r.project_group ? <span className="px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.1em] bg-[#ff5722]/10 text-[#ff5722] rounded">{r.project_group}</span> : "—" },
    { key: "gst_applicable", label: "GST",
      render: (r) => <StatusPill tone={r.gst_applicable ? "indigo" : "zinc"} label={r.gst_applicable ? "GST" : "Non-GST"} /> },
    { key: "status",     label: "Status", render: (r) => <StatusPill tone={PROJECT_STATUS_TONE[r.status] || "zinc"} label={(PROJECT_STATUSES.find((s) => s.k === r.status) || PROJECT_STATUSES[0]).label} /> },
    { key: "start_date", label: "Start",   render: (r) => <span className="font-mono text-xs">{fmtDate(r.start_date)}</span> },
    { key: "end_date",   label: "End",     render: (r) => <span className="font-mono text-xs">{fmtDate(r.end_date)}</span> },
    { key: "budget",     label: "Budget",  render: (r) => <span className="font-mono">{INR(r.budget)}</span> },
    { key: "total_expenses", label: "Expenses", render: (r) => <span className="font-mono text-rose-600">{INR(r.total_expenses || 0)}</span> },
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
          onClick={() => { setSelectedId(null); loadSummary(); }}
          data-testid="crm-back-to-projects"
          className="inline-flex items-center gap-2 text-sm text-[#4a4a4a] hover:text-[#ff5722] mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> All projects
        </button>
        <ProjectDetail token={token} projectId={selectedId} />
      </div>
    );
  }

  const cards = summary ? [
    { label: "Total projects",  value: summary.total,                       icon: <Briefcase className="h-3.5 w-3.5" />,    tone: "bg-zinc-400" },
    { label: "Total budget",    value: INR(summary.total_budget),           icon: <FolderKanban className="h-3.5 w-3.5" />, tone: "bg-blue-500" },
    { label: "Total invoiced",  value: INR(summary.total_invoiced),         icon: <Receipt className="h-3.5 w-3.5" />,      tone: "bg-indigo-500" },
    { label: "Total received",  value: INR(summary.total_received),         icon: <ArrowUpCircle className="h-3.5 w-3.5" />, tone: "bg-emerald-500", accent: "text-emerald-700" },
    { label: "General expenses", value: INR(summary.total_general_expenses), icon: <ArrowDownCircle className="h-3.5 w-3.5" />, tone: "bg-amber-500" },
    { label: "Vendor expenses",  value: INR(summary.total_vendor_expenses),  icon: <ArrowDownCircle className="h-3.5 w-3.5" />, tone: "bg-rose-500" },
    { label: "Net profit",       value: INR(summary.net_profit),             icon: <Wallet className="h-3.5 w-3.5" />,
      accent: summary.net_profit >= 0 ? "text-emerald-700" : "text-rose-700",
      tone: summary.net_profit >= 0 ? "bg-emerald-500" : "bg-rose-500" },
    { label: "In progress",     value: summary.by_status?.in_progress || 0, icon: <Briefcase className="h-3.5 w-3.5" />, tone: "bg-blue-500" },
  ] : [];

  return (
    <>
      {summary && <SummaryCards cards={cards} />}
      <CrmPanel
        title="Reachvel Projects"
        entityName="projects"
        description="Internal delivery projects with tasks, expenses, vendor payments and invoices."
        fields={fields}
        columns={columns}
        list={(p) => crmList(token, "projects", p)}
        create={wrap((p) => crmCreate(token, "projects", p))}
        update={(id, p) => wrap((pp) => crmUpdate(token, "projects", id, pp))(p)}
        remove={(id) => crmDelete(token, "projects", id)}
        filters={[
          { key: "status", label: "Status", options: PROJECT_STATUSES },
          { key: "project_group", label: "Group", options: PROJECT_GROUPS },
        ]}
        initialForm={{ status: "planning", budget: 0, gst_applicable: "true" }}
        onChange={loadSummary}
      />
    </>
  );
}
