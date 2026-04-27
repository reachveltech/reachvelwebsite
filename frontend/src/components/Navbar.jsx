import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu, X, ArrowUpRight } from "lucide-react";
import { BRAND } from "@/lib/data";

const LINKS = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/projects", label: "Projects" },
  { to: "/careers", label: "Careers" },
  { to: "/knowledge", label: "Knowledge" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const isDarkRoute = pathname === "/services" || pathname === "/projects";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        data-testid="site-navbar"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? isDarkRoute
              ? "backdrop-blur-xl bg-[rgba(5,5,5,0.72)] border-b border-white/10"
              : "backdrop-blur-xl bg-[rgba(247,246,243,0.72)] border-b border-black/10"
            : "bg-transparent"
        }`}
      >
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 h-[72px] flex items-center justify-between">
          <Link to="/" data-testid="nav-logo-link" className="flex items-center gap-3 group">
            <div className={`relative h-9 w-9 rounded-md flex items-center justify-center overflow-hidden ${isDarkRoute ? "bg-white" : "bg-[#0a0a0a]"}`}>
              <span className={`font-display font-black text-lg leading-none ${isDarkRoute ? "text-black" : "text-white"}`}>R</span>
              <span className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 h-4 w-[2px] bg-[#ff5722]" />
              <span className="absolute top-1 right-1 h-1 w-1 rounded-full bg-[#ff5722] animate-pulse-dot" />
            </div>
            <span className={`font-display font-black tracking-tight text-xl ${isDarkRoute ? "text-white" : "text-[#0a0a0a]"}`}>
              reachvel
            </span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                data-testid={`nav-link-${l.label.toLowerCase()}`}
                className={({ isActive }) =>
                  `px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 ${
                    isDarkRoute
                      ? isActive
                        ? "text-white bg-white/10"
                        : "text-white/80 hover:text-white hover:bg-white/10"
                      : isActive
                        ? "text-[#0a0a0a] bg-[#0a0a0a]/[0.08]"
                        : "text-[#0a0a0a]/80 hover:text-[#0a0a0a] hover:bg-[#0a0a0a]/[0.06]"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/contact"
              data-testid="nav-contact-cta"
              className={isDarkRoute ? "btn-ghost-light !py-[10px] !px-5 text-[12px]" : "btn-primary !py-[10px] !px-5 text-[12px]"}
            >
              Start a project <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <button
            data-testid="mobile-menu-toggle"
            className={`lg:hidden h-10 w-10 rounded-full border flex items-center justify-center ${isDarkRoute ? "border-white/20 text-white" : "border-black/10 text-[#0a0a0a]"}`}
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      <div
        data-testid="mobile-menu-overlay"
        className={`fixed inset-0 z-[60] bg-[#050505] text-white transition-all duration-500 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 h-[72px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-display font-black text-lg leading-none">R</span>
            </div>
            <span className="font-display font-black tracking-tight text-xl">reachvel</span>
          </Link>
          <button
            data-testid="mobile-menu-close"
            className="h-10 w-10 rounded-full border border-white/15 flex items-center justify-center"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-5 md:px-10 pt-10">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#ff5722] font-bold mb-6">
            Menu
          </p>
          <nav className="flex flex-col gap-1">
            {LINKS.concat([{ to: "/contact", label: "Contact" }]).map((l, i) => (
              <NavLink
                key={l.to}
                to={l.to}
                end={l.to === "/"}
                data-testid={`mobile-nav-link-${l.label.toLowerCase()}`}
                className="font-display font-black text-5xl tracking-tighter py-3 border-b border-white/10 flex items-baseline justify-between group"
              >
                <span>{l.label}</span>
                <span className="font-mono text-xs text-white/40 mr-1">0{i + 1}</span>
              </NavLink>
            ))}
          </nav>

          <div className="mt-12 space-y-4 text-sm text-white/60">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/40">Get in touch</div>
            <div>{BRAND.email}</div>
            <div>{BRAND.phone}</div>
          </div>
        </div>
      </div>
    </>
  );
}
