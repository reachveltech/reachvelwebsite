import { CLIENTS } from "@/lib/data";

export default function ClientsMarquee({ theme = "light" }) {
  const dark = theme === "dark";
  const all = [...CLIENTS, ...CLIENTS];
  return (
    <section
      data-testid="clients-marquee"
      className={`relative overflow-hidden py-14 border-y ${
        dark ? "bg-[#050505] border-white/10" : "bg-[#f7f6f3] border-black/10"
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 mb-8 flex items-center justify-between gap-6">
        <div className={`text-[11px] uppercase tracking-[0.3em] font-bold ${dark ? "text-[#ff5722]" : "text-[#ff5722]"}`}>
          Clients & Collaborators
        </div>
        <div className={`hidden md:block text-xs font-mono ${dark ? "text-white/40" : "text-black/40"}`}>
          — serving teams in 14 countries
        </div>
      </div>
      <div className="relative">
        <div
          className={`pointer-events-none absolute inset-y-0 left-0 w-24 z-10 ${
            dark
              ? "bg-gradient-to-r from-[#050505] to-transparent"
              : "bg-gradient-to-r from-[#f7f6f3] to-transparent"
          }`}
        />
        <div
          className={`pointer-events-none absolute inset-y-0 right-0 w-24 z-10 ${
            dark
              ? "bg-gradient-to-l from-[#050505] to-transparent"
              : "bg-gradient-to-l from-[#f7f6f3] to-transparent"
          }`}
        />
        <div className="flex gap-16 animate-marquee w-max">
          {all.map((c, i) => (
            <div
              key={`${c.name}-${i}`}
              className="h-10 flex items-center opacity-60 hover:opacity-100 transition-opacity duration-300"
            >
              <img
                src={c.src}
                alt={c.name}
                className={`h-7 md:h-8 w-auto object-contain ${dark ? "invert brightness-0 opacity-80" : "grayscale"}`}
                loading="lazy"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
