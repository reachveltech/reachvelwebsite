import { useEffect, useState } from "react";
import CrmPanel from "./CrmPanel";
import { crmList, crmCreate, crmUpdate, crmDelete } from "@/lib/api";
import { INR_PRECISE, fmtDate } from "./crmUtils";

export default function ProjectPayments({ token }) {
  const [projects, setProjects] = useState([]);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    Promise.all([crmList(token, "projects"), crmList(token, "invoices")])
      .then(([p, i]) => { setProjects(p); setInvoices(i); })
      .catch(() => {});
  }, [token]);

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));
  const invMap = Object.fromEntries(invoices.map((i) => [i.id, i.invoice_number]));

  const fields = [
    { name: "project_id",  label: "Project",        type: "select", required: true,
      options: [{ value: "", label: "— Select project —" }, ...projects.map((p) => ({ value: p.id, label: p.name }))] },
    { name: "invoice_id",  label: "Against invoice", type: "select",
      options: [{ value: "", label: "— Unlinked —" }, ...invoices.map((i) => ({ value: i.id, label: `${i.invoice_number || "INV"} · ${projectMap[i.project_id] || ""}` }))] },
    { name: "amount",      label: "Amount received (₹)", type: "money", required: true },
    { name: "method",      label: "Method",         type: "text", placeholder: "Bank transfer · UPI · Cheque" },
    { name: "date",        label: "Date",           type: "date" },
    { name: "notes",       label: "Notes",          type: "textarea", full: true, rows: 3 },
  ];

  const columns = [
    { key: "project_id", label: "Project",   render: (r) => <div className="font-semibold">{projectMap[r.project_id] || "—"}</div> },
    { key: "invoice_id", label: "Invoice #", render: (r) => <span className="font-mono text-xs">{invMap[r.invoice_id] || "—"}</span> },
    { key: "amount",     label: "Amount",    render: (r) => <span className="font-mono font-bold text-emerald-600">{INR_PRECISE(r.amount)}</span> },
    { key: "method",     label: "Method",    render: (r) => r.method || "—" },
    { key: "date",       label: "Date",      render: (r) => <span className="font-mono text-xs">{fmtDate(r.date)}</span> },
    { key: "notes",      label: "Notes",     render: (r) => <span className="text-[#4a4a4a] truncate max-w-[24ch] inline-block">{r.notes || "—"}</span> },
  ];

  return (
    <CrmPanel
      title="Project Payments"
      entityName="project-payments"
      description="All client payments across every Reachvel project."
      fields={fields}
      columns={columns}
      list={(p) => crmList(token, "project-payments", p)}
      create={(p) => crmCreate(token, "project-payments", p)}
      update={(id, p) => crmUpdate(token, "project-payments", id, p)}
      remove={(id) => crmDelete(token, "project-payments", id)}
      searchable={false}
    />
  );
}
