import { useEffect, useState } from "react";
import CrmPanel from "./CrmPanel";
import Tasks from "./Tasks";
import { crmGet, crmList, crmCreate, crmUpdate, crmDelete } from "@/lib/api";
import { INR, INR_PRECISE, fmtDate, INVOICE_STATUSES, VENDOR_PAYMENT_STATUSES } from "./crmUtils";

const SUB_TABS = [
  { k: "tasks",    label: "Tasks" },
  { k: "expenses", label: "Expenses" },
  { k: "vendor",   label: "Vendor Payments" },
  { k: "invoices", label: "Invoices" },
  { k: "payments", label: "Client Payments" },
];

export default function ProjectDetail({ token, projectId }) {
  const [project, setProject] = useState(null);
  const [vendors, setVendors] = useState([]);
  const [tab, setTab] = useState("tasks");

  useEffect(() => {
    (async () => {
      try {
        const [p, v] = await Promise.all([
          crmGet(token, "projects", projectId),
          crmList(token, "vendors"),
        ]);
        setProject(p);
        setVendors(v);
      } catch {
        /* noop */
      }
    })();
  }, [token, projectId]);

  if (!project) return <div className="p-10 text-sm text-[#4a4a4a]">Loading project…</div>;

  return (
    <div data-testid={`project-detail-${projectId}`}>
      {/* Header */}
      <div className="bg-white border border-black/10 p-6 md:p-8 mb-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">Project</div>
        <h2 className="mt-1 font-display font-black text-3xl md:text-4xl tracking-tighter text-[#0a0a0a]">
          {project.name}
        </h2>
        <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#4a4a4a]">
          <span><span className="font-mono uppercase text-[10px] tracking-[0.2em] text-[#4a4a4a]/70 mr-2">Client</span>{project.client || "—"}</span>
          <span><span className="font-mono uppercase text-[10px] tracking-[0.2em] text-[#4a4a4a]/70 mr-2">Status</span>{project.status}</span>
          <span><span className="font-mono uppercase text-[10px] tracking-[0.2em] text-[#4a4a4a]/70 mr-2">Budget</span>{INR(project.budget)}</span>
          <span><span className="font-mono uppercase text-[10px] tracking-[0.2em] text-[#4a4a4a]/70 mr-2">Start</span>{fmtDate(project.start_date)}</span>
          <span><span className="font-mono uppercase text-[10px] tracking-[0.2em] text-[#4a4a4a]/70 mr-2">End</span>{fmtDate(project.end_date)}</span>
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

      {tab === "tasks" && <Tasks token={token} projectId={projectId} compact />}
      {tab === "expenses" && <Expenses token={token} projectId={projectId} />}
      {tab === "vendor" && <VendorPayments token={token} projectId={projectId} vendors={vendors} />}
      {tab === "invoices" && <Invoices token={token} projectId={projectId} />}
      {tab === "payments" && <ClientPayments token={token} projectId={projectId} />}
    </div>
  );
}

function Expenses({ token, projectId }) {
  const fields = [
    { name: "description", label: "Description", type: "text", required: true, full: true, placeholder: "AWS credits, software, travel…" },
    { name: "amount",      label: "Amount (₹)",  type: "money", required: true },
    { name: "category",    label: "Category",    type: "text", placeholder: "Infra · Software · Travel" },
    { name: "date",        label: "Date",        type: "date" },
    { name: "receipt_url", label: "Receipt URL", type: "url", full: true, placeholder: "https://…" },
    { name: "notes",       label: "Notes",       type: "textarea", full: true, rows: 3 },
  ];
  const columns = [
    { key: "description", label: "Description", render: (r) => <div className="font-semibold">{r.description}</div> },
    { key: "category",    label: "Category",    render: (r) => r.category || "—" },
    { key: "date",        label: "Date",        render: (r) => <span className="font-mono text-xs">{fmtDate(r.date)}</span> },
    { key: "amount",      label: "Amount",      render: (r) => <span className="font-mono">{INR(r.amount)}</span> },
  ];
  return (
    <CrmPanel
      title="Expenses"
      entityName="expenses"
      fields={fields}
      columns={columns}
      list={(p) => crmList(token, "expenses", { ...p, project_id: projectId })}
      create={(p) => crmCreate(token, "expenses", { ...p, project_id: projectId })}
      update={(id, p) => crmUpdate(token, "expenses", id, p)}
      remove={(id) => crmDelete(token, "expenses", id)}
      extraParams={{ project_id: projectId }}
      searchable={false}
    />
  );
}

