import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { BRAND } from "@/lib/data";
import Logo from "@/components/Logo";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer data-testid="site-footer" className="relative bg-[#050505] text-white overflow-hidden">
      <div className="hero-grid-dark absolute inset-0 opacity-30 pointer-events-none" />
      <div className="grain absolute inset-0" />

      <div className="relative mx-auto max-w-[1400px] px-5 md:px-10 py-20 md:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-16">
          <div>
            <Logo theme="dark" className="h-11 md:h-12 w-auto mb-8" testid="footer-logo" />
            <p className="text-[11px] uppercase tracking-[0.3em] text-[#ff5722] font-bold mb-6">
              Let's build something remarkable
            </p>
            <h2 className="font-display font-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tighter leading-[0.95] text-white">
              A serious partner
              <br />
              for serious
              <span className="text-[#ff5722]"> software.</span>
            </h2>
            <div className="mt-10 flex flex-wrap gap-3">
              <Link to="/contact" data-testid="footer-cta-start" className="btn-ghost-light">
                Start a project <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a href={`mailto:${BRAND.email}`} data-testid="footer-cta-email" className="btn-ghost-light">
                {BRAND.email}
              </a>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 lg:pl-20 lg:border-l lg:border-white/10">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-4 font-mono">Navigate</div>
              <ul className="space-y-2.5 text-sm text-white/80">
                <li><Link to="/" className="link-underline" data-testid="footer-link-home">Home</Link></li>
                <li><Link to="/about" className="link-underline" data-testid="footer-link-about">About</Link></li>
                <li><Link to="/services" className="link-underline" data-testid="footer-link-services">Services</Link></li>
                <li><Link to="/projects" className="link-underline" data-testid="footer-link-projects">Projects</Link></li>
                <li><Link to="/careers" className="link-underline" data-testid="footer-link-careers">Careers</Link></li>
                <li><Link to="/knowledge" className="link-underline" data-testid="footer-link-knowledge">Knowledge</Link></li>
                <li><Link to="/contact" className="link-underline" data-testid="footer-link-contact">Contact</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-4 font-mono">Elsewhere</div>
              <ul className="space-y-2.5 text-sm text-white/80">
                {BRAND.socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href} className="link-underline" data-testid={`footer-social-${s.label.toLowerCase().replace(/\s|\//g, "-")}`}>
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-20 pt-8 border-t border-white/10 grid grid-cols-1 md:grid-cols-2 gap-6">
          {BRAND.offices.map((o) => (
            <div key={o.city}>
              <div className="font-display font-bold text-lg flex items-baseline gap-2">
                {o.city}
                <span className="text-[10px] font-mono text-white/40 tracking-wider">{o.timezone}</span>
              </div>
              <div className="text-sm text-white/60 mt-1">{o.line1}</div>
              <div className="text-sm text-white/60">{o.line2}</div>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-white/40 font-mono uppercase tracking-wider">
          <div>© {year} Reachvel — All rights reserved.</div>
          <div className="flex items-center gap-5">
            <Link to="/privacy"  className="hover:text-white transition-colors" data-testid="footer-link-privacy">Privacy Policy</Link>
            <Link to="/terms"    className="hover:text-white transition-colors" data-testid="footer-link-terms">Terms of Use</Link>
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#ff5722] animate-pulse-dot" />
              Systems operational
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
