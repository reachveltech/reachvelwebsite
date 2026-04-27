export default function SectionLabel({ children, tone = "light" }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-[1px] w-8 ${tone === "light" ? "bg-[#0a0a0a]" : "bg-white"}`} />
      <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#ff5722]">
        {children}
      </span>
    </div>
  );
}
