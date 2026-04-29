import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, ArrowRight, Sparkles } from "lucide-react";
import Reveal from "@/components/Reveal";
import ClientsMarquee from "@/components/ClientsMarquee";
import SectionLabel from "@/components/SectionLabel";
import Seo from "@/components/Seo";
import { fetchProjects } from "@/lib/api";
import { SERVICES, STATS, TESTIMONIALS, APPROACH } from "@/lib/data";

function MoleculeArt() {
  // Physics/chemistry metaphor — the "atomic synthesis" of Reachvel.
  // Narrative of the animation:
  //   • H₂O (raw data) enters at the top and flows downward through the lattice.
  //   • Orbital shells rotate around the AI nucleus — opposite directions, like
  //     real electron shells, to suggest stability under motion.
  //   • Each outer atom (React, Swift, LLM, Node) gently "breathes" — bond
  //     vibration at different phases, because every discipline has its own
  //     resonance.
  //   • Orange energy packets (electrons) travel along every bond toward
  //     Reachvel at the bottom — ingredients being synthesized into product.
  //   • Reachvel nucleus at the base emits expanding rings — the heartbeat of
  //     delivery. Inputs are converted into outcomes.
  return (
    <svg
      viewBox="0 0 600 600"
      className="absolute right-[-40px] sm:right-[-80px] top-1/2 -translate-y-1/2 h-[360px] w-[360px] sm:h-[520px] sm:w-[520px] lg:h-[640px] lg:w-[640px] opacity-95 pointer-events-none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="node" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5722" />
          <stop offset="100%" stopColor="#ff5722" stopOpacity="0.15" />
        </radialGradient>
        <radialGradient id="nucleusGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5722" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#ff5722" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#ff5722" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Orbital shells — counter-rotating, anchored on AI nucleus at (300, 180) */}
      <g style={{ transformOrigin: "300px 180px" }} className="animate-spin-slow">
        <circle cx="300" cy="180" r="240" fill="none" stroke="#0a0a0a" strokeOpacity="0.06" strokeDasharray="2 6" />
      </g>
      <g style={{ transformOrigin: "300px 180px" }} className="animate-spin-reverse">
        <circle cx="300" cy="180" r="180" fill="none" stroke="#0a0a0a" strokeOpacity="0.1" strokeDasharray="1 5" />
      </g>
      <g style={{ transformOrigin: "300px 180px" }} className="animate-spin-fast">
        <circle cx="300" cy="180" r="120" fill="none" stroke="#0a0a0a" strokeOpacity="0.14" />
        {/* Electrons orbiting the AI nucleus — intelligence continuously circulating */}
        <circle cx="420" cy="180" r="3.5" fill="#ff5722" />
        <circle cx="180" cy="180" r="2.5" fill="#ff5722" />
      </g>

      {/* Bond lines — animated energy flowing toward Reachvel */}
      <g stroke="#ff5722" strokeOpacity="0.35" strokeWidth="1" fill="none">
        <line x1="300" y1="60"  x2="300" y2="180" className="bond-flow" />
        <line x1="300" y1="180" x2="200" y2="250" className="bond-flow" style={{ animationDelay: "-0.2s" }} />
        <line x1="300" y1="180" x2="400" y2="250" className="bond-flow" style={{ animationDelay: "-0.4s" }} />
        <line x1="200" y1="250" x2="200" y2="370" className="bond-flow" style={{ animationDelay: "-0.6s" }} />
        <line x1="400" y1="250" x2="400" y2="370" className="bond-flow" style={{ animationDelay: "-0.8s" }} />
        <line x1="200" y1="370" x2="300" y2="440" className="bond-flow" style={{ animationDelay: "-1.0s" }} />
        <line x1="400" y1="370" x2="300" y2="440" className="bond-flow" style={{ animationDelay: "-1.2s" }} />
        <line x1="200" y1="370" x2="120" y2="430" stroke="#0a0a0a" strokeOpacity="0.2" />
        <line x1="400" y1="370" x2="480" y2="430" stroke="#0a0a0a" strokeOpacity="0.2" />
      </g>

      {/* Static grey lines behind, for context */}
      <g stroke="#0a0a0a" strokeOpacity="0.12" strokeWidth="1">
        <line x1="300" y1="60"  x2="300" y2="180" />
        <line x1="300" y1="180" x2="200" y2="250" />
        <line x1="300" y1="180" x2="400" y2="250" />
        <line x1="200" y1="250" x2="200" y2="370" />
        <line x1="400" y1="250" x2="400" y2="370" />
        <line x1="200" y1="370" x2="300" y2="440" />
        <line x1="400" y1="370" x2="300" y2="440" />
      </g>

      {/* Data packets — orange electrons traveling along every bond toward Reachvel nucleus */}
      <g>
        {[
          { path: "M300,60 L300,180",    dur: "3.2s", delay: "0s" },
          { path: "M300,180 L200,250",   dur: "2.6s", delay: "-0.6s" },
          { path: "M300,180 L400,250",   dur: "2.6s", delay: "-1.1s" },
          { path: "M200,250 L200,370",   dur: "2.8s", delay: "-0.3s" },
          { path: "M400,250 L400,370",   dur: "2.8s", delay: "-1.3s" },
          { path: "M200,370 L300,440",   dur: "2.4s", delay: "-0.8s" },
          { path: "M400,370 L300,440",   dur: "2.4s", delay: "-1.6s" },
        ].map((p, i) => (
          <circle key={i} r="3.2" fill="#ff5722">
            <animateMotion dur={p.dur} repeatCount="indefinite" path={p.path} begin={p.delay} />
            <animate attributeName="opacity" dur={p.dur} repeatCount="indefinite" values="0;1;1;0" keyTimes="0;0.15;0.85;1" begin={p.delay} />
          </circle>
        ))}
      </g>

      {/* Outer atoms — vibrating with unique phase (bond resonance) */}
      <g>
        {/* H2O — raw data, top */}
        <g className="atom-breathe" style={{ animationDelay: "-0.1s" }}>
          <circle cx="300" cy="60" r="8" fill="#0a0a0a" />
        </g>

        {/* AI nucleus core — central hub with halo + breath */}
        <circle cx="300" cy="180" r="34" fill="url(#nucleusGlow)" className="ai-halo" />
        <g className="nucleus-core">
          <circle cx="300" cy="180" r="14" fill="url(#node)" />
          <circle cx="300" cy="180" r="6"  fill="#ff5722" />
        </g>

        {/* React / Swift — platforms */}
        <g className="atom-breathe" style={{ animationDelay: "-0.8s" }}>
          <circle cx="200" cy="250" r="8" fill="#0a0a0a" />
        </g>
        <g className="atom-breathe" style={{ animationDelay: "-1.4s" }}>
          <circle cx="400" cy="250" r="10" fill="#0a0a0a" />
        </g>

        {/* LLM / Node — runtime intelligence */}
        <g className="atom-breathe" style={{ animationDelay: "-2.0s" }}>
          <circle cx="200" cy="370" r="12" fill="url(#node)" />
        </g>
        <g className="atom-breathe" style={{ animationDelay: "-2.6s" }}>
          <circle cx="400" cy="370" r="8" fill="#0a0a0a" />
        </g>

        {/* Reachvel nucleus — the synthesized outcome, pulses as packets arrive */}
        <circle cx="300" cy="440" r="16" fill="none" stroke="#ff5722" strokeOpacity="0.4" className="nucleus-ring" />
        <circle cx="300" cy="440" r="16" fill="none" stroke="#ff5722" strokeOpacity="0.4" className="nucleus-ring" style={{ animationDelay: "-1.3s" }} />
        <g className="nucleus-core" style={{ animationDuration: "2.4s" }}>
          <circle cx="300" cy="440" r="16" fill="#0a0a0a" />
          <circle cx="300" cy="440" r="5"  fill="#ff5722" />
        </g>

        {/* Output atoms — side surfaces, static orange */}
        <circle cx="120" cy="430" r="6" fill="#ff5722" />
        <circle cx="480" cy="430" r="6" fill="#ff5722" />
      </g>

      {/* Floating labels */}
      <g fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#0a0a0a" opacity="0.5">
        <text x="312" y="55">Python</text>
        <text x="320" y="184">AI</text>
        <text x="215" y="250">React</text>
        <text x="415" y="250">Swift</text>
        <text x="215" y="365">LLM</text>
        <text x="410" y="365">Node</text>
        <text x="318" y="448" fontWeight="700" fill="#ff5722" opacity="1">Reachvel</text>
      </g>
    </svg>
  );
}

