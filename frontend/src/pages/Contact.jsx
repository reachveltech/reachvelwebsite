import { useState } from "react";
import axios from "axios";
import { ArrowUpRight, Mail, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import Reveal from "@/components/Reveal";
import SectionLabel from "@/components/SectionLabel";
import Seo from "@/components/Seo";
import { BRAND } from "@/lib/data";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const SERVICES = ["Web Engineering", "Mobile Applications", "AI Automation", "Commerce", "Brand", "Data", "Not sure yet"];
const BUDGETS = ["< $50k", "$50k – $150k", "$150k – $500k", "$500k+"];

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    service: "",
    budget: "",
    note: "",
  });
  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Required";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "Valid email required";
    if (form.phone && !/^[+\d\s().-]{7,20}$/.test(form.phone)) e.phone = "Enter a valid phone";
    if (!form.service) e.service = "Pick one";
    if (!form.note.trim() || form.note.length < 10) e.note = "Tell us a bit (10+ chars)";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    try {
      setSending(true);
      await axios.post(`${API}/contact`, form);
      toast.success("Briefing received. A strategist will reply within 24 hours.");
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again or email us directly.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div data-testid="page-contact" className="bg-[#f7f6f3]">
      <Seo
        title="Contact — start a project"
        description="Tell us about the improbable thing. A strategist will reply within 24 hours. Email info@reachvel.com or call +91 91214 77 117."
        path="/contact"
      />
      {/* Hero */}
      <section className="relative overflow-hidden pt-[110px] sm:pt-[140px] md:pt-[180px] pb-12 md:pb-20">
        <div className="hero-grid absolute inset-0 opacity-50 pointer-events-none" />
        <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <SectionLabel>Contact · Response within 24h</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display font-black text-[12vw] sm:text-7xl md:text-8xl lg:text-[9rem] tracking-[-0.04em] leading-[0.88] text-[#0a0a0a] max-w-6xl">
              Tell us
              <br />
              about the
              <br />
              <span className="text-[#ff5722]">improbable thing.</span>
            </h1>
          </Reveal>
        </div>
      </section>

      {/* Main split */}
      <section className="relative">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 grid lg:grid-cols-[1.1fr_1fr] gap-10 md:gap-16 py-10 md:py-16">
          {/* Form */}
          <Reveal className="relative">
            {submitted ? (
              <div data-testid="contact-success" className="bg-[#0a0a0a] text-white p-8 sm:p-10 md:p-14 rounded-sm min-h-[420px] sm:min-h-[540px] flex flex-col justify-center">
                <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] mb-4">
                  Briefing received
                </div>
                <h2 className="font-display font-black text-4xl md:text-5xl tracking-tighter">
                  We'll reply within 24 hours.
                </h2>
                <p className="mt-6 text-white/70 max-w-md">
                  You'll hear from a strategist — not a form-response bot. In the meantime, explore a few
                  of our recent engagements.
                </p>
                <button
                  data-testid="contact-reset"
                  onClick={() => {
                    setSubmitted(false);
                    setForm({ name: "", email: "", phone: "", company: "", service: "", budget: "", note: "" });
                  }}
                  className="mt-10 btn-ghost-light w-fit"
                >
                  Send another briefing <ArrowUpRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                data-testid="contact-form"
                className="bg-white border border-black/10 p-6 md:p-10 rounded-sm"
              >
                <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">
                  Briefing Form · 01 / 05
                </div>
                <h2 className="mt-2 font-display font-black text-3xl md:text-4xl tracking-tighter text-[#0a0a0a]">
                  Start a project
                </h2>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">Full name</label>
                    <input
                      data-testid="contact-name"
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
                      data-testid="contact-email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]"
                      placeholder="ada@company.com"
                    />
                    {errors.email && <div className="text-xs text-[#ff5722] mt-1">{errors.email}</div>}
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">Company</label>
                    <input
                      data-testid="contact-company"
                      value={form.company}
                      onChange={(e) => setForm({ ...form, company: e.target.value })}
                      className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]"
                      placeholder="Company or team"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">Mobile number</label>
                    <input
                      data-testid="contact-phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]"
                      placeholder="+1 (415) 555-0199"
                    />
                    {errors.phone && <div className="text-xs text-[#ff5722] mt-1">{errors.phone}</div>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
                      What are you building?
                    </label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {SERVICES.map((s) => (
                        <button
                          type="button"
                          key={s}
                          data-testid={`contact-service-${s.toLowerCase().replace(/\s|\//g, "-")}`}
                          onClick={() => setForm({ ...form, service: s })}
                          className={`px-4 py-2 text-xs font-mono uppercase tracking-[0.15em] rounded-full border transition-colors ${
                            form.service === s
                              ? "bg-[#0a0a0a] border-[#0a0a0a] text-white"
                              : "border-black/20 text-[#4a4a4a] hover:border-[#0a0a0a]"
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                    {errors.service && <div className="text-xs text-[#ff5722] mt-2">{errors.service}</div>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">Budget</label>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {BUDGETS.map((b) => (
                        <button
                          type="button"
                          key={b}
                          data-testid={`contact-budget-${b.replace(/[$<>\s]/g, "").toLowerCase()}`}
                          onClick={() => setForm({ ...form, budget: b })}
                          className={`px-4 py-2 text-xs font-mono rounded-full border transition-colors ${
                            form.budget === b
                              ? "bg-[#ff5722] border-[#ff5722] text-white"
                              : "border-black/20 text-[#4a4a4a] hover:border-[#ff5722]"
                          }`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
                      Tell us about the project
                    </label>
                    <textarea
                      data-testid="contact-note"
                      rows={5}
                      value={form.note}
                      onChange={(e) => setForm({ ...form, note: e.target.value })}
                      className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722] resize-none"
                      placeholder="Goals, constraints, timelines, links…"
                    />
                    {errors.note && <div className="text-xs text-[#ff5722] mt-1">{errors.note}</div>}
                  </div>
                </div>

                <button
                  type="submit"
                  data-testid="contact-submit"
                  disabled={sending}
                  className="btn-primary mt-10 w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {sending ? "Sending…" : "Send briefing"} <ArrowUpRight className="h-4 w-4" />
                </button>
                <p className="mt-4 text-xs text-[#4a4a4a] text-center">
                  By submitting, you agree to our privacy policy. No spam, ever.
                </p>
              </form>
            )}
          </Reveal>

          {/* Info rail */}
          <div className="space-y-10">
            <Reveal delay={80}>
              <div className="bg-[#0a0a0a] text-white p-8 md:p-10 rounded-sm relative overflow-hidden">
                <div className="hero-grid-dark absolute inset-0 opacity-30 pointer-events-none" />
                <div className="relative">
                  <SectionLabel tone="dark">Direct channels</SectionLabel>
                  <div className="mt-8 space-y-6">
                    <a href={`mailto:${BRAND.email}`} className="flex items-start gap-4 group">
                      <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/40">
                          Email
                        </div>
                        <div className="mt-1 text-lg group-hover:text-[#ff5722] transition-colors">
                          {BRAND.email}
                        </div>
                      </div>
                    </a>
                    <a href={`tel:${BRAND.phone}`} className="flex items-start gap-4 group">
                      <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center">
                        <Phone className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/40">
                          Phone
                        </div>
                        <div className="mt-1 text-lg group-hover:text-[#ff5722] transition-colors">
                          {BRAND.phone}
                        </div>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>

            <Reveal delay={160}>
              <div>
                <SectionLabel>Offices · 03 Locations</SectionLabel>
                <div className="mt-6 border-t border-black/10">
                  {BRAND.offices.map((o) => (
                    <div key={o.city} className="py-6 border-b border-black/10 flex items-start gap-4">
                      <div className="h-10 w-10 rounded-full bg-[#ff5722]/10 text-[#ff5722] flex items-center justify-center">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-baseline gap-3">
                          <div className="font-display font-bold text-xl text-[#0a0a0a]">{o.city}</div>
                          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
                            {o.timezone}
                          </span>
                        </div>
                        <div className="mt-1 text-sm text-[#4a4a4a]">{o.line1}</div>
                        <div className="text-sm text-[#4a4a4a]">{o.line2}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>
    </div>
  );
}
