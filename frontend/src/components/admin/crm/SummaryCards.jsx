/** Reusable KPI/summary card grid for CRM module headers.
 * cards: [{ label, value, accent?, icon?, tone?, onClick?, active? }]
 */
export default function SummaryCards({ cards = [] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-black/10 border border-black/10 mb-8" data-testid="crm-summary-cards">
      {cards.map((c, i) => {
        const clickable = typeof c.onClick === "function";
        const Tag = clickable ? "button" : "div";
        return (
          <Tag
            key={i}
            type={clickable ? "button" : undefined}
            onClick={c.onClick}
            className={
              `bg-white p-5 relative overflow-hidden text-left w-full transition-colors ` +
              (clickable ? "hover:bg-[#fff7f4] cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#ff5722]/40 " : "") +
              (c.active ? "ring-2 ring-inset ring-[#ff5722]" : "")
            }
            data-testid={`crm-kpi-${(c.label || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
          >
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
              {c.icon} {c.label}
              {clickable && (
                <span className="ml-auto text-[9px] tracking-[0.1em] text-[#ff5722]">
                  {c.active ? "✓ sorted" : "click to sort"}
                </span>
              )}
            </div>
            <div className={`mt-2 crm-num text-2xl md:text-3xl ${c.accent || "text-[#0a0a0a]"}`}>
              {c.value}
            </div>
            {c.sub && <div className="mt-1 text-[10px] font-mono text-[#4a4a4a]">{c.sub}</div>}
            {c.tone && (
              <span className={`absolute top-0 left-0 h-1 w-full ${c.tone}`} />
            )}
          </Tag>
        );
      })}
    </div>
  );
}
