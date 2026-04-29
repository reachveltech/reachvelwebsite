import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionLabel from "@/components/SectionLabel";
import Seo from "@/components/Seo";
import { AboutAtom } from "@/components/AtomicArt";
import { VALUES, STATS, LEADERSHIP } from "@/lib/data";

export default function About() {
  return (
    <div data-testid="page-about" className="bg-[#f7f6f3]">
      <Seo
        title="About — engineers, scientists & craftspeople"
        description="Reachvel was founded on a stubborn belief: the boundary between design, engineering and intelligence was a staffing problem — not a technical one."
        path="/about"
      />
      {/* Hero */}
      <section className="relative overflow-hidden pt-[110px] sm:pt-[140px] md:pt-[180px] pb-20 md:pb-24">
        <div className="hero-grid absolute inset-0 opacity-50 pointer-events-none" />
        <AboutAtom className="hidden lg:block absolute right-[-60px] top-[80px] h-[560px] w-[560px] opacity-80 pointer-events-none z-[5]" />

        <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <SectionLabel>About · Est. 2018</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display font-black text-[12vw] sm:text-7xl md:text-8xl lg:text-[9rem] tracking-[-0.04em] leading-[0.9] text-[#0a0a0a] max-w-5xl">
              A studio of
              <br />
              <span className="italic font-light">engineers,</span>
              <br />
              <span className="text-[#ff5722]">scientists,</span>
              <br />
              & craftspeople.
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-10 max-w-2xl text-lg md:text-xl text-[#4a4a4a] font-light leading-relaxed">
              Reachvel was founded on a stubborn belief: that the boundary between design, engineering,
              and intelligence was a staffing problem — not a technical one. We hired across that boundary
              and built a studio around it.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Mission split */}
      <section className="bg-white border-y border-black/10 py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 grid lg:grid-cols-[1fr_1.3fr] gap-10 md:gap-20">
          <Reveal>
            <SectionLabel>Mission</SectionLabel>
            <div className="mt-4 text-[11px] font-mono uppercase tracking-[0.3em] text-[#4a4a4a]">
              Codex · V/I
            </div>
          </Reveal>

          <Reveal delay={120}>
            <h2 className="font-display font-black text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tighter leading-[0.96] text-[#0a0a0a]">
              We build the interfaces between human intent and
              intelligent systems — and we treat that interface like a
              <span className="text-[#ff5722]"> load-bearing wall</span>.
            </h2>
            <p className="mt-10 text-lg text-[#4a4a4a] leading-relaxed max-w-2xl font-light">
              Every engagement is engineered from first principles. Every system we ship is measured,
              observed, and defensible. We don't believe in vapor — we believe in dossiers, evals, and
              the discipline of shipping.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Values */}
      <section className="bg-[#f7f6f3] py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-3xl mb-16">
            <SectionLabel>What We Believe</SectionLabel>
            <h2 className="mt-5 font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] text-[#0a0a0a]">
              Four beliefs. Held
              <br /> unreasonably.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-black/10 border border-black/10">
            {VALUES.map((v) => (
              <Reveal key={v.n} className="bg-white p-10 md:p-14 min-h-[280px]">
                <div className="flex items-start gap-6">
                  <span className="font-display font-black text-5xl text-[#ff5722] leading-none">{v.n}</span>
                  <div className="flex-1">
                    <h3 className="font-display font-extrabold text-2xl tracking-tight text-[#0a0a0a]">{v.title}</h3>
                    <p className="mt-4 text-[#4a4a4a] leading-relaxed">{v.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Stats dark */}
      <section className="bg-[#050505] text-white relative overflow-hidden">
        <div className="hero-grid-dark absolute inset-0 opacity-30 pointer-events-none" />
        <div className="relative mx-auto max-w-[1400px] px-5 md:px-10 py-24 md:py-32 grid lg:grid-cols-[1fr_1.4fr] gap-10 md:gap-16">
          <div>
            <SectionLabel tone="dark">By the numbers</SectionLabel>
            <h2 className="mt-5 font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95]">
              Seven years.
              <br /> Every one
              <br /> <span className="text-[#ff5722]">measured.</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-px bg-white/10 border border-white/10 self-end w-full">
            {STATS.map((s) => (
              <div key={s.label} className="bg-[#050505] p-6 sm:p-8 md:p-10 min-h-[160px] sm:min-h-[180px] flex flex-col justify-end">
                <div className="font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter text-white leading-none">
                  {s.value}
                </div>
                <div className="mt-4 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-white/60 font-bold">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="bg-[#f7f6f3] py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="mb-16 flex items-end justify-between gap-6">
            <div>
              <SectionLabel>Leadership</SectionLabel>
              <h2 className="mt-5 font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] text-[#0a0a0a]">
                The four we build around.
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {LEADERSHIP.map((l, i) => (
              <Reveal key={l.name} delay={i * 80}>
                <div className="group relative bg-white border border-black/10 rounded-sm overflow-hidden">
                  <div className="aspect-[3/4] bg-[#0a0a0a] relative overflow-hidden flex items-center justify-center">
                    <div className="absolute inset-0 hero-grid-dark opacity-40" />
                    <div className="relative z-10 font-display font-black text-[7rem] sm:text-[10rem] text-white/90 tracking-tighter leading-none">
                      {l.initial}
                    </div>
                    <div className="absolute bottom-4 left-4 text-[10px] font-mono uppercase tracking-[0.2em] text-white/60">
                      0{i + 1} · Reachvel
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="font-display font-bold text-xl tracking-tight text-[#0a0a0a]">
                      {l.name}
                    </div>
                    <div className="text-sm text-[#4a4a4a]">{l.role}</div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-white border-t border-black/10 py-20 md:py-28">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 grid lg:grid-cols-[1.5fr_1fr] gap-10 items-end">
          <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter leading-[0.95] text-[#0a0a0a]">
            Think we'd be
            <br /> a <span className="text-[#ff5722]">fit?</span>
          </h2>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link to="/contact" data-testid="about-cta-contact" className="btn-primary">
              Get in touch <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to="/careers" data-testid="about-cta-careers" className="btn-ghost">
              Join the studio <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
