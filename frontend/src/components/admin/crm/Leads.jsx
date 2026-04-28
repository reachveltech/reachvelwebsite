import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { Rocket, UserCircle2, TrendingUp, Trophy, CalendarClock } from "lucide-react";
import CrmPanel from "./CrmPanel";
import SummaryCards from "./SummaryCards";
import StatusPill from "./StatusPill";
import {
  crmList, crmCreate, crmUpdate, crmDelete, crmConvertLead, crmLeadsSummary,
} from "@/lib/api";
import {
  INR, fmtDate, LEAD_STAGES, SERVICE_INTERESTS, LEAD_SOURCES, STAGE_TONE,
} from "./crmUtils";

export default function Leads({ token }) {
  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(async () => {
    try { setSummary(await crmLeadsSummary(token)); } catch { /* noop */ }
  }, [token]);

  useEffect(() => {
    loadSummary();
    const handler = () => loadSummary();
    window.addEventListener("crm-leads-refresh", handler);
    return () => window.removeEventListener("crm-leads-refresh", handler);
  }, [loadSummary]);

  const fields = [
    { name: "name",    label: "Name",    type: "text",   required: true, full: true, placeholder: "John Doe" },
    { name: "email",   label: "Email",   type: "text",   placeholder: "john@example.com" },
    { name: "phone",   label: "Phone",   type: "text",   placeholder: "+91 98…" },
    { name: "company", label: "Company", type: "text",   placeholder: "Acme Corp" },
    { name: "service", label: "Service interest", type: "select",
      options: [{ value: "", label: "— Select —" }, ...SERVICE_INTERESTS.map((s) => ({ value: s.k, label: s.label }))] },
    { name: "source",  label: "Source",  type: "select",
      options: [{ value: "", label: "— Select —" }, ...LEAD_SOURCES.map((s) => ({ value: s.k, label: s.label }))] },
    { name: "value",   label: "Deal value (₹)", type: "money" },
    { name: "stage",   label: "Stage",   type: "select", options: LEAD_STAGES.map((s) => ({ value: s.k, label: s.label })) },
    { name: "owner",   label: "Owner",   type: "text",   placeholder: "Reachvel sales rep" },
    { name: "follow_up_date", label: "Follow-up date", type: "date" },
    { name: "notes",   label: "Notes",   type: "textarea", full: true, rows: 4 },
  ];

  const handleConvert = async (lead) => {
    if (lead.stage === "won") {
      if (!window.confirm("This lead is already marked Won. Create a new project from it anyway?")) return;
    } else {
      if (!window.confirm(`Convert "${lead.name}" into a Reachvel Project?\nThis will mark the lead as Won and carry over ${INR(lead.value)} as budget.`)) return;
    }
    try {
      const res = await crmConvertLead(token, lead.id);
      toast.success(`${res.created ? "Created" : "Linked"} project "${res.project.name}".`);
      window.dispatchEvent(new CustomEvent("crm-leads-refresh"));
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Couldn't convert lead.");
    }
  };

  const columns = [
    { key: "name",    label: "Name",    render: (r) => <div className="font-semibold">{r.name}</div> },
    { key: "company", label: "Company", render: (r) => r.company || "—" },
    { key: "email",   label: "Email",   render: (r) => r.email || "—" },
    { key: "phone",   label: "Phone",   render: (r) => r.phone || "—" },
    { key: "service", label: "Service", render: (r) => r.service || "—" },
    { key: "source",  label: "Source",  render: (r) => r.source || "—" },
    { key: "value",   label: "Value",   render: (r) => <span className="font-mono">{INR(r.value)}</span> },
    { key: "stage",   label: "Stage",   render: (r) => <StatusPill tone={STAGE_TONE[r.stage] || "zinc"} label={LEAD_STAGES.find((s) => s.k === r.stage)?.label || r.stage} /> },
    { key: "owner",   label: "Owner",   render: (r) => r.owner || "—" },
    { key: "follow_up_date", label: "Follow-up", render: (r) => <span className="font-mono text-xs">{fmtDate(r.follow_up_date)}</span> },
    { key: "created_at",     label: "Created",   render: (r) => <span className="font-mono text-[10px] text-[#4a4a4a]">{fmtDate(r.created_at)}</span> },
    { key: "updated_at",     label: "Updated",   render: (r) => <span className="font-mono text-[10px] text-[#4a4a4a]">{fmtDate(r.updated_at)}</span> },
    {
      key: "convert", label: "Convert",
      render: (r) => (
        <button
          onClick={() => handleConvert(r)}
          data-testid={`crm-convert-lead-${r.id}`}
          disabled={r.stage === "lost"}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-[#ff5722]/30 text-[11px] font-mono uppercase tracking-[0.1em] text-[#ff5722] hover:bg-[#ff5722] hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          title={r.stage === "lost" ? "Can't convert a lost lead" : "Create a Reachvel Project from this lead"}
        >
          <Rocket className="h-3 w-3" /> To project
        </button>
      ),
    },
  ];

  const cards = summary ? [
    { label: "Total leads",     value: summary.total,                icon: <UserCircle2 className="h-3.5 w-3.5" />, tone: "bg-zinc-400" },
    { label: "Pipeline value",  value: INR(summary.pipeline_value),  icon: <TrendingUp className="h-3.5 w-3.5" />,  tone: "bg-blue-500" },
    { label: "Won deals value", value: INR(summary.won_value),       icon: <Trophy className="h-3.5 w-3.5" />,      tone: "bg-emerald-500", accent: "text-emerald-700" },
    { label: "Follow-ups (7d)", value: summary.follow_ups_due_7d,    icon: <CalendarClock className="h-3.5 w-3.5" />, tone: "bg-amber-500" },
  ] : [];

  return (
    <>
      {summary && <SummaryCards cards={cards} />}
      <CrmPanel
        title="Leads"
        entityName="leads"
        description="Track prospects through each stage of the funnel."
        fields={fields}
        columns={columns}
        list={(p) => crmList(token, "leads", p)}
        create={(p) => crmCreate(token, "leads", p)}
        update={(id, p) => crmUpdate(token, "leads", id, p)}
        remove={(id) => crmDelete(token, "leads", id)}
        filters={[
          { key: "stage",   label: "Stage",   options: LEAD_STAGES },
          { key: "service", label: "Service", options: SERVICE_INTERESTS },
          { key: "source",  label: "Source",  options: LEAD_SOURCES },
        ]}
        initialForm={{ stage: "new", value: 0 }}
        onChange={loadSummary}
      />
    </>
  );
}
