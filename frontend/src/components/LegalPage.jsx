import { Link } from "react-router-dom";
import { Mail, Globe, MapPin, ArrowUpRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import Seo from "@/components/Seo";
import { BRAND } from "@/lib/data";

/**
 * Reusable, on-brand legal page (Privacy / Terms of Use).
 * Shows a clean two-column layout: sticky table-of-contents on the left
 * and the numbered sections on the right.
 */
export default function LegalPage({ kind, title, summary, doc, peerLink }) {
  return (
    <div data-testid={`page-${kind}`} className="bg-[#f7f6f3] min-h-screen">
      <Seo
        title={`${title} — Reachvel`}
        description={summary}
        path={`/${kind}`}
      />

      {/* Hero */}
      <section className="relative overflow-hidden pt-[110px] sm:pt-[140px] md:pt-[180px] pb-12 md:pb-16">
        <div className="hero-grid absolute inset-0 opacity-25 pointer-events-none" />
        <div className="grain absolute inset-0" />

        <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <div className="text-[11px] uppercase tracking-[0.3em] font-bold text-[#ff5722] inline-flex items-center gap-2">
              <span className="h-1 w-12 bg-[#ff5722] inline-block" />
              {kind === "privacy" ? "Privacy" : "Terms"}
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <h1 className="mt-6 font-display font-black text-[12vw] sm:text-7xl md:text-8xl lg:text-[8.5rem] tracking-[-0.04em] leading-[0.9] text-[#0a0a0a]">
              {title.split(" ").map((w, i) => (
                <span key={i} className={i === 1 ? "italic font-light" : ""}>
                  {i ? " " : ""}{w}
                </span>
              ))}
            </h1>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="mt-8 flex flex-wrap items-center gap-3 text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
              <span className="px-2.5 py-1 bg-white border border-black/10 rounded-full">Effective {doc.effective}</span>
              <span className="px-2.5 py-1 bg-white border border-black/10 rounded-full">v{doc.version}</span>
              <Link
                to={`/${peerLink.to}`}
                data-testid={`legal-peer-${peerLink.to}`}
                className="px-3 py-1 inline-flex items-center gap-1 hover:text-[#ff5722]"
              >
                Read {peerLink.label} <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Body */}
      <section className="relative pb-20 md:pb-28">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-10 md:gap-16">
          {/* TOC */}
          <aside className="hidden lg:block">
            <div className="sticky top-28">
              <div className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#4a4a4a] font-mono mb-4">
                Contents
              </div>
              <ul className="space-y-2 text-sm">
                {doc.sections.map((s) => (
                  <li key={s.number}>
                    <a
                      href={`#sec-${s.number}`}
                      className="group inline-flex items-baseline gap-2 text-[#0a0a0a] hover:text-[#ff5722] transition-colors"
                    >
                      <span className="font-mono text-[10px] text-[#4a4a4a] group-hover:text-[#ff5722]">
                        {s.number}
                      </span>
                      {s.title}
                    </a>
                  </li>
                ))}
                <li>
                  <a href="#contact" className="inline-flex items-baseline gap-2 text-[#0a0a0a] hover:text-[#ff5722]">
                    <span className="font-mono text-[10px] text-[#4a4a4a]">{String(doc.sections.length + 1).padStart(2, "0")}</span>
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </aside>

          {/* Content */}
          <div className="max-w-[820px]">
            <p className="text-base md:text-lg text-[#0a0a0a]/80 leading-relaxed border-l-2 border-[#ff5722] pl-5 md:pl-6">
              {summary}
            </p>

            <div className="mt-12 space-y-14">
              {doc.sections.map((s) => (
                <Section key={s.number} number={s.number} title={s.title} nodes={s.nodes} />
              ))}

              {/* Contact */}
              <div id="contact" className="scroll-mt-28">
                <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#ff5722] font-bold">
                  {String(doc.sections.length + 1).padStart(2, "0")}
                </div>
                <h2 className="mt-2 crm-h text-3xl md:text-4xl text-[#0a0a0a]">Contact us</h2>
                <p className="mt-4 text-[#0a0a0a]/80 leading-relaxed">
                  For any questions, concerns, or requests relating to {kind === "privacy" ? "this Privacy Policy or our data practices" : "these Terms of Use"}, please contact:
                </p>
                <div className="mt-6 bg-white border border-black/10 p-6 md:p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
                      <Mail className="h-3.5 w-3.5" /> Email
                    </div>
                    <a href={`mailto:${BRAND.email}`} className="mt-2 block link-underline text-[#0a0a0a]">
                      {BRAND.email}
                    </a>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
                      <Globe className="h-3.5 w-3.5" /> Website
                    </div>
                    <a href="https://www.reachvel.com" className="mt-2 block link-underline text-[#0a0a0a]">
                      www.reachvel.com
                    </a>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
                      <MapPin className="h-3.5 w-3.5" /> Registered office
                    </div>
                    <div className="mt-2 text-sm text-[#0a0a0a]">
                      Plot no 24, Mothi Nagar, Nagarjuna Hills, Punjagutta, Hyderabad, Telangana — 500082
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-16 text-[10px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]/70 border-t border-black/10 pt-6">
              © {new Date().getFullYear()} Reachvel. All rights reserved.
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Section({ number, title, nodes }) {
  return (
    <div id={`sec-${number}`} className="scroll-mt-28">
      <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#ff5722] font-bold">
        {number}
      </div>
      <h2 className="mt-2 crm-h text-3xl md:text-4xl text-[#0a0a0a]">{title}</h2>
      <div className="mt-5 space-y-5 text-[#0a0a0a]/85 leading-[1.7]">
        {nodes.map((n, i) => {
          if (n.type === "h3") {
            return <h3 key={i} className="font-display font-bold text-lg text-[#0a0a0a] mt-2">{n.text}</h3>;
          }
          if (n.type === "ul") {
            return (
              <ul key={i} className="list-none space-y-2 pl-1">
                {n.items.map((it, j) => (
                  <li key={j} className="flex gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#ff5722] shrink-0" />
                    <span>{typeof it === "string" ? it : `${it.label}: ${it.value}`}</span>
                  </li>
                ))}
              </ul>
            );
          }
          return <p key={i}>{n.text}</p>;
        })}
      </div>
    </div>
  );
}