function VendorPayments({ token, projectId, vendors }) {
  const vendorMap = Object.fromEntries(vendors.map((v) => [v.id, v.name || v.company || "Vendor"]));
  const fields = [
    { name: "vendor_id",   label: "Vendor",      type: "select", required: true,
      options: [{ value: "", label: "— Select vendor —" }, ...vendors.map((v) => ({ value: v.id, label: v.name || v.company || v.id }))] },
    { name: "description", label: "Description", type: "text", full: true, placeholder: "What was this for?" },
    { name: "amount",      label: "Amount pre-GST (₹)", type: "money", required: true, help: "GST will be computed from the percentage below." },
    { name: "gst_pct",     label: "GST %",       type: "money", help: "Default 18%. Edit if different." },
    { name: "status",      label: "Status",      type: "select", options: VENDOR_PAYMENT_STATUSES.map((s) => ({ value: s.k, label: s.label })) },
    { name: "date",        label: "Date",        type: "date" },
    { name: "notes",       label: "Notes",       type: "textarea", full: true, rows: 3 },
  ];
  const columns = [
    { key: "vendor_id",   label: "Vendor",      render: (r) => vendorMap[r.vendor_id] || "—" },
    { key: "description", label: "Description", render: (r) => r.description || "—" },
    { key: "amount",      label: "Amount",      render: (r) => <span className="font-mono">{INR_PRECISE(r.amount)}</span> },
    { key: "gst_amount",  label: "GST",         render: (r) => <span className="font-mono text-[#4a4a4a]">{INR_PRECISE(r.gst_amount)} <span className="text-[10px]">({r.gst_pct}%)</span></span> },
    { key: "total",       label: "Total",       render: (r) => <span className="font-mono font-bold">{INR_PRECISE(r.total)}</span> },
    { key: "date",        label: "Date",        render: (r) => <span className="font-mono text-xs">{fmtDate(r.date)}</span> },
    { key: "status",      label: "Status",      render: (r) => <StatusPill k={r.status} options={VENDOR_PAYMENT_STATUSES} /> },
  ];
  return (
    <CrmPanel
      title="Vendor Payments"
      entityName="vendor-payments"
      fields={fields}
      columns={columns}
      list={(p) => crmList(token, "vendor-payments", { ...p, project_id: projectId })}
      create={(p) => crmCreate(token, "vendor-payments", { ...p, project_id: projectId })}
      update={(id, p) => crmUpdate(token, "vendor-payments", id, p)}
      remove={(id) => crmDelete(token, "vendor-payments", id)}
      filters={[{ key: "status", label: "Status", options: VENDOR_PAYMENT_STATUSES }]}
      extraParams={{ project_id: projectId }}
      initialForm={{ gst_pct: 18, status: "pending" }}
      searchable={false}
    />
  );
}

function Invoices({ token, projectId }) {
  const fields = [
    { name: "invoice_number", label: "Invoice #",   type: "text", required: true, placeholder: "INV-2026-001" },
    { name: "description",    label: "Description", type: "text", full: true },
    { name: "amount",         label: "Amount pre-GST (₹)", type: "money", required: true },
    { name: "gst_pct",        label: "GST %",       type: "money", help: "Default 18%." },
    { name: "status",         label: "Status",      type: "select", options: INVOICE_STATUSES.map((s) => ({ value: s.k, label: s.label })) },
    { name: "issued_date",    label: "Issued",      type: "date" },
    { name: "due_date",       label: "Due",         type: "date" },
    { name: "notes",          label: "Notes",       type: "textarea", full: true, rows: 3 },
  ];
  const columns = [
    { key: "invoice_number", label: "Invoice #",   render: (r) => <span className="font-mono font-bold">{r.invoice_number}</span> },
    { key: "description",    label: "Description", render: (r) => r.description || "—" },
    { key: "amount",         label: "Subtotal",    render: (r) => <span className="font-mono">{INR_PRECISE(r.amount)}</span> },
    { key: "gst_amount",     label: "GST",         render: (r) => <span className="font-mono text-[#4a4a4a]">{INR_PRECISE(r.gst_amount)} <span className="text-[10px]">({r.gst_pct}%)</span></span> },
    { key: "total",          label: "Total",       render: (r) => <span className="font-mono font-bold">{INR_PRECISE(r.total)}</span> },
    { key: "issued_date",    label: "Issued",      render: (r) => <span className="font-mono text-xs">{fmtDate(r.issued_date)}</span> },
    { key: "due_date",       label: "Due",         render: (r) => <span className="font-mono text-xs">{fmtDate(r.due_date)}</span> },
    { key: "status",         label: "Status",      render: (r) => <StatusPill k={r.status} options={INVOICE_STATUSES} /> },
  ];
  return (
    <CrmPanel
      title="Invoices"
      entityName="invoices"
      fields={fields}
      columns={columns}
      list={(p) => crmList(token, "invoices", { ...p, project_id: projectId })}
      create={(p) => crmCreate(token, "invoices", { ...p, project_id: projectId })}
      update={(id, p) => crmUpdate(token, "invoices", id, p)}
      remove={(id) => crmDelete(token, "invoices", id)}
      filters={[{ key: "status", label: "Status", options: INVOICE_STATUSES }]}
      extraParams={{ project_id: projectId }}
      initialForm={{ gst_pct: 18, status: "draft" }}
      searchable={false}
    />
  );
}

function ClientPayments({ token, projectId }) {
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
      title="Client Payments"
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

function StatusPill({ k, options }) {
  const s = options.find((x) => x.k === k) || options[0];
  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-black/10 text-[11px] font-mono uppercase tracking-[0.1em]">
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
