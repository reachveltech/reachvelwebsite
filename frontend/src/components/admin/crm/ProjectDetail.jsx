import { useEffect, useState } from "react";
import CrmPanel from "./CrmPanel";
import StatusPill from "./StatusPill";
import Tasks from "./Tasks";
import { crmGet, crmList, crmCreate, crmUpdate, crmDelete } from "@/lib/api";
import {
  INR, INR_PRECISE, fmtDate,
  INVOICE_STATUSES, VENDOR_PAYMENT_STATUSES,
  INVOICE_TONE, VENDOR_PAY_TONE, PROJECT_STATUS_TONE, PROJECT_STATUSES,
} from "./crmUtils";

const SUB_TABS = [
  { k: "tasks",    label: "Tasks" },
  { k: "expenses", label: "Expenses" },
  { k: "vendor",   label: "Vendor Payments" },
  { k: "invoices", label: "Invoices" },
  { k: "payments", label: "Received Payments" },
];

// Convert "true" / "false" strings (from select) → bool
const coerceGst = (p) => {
  const out = { ...p };
  if (typeof out.gst_applicable === "string") out.gst_applicable = out.gst_applicable === "true";
  return out;
};

export default function ProjectDetail({ token, projectId }) {
  const [project, setProject] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [tab, setTab] = useState("tasks");

  const reload = async () => {
    try {
      const [p, v] = await Promise.all([
        crmGet(token, "projects", projectId),
        crmList(token, "vendors"),
      ]);
      setProject(p);
      setVendors(v);
    } catch { /* noop */ }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [token, projectId]);

  if (!project) return <div className="p-10 text-sm text-[#4a4a4a]">Loading project…</div>;

  const projectGstDefault = !!project.gst_applicable;

  return (
    <div data-testid={`project-detail-${projectId}`}>
      {/* Header */}
      <div className="bg-white border border-black/10 p-6 md:p-8 mb-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">Project</div>
          <StatusPill tone={PROJECT_STATUS_TONE[project.status] || "zinc"} label={(PROJECT_STATUSES.find((s) => s.k === project.status) || PROJECT_STATUSES[0]).label} />
          <StatusPill tone={projectGstDefault ? "indigo" : "zinc"} label={projectGstDefault ? "GST" : "Non-GST"} />
          {project.project_group && <StatusPill tone="orange" label={project.project_group} />}
        </div>
        <h2 className="mt-2 crm-h text-3xl md:text-4xl text-[#0a0a0a]">
          {project.name}
        </h2>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#4a4a4a]">
          <Meta k="Client" v={project.client || "—"} />
          <Meta k="Project Budget" v={INR(project.budget)} />
          <Meta k="Start" v={fmtDate(project.start_date)} />
          <Meta k="End" v={fmtDate(project.end_date)} />
        </div>
        {project.description && <p className="mt-4 text-[#0a0a0a] leading-relaxed">{project.description}</p>}
      </div>

      {/* Sub-tabs */}
      <div className="border-b border-black/10 mb-6">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {SUB_TABS.map((t) => (
            <button
              key={t.k}
              data-testid={`project-subtab-${t.k}`}
              onClick={() => setTab(t.k)}
              className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.k
                  ? "border-[#ff5722] text-[#0a0a0a]"
                  : "border-transparent text-[#4a4a4a] hover:text-[#0a0a0a]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "tasks"    && <Tasks token={token} projectId={projectId} compact />}
      {tab === "expenses" && <Expenses token={token} projectId={projectId} defaultGst={projectGstDefault} />}
      {tab === "vendor"   && <VendorPayments token={token} projectId={projectId} vendors={vendors} defaultGst={projectGstDefault} />}
      {tab === "invoices" && <Invoices token={token} projectId={projectId} defaultGst={projectGstDefault} />}
      {tab === "payments" && <ReceivedPayments token={token} projectId={projectId} />}
    </div>
  );
}

function Meta({ k, v }) {
  return (
    <span>
      <span className="font-mono uppercase text-[10px] tracking-[0.2em] text-[#4a4a4a]/70 mr-2">{k}</span>
      {v}
    </span>
  );
}

function Expenses({ token, projectId, defaultGst }) {
  const fields = [
    { name: "description",   label: "Description",     type: "text", required: true, full: true },
    { name: "amount",        label: "Amount (₹)",      type: "money", required: true },
    { name: "gst_applicable", label: "GST",            type: "select",
      options: [{ value: "true", label: "GST" }, { value: "false", label: "Non-GST" }] },
    { name: "gst_pct",       label: "GST %",           type: "money", help: "Default 18%. Ignored if Non-GST." },
    { name: "category",      label: "Category",        type: "text", placeholder: "Infra · Software · Travel" },
    { name: "date",          label: "Date",            type: "date" },
    { name: "receipt_url",   label: "Receipt URL",     type: "url", full: true, placeholder: "https://…" },
    { name: "notes",         label: "Notes",           type: "textarea", full: true, rows: 3 },
  ];
  const columns = [
    { key: "description", label: "Description", render: (r) => <div className="font-semibold">{r.description}</div> },
    { key: "category",    label: "Category",    render: (r) => r.category || "—" },
    { key: "gst_applicable", label: "GST",      render: (r) => <StatusPill tone={r.gst_applicable ? "indigo" : "zinc"} label={r.gst_applicable ? `${r.gst_pct}%` : "None"} /> },
    { key: "amount",      label: "Subtotal",    render: (r) => <span className="font-mono">{INR_PRECISE(r.amount)}</span> },
    { key: "total",       label: "Total",       render: (r) => <span className="font-mono font-bold">{INR_PRECISE(r.total ?? r.amount)}</span> },
    { key: "date",        label: "Date",        render: (r) => <span className="font-mono text-xs">{fmtDate(r.date)}</span> },
  ];
  return (
    <CrmPanel
      title="Expenses"
      entityName="expenses"
      fields={fields}
      columns={columns}
      list={(p) => crmList(token, "expenses", { ...p, project_id: projectId })}
      create={(p) => crmCreate(token, "expenses", { ...coerceGst(p), project_id: projectId })}
      update={(id, p) => crmUpdate(token, "expenses", id, coerceGst(p))}
      remove={(id) => crmDelete(token, "expenses", id)}
      extraParams={{ project_id: projectId }}
      initialForm={{ gst_applicable: defaultGst ? "true" : "false", gst_pct: 18 }}
      searchable={false}
    />
  );
}

function VendorPayments({ token, projectId, vendors, defaultGst }) {
  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name || v.company || "Vendor"]));
  const fields = [
    { name: "vendor_id",     label: "Vendor",          type: "select", required: true,
      options: [{ value: "", label: "— Select vendor —" }, ...vendors.map((v) => ({ value: v.id, label: v.name || v.company || v.id }))] },
    { name: "description",   label: "Description",     type: "text", full: true },
    { name: "amount",        label: "Amount (₹)",      type: "money", required: true },
    { name: "gst_applicable", label: "GST",            type: "select",
      options: [{ value: "true", label: "GST" }, { value: "false", label: "Non-GST" }] },
    { name: "gst_pct",       label: "GST %",           type: "money", help: "Default 18%. Ignored if Non-GST." },
    { name: "status",        label: "Status",          type: "select", options: VENDOR_PAYMENT_STATUSES.map((s) => ({ value: s.k, label: s.label })) },
    { name: "date",          label: "Date",            type: "date" },
    { name: "notes",         label: "Notes",           type: "textarea", full: true, rows: 3 },
  ];
  const columns = [
    { key: "vendor_id",   label: "Vendor",      render: (r) => vendorMap[r.vendor_id] || "—" },
    { key: "description", label: "Description", render: (r) => r.description || "—" },
    { key: "gst_applicable", label: "GST",      render: (r) => <StatusPill tone={r.gst_applicable ? "indigo" : "zinc"} label={r.gst_applicable ? `${r.gst_pct}%` : "None"} /> },
    { key: "amount",      label: "Subtotal",    render: (r) => <span className="font-mono">{INR_PRECISE(r.amount)}</span> },
    { key: "gst_amount",  label: "GST amt",     render: (r) => <span className="font-mono text-[#4a4a4a]">{INR_PRECISE(r.gst_amount || 0)}</span> },
    { key: "total",       label: "Total",       render: (r) => <span className="font-mono font-bold">{INR_PRECISE(r.total ?? r.amount)}</span> },
    { key: "date",        label: "Date",        render: (r) => <span className="font-mono text-xs">{fmtDate(r.date)}</span> },
    { key: "status",      label: "Status",      render: (r) => <StatusPill tone={VENDOR_PAY_TONE[r.status] || "zinc"} label={(VENDOR_PAYMENT_STATUSES.find((s) => s.k === r.status) || VENDOR_PAYMENT_STATUSES[0]).label} /> },
  ];
  return (
    <CrmPanel
      title="Vendor Payments"
      entityName="vendor-payments"
      fields={fields}
      columns={columns}
      list={(p) => crmList(token, "vendor-payments", { ...p, project_id: projectId })}
      create={(p) => crmCreate(token, "vendor-payments", { ...coerceGst(p), project_id: projectId })}
      update={(id, p) => crmUpdate(token, "vendor-payments", id, coerceGst(p))}
      remove={(id) => crmDelete(token, "vendor-payments", id)}
      filters={[{ key: "status", label: "Status", options: VENDOR_PAYMENT_STATUSES }]}
      extraParams={{ project_id: projectId }}
      initialForm={{ gst_applicable: defaultGst ? "true" : "false", gst_pct: 18, status: "pending" }}
      searchable={false}
    />
  );
}

