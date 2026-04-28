import { PILL_TONES } from "./crmUtils";

/** Vibrant status pill — uses tone keys defined in crmUtils. */
export default function StatusPill({ tone = "zinc", label, className = "" }) {
  const tones = PILL_TONES[tone] || PILL_TONES.zinc;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-mono uppercase tracking-[0.12em] font-semibold ${tones} ${className}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      {label}
    </span>
  );
}
