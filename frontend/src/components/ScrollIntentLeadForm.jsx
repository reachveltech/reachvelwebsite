import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, X } from "lucide-react";
import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const DISMISSED_KEY = "reachvel_lead_intent_dismissed";
const SUBMITTED_KEY = "reachvel_lead_intent_submitted";

/**
 * Scroll-intent lead form (Reachvel-themed, atomic-flourished).
 *
 * Trigger: user must (a) scroll down at least 600px, then (b) scroll up by
 *          ≥ 200px without reaching the very top. Fires once per tab session.
 * Persistence: dismissing the modal sets sessionStorage so it never re-opens
 *              in the same tab. A successful submit also suppresses it.
 */
export default function ScrollIntentLeadForm() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", note: "" });
  const fired = useRef(false);
  const maxScroll = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const dismissed = sessionStorage.getItem(DISMISSED_KEY) === "1"
                   || sessionStorage.getItem(SUBMITTED_KEY) === "1";
    if (dismissed) { fired.current = true; return; }

    const onScroll = () => {
      if (fired.current) return;
      const y = window.scrollY;
      if (y > maxScroll.current) maxScroll.current = y;

      // User must have first scrolled down past 600px,
      // then scroll back up by at least 200px (but not all the way to 0).
      if (maxScroll.current > 600 && y < maxScroll.current - 200 && y > 80) {
        fired.current = true;
        setOpen(true);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  const close = () => {
    sessionStorage.setItem(DISMISSED_KEY, "1");
    setOpen(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    const name = form.name.trim();
    const email = form.email.trim();
    const phone = form.phone.trim();
    const note = form.note.trim();
    if (name.length < 2) return toast.error("Please enter your name.");
    if (!/^\S+@\S+\.\S+$/.test(email)) return toast.error("Please enter a valid email.");
    if (note.length < 10) return toast.error("Tell us a little more — at least 10 characters.");
    setBusy(true);
    try {
      await axios.post(`${API}/contact`, {
        name, email, phone, note,
        company: "", service: "", budget: "",
      });
      sessionStorage.setItem(SUBMITTED_KEY, "1");
      toast.success("Got it. We'll reach out within one business day.");
      setOpen(false);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Couldn't send. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div
      data-testid="scroll-intent-lead"
      className="fixed inset-0 z-[90] flex items-stretch justify-end"
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <button
        aria-label="Close"
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm cursor-default"
      />

      {/* Panel */}
      <div
        className="relative w-full md:max-w-[440px] h-full bg-[#f7f6f3] border-l border-black/10
                   shadow-[-30px_0_60px_-20px_rgba(0,0,0,0.4)]
                   overflow-y-auto animate-slide-in-right"
      >
        {/* atomic flourish (background) */}
        <FlourishSVG />

        {/* close */}
        <button
          onClick={close}
          data-testid="scroll-intent-close"
          className="absolute top-4 right-4 z-20 h-9 w-9 rounded-full bg-white border border-black/15 hover:bg-black hover:text-white transition-colors flex items-center justify-center"
          aria-label="Close form"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="relative z-10 px-6 md:px-8 pt-12 pb-10">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#ff5722] animate-pulse-dot" />
            Q2 2026 · Now booking
          </div>

          <h2 className="mt-4 font-display font-black text-3xl md:text-[2.5rem] tracking-tighter leading-[1.05] text-[#0a0a0a]">
            Got the vision?{" "}
            <span className="text-[#ff5722]">We engineer it</span>{" "}
            <span className="italic font-medium">at atomic scale.</span>
          </h2>

          <p className="mt-3 text-sm text-[#4a4a4a] leading-relaxed">
            Tell us what you want to build. A senior partner replies inside one business day —
            no SDR, no template, no fluff.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-6" noValidate>
            <Field
              label="Full name"
              required
              type="text"
              value={form.name}
              onChange={(v) => setForm((f) => ({ ...f, name: v }))}
              placeholder="Jane Doe"
              testid="lead-name"
              autoFocus
            />
            <Field
              label="Email"
              required
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
              placeholder="jane@company.com"
              testid="lead-email"
            />
            <Field
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="+91 98 0000 0000"
              testid="lead-phone"
            />
            <div>
              <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#4a4a4a]">
                What are you building? *
              </label>
              <textarea
                rows={4}
                required
                value={form.note}
                onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
                placeholder="A brief on the product, timeline, and what good looks like."
                data-testid="lead-note"
                className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722] resize-none text-[#0a0a0a]"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              data-testid="lead-submit"
              className="group relative w-full overflow-hidden bg-[#0a0a0a] hover:bg-[#ff5722] transition-colors duration-300 text-white py-4 px-6 inline-flex items-center justify-center gap-3 disabled:opacity-60"
            >
              <span className="text-[12px] font-bold uppercase tracking-[0.25em]">
                {busy ? "Sending…" : "Start the briefing"}
              </span>
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1" />
            </button>
            <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]/80 text-center">
              We never share. · Reply within one business day.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

function Field({ label, required, type, value, onChange, placeholder, testid, autoFocus }) {
  return (
    <div>
      <label className="text-[10px] font-mono uppercase tracking-[0.25em] text-[#4a4a4a]">
        {label} {required && <span className="text-[#ff5722]">*</span>}
      </label>
      <input
        autoFocus={autoFocus}
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        data-testid={testid}
        className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722] text-[#0a0a0a]"
      />
    </div>
  );
}

function FlourishSVG() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 440 800"
      preserveAspectRatio="xMidYMid slice"
      className="absolute inset-0 w-full h-full opacity-[0.18] pointer-events-none"
    >
      <defs>
        <radialGradient id="lead-glow" cx="50%" cy="20%" r="60%">
          <stop offset="0%" stopColor="#ff5722" stopOpacity="0.6" />
          <stop offset="80%" stopColor="#ff5722" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="440" height="800" fill="url(#lead-glow)" />
      {/* orbits */}
      <g stroke="#0a0a0a" strokeOpacity="0.18" fill="none">
        <ellipse cx="220" cy="160" rx="160" ry="56" />
        <ellipse cx="220" cy="160" rx="160" ry="56" transform="rotate(60 220 160)" />
        <ellipse cx="220" cy="160" rx="160" ry="56" transform="rotate(-60 220 160)" />
      </g>
      {/* nodes */}
      <g fill="#ff5722">
        <circle cx="220" cy="160" r="5" />
        <circle cx="380" cy="160" r="3" />
        <circle cx="60"  cy="160" r="3" />
        <circle cx="298" cy="106" r="2.5" />
        <circle cx="142" cy="214" r="2.5" />
      </g>
      {/* hex lattice bottom */}
      <g stroke="#0a0a0a" strokeOpacity="0.1" fill="none">
        {Array.from({ length: 6 }).map((_, i) => {
          const cy = 540 + (i % 2) * 40;
          return Array.from({ length: 5 }).map((__, j) => {
            const cx = 60 + j * 80 + (i % 2 === 0 ? 0 : 40);
            return <polygon key={`${i}-${j}`} points={hex(cx, cy, 22).join(" ")} />;
          });
        })}
      </g>
    </svg>
  );
}

function hex(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts;
}