function Invoices({ token, projectId, defaultGst }) {
  const fields = [
    { name: "invoice_number", label: "Invoice #",     type: "text", required: true, placeholder: "INV-2026-001" },
    { name: "description",    label: "Description",   type: "text", full: true },
    { name: "amount",         label: "Amount (₹)",    type: "money", required: true },
    { name: "gst_applicable", label: "GST",           type: "select",
      options: [{ value: "true", label: "GST" }, { value: "false", label: "Non-GST" }] },
    { name: "gst_pct",        label: "GST %",         type: "money", help: "Default 18%. Ignored if Non-GST." },
    { name: "status",         label: "Status",        type: "select", options: INVOICE_STATUSES.map((s) => ({ value: s.k, label: s.label })) },
    { name: "issued_date",    label: "Issued",        type: "date" },
    { name: "due_date",       label: "Due",           type: "date" },
    { name: "notes",          label: "Notes",         type: "textarea", full: true, rows: 3 },
  ];
  const columns = [
    { key: "invoice_number", label: "Invoice #",   render: (r) => <span className="font-mono font-bold">{r.invoice_number}</span> },
    { key: "description",    label: "Description", render: (r) => r.description || "—" },
    { key: "gst_applicable", label: "GST",         render: (r) => <StatusPill tone={r.gst_applicable ? "indigo" : "zinc"} label={r.gst_applicable ? `${r.gst_pct}%` : "None"} /> },
    { key: "amount",         label: "Subtotal",    render: (r) => <span className="font-mono">{INR_PRECISE(r.amount)}</span> },
    { key: "gst_amount",     label: "GST amt",     render: (r) => <span className="font-mono text-[#4a4a4a]">{INR_PRECISE(r.gst_amount || 0)}</span> },
    { key: "total",          label: "Total",       render: (r) => <span className="font-mono font-bold">{INR_PRECISE(r.total ?? r.amount)}</span> },
    { key: "issued_date",    label: "Issued",      render: (r) => <span className="font-mono text-xs">{fmtDate(r.issued_date)}</span> },
    { key: "due_date",       label: "Due",         render: (r) => <span className="font-mono text-xs">{fmtDate(r.due_date)}</span> },
    { key: "status",         label: "Status",      render: (r) => <StatusPill tone={INVOICE_TONE[r.status] || "zinc"} label={(INVOICE_STATUSES.find((s) => s.k === r.status) || INVOICE_STATUSES[0]).label} /> },
  ];
  return (
    <CrmPanel
      title="Invoices"
      entityName="invoices"
      fields={fields}
      columns={columns}
      list={(p) => crmList(token, "invoices", { ...p, project_id: projectId })}
      create={(p) => crmCreate(token, "invoices", { ...coerceGst(p), project_id: projectId })}
      update={(id, p) => crmUpdate(token, "invoices", id, coerceGst(p))}
      remove={(id) => crmDelete(token, "invoices", id)}
      filters={[{ key: "status", label: "Status", options: INVOICE_STATUSES }]}
      extraParams={{ project_id: projectId }}
      initialForm={{ gst_applicable: defaultGst ? "true" : "false", gst_pct: 18, status: "draft" }}
      searchable={false}
    />
  );
}

