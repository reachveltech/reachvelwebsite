import { useEffect, useState } from "react";
import { ArrowUpRight, MapPin, Clock, X } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import Reveal from "@/components/Reveal";
import SectionLabel from "@/components/SectionLabel";
import Seo from "@/components/Seo";
import { CareersAtom } from "@/components/AtomicArt";
import { fetchRoles } from "@/lib/api";
import { BENEFITS } from "@/lib/data";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;
const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5 MB

function RoleApplyDialog({ role, onClose }) {
  const [form, setForm] = useState({ name: "", email: "", linkedin: "", note: "" });
  const [errors, setErrors] = useState({});
  const [resume, setResume] = useState(null); // { name, type, size, dataUrl }
  const [busy, setBusy] = useState(false);

  const handleResumePick = (e) => {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    if (f.size > MAX_RESUME_BYTES) {
      toast.error(`Resume is too large (max ${(MAX_RESUME_BYTES / 1024 / 1024).toFixed(0)} MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setResume({ name: f.name, type: f.type, size: f.size, dataUrl: reader.result });
      toast.success(`Attached ${f.name}`);
    };
    reader.onerror = () => toast.error("Couldn't read the file.");
    reader.readAsDataURL(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = "Name required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email = "Valid email required";
    if (!form.note.trim() || form.note.length < 10) errs.note = "Tell us a bit more (10+ chars)";
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      setBusy(true);
      const payload = {
        role_id: role.id,
        role_title: role.title,
        name: form.name.trim(),
        email: form.email.trim(),
        linkedin: form.linkedin.trim(),
        note: form.note.trim(),
      };
      if (resume) {
        payload.resume = {
          filename: resume.name,
          mimetype: resume.type,
          size: resume.size,
          data: resume.dataUrl,
        };
      }
      await axios.post(`${API}/applications`, payload);
      toast.success(`Application received for ${role.title}. We'll reply within 3 business days.`);
      onClose();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Couldn't submit. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      data-testid="role-apply-modal"
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-lg flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white border border-black/10 rounded-sm p-6 md:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          data-testid="role-apply-close"
          onClick={onClose}
          className="absolute top-4 right-4 h-10 w-10 rounded-full border border-black/10 hover:bg-[#ff5722] hover:text-white hover:border-[#ff5722] transition-colors flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold mb-2">
          Apply · {role.dept}
        </div>
        <h3 className="font-display font-black text-3xl tracking-tight text-[#0a0a0a]">
          {role.title}
        </h3>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">Full name</label>
            <input
              data-testid="apply-input-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]"
              placeholder="Ada Lovelace"
            />
            {errors.name && <div className="text-xs text-[#ff5722] mt-1">{errors.name}</div>}
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">Email</label>
            <input
              data-testid="apply-input-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]"
              placeholder="ada@example.com"
            />
            {errors.email && <div className="text-xs text-[#ff5722] mt-1">{errors.email}</div>}
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">LinkedIn / Portfolio</label>
            <input
              data-testid="apply-input-link"
              value={form.linkedin}
              onChange={(e) => setForm({ ...form, linkedin: e.target.value })}
              className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]"
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">Why this role?</label>
            <textarea
              data-testid="apply-input-note"
              rows={4}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722] resize-none"
              placeholder="Tell us about the work you're proudest of…"
            />
            {errors.note && <div className="text-xs text-[#ff5722] mt-1">{errors.note}</div>}
          </div>
          <div>
            <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
              Resume / CV
            </label>
            <div className="mt-3">
              <input
                id={`resume-${role.id}`}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleResumePick}
                className="hidden"
                data-testid="apply-resume-file"
              />
              {!resume ? (
                <label
                  htmlFor={`resume-${role.id}`}
                  data-testid="apply-resume-pick"
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-[0.15em] rounded-full border border-dashed border-black/30 text-[#4a4a4a] hover:border-[#ff5722] hover:text-[#ff5722] cursor-pointer transition-colors"
                >
                  <ArrowUpRight className="h-3.5 w-3.5 rotate-180" /> Attach resume (PDF / DOC)
                </label>
              ) : (
                <div className="inline-flex items-center gap-3 px-4 py-2.5 bg-[#f7f6f3] border border-black/15 rounded-full text-xs">
                  <span className="font-mono truncate max-w-[220px]" title={resume.name}>{resume.name}</span>
                  <span className="text-[#4a4a4a]">{(resume.size / 1024).toFixed(0)} KB</span>
                  <button
                    type="button"
                    onClick={() => setResume(null)}
                    data-testid="apply-resume-remove"
                    className="text-[#ff5722] hover:underline"
                  >
                    remove
                  </button>
                </div>
              )}
              <div className="mt-2 text-[10px] font-mono text-[#4a4a4a]">PDF, DOC, or DOCX — up to 5 MB.</div>
            </div>
          </div>
          <button
            type="submit"
            data-testid="apply-submit"
            disabled={busy}
            className="btn-primary w-full justify-center disabled:opacity-60"
          >
            {busy ? "Sending…" : "Send application"} <ArrowUpRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

export default function Careers() {
  const [activeRole, setActiveRole] = useState(null);
  const [roles, setRoles] = useState([]);

  useEffect(() => {
    fetchRoles().then((d) => setRoles(d || [])).catch(() => setRoles([]));
  }, []);

  return (
    <div data-testid="page-careers" className="bg-[#f7f6f3]">
      <Seo
        title={`Careers — ${roles.length ? `${roles.length} open roles` : "join the studio"}`}
        description="Build a career worth the craft. Reachvel hires across engineering, design, AI, and brand — remote-first, globally paid, profit-shared."
        path="/careers"
      />
      {/* Hero */}
      <section className="relative overflow-hidden pt-[110px] sm:pt-[140px] md:pt-[180px] pb-16 md:pb-24">
        <div className="hero-grid absolute inset-0 opacity-50 pointer-events-none" />
        <CareersAtom className="hidden lg:block absolute right-[-60px] top-[60px] h-[560px] w-[560px] opacity-80 pointer-events-none z-[5]" />
        <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <SectionLabel>Careers · {roles.length} Open Roles</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display font-black text-[12vw] sm:text-7xl md:text-8xl lg:text-[9.5rem] tracking-[-0.04em] leading-[0.9] text-[#0a0a0a] max-w-6xl">
              Build a career
              <br />
              <span className="italic font-light">worth</span>{" "}
              <span className="text-[#ff5722]">the craft.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-10 max-w-2xl text-lg md:text-xl text-[#4a4a4a] font-light leading-relaxed">
              We hire slowly and pay unreasonably. We work on problems that compound — in engineering,
              in design, in intelligence — alongside teammates you'll follow for a decade.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Culture mosaic */}
      <section className="bg-white border-y border-black/10">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-20 md:py-24 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6">
          <Reveal className="md:col-span-7">
            <img
              src="https://images.unsplash.com/photo-1758691737387-a89bb8adf768?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzMzN8MHwxfHNlYXJjaHwyfHxtb2Rlcm4lMjB0ZWNoJTIwdGVhbSUyMG9mZmljZSUyMGRpdmVyc2V8ZW58MHx8fHwxNzc3MjkyMDQ3fDA&ixlib=rb-4.1.0&q=85"
              alt="Reachvel team"
              className="w-full h-[460px] md:h-[540px] object-cover rounded-sm"
              loading="lazy"
            />
          </Reveal>
          <div className="md:col-span-5 flex flex-col gap-4 md:gap-6">
            <Reveal delay={120} className="flex-1">
              <img
                src="https://images.pexels.com/photos/12902874/pexels-photo-12902874.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
                alt="Reachvel working"
                className="w-full h-[220px] md:h-[260px] object-cover rounded-sm"
                loading="lazy"
              />
            </Reveal>
            <Reveal delay={200} className="flex-1 bg-[#0a0a0a] text-white p-8 md:p-10 rounded-sm">
              <SectionLabel tone="dark">Culture</SectionLabel>
              <h3 className="mt-4 font-display font-extrabold text-3xl md:text-4xl tracking-tight leading-tight">
                Hire for craft. Keep for character.
              </h3>
              <p className="mt-4 text-white/70">
                Remote-first, asynchronous by default, and intensely collaborative when it counts.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-[#f7f6f3] py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="max-w-3xl mb-14">
            <SectionLabel>Benefits</SectionLabel>
            <h2 className="mt-5 font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] text-[#0a0a0a]">
              The offer,
              <br /> unabridged.
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-black/10 border border-black/10">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.t} delay={i * 60} className="bg-white p-8 md:p-10 min-h-[220px]">
                <div className="text-[11px] font-mono tracking-[0.25em] text-[#ff5722] font-bold">
                  0{i + 1}
                </div>
                <h3 className="mt-4 font-display font-extrabold text-xl tracking-tight text-[#0a0a0a]">
                  {b.t}
                </h3>
                <p className="mt-3 text-sm text-[#4a4a4a] leading-relaxed">{b.d}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Open roles */}
      <section className="bg-white border-y border-black/10 py-24 md:py-32">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="flex items-end justify-between mb-14 gap-6">
            <div>
              <SectionLabel>Open Roles</SectionLabel>
              <h2 className="mt-5 font-display font-black text-4xl sm:text-5xl md:text-6xl tracking-tighter leading-[0.95] text-[#0a0a0a]">
                Now hiring.
              </h2>
            </div>
            <div className="hidden md:flex items-center gap-2 text-xs font-mono text-[#4a4a4a]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#ff5722] animate-pulse-dot" />
              {roles.length} positions · Global
            </div>
          </div>

          <div className="border-t border-black/10">
            {roles.map((r) => (
              <button
                key={r.id}
                data-testid={`role-${r.id}`}
                onClick={() => setActiveRole(r)}
                className="group w-full text-left flex flex-col md:flex-row md:items-center gap-4 md:gap-10 py-6 md:py-8 border-b border-black/10 hover:bg-[#0a0a0a] hover:text-white transition-colors duration-500 px-2 md:px-4"
              >
                <div className="md:w-1/2">
                  <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] mb-2">
                    {r.dept}
                  </div>
                  <div className="font-display font-bold text-2xl md:text-3xl tracking-tight">
                    {r.title}
                  </div>
                </div>
                <div className="md:flex-1 flex items-center gap-6 text-sm text-[#4a4a4a] group-hover:text-white/80">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> {r.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" /> {r.type}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em]">
                  Apply <ArrowUpRight className="h-4 w-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {activeRole && <RoleApplyDialog role={activeRole} onClose={() => setActiveRole(null)} />}
    </div>
  );
}
