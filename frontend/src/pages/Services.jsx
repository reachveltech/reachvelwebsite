import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionLabel from "@/components/SectionLabel";
import { ServicesAtom } from "@/components/AtomicArt";
import { SERVICES } from "@/lib/data";

export default function Services() {
  return (
    <div data-testid="page-services" className="bg-[#050505] text-white relative overflow-hidden">
      <div className="hero-grid-dark fixed inset-0 opacity-20 pointer-events-none" />
      <div className="grain fixed inset-0" />

      {/* Hero */}
      <section className="relative pt-[140px] md:pt-[180px] pb-20 md:pb-24">
        <div className="radial-fade-dark absolute inset-0 pointer-events-none" />
        <ServicesAtom className="hidden lg:block absolute right-0 bottom-[-10px] h-[360px] w-[720px] opacity-90 pointer-events-none z-[5]" />
        <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <SectionLabel tone="dark">Capabilities · 07 Disciplines</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display font-black text-6xl sm:text-7xl md:text-8xl lg:text-[9.5rem] tracking-[-0.04em] leading-[0.88] max-w-6xl">
              Technology-driven
              <br />
              solutions for
              <br />
              <span className="text-[#ff5722]">modern business.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-10 max-w-2xl text-lg md:text-xl text-white/70 font-light leading-relaxed">
              Seven disciplines, one standard. Every service is run by a dedicated craft lead, every
              engagement is measured, and every deliverable is production-grade on day one.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Service rows */}
      <section className="relative border-t border-white/10">
        {SERVICES.map((s, idx) => (
          <Reveal
            key={s.id}
            className="border-b border-white/10"
          >
            <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-16 md:py-24 grid lg:grid-cols-12 gap-10">
              <div className="lg:col-span-4">
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-mono tracking-[0.25em] text-[#ff5722]">
                    {s.number}
                  </span>
                  <span className="h-[1px] flex-1 bg-white/20" />
                </div>
                <h2 className="mt-6 font-display font-black text-5xl md:text-6xl tracking-tighter leading-[0.95]">
                  {s.title}
                </h2>
                <div className="mt-3 text-[#ff5722] text-sm font-medium">{s.short}</div>
              </div>

              <div className="lg:col-span-5">
                <p className="text-lg text-white/80 font-light leading-relaxed">{s.description}</p>
                <div className="mt-8">
                  <div className="text-[11px] uppercase tracking-[0.25em] text-white/40 font-mono mb-4">
                    What we ship
                  </div>
                  <ul className="space-y-2">
                    {s.capabilities.map((c) => (
                      <li key={c} className="flex items-start gap-3 text-white/85">
                        <span className="mt-[7px] h-1.5 w-1.5 rounded-full bg-[#ff5722] shrink-0" />
                        <span>{c}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="lg:col-span-3 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.25em] text-white/40 font-mono mb-4">
                    Stack
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.stack.map((t) => (
                      <span
                        key={t}
                        className="px-3 py-1.5 text-xs font-mono border border-white/15 rounded-full bg-white/[0.02]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                <Link
                  to="/contact"
                  data-testid={`service-cta-${s.id}`}
                  className="mt-10 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-white hover:text-[#ff5722] transition-colors w-fit"
                >
                  Engage <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </Reveal>
        ))}
      </section>

      {/* Process mini */}
      <section className="relative py-24 md:py-32 bg-gradient-to-b from-[#050505] to-[#0a0a0a]">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-3xl mb-14">
            <SectionLabel tone="dark">The Engagement</SectionLabel>
            <h2 className="mt-5 font-display font-black text-5xl md:text-6xl tracking-tighter leading-[0.95]">
              Ways to
              <br /> work with us.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/10 border border-white/10">
            {[
              {
                title: "Sprint",
                desc: "2–6 weeks. Diagnostic, audit, or a tightly scoped MVP. Fixed price.",
                price: "From $35k",
              },
              {
                title: "Engagement",
                desc: "3–6 months. Dedicated pod embedded with your team. Shared roadmap.",
                price: "From $180k/qtr",
              },
              {
                title: "Studio",
                desc: "Ongoing retainer. We operate a full studio as your design/engineering arm.",
                price: "From $85k/mo",
              },
            ].map((p) => (
              <div key={p.title} className="bg-[#050505] p-8 md:p-10">
                <div className="font-display font-black text-3xl tracking-tight">{p.title}</div>
                <p className="mt-4 text-white/70">{p.desc}</p>
                <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-between">
                  <span className="text-sm text-white/60 font-mono">{p.price}</span>
                  <ArrowRight className="h-4 w-4 text-[#ff5722]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative border-t border-white/10 py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 grid lg:grid-cols-[1.5fr_1fr] gap-10 items-end">
          <h2 className="font-display font-black text-5xl md:text-6xl lg:text-7xl tracking-tighter leading-[0.95]">
            Ready to
            <br /> <span className="text-[#ff5722]">engineer the improbable?</span>
          </h2>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link to="/contact" data-testid="services-cta-book" className="btn-ghost-light">
              Book a briefing <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to="/projects" data-testid="services-cta-projects" className="btn-ghost-light">
              See the proof <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
