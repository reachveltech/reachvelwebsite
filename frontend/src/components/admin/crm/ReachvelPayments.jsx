import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import { RefreshCw, Wallet, ArrowUpCircle, ArrowDownCircle, TrendingUp, Sparkles } from "lucide-react";
import CrmPanel from "./CrmPanel";
import SummaryCards from "./SummaryCards";
import StatusPill from "./StatusPill";
import {
  crmList, crmCreate, crmUpdate, crmDelete, crmReachvelSummary, crmReachvelSync,
} from "@/lib/api";
import {
  INR, INR_PRECISE, fmtDate, REACHVEL_PAYMENT_TYPES,
  REACHVEL_CREDIT_CATEGORIES, REACHVEL_DEBIT_CATEGORIES, BANKS,
  PAYMENT_TYPE_TONE,
} from "./crmUtils";

export default function ReachvelPayments({ token }) {
  const [summary, setSummary] = useState(null);
  const [projects, setProjects] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const loadSummary = useCallback(async () => {
    try { setSummary(await crmReachvelSummary(token)); } catch { /* noop */ }
  }, [token]);

  useEffect(() => {
    loadSummary();
    crmList(token, "projects").then(setProjects).catch(() => {});
  }, [token, loadSummary, reloadKey]);

  const projectMap = Object.fromEntries(projects.map((p) => [p.id, p.name]));

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await crmReachvelSync(token);
      const total = (res.added_credits || 0) + (res.added_debits || 0);
      if (total === 0 && (res.updated || 0) === 0) {
        toast.success("Already up to date.");
      } else {
        toast.success(`Synced: +${res.added_credits} credits, +${res.added_debits} debits, ${res.updated} updated`);
      }
      loadSummary();
      setReloadKey((k) => k + 1);
      window.dispatchEvent(new CustomEvent("crm-reachvel-payments-refresh"));
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Sync failed.");
    } finally {
      setSyncing(false);
    }
  };

  // Form fields — both credit & debit categories are listed with [Credit]/[Debit] prefix.
  // Selecting Type narrows visually (admin can pick any compatible category).

  const fields = [
    { name: "type",        label: "Type",        type: "select", required: true,
      options: REACHVEL_PAYMENT_TYPES.map((t) => ({ value: t.k, label: t.label })) },
    { name: "category",    label: "Category",    type: "select",
      options: [
        { value: "", label: "— Select after choosing Type —" },
        ...REACHVEL_CREDIT_CATEGORIES.map((c) => ({ value: c.k, label: `[Credit] ${c.label}` })),
        ...REACHVEL_DEBIT_CATEGORIES.map((c) => ({ value: c.k, label: `[Debit] ${c.label}` })),
      ] },
    { name: "description", label: "Description", type: "text", required: true, full: true },
    { name: "amount",      label: "Amount (₹)",  type: "money", required: true },
    { name: "bank",        label: "Bank",        type: "select",
      options: [{ value: "", label: "— None —" }, ...BANKS.map((b) => ({ value: b.k, label: b.label }))] },
    { name: "source",      label: "Source",      type: "text", placeholder: "e.g. Manual / Project name / Vendor" },
    { name: "project_id",  label: "Project",     type: "select",
      options: [{ value: "", label: "— Unlinked —" }, ...projects.map((p) => ({ value: p.id, label: p.name }))] },
    { name: "date",        label: "Date",        type: "date" },
    { name: "notes",       label: "Notes",       type: "textarea", full: true, rows: 3 },
  ];

  const columns = [
    { key: "date",        label: "Date",        render: (r) => <span className="font-mono text-xs">{fmtDate(r.date)}</span> },
    { key: "type",        label: "Type",        render: (r) => <StatusPill tone={PAYMENT_TYPE_TONE[r.type] || "zinc"} label={r.type === "credit" ? "Credit" : "Debit"} /> },
    { key: "category",    label: "Category",    render: (r) => r.category ? <StatusPill tone={r.type === "credit" ? "emerald" : "rose"} label={r.category} className="!bg-white" /> : "—" },
    { key: "description", label: "Description", render: (r) => <div className="font-semibold">{r.description}</div> },
    { key: "bank",        label: "Bank",        render: (r) => r.bank ? <StatusPill tone="violet" label={r.bank} /> : "—" },
    { key: "source",      label: "Source",      render: (r) => r.source || (r.source_type === "manual" || !r.source_type ? "Manual" : "—") },
    { key: "project_id",  label: "Project",     render: (r) => projectMap[r.project_id] || "—" },
    { key: "source_type", label: "Origin",      render: (r) => {
      if (!r.source_type || r.source_type === "manual") return <StatusPill tone="zinc" label="Manual" />;
      return <StatusPill tone="orange" label="Synced" />;
    }},
    {
      key: "amount", label: "Amount",
      render: (r) => (
        <span className={`font-mono font-bold ${r.type === "credit" ? "text-emerald-600" : "text-rose-600"}`}>
          {r.type === "credit" ? "+" : "−"} {INR_PRECISE(r.amount)}
        </span>
      ),
    },
  ];

  const cards = summary ? [
    { label: "Total credit", value: INR(summary.credit_total),  icon: <ArrowUpCircle className="h-3.5 w-3.5" />,   tone: "bg-emerald-500", accent: "text-emerald-700" },
    { label: "Total debit",  value: INR(summary.debit_total),   icon: <ArrowDownCircle className="h-3.5 w-3.5" />, tone: "bg-rose-500",    accent: "text-rose-700" },
    { label: "Net cashflow", value: INR(summary.net),           icon: <TrendingUp className="h-3.5 w-3.5" />,
      tone: summary.net >= 0 ? "bg-emerald-500" : "bg-rose-500",
      accent: summary.net >= 0 ? "text-emerald-700" : "text-rose-700" },
    { label: "Records",      value: summary.total,              icon: <Wallet className="h-3.5 w-3.5" />,         tone: "bg-blue-500",
      sub: `${summary.synced} synced · ${summary.manual} manual` },
  ] : [];

  return (
    <div data-testid="crm-reachvel-payments-page">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">Reachvel Payments</div>
          <h2 className="mt-1 crm-h text-3xl md:text-4xl text-[#0a0a0a]">
            Company ledger
          </h2>
          <p className="mt-2 text-sm text-[#4a4a4a]">Sync from projects + manual entries. Track every credit & debit.</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          data-testid="crm-reachvel-sync"
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-[0.15em] border border-[#ff5722] text-[#ff5722] rounded-full hover:bg-[#ff5722] hover:text-white transition-colors disabled:opacity-60"
        >
          <Sparkles className={`h-4 w-4 ${syncing ? "animate-pulse" : ""}`} /> {syncing ? "Syncing…" : "Sync Projects"}
          <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {summary && <SummaryCards cards={cards} />}

      <CrmPanel
        key={reloadKey}
        title="Ledger entries"
        entityName="reachvel-payments"
        fields={fields}
        columns={columns}
        list={(p) => crmList(token, "reachvel-payments", p)}
        create={(p) => crmCreate(token, "reachvel-payments", p)}
        update={(id, p) => crmUpdate(token, "reachvel-payments", id, p)}
        remove={(id) => crmDelete(token, "reachvel-payments", id)}
        filters={[
          { key: "type",     label: "Type",     options: REACHVEL_PAYMENT_TYPES },
          { key: "category", label: "Category", options: [...REACHVEL_CREDIT_CATEGORIES, ...REACHVEL_DEBIT_CATEGORIES.filter((c) => !REACHVEL_CREDIT_CATEGORIES.find((x) => x.k === c.k))] },
          { key: "bank",     label: "Bank",     options: BANKS },
        ]}
        initialForm={{ type: "debit", category: "" }}
        searchable={false}
        onChange={loadSummary}
      />
    </div>
  );
}
