import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Play } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionLabel from "@/components/SectionLabel";
import { ProjectsAtom } from "@/components/AtomicArt";
import { PROJECTS } from "@/lib/data";

const FILTERS = ["All", "Fintech", "Healthcare", "Retail", "Data", "AI"];

export default function Projects() {
  const [filter, setFilter] = useState("All");
  const [active, setActive] = useState(null);

  const filtered = useMemo(
    () => (filter === "All" ? PROJECTS : PROJECTS.filter((p) => p.domain === filter)),
    [filter]
  );

  return (
    <div data-testid="page-projects" className="bg-[#050505] text-white relative overflow-hidden">
      <div className="hero-grid-dark fixed inset-0 opacity-20 pointer-events-none" />
      <div className="grain fixed inset-0" />

      {/* Hero */}
      <section className="relative pt-[140px] md:pt-[180px] pb-14 md:pb-20">
        <div className="radial-fade-dark absolute inset-0 pointer-events-none" />
        <ProjectsAtom className="hidden lg:block absolute right-[-40px] top-[90px] h-[520px] w-[520px] opacity-85 pointer-events-none z-[5]" />
        <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <SectionLabel tone="dark">Case Studies · 2023 – 2025</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display font-black text-6xl sm:text-7xl md:text-8xl lg:text-[9.5rem] tracking-[-0.04em] leading-[0.88] max-w-6xl">
              Selected
              <br />
              <span className="italic font-light">work that</span>
              <br />
              <span className="text-[#ff5722]">shipped.</span>
            </h1>
          </Reveal>
          <Reveal delay={140}>
            <p className="mt-10 max-w-2xl text-lg md:text-xl text-white/70 font-light leading-relaxed">
              A slice of the things we've built. Every project here is in production — not a pitch deck.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Filter bar */}
      <section className="sticky top-[72px] z-30 backdrop-blur-xl bg-[#050505]/80 border-y border-white/10">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-4 flex items-center gap-3 overflow-x-auto no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f}
              data-testid={`filter-${f.toLowerCase()}`}
              onClick={() => setFilter(f)}
              className={`shrink-0 px-4 py-2 rounded-full border text-sm font-mono uppercase tracking-[0.15em] transition-all duration-300 ${
                filter === f
                  ? "bg-[#ff5722] border-[#ff5722] text-black"
                  : "border-white/20 text-white/70 hover:text-white hover:border-white/50"
              }`}
            >
              {f}
            </button>
          ))}
          <div className="ml-auto hidden md:block text-[11px] font-mono text-white/40">
            {filtered.length} of {PROJECTS.length}
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="relative py-12 md:py-20">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
            {filtered.map((p, i) => {
              const spans = [
                "lg:col-span-7",
                "lg:col-span-5",
                "lg:col-span-4",
                "lg:col-span-8",
                "lg:col-span-6",
                "lg:col-span-6",
              ];
              return (
                <Reveal
                  key={p.slug}
                  delay={i * 60}
                  className={`${spans[i % spans.length]}`}
                >
                  <button
                    type="button"
                    onClick={() => setActive(p)}
                    data-testid={`project-card-${p.slug}`}
                    className="group relative block w-full text-left overflow-hidden rounded-sm border border-white/10 bg-[#0f0f0f] hover:border-[#ff5722]/50 transition-colors"
                  >
                    <div className="relative overflow-hidden aspect-[16/10]">
                      <img
                        src={p.cover}
                        alt={p.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.06]"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-white text-[#0a0a0a]">
                          {p.domain}
                        </span>
                        <span className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-black/60 backdrop-blur text-white">
                          {p.year}
                        </span>
                      </div>
                      <div className="absolute top-4 right-4 h-10 w-10 rounded-full bg-[#ff5722]/90 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="h-4 w-4 text-black fill-black ml-[2px]" />
                      </div>
                      <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                        <div>
                          <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/70">
                            {p.client}
                          </div>
                          <h3 className="mt-1 font-display font-extrabold text-2xl md:text-3xl tracking-tight text-white">
                            {p.title}
                          </h3>
                        </div>
                        <ArrowUpRight className="h-6 w-6 shrink-0 text-white group-hover:text-[#ff5722] transition-colors" />
                      </div>
                    </div>
                    <div className="p-6 md:p-8 grid grid-cols-3 gap-4">
                      {p.metrics.map((m) => (
                        <div key={m.v} className="border-l border-[#ff5722]/60 pl-3">
                          <div className="font-display font-black text-xl tracking-tight">{m.k}</div>
                          <div className="text-[10px] font-mono uppercase tracking-[0.15em] text-white/50 mt-1">
                            {m.v}
                          </div>
                        </div>
                      ))}
                    </div>
                  </button>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Modal */}
      {active && (
        <div
          data-testid="project-modal"
          className="fixed inset-0 z-[70] bg-black/85 backdrop-blur-xl flex items-center justify-center p-4 md:p-10"
          onClick={() => setActive(null)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-auto bg-[#0a0a0a] border border-white/10 rounded-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              data-testid="project-modal-close"
              onClick={() => setActive(null)}
              className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-white/10 hover:bg-[#ff5722] text-white flex items-center justify-center transition-colors"
            >
              ✕
            </button>
            <div className="aspect-video relative bg-black">
              <video
                key={active.slug}
                src={active.video}
                poster={active.cover}
                autoPlay
                muted
                loop
                playsInline
                controls
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <div className="p-6 md:p-10">
              <div className="flex items-center gap-2 mb-4">
                <span className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-[#ff5722] text-black">
                  {active.domain}
                </span>
                <span className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/50">
                  {active.client} · {active.year}
                </span>
              </div>
              <h3 className="font-display font-black text-3xl md:text-5xl tracking-tight text-white">
                {active.title}
              </h3>
              <p className="mt-4 text-white/70 text-lg font-light leading-relaxed max-w-2xl">
                {active.summary}
              </p>
              <div className="mt-8 grid grid-cols-3 gap-px bg-white/10 border border-white/10">
                {active.metrics.map((m) => (
                  <div key={m.v} className="bg-[#0a0a0a] p-5 md:p-6">
                    <div className="font-display font-black text-2xl md:text-3xl tracking-tight text-white">
                      {m.k}
                    </div>
                    <div className="mt-2 text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">
                      {m.v}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-2">
                {active.services.map((s) => (
                  <span key={s} className="px-3 py-1.5 text-xs font-mono border border-white/15 rounded-full">
                    {s}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <section className="relative border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 grid lg:grid-cols-[1.5fr_1fr] gap-10 items-end">
          <h2 className="font-display font-black text-5xl md:text-6xl lg:text-7xl tracking-tighter leading-[0.95]">
            Want yours
            <br /> on this page?
          </h2>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link to="/contact" data-testid="projects-cta-contact" className="btn-ghost-light">
              Start a project <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
