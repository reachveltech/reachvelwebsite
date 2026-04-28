import CrmPanel from "./CrmPanel";
import { crmList, crmCreate, crmUpdate, crmDelete } from "@/lib/api";
import { INR, fmtDate, LEAD_STAGES, labelFrom } from "./crmUtils";

export default function Leads({ token }) {
  const stageOptions = LEAD_STAGES.map((s) => ({ value: s.k, label: s.label }));

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

  const columns = [
    { key: "name",    label: "Name",    render: (r) => <div className="font-semibold">{r.name}</div> },
    { key: "company", label: "Company", render: (r) => r.company || "—" },
    { key: "email",   label: "Email",   render: (r) => r.email || "—" },
    { key: "phone",   label: "Phone",   render: (r) => r.phone || "—" },
    { key: "service", label: "Service", render: (r) => r.service || "—" },
    { key: "value",   label: "Value",   render: (r) => <span className="font-mono">{INR(r.value)}</span> },
    { key: "stage",   label: "Stage",   render: (r) => <StageBadge stage={r.stage} /> },
    { key: "owner",   label: "Owner",   render: (r) => r.owner || "—" },
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
