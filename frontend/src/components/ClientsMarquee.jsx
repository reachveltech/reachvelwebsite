import { useEffect, useState } from "react";
import { CLIENTS } from "@/lib/data";
import { fetchClientLogos } from "@/lib/api";

export default function ClientsMarquee({ theme = "light" }) {
  const dark = theme === "dark";
  const [items, setItems] = useState(null); // null = loading, [] = none yet

  useEffect(() => {
    let mounted = true;
    fetchClientLogos()
      .then((data) => {
        if (!mounted) return;
        const apiItems = (data || []).map((d) => ({ name: d.name, src: d.image, website: d.website }));
        setItems(apiItems);
      })
      .catch(() => mounted && setItems([]));
    return () => { mounted = false; };
  }, []);

  // While loading or if admin hasn't added any, show static seed list
  const list = items === null || items.length === 0 ? CLIENTS : items;
  const all = [...list, ...list];

  return (
    <section
      data-testid="clients-marquee"
      className={`relative overflow-hidden py-14 border-y ${
        dark ? "bg-[#050505] border-white/10" : "bg-[#f7f6f3] border-black/10"
      }`}
    >
      <div className="mx-auto max-w-[1400px] px-5 md:px-10 mb-8 flex items-center justify-between gap-6">
        <div className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#ff5722]">
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
        <div className="flex gap-10 md:gap-14 animate-marquee w-max items-center">
          {all.map((c, i) => (
            <a
              key={`${c.name}-${i}`}
              href={c.website || "#"}
              target={c.website ? "_blank" : undefined}
              rel={c.website ? "noreferrer" : undefined}
              onClick={(e) => { if (!c.website) e.preventDefault(); }}
              className="shrink-0 h-16 md:h-20 w-36 md:w-44 flex items-center justify-center transition-transform duration-300 hover:scale-110 group"
              title={c.name}
            >
              <img
                src={c.src}
                alt={c.name}
                className={`max-h-14 md:max-h-16 max-w-full object-contain transition-all duration-300 ease-out ${
                  dark
                    ? "invert brightness-0 opacity-80 group-hover:invert-0 group-hover:brightness-100 group-hover:opacity-100"
                    : "grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100"
                }`}
                loading="lazy"
              />
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
