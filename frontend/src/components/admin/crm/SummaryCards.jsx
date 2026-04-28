/** Reusable KPI/summary card grid for CRM module headers.
 * cards: [{ label, value, accent?, icon?, tone? }]
 */
export default function SummaryCards({ cards = [] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-black/10 border border-black/10 mb-8" data-testid="crm-summary-cards">
      {cards.map((c, i) => (
        <div
          key={i}
          className="bg-white p-5 relative overflow-hidden"
          data-testid={`crm-kpi-${(c.label || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
        >
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
            {c.icon} {c.label}
          </div>
          <div className={`mt-2 font-display font-black text-2xl md:text-3xl tracking-tighter ${c.accent || "text-[#0a0a0a]"}`}>
            {c.value}
          </div>
          {c.sub && <div className="mt-1 text-[10px] font-mono text-[#4a4a4a]">{c.sub}</div>}
          {c.tone && (
            <span className={`absolute top-0 left-0 h-1 w-full ${c.tone}`} />
          )}
        </div>
      ))}
    </div>
  );
}
