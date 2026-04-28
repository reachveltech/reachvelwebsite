import { useRef } from "react";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import CrmPanel from "./CrmPanel";
import { crmList, crmCreate, crmUpdate, crmDelete, crmConvertLead } from "@/lib/api";
import { INR, LEAD_STAGES } from "./crmUtils";

export default function Leads({ token }) {
  const stageOptions = LEAD_STAGES.map((s) => ({ value: s.k, label: s.label }));
  const reloadRef = useRef(0);

  const fields = [
    { name: "name",    label: "Name",    type: "text",   required: true, full: true, placeholder: "John Doe" },
    { name: "email",   label: "Email",   type: "text",   placeholder: "john@example.com" },
    { name: "phone",   label: "Phone",   type: "text",   placeholder: "+91 98…" },
    { name: "company", label: "Company", type: "text",   placeholder: "Acme Corp" },
    { name: "service", label: "Service interest", type: "text", placeholder: "Web · Mobile · AI" },
    { name: "source",  label: "Source",  type: "text",   placeholder: "Referral · LinkedIn · Website" },
    { name: "value",   label: "Deal value (₹)", type: "money" },
    { name: "stage",   label: "Stage",   type: "select", options: stageOptions },
    { name: "owner",   label: "Owner",   type: "text",   placeholder: "Reachvel sales rep" },
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
      const action = res.created ? "Created" : "Linked";
      toast.success(`${action} project "${res.project.name}" from lead.`);
      // Trigger refresh
      reloadRef.current += 1;
      window.dispatchEvent(new CustomEvent("crm-leads-refresh"));
    } catch (err) {
      const detail = err?.response?.data?.detail || "Couldn't convert lead.";
      toast.error(detail);
    }
  };

  const columns = [
    { key: "name",    label: "Name",    render: (r) => <div className="font-semibold">{r.name}</div> },
    { key: "company", label: "Company", render: (r) => r.company || "—" },
    { key: "email",   label: "Email",   render: (r) => r.email || "—" },
    { key: "phone",   label: "Phone",   render: (r) => r.phone || "—" },
    { key: "service", label: "Service", render: (r) => r.service || "—" },
    { key: "value",   label: "Value",   render: (r) => <span className="font-mono">{INR(r.value)}</span> },
    { key: "stage",   label: "Stage",   render: (r) => <StageBadge stage={r.stage} /> },
    { key: "owner",   label: "Owner",   render: (r) => r.owner || "—" },
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

  return (
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
      filters={[{ key: "stage", label: "Stage", options: LEAD_STAGES }]}
      initialForm={{ stage: "new", value: 0 }}
    />
  );
}

function StageBadge({ stage }) {
  const s = LEAD_STAGES.find((x) => x.k === stage) || LEAD_STAGES[0];
  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-black/10 text-[11px] font-mono uppercase tracking-[0.1em]">
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
