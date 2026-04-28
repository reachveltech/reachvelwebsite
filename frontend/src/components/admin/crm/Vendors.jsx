import { useEffect, useState, useCallback } from "react";
import { Truck, CheckCircle2, XCircle, Wallet } from "lucide-react";
import CrmPanel from "./CrmPanel";
import SummaryCards from "./SummaryCards";
import StatusPill from "./StatusPill";
import { crmList, crmCreate, crmUpdate, crmDelete, crmVendorsSummary } from "@/lib/api";
import { INR, fmtDate, VENDOR_STATUSES, VENDOR_TONE } from "./crmUtils";

export default function Vendors({ token }) {
  const [summary, setSummary] = useState(null);

  const loadSummary = useCallback(async () => {
    try { setSummary(await crmVendorsSummary(token)); } catch { /* noop */ }
  }, [token]);

  useEffect(() => { loadSummary(); }, [loadSummary]);

  const fields = [
    { name: "name",       label: "Contact name", type: "text", required: true, placeholder: "Priya Sharma" },
    { name: "company",    label: "Company",      type: "text", placeholder: "Sharma Cloud Pvt Ltd" },
    { name: "email",      label: "Email",        type: "text", placeholder: "priya@sharma.co" },
    { name: "phone",      label: "Phone",        type: "text", placeholder: "+91 98…" },
    { name: "services",   label: "Services offered", type: "text", full: true, placeholder: "Infra, hosting, cloud" },
    { name: "gst_number", label: "GSTIN",        type: "text", placeholder: "29ABCDE1234F2Z5" },
    { name: "status",     label: "Status",       type: "select", options: VENDOR_STATUSES.map((s) => ({ value: s.k, label: s.label })) },
    { name: "onboarded_date", label: "Onboarded date", type: "date" },
    { name: "address",    label: "Address",      type: "textarea", full: true, rows: 2 },
    { name: "notes",      label: "Notes",        type: "textarea", full: true, rows: 3 },
  ];

  const columns = [
    { key: "name",       label: "Contact",  render: (r) => <div className="font-semibold">{r.name}</div> },
    { key: "company",    label: "Company",  render: (r) => r.company || "—" },
    { key: "email",      label: "Email",    render: (r) => r.email || "—" },
    { key: "phone",      label: "Phone",    render: (r) => r.phone || "—" },
    { key: "services",   label: "Services", render: (r) => <span className="text-[#4a4a4a]">{r.services || "—"}</span> },
    { key: "gst_number", label: "GSTIN",    render: (r) => <span className="font-mono text-xs">{r.gst_number || "—"}</span> },
    { key: "status",     label: "Status",   render: (r) => <StatusPill tone={VENDOR_TONE[r.status] || "zinc"} label={(VENDOR_STATUSES.find((s) => s.k === r.status) || VENDOR_STATUSES[0]).label} /> },
    { key: "onboarded_date", label: "Onboarded", render: (r) => <span className="font-mono text-xs">{fmtDate(r.onboarded_date)}</span> },
  ];

  const cards = summary ? [
    { label: "Total vendors",  value: summary.total,                  icon: <Truck className="h-3.5 w-3.5" />,        tone: "bg-zinc-400" },
    { label: "Active",         value: summary.active,                 icon: <CheckCircle2 className="h-3.5 w-3.5" />, tone: "bg-emerald-500", accent: "text-emerald-700" },
    { label: "Inactive",       value: summary.inactive,               icon: <XCircle className="h-3.5 w-3.5" />,      tone: "bg-zinc-400" },
    { label: "Paid outflow",   value: INR(summary.total_paid_outflow), icon: <Wallet className="h-3.5 w-3.5" />,      tone: "bg-rose-500" },
  ] : [];

  return (
    <>
      {summary && <SummaryCards cards={cards} />}
      <CrmPanel
        title="Vendors"
        entityName="vendors"
        description="Directory of partners, contractors, and suppliers."
        fields={fields}
        columns={columns}
        list={(p) => crmList(token, "vendors", p)}
        create={(p) => crmCreate(token, "vendors", p)}
        update={(id, p) => crmUpdate(token, "vendors", id, p)}
        remove={(id) => crmDelete(token, "vendors", id)}
        filters={[{ key: "status", label: "Status", options: VENDOR_STATUSES }]}
        initialForm={{ status: "active" }}
        onChange={loadSummary}
      />
    </>
  );
}
