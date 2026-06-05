import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ReceiptText, X, Save } from "lucide-react";
import CrmPanel from "./CrmPanel";
import StatusPill from "./StatusPill";
import Tasks from "./Tasks";
import { crmGet, crmList, crmCreate, crmUpdate, crmDelete, crmRecordInvoicePayment } from "@/lib/api";
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
        {(project.contact_person || project.contact_phone || project.contact_email) && (
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#4a4a4a]">
            {project.contact_person && <Meta k="Contact" v={project.contact_person} />}
            {project.contact_phone && <Meta k="Mobile" v={project.contact_phone} />}
            {project.contact_email && <Meta k="Email" v={project.contact_email} />}
          </div>
        )}
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
      update={(id, p) => crmUpdate(token, "expenses", id, { ...coerceGst(p), project_id: projectId })}
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
      update={(id, p) => crmUpdate(token, "vendor-payments", id, { ...coerceGst(p), project_id: projectId })}
      remove={(id) => crmDelete(token, "vendor-payments", id)}
      filters={[{ key: "status", label: "Status", options: VENDOR_PAYMENT_STATUSES }]}
      extraParams={{ project_id: projectId }}
      initialForm={{ gst_applicable: defaultGst ? "true" : "false", gst_pct: 18, status: "pending" }}
      searchable={false}
    />
  );
}