export default function Home() {
  const [projects, setProjects] = useState([]);
  useEffect(() => {
    fetchProjects().then((d) => setProjects(d || [])).catch(() => setProjects([]));
  }, []);

  const orgJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Reachvel",
    url: "https://reachvel.com",
    logo: "https://customer-assets.emergentagent.com/job_reachvel-studio/artifacts/elkurlun_For%20Black%20BG.png",
    sameAs: [],
    contactPoint: [{
      "@type": "ContactPoint",
      contactType: "sales",
      email: "info@reachvel.com",
      telephone: "+91-91214-77-117",
      areaServed: "Worldwide",
    }],
  };

  return (
    <div data-testid="page-home" className="relative bg-[#f7f6f3]">
      <Seo
        title="AI-Native Engineering Studio for Web, Mobile & AI"
        description="Reachvel builds Web, Mobile and AI systems for companies that refuse to ship the ordinary. We engineer at the boundary between physics and product."
        path="/"
        jsonLd={orgJsonLd}
      />
      {/* HERO */}
      <section className="relative overflow-hidden pt-[120px] md:pt-[160px] pb-24 md:pb-32">
        <div className="hero-grid absolute inset-0 opacity-60 pointer-events-none" />
        <div className="radial-fade-light absolute inset-0 pointer-events-none" />

        <div className="relative mx-auto max-w-[1400px] px-5 md:px-10 grid lg:grid-cols-[1.35fr_1fr] gap-10 items-center">
          <div>
            <Reveal>
              <div className="flex items-center gap-2 mb-6">
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-black/10 text-[11px] font-mono uppercase tracking-[0.2em] text-[#0a0a0a]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#ff5722] animate-pulse-dot" />
                  Now accepting Q2 2026 engagements
                </span>
              </div>
            </Reveal>

            <Reveal delay={80}>
              <h1 className="font-display font-black text-[12vw] sm:text-7xl lg:text-[8.2rem] leading-[0.88] tracking-[-0.04em] text-[#0a0a0a]">
                AI-native
                <br />
                <span className="relative inline-block">
                  engineering,
                  <span className="absolute -right-6 -top-4 text-2xl text-[#ff5722]">*</span>
                </span>
                <br />
                <span className="italic font-light text-[#4a4a4a]">at</span>{" "}
                <span className="text-[#ff5722]">atomic</span> scale.
              </h1>
            </Reveal>

            <Reveal delay={160}>
              <p className="mt-8 max-w-xl text-lg md:text-xl text-[#4a4a4a] leading-relaxed font-light">
                Reachvel builds Web, Mobile, and AI systems for companies that refuse to ship the ordinary.
                We engineer at the boundary between physics and product — where latency, scale, and intelligence collide.
              </p>
            </Reveal>

            <Reveal delay={240}>
              <div className="mt-10 flex flex-wrap gap-3">
                <Link to="/contact" data-testid="hero-cta-start" className="btn-primary">
                  Start a project <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link to="/projects" data-testid="hero-cta-work" className="btn-ghost">
                  See the work <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </Reveal>

            <Reveal delay={320}>
              <div className="mt-14 flex flex-wrap items-center gap-6 md:gap-10 text-xs font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
                <div>● 120+ products shipped</div>
                <div>● 4.9 / 5 client rating</div>
                <div>● SOC 2 · ISO 27001</div>
              </div>
            </Reveal>
          </div>

          <div className="relative min-h-[360px] sm:min-h-[480px] lg:min-h-[640px]">
            <MoleculeArt />
          </div>
        </div>

        {/* ticker strip */}
        <div className="relative mt-10 border-y border-black/10 bg-white/60 backdrop-blur">
          <div className="mx-auto max-w-[1400px] px-5 md:px-10 h-12 flex items-center overflow-hidden">
            <div className="relative z-10 pr-5 mr-2 bg-white/90 backdrop-blur shadow-[8px_0_12px_-8px_rgba(255,255,255,0.95)]">
              <span className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#ff5722] whitespace-nowrap inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#ff5722] animate-pulse-dot" />
                Live signal
              </span>
            </div>
            <div className="flex-1 overflow-hidden relative">
              <div className="flex items-center gap-10 animate-marquee whitespace-nowrap font-mono text-[11px] uppercase tracking-[0.2em] text-[#0a0a0a]">
                {[
                  "Shipping · Vault iOS 4.2",
                  "Deploying · Helix RAG v3",
                  "Evaluating · Mira Agent",
                  "Scaling · Atlas Warehouse",
                  "Optimizing · Noor LCP 1.1s",
                  "Shipping · Vault iOS 4.2",
                  "Deploying · Helix RAG v3",
                  "Evaluating · Mira Agent",
                  "Scaling · Atlas Warehouse",
                  "Optimizing · Noor LCP 1.1s",
                ].map((x, i) => (
                  <span key={i} className="flex items-center gap-3">
                    <span className="h-1 w-1 rounded-full bg-[#ff5722]" /> {x}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <ClientsMarquee theme="light" />

      {/* SERVICES — dark sectional switch */}
      <section className="relative bg-[#050505] text-white overflow-hidden py-24 md:py-32">
        <div className="hero-grid-dark absolute inset-0 opacity-40 pointer-events-none" />
        <div className="radial-fade-dark absolute inset-0 pointer-events-none" />
        <div className="grain absolute inset-0" />

        <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="grid lg:grid-cols-[1fr_1.4fr] gap-10 mb-16">
            <Reveal>
              <SectionLabel tone="dark">Capabilities</SectionLabel>
              <h2 className="mt-5 font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter leading-[0.95]">
                Seven disciplines.
                <br />
                One standard.
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="text-lg text-white/70 lg:pt-20 max-w-xl font-light leading-relaxed">
                We do not bolt AI onto existing practices — we rebuilt every discipline around it.
                Web that renders at the edge. Mobile that feels like physics. Data that predicts.
                Commerce that converts. AI that compounds.
              </p>
            </Reveal>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-white/10">
            {SERVICES.map((s, i) => (
              <Reveal key={s.id} delay={i * 60} className="group relative p-8 md:p-10 bg-[#050505] hover:bg-[#0f0f0f] transition-colors duration-500 min-h-[280px] flex flex-col">
                <div className="flex items-start justify-between mb-6">
                  <span className="text-[11px] font-mono tracking-[0.2em] text-white/40">{s.number}</span>
                  <ArrowUpRight className="h-5 w-5 text-white/40 group-hover:text-[#ff5722] group-hover:-translate-y-1 group-hover:translate-x-1 transition-all duration-500" />
                </div>
                <h3 className="font-display font-extrabold text-3xl tracking-tight">
                  {s.title}
                </h3>
                <p className="mt-2 text-[#ff5722] text-sm font-medium">{s.short}</p>
                <p className="mt-6 text-sm text-white/60 leading-relaxed flex-1">{s.description}</p>
              </Reveal>
            ))}
            <Reveal delay={SERVICES.length * 60} className="group relative p-8 md:p-10 bg-[#ff5722] text-black hover:bg-white transition-colors duration-500 min-h-[280px] flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-mono tracking-[0.2em] mb-6 opacity-70">S/ALL</div>
                <h3 className="font-display font-extrabold text-3xl tracking-tight">
                  Full-stack engagements
                </h3>
                <p className="mt-3 text-sm opacity-80">
                  Deploy us as a single pod across brand, product, engineering, and AI.
                </p>
              </div>
              <Link to="/services" data-testid="services-all-cta" className="mt-6 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em]">
                Explore services <ArrowRight className="h-4 w-4" />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* STATS — tetris borders */}
      <section className="bg-[#f7f6f3] border-y border-black/10">
        <div className="mx-auto max-w-[1400px] grid grid-cols-2 lg:grid-cols-4 grid-tetris">
          {STATS.map((s) => (
            <div key={s.label} className="px-5 sm:px-6 md:px-10 py-10 sm:py-14 md:py-20">
              <div className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter text-[#0a0a0a] leading-none">
                {s.value}
              </div>
              <div className="mt-5 text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#4a4a4a] font-bold">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* PROJECTS SNIPPET */}
      <section className="bg-[#f7f6f3] py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="flex items-end justify-between gap-6 mb-16">
            <div>
              <SectionLabel>Selected Projects</SectionLabel>
              <h2 className="mt-5 font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter leading-[0.95] text-[#0a0a0a]">
                The proof is
                <br /> in the ship.
              </h2>
            </div>
            <Link to="/projects" data-testid="home-projects-all" className="hidden md:inline-flex btn-ghost">
              All projects <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {projects.slice(0, 4).map((p, i) => {
              const spans = ["lg:col-span-7", "lg:col-span-5", "lg:col-span-5", "lg:col-span-7"];
              return (
                <Reveal key={p.slug} delay={i * 80} className={`${spans[i]}`}>
                  <Link
                    to="/projects"
                    data-testid={`home-project-card-${p.slug}`}
                    className="group block bg-white border border-black/5 rounded-sm overflow-hidden"
                  >
                    <div className="relative overflow-hidden aspect-[16/10]">
                      <img
                        src={p.cover}
                        alt={p.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.05]"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4 flex gap-2">
                        <span className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-white/90 backdrop-blur text-[#0a0a0a]">
                          {p.domain}
                        </span>
                        <span className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-[#0a0a0a] text-white">
                          {p.year}
                        </span>
                      </div>
                    </div>
                    <div className="p-6 md:p-8 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a] mb-2">
                          {p.client}
                        </div>
                        <h3 className="font-display font-extrabold text-2xl md:text-3xl tracking-tight text-[#0a0a0a]">
                          {p.title}
                        </h3>
                      </div>
                      <ArrowUpRight className="h-6 w-6 mt-1 shrink-0 text-[#0a0a0a] group-hover:text-[#ff5722] group-hover:-translate-y-1 group-hover:translate-x-1 transition-all duration-500" />
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>

          <div className="mt-10 md:hidden">
            <Link to="/projects" data-testid="home-projects-all-mobile" className="btn-ghost">
              All projects <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* APPROACH */}
      <section className="bg-white py-24 md:py-32 border-y border-black/10">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-3xl mb-16">
            <SectionLabel>How We Work</SectionLabel>
            <h2 className="mt-5 font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] text-[#0a0a0a]">
              A discipline of
              <br /> <span className="text-[#ff5722]">first principles.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-black/10 border border-black/10">
            {APPROACH.map((a) => (
              <div key={a.n} className="bg-white p-8 md:p-10 min-h-[320px] flex flex-col">
                <div className="flex items-center gap-3 mb-8">
                  <span className="font-display font-black text-xl">{a.n}</span>
                  <span className="h-[1px] w-10 bg-[#ff5722]" />
                </div>
                <h3 className="font-display font-extrabold text-xl tracking-tight text-[#0a0a0a]">{a.title}</h3>
                <p className="mt-3 text-sm text-[#4a4a4a] leading-relaxed flex-1">{a.body}</p>
                <ul className="mt-6 space-y-1.5">
                  {a.points.map((p) => (
                    <li key={p} className="text-xs font-mono uppercase tracking-[0.15em] text-[#0a0a0a]">
                      ↳ {p}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-[#f7f6f3] py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="mb-16">
            <SectionLabel>In Their Words</SectionLabel>
            <h2 className="mt-5 font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] text-[#0a0a0a]">
              What partners say after the ship date.
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 100} className={`${i === 1 ? "lg:mt-16" : ""}`}>
                <figure className="relative h-full bg-white border border-black/10 p-8 md:p-10 rounded-sm">
                  <div className="absolute -top-3 left-8 bg-[#ff5722] text-white h-6 w-6 flex items-center justify-center text-xs">
                    "
                  </div>
                  <blockquote className="font-display text-xl md:text-2xl tracking-tight text-[#0a0a0a] leading-tight">
                    {t.quote}
                  </blockquote>
                  <figcaption className="mt-8 pt-6 border-t border-black/10">
                    <div className="font-bold text-sm text-[#0a0a0a]">{t.author}</div>
                    <div className="text-xs text-[#4a4a4a]">{t.role} · {t.company}</div>
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA STRIP */}
      <section className="relative overflow-hidden bg-[#ff5722] text-black py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 grid lg:grid-cols-[1.3fr_1fr] gap-10 items-end">
          <div>
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em] font-bold mb-6">
              <Sparkles className="h-4 w-4" /> Next cohort · Q2 2026
            </div>
            <h2 className="font-display font-black text-4xl sm:text-5xl md:text-7xl lg:text-8xl tracking-tighter leading-[0.92]">
              Engineer the
              <br /> improbable.
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link to="/contact" data-testid="home-cta-book" className="btn-primary">
              Book a briefing <ArrowUpRight className="h-4 w-4" />
            </Link>
            <Link to="/services" data-testid="home-cta-services" className="btn-ghost">
              Browse services <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