function ReceivedPayments({ token, projectId }) {
  const [invoices, setInvoices] = useState([]);
  useEffect(() => { crmList(token, "invoices", { project_id: projectId }).then(setInvoices).catch(() => {}); }, [token, projectId]);
  const invMap = Object.fromEntries(invoices.map((i) => [i.id, i.invoice_number]));

  const fields = [
    { name: "invoice_id",  label: "Against invoice", type: "select",
      options: [{ value: "", label: "— Unlinked —" }, ...invoices.map((i) => ({ value: i.id, label: i.invoice_number || i.id }))] },
    { name: "amount",      label: "Amount received (₹)", type: "money", required: true },
    { name: "method",      label: "Method",         type: "text", placeholder: "Bank transfer · UPI · Cheque" },
    { name: "date",        label: "Date",           type: "date" },
    { name: "notes",       label: "Notes",          type: "textarea", full: true, rows: 3 },
  ];
  const columns = [
    { key: "invoice_id", label: "Invoice #", render: (r) => <span className="font-mono">{invMap[r.invoice_id] || "—"}</span> },
    { key: "amount",     label: "Amount",    render: (r) => <span className="font-mono font-bold text-emerald-600">{INR_PRECISE(r.amount)}</span> },
    { key: "method",     label: "Method",    render: (r) => r.method || "—" },
    { key: "date",       label: "Date",      render: (r) => <span className="font-mono text-xs">{fmtDate(r.date)}</span> },
  ];
  return (
    <CrmPanel
      title="Received Payments"
      entityName="project-payments"
      fields={fields}
      columns={columns}
      list={(p) => crmList(token, "project-payments", { ...p, project_id: projectId })}
      create={(p) => crmCreate(token, "project-payments", { ...p, project_id: projectId })}
      update={(id, p) => crmUpdate(token, "project-payments", id, p)}
      remove={(id) => crmDelete(token, "project-payments", id)}
      extraParams={{ project_id: projectId }}
      searchable={false}
    />
  );
}