function Invoices({ token, projectId, defaultGst }) {
  const [recordingFor, setRecordingFor] = useState(null);

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
    { name: "paid_date",      label: "Paid date",     type: "date", help: "Auto-filled when status flips to Paid." },
    { name: "notes",          label: "Notes",         type: "textarea", full: true, rows: 3 },
  ];
  const columns = [
    { key: "invoice_number", label: "Invoice #",   render: (r) => <span className="font-mono font-bold">{r.invoice_number}</span> },
    { key: "gst_applicable", label: "GST",         render: (r) => <StatusPill tone={r.gst_applicable ? "indigo" : "zinc"} label={r.gst_applicable ? `${r.gst_pct}%` : "None"} /> },
    { key: "total",          label: "Total",       render: (r) => <span className="font-mono font-bold">{INR_PRECISE(r.total ?? r.amount)}</span> },
    { key: "paid_amount",    label: "Paid",        render: (r) => <span className="font-mono text-emerald-700">{INR_PRECISE(r.paid_amount || 0)}</span> },
    { key: "balance",        label: "Balance",     render: (r) => {
        const bal = r.balance ?? Math.max((r.total ?? r.amount) - (r.paid_amount || 0), 0);
        return <span className={`font-mono ${bal > 0 ? "text-rose-700" : "text-[#4a4a4a]"}`}>{INR_PRECISE(bal)}</span>;
      } },
    {
      key: "record", label: "Payment",
      render: (r) => {
        const bal = r.balance ?? Math.max((r.total ?? r.amount) - (r.paid_amount || 0), 0);
        if (bal <= 0.01) return <span className="text-[10px] font-mono uppercase tracking-[0.15em] text-emerald-700 font-bold">✓ Settled</span>;
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setRecordingFor(r); }}
            data-testid={`invoice-record-${r.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.15em] bg-[#ff5722] text-white rounded-full hover:bg-[#0a0a0a] transition-colors shadow-sm"
          >
            <ReceiptText className="h-3.5 w-3.5" /> Record
          </button>
        );
      },
    },
    { key: "issued_date",    label: "Issued",      render: (r) => <span className="font-mono text-xs">{fmtDate(r.issued_date)}</span> },
    { key: "due_date",       label: "Due",         render: (r) => <span className="font-mono text-xs">{fmtDate(r.due_date)}</span> },
    { key: "paid_date",      label: "Paid on",     render: (r) => <span className="font-mono text-xs text-emerald-700">{r.paid_date ? fmtDate(r.paid_date) : "—"}</span> },
    { key: "status",         label: "Status",      render: (r) => <StatusPill tone={INVOICE_TONE[r.status] || "zinc"} label={(INVOICE_STATUSES.find((s) => s.k === r.status) || INVOICE_STATUSES[0]).label} /> },
  ];

  const triggerReload = () => {
    window.dispatchEvent(new Event("crm-invoices-refresh"));
    window.dispatchEvent(new Event("crm-project-payments-refresh"));
  };

  return (
    <>
      <CrmPanel
        title="Invoices"
        entityName="invoices"
        fields={fields}
        columns={columns}
        list={(p) => crmList(token, "invoices", { ...p, project_id: projectId })}
        create={(p) => crmCreate(token, "invoices", { ...coerceGst(p), project_id: projectId })}
        update={(id, p) => crmUpdate(token, "invoices", id, { ...coerceGst(p), project_id: projectId })}
        remove={(id) => crmDelete(token, "invoices", id)}
        filters={[{ key: "status", label: "Status", options: INVOICE_STATUSES }]}
        extraParams={{ project_id: projectId }}
        initialForm={{ gst_applicable: defaultGst ? "true" : "false", gst_pct: 18, status: "draft" }}
        searchable={false}
      />
      {recordingFor && (
        <RecordPaymentModal
          token={token}
          invoice={recordingFor}
          onClose={() => setRecordingFor(null)}
          onSuccess={() => { setRecordingFor(null); triggerReload(); }}
        />
      )}
    </>
  );
}

function RecordPaymentModal({ token, invoice, onClose, onSuccess }) {
  const total = invoice.total ?? invoice.amount ?? 0;
  const paid = invoice.paid_amount || 0;
  const balance = Math.max(total - paid, 0);
  const today = new Date().toISOString().slice(0, 10);

  const [form, setForm] = useState({
    amount: balance,
    date: today,
    method: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const amt = Number(form.amount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount"); return; }
    if (amt > balance + 0.01) {
      if (!window.confirm(`This will record ₹${amt.toFixed(2)} which exceeds the balance of ₹${balance.toFixed(2)}. Continue?`)) return;
    }
    setBusy(true);
    try {
      await crmRecordInvoicePayment(token, invoice.id, {
        amount: amt,
        date: form.date,
        method: form.method,
        notes: form.notes,
      });
      toast.success(amt + balance >= total ? "Payment recorded — invoice settled." : "Partial payment recorded.");
      onSuccess();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Failed to record payment");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="record-payment-modal" className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm p-0 md:p-6">
      <div className="bg-white w-full md:max-w-md max-h-[90vh] overflow-auto rounded-t-2xl md:rounded-2xl border border-black/10 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/10">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#ff5722] font-bold">Record Payment</div>
            <div className="font-bold text-[#0a0a0a] mt-0.5">{invoice.invoice_number}</div>
          </div>
          <button onClick={onClose} data-testid="record-payment-close" className="text-[#4a4a4a] hover:text-[#0a0a0a]"><X className="h-5 w-5" /></button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-[#f7f6f3] rounded p-2.5">
              <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-[#4a4a4a]">Total</div>
              <div className="font-bold font-mono">{INR_PRECISE(total)}</div>
            </div>
            <div className="bg-emerald-50 rounded p-2.5">
              <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-emerald-700">Paid</div>
              <div className="font-bold font-mono text-emerald-700">{INR_PRECISE(paid)}</div>
            </div>
            <div className="bg-rose-50 rounded p-2.5">
              <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-rose-700">Balance</div>
              <div className="font-bold font-mono text-rose-700">{INR_PRECISE(balance)}</div>
            </div>
          </div>
          <Field label="Amount received (₹)" required>
            <input
              type="number"
              step="0.01"
              data-testid="record-payment-amount"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="w-full border border-black/15 rounded px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Payment date">
            <input
              type="date"
              data-testid="record-payment-date"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="w-full border border-black/15 rounded px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Method">
            <input
              type="text"
              placeholder="Bank transfer · UPI · Cheque · Cash"
              data-testid="record-payment-method"
              value={form.method}
              onChange={(e) => setForm({ ...form, method: e.target.value })}
              className="w-full border border-black/15 rounded px-3 py-2 text-sm"
            />
          </Field>
          <Field label="Notes">
            <textarea
              rows={2}
              data-testid="record-payment-notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              className="w-full border border-black/15 rounded px-3 py-2 text-sm"
            />
          </Field>
        </div>
        <div className="px-5 py-4 border-t border-black/10 flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 text-xs border border-black/15 rounded-full">Cancel</button>
          <button
            onClick={submit}
            disabled={busy}
            data-testid="record-payment-submit"
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold uppercase tracking-[0.15em] bg-[#0a0a0a] text-white rounded-full hover:bg-[#ff5722] disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {busy ? "Saving…" : "Record Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <label className="block">
      <span className="block text-[11px] font-mono uppercase tracking-[0.15em] text-[#4a4a4a] mb-1.5">
        {label}{required && <span className="text-[#ff5722]"> *</span>}
      </span>
      {children}
    </label>
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
    {
      key: "invoice_id", label: "Invoice #",
      render: (r) => (
        <span className="inline-flex items-center gap-2">
          <span className="font-mono">{invMap[r.invoice_id] || "—"}</span>
          {r.auto_synced && (
            <span
              title="Auto-synced from a paid invoice. Edits will be overwritten when the invoice changes."
              className="px-1.5 py-0.5 text-[9px] font-mono uppercase tracking-[0.15em] rounded bg-[#ff5722]/10 text-[#ff5722] border border-[#ff5722]/30"
            >
              Auto
            </span>
          )}
        </span>
      ),
    },
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
      update={(id, p) => crmUpdate(token, "project-payments", id, { ...p, project_id: projectId })}
      remove={(id) => crmDelete(token, "project-payments", id)}
      extraParams={{ project_id: projectId }}
      searchable={false}
      rowGuard={(r) => r.auto_synced ? {
        lockEdit: true,
        lockLabel: "Synced",
        reason: "Auto-synced from a recorded invoice payment. Delete to remove it, or edit the invoice to change the amount.",
      } : null}
    />
  );
}
