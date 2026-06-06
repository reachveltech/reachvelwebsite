import { useEffect, useState, useCallback } from "react";
import { RefreshCw, Wallet, Receipt, ArrowUpCircle, ArrowDownCircle, TrendingUp, Eraser } from "lucide-react";
import { toast } from "sonner";
import SummaryCards from "./SummaryCards";
import StatusPill from "./StatusPill";
import { crmProjectsAggregates, crmProjectsSummary, crmOrphansCheck, crmOrphansCleanup } from "@/lib/api";
import { INR, INR_PRECISE, PROJECT_STATUSES, PROJECT_STATUS_TONE } from "./crmUtils";

export default function ProjectPayments({ token }) {
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  // null = default (created_at desc from API), "pending-desc" = sort by total_pending
  const [sortMode, setSortMode] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([
        crmProjectsAggregates(token),
        crmProjectsSummary(token),
      ]);
      setRows(r);
      setSummary(s);
    } catch {
      toast.error("Couldn't load project aggregates");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { reload(); }, [reload]);

  const onCleanupOrphans = async () => {
    setCleaning(true);
    try {
      const report = await crmOrphansCheck(token);
      const total = report.total_orphans || 0;
      if (total === 0) {
        toast.success("No orphan records found — your books are clean.");
        return;
      }
      const ok = window.confirm(
        `Found ${total} orphan record(s) linked to deleted projects:\n` +
        Object.entries(report)
          .filter(([k]) => !["active_projects", "total_orphans"].includes(k))
          .map(([k, v]) => `  • ${k}: ${v}`)
          .join("\n") +
        `\n\nDelete all of them? This cannot be undone.`
      );
      if (!ok) return;
      const res = await crmOrphansCleanup(token);
      toast.success(`Removed ${res.total_removed} orphan record(s).`);
      reload();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Cleanup failed");
    } finally {
      setCleaning(false);
    }
  };

  const togglePendingSort = () => {
    setSortMode((m) => (m === "pending-desc" ? null : "pending-desc"));
  };

  const cards = summary ? [
    { label: "Total budget",     value: INR(summary.total_budget),           icon: <Wallet className="h-3.5 w-3.5" />,        tone: "bg-blue-500" },
    { label: "Total invoiced",   value: INR(summary.total_invoiced),         icon: <Receipt className="h-3.5 w-3.5" />,       tone: "bg-indigo-500" },
    { label: "Total received",   value: INR(summary.total_received),         icon: <ArrowUpCircle className="h-3.5 w-3.5" />, tone: "bg-emerald-500", accent: "text-emerald-700" },
    { label: "Total pending",    value: INR(summary.total_pending ?? Math.max((summary.total_invoiced || 0) - (summary.total_received || 0), 0)),
      icon: <Receipt className="h-3.5 w-3.5" />,
      tone: "bg-amber-500", accent: "text-amber-700",
      onClick: togglePendingSort,
      active: sortMode === "pending-desc",
    },
    { label: "General expenses", value: INR(summary.total_general_expenses), icon: <ArrowDownCircle className="h-3.5 w-3.5" />, tone: "bg-amber-500" },
    { label: "Vendor expenses",  value: INR(summary.total_vendor_expenses),  icon: <ArrowDownCircle className="h-3.5 w-3.5" />, tone: "bg-rose-500" },
    { label: "Net profit",       value: INR(summary.net_profit),             icon: <TrendingUp className="h-3.5 w-3.5" />,
      accent: summary.net_profit >= 0 ? "text-emerald-700" : "text-rose-700",
      tone: summary.net_profit >= 0 ? "bg-emerald-500" : "bg-rose-500" },
  ] : [];

  const displayRows = sortMode === "pending-desc"
    ? [...rows].sort((a, b) => {
        const pa = a.total_pending ?? Math.max((a.total_invoiced || 0) - (a.total_received || 0), 0);
        const pb = b.total_pending ?? Math.max((b.total_invoiced || 0) - (b.total_received || 0), 0);
        return pb - pa;
      })
    : rows;

  return (
    <div data-testid="crm-project-payments-page">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">Project Payments</div>
          <h2 className="mt-1 crm-h text-3xl md:text-4xl text-[#0a0a0a]">
            Per-project rollup
          </h2>
          <p className="mt-2 text-sm text-[#4a4a4a]">
            Live totals computed from invoices, expenses, vendor payments, and received payments.
            Add records inside each project's detail view.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onCleanupOrphans}
            data-testid="crm-pp-cleanup-orphans"
            disabled={cleaning}
            title="Find and delete invoices/expenses/payments whose project was deleted."
            className="inline-flex items-center gap-2 px-4 py-2 text-xs border border-black/15 rounded-full hover:border-rose-500 hover:text-rose-500 transition-colors disabled:opacity-60"
          >
            <Eraser className={`h-4 w-4 ${cleaning ? "animate-pulse" : ""}`} /> {cleaning ? "Cleaning…" : "Cleanup orphans"}
          </button>
          <button
            onClick={reload}
            data-testid="crm-pp-refresh"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs border border-black/15 rounded-full hover:border-[#ff5722] hover:text-[#ff5722] transition-colors"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
      </div>

      {summary && <SummaryCards cards={cards} />}

      <div className="bg-white border border-black/10 overflow-x-auto">
        {loading ? (
          <div className="p-10 text-sm text-[#4a4a4a]">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="p-10 text-sm text-[#4a4a4a]">No projects yet.</div>
        ) : (
          <table className="w-full text-left min-w-[1100px]">
            <thead className="bg-[#f7f6f3] border-b border-black/10 text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
              <tr>
                <th className="px-4 py-4 w-12">S.No</th>
                <th className="px-4 py-4">Project</th>
                <th className="px-4 py-4">GST</th>
                <th className="px-4 py-4 text-right">Total Budget</th>
                <th className="px-4 py-4 text-right">Total Invoiced</th>
                <th className="px-4 py-4 text-right">Total Received</th>
                <th
                  className={`px-4 py-4 text-right cursor-pointer select-none transition-colors ${sortMode === "pending-desc" ? "text-[#ff5722]" : "hover:text-[#ff5722]"}`}
                  onClick={togglePendingSort}
                  data-testid="crm-pp-pending-header"
                  title="Click to sort by Total Pending (desc)"
                >
                  Total Pending {sortMode === "pending-desc" ? "↓" : ""}
                </th>
                <th className="px-4 py-4 text-right">Gen. Expenses</th>
                <th className="px-4 py-4 text-right">Vendor Expenses</th>
                <th className="px-4 py-4 text-right">Profit</th>
                <th className="px-4 py-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {displayRows.map((r, i) => {
                const profitColor = r.profit >= 0 ? "text-emerald-700" : "text-rose-700";
                const pending = r.total_pending ?? Math.max((r.total_invoiced || 0) - (r.total_received || 0), 0);
                return (
                  <tr key={r.id} data-testid={`crm-pp-row-${r.id}`}
                      className="border-b border-black/5 hover:bg-[#0a0a0a]/[0.02] transition-colors">
                    <td className="px-4 py-4 text-xs font-mono text-[#4a4a4a]">{String(i + 1).padStart(2, "0")}</td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-[#0a0a0a]">{r.name || "—"}</div>
                      {r.client && <div className="text-[11px] text-[#4a4a4a]">{r.client}</div>}
                      {r.project_group && (
                        <span className="mt-1 inline-block px-2 py-0.5 text-[10px] font-mono uppercase tracking-[0.1em] bg-[#ff5722]/10 text-[#ff5722] rounded">
                          {r.project_group}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <StatusPill tone={r.gst_applicable ? "indigo" : "zinc"} label={r.gst_applicable ? "GST" : "Non-GST"} />
                    </td>
                    <td className="px-4 py-4 text-right font-mono">{INR_PRECISE(r.total_budget)}</td>
                    <td className="px-4 py-4 text-right font-mono">{INR_PRECISE(r.total_invoiced)}</td>
                    <td className="px-4 py-4 text-right font-mono text-emerald-700">{INR_PRECISE(r.total_received)}</td>
                    <td className={`px-4 py-4 text-right font-mono ${pending > 0 ? "text-amber-700 font-bold" : "text-[#4a4a4a]"}`} data-testid={`crm-pp-pending-${r.id}`}>{INR_PRECISE(pending)}</td>
                    <td className="px-4 py-4 text-right font-mono text-amber-700">{INR_PRECISE(r.total_general_expenses)}</td>
                    <td className="px-4 py-4 text-right font-mono text-rose-700">{INR_PRECISE(r.total_vendor_expenses)}</td>
                    <td className={`px-4 py-4 text-right font-mono font-bold ${profitColor}`}>{INR_PRECISE(r.profit)}</td>
                    <td className="px-4 py-4">
                      <StatusPill tone={PROJECT_STATUS_TONE[r.status] || "zinc"} label={(PROJECT_STATUSES.find((s) => s.k === r.status) || PROJECT_STATUSES[0]).label} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
