import CrmPanel from "./CrmPanel";
import { crmList, crmCreate, crmUpdate, crmDelete } from "@/lib/api";
import { INR_PRECISE, fmtDate, REACHVEL_PAYMENT_TYPES } from "./crmUtils";

export default function ReachvelPayments({ token }) {
  const fields = [
    { name: "type",        label: "Type",        type: "select", required: true,
      options: REACHVEL_PAYMENT_TYPES.map((t) => ({ value: t.k, label: t.label })) },
    { name: "category",    label: "Category",    type: "text", placeholder: "Salary · Rent · SaaS · Refund" },
    { name: "description", label: "Description", type: "text", required: true, full: true },
    { name: "amount",      label: "Amount (₹)",  type: "money", required: true },
    { name: "date",        label: "Date",        type: "date" },
    { name: "notes",       label: "Notes",       type: "textarea", full: true, rows: 3 },
  ];

  const columns = [
    { key: "date",        label: "Date",        render: (r) => <span className="font-mono text-xs">{fmtDate(r.date)}</span> },
    { key: "type",        label: "Type",        render: (r) => <TypePill k={r.type} /> },
    { key: "category",    label: "Category",    render: (r) => r.category || "—" },
    { key: "description", label: "Description", render: (r) => <div className="font-semibold">{r.description}</div> },
    {
      key: "amount", label: "Amount",
      render: (r) => (
        <span className={`font-mono font-bold ${r.type === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
          {r.type === "credit" ? "+" : "−"} {INR_PRECISE(r.amount)}
        </span>
      ),
    },
  ];

  return (
    <CrmPanel
      title="Reachvel Payments"
      entityName="reachvel-payments"
      description="Company-wide credit & debit ledger — salaries, rent, refunds, misc."
      fields={fields}
      columns={columns}
      list={(p) => crmList(token, "reachvel-payments", p)}
      create={(p) => crmCreate(token, "reachvel-payments", p)}
      update={(id, p) => crmUpdate(token, "reachvel-payments", id, p)}
      remove={(id) => crmDelete(token, "reachvel-payments", id)}
      filters={[{ key: "type", label: "Type", options: REACHVEL_PAYMENT_TYPES }]}
      initialForm={{ type: "debit" }}
      searchable={false}
    />
  );
}

function TypePill({ k }) {
  const t = REACHVEL_PAYMENT_TYPES.find((x) => x.k === k) || REACHVEL_PAYMENT_TYPES[0];
  return (
    <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-white border border-black/10 text-[11px] font-mono uppercase tracking-[0.1em]">
      <span className={`h-1.5 w-1.5 rounded-full ${t.dot}`} />
      {t.label}
    </span>
  );
}
