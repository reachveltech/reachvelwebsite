import { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpRight, LogOut, Trash2, RefreshCw, Mail, Phone, Building2, Tag, Wallet, MessageSquare } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const TOKEN_KEY = "reachvel_admin_token";

function formatDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0 });
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);

  const fetchAll = async (t = token) => {
    if (!t) return;
    setLoading(true);
    try {
      const [s, st] = await Promise.all([
        axios.get(`${API}/admin/submissions`, { headers: { "X-Admin-Token": t } }),
        axios.get(`${API}/admin/stats`, { headers: { "X-Admin-Token": t } }),
      ]);
      setSubmissions(s.data || []);
      setStats(st.data || { total: 0, today: 0 });
    } catch (err) {
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please sign in again.");
        logout();
      } else {
        toast.error("Couldn't load submissions.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Reachvel · Admin";
    if (token) fetchAll(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (e) => {
    e.preventDefault();
    if (!password) return;
    try {
      setLoggingIn(true);
      const { data } = await axios.post(`${API}/admin/login`, { password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword("");
      await fetchAll(data.token);
      toast.success("Signed in");
    } catch (err) {
      toast.error(err?.response?.status === 401 ? "Invalid password" : "Sign-in failed");
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setSubmissions([]);
    setStats({ total: 0, today: 0 });
    setSelected(null);
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this submission? This can't be undone.")) return;
    try {
      await axios.delete(`${API}/admin/submissions/${id}`, { headers: { "X-Admin-Token": token } });
      toast.success("Deleted");
      setSubmissions((xs) => xs.filter((x) => x.id !== id));
      setSelected(null);
    } catch {
      toast.error("Couldn't delete");
    }
  };

  if (!token) {
    return (
      <div data-testid="page-admin-login" className="min-h-screen bg-[#050505] text-white flex flex-col">
        <header className="px-5 md:px-10 py-5 border-b border-white/10 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-md bg-white flex items-center justify-center">
              <span className="text-black font-display font-black text-lg leading-none">R</span>
              <span className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 h-4 w-[2px] bg-[#ff5722]" />
            </div>
            <span className="font-display font-black tracking-tight text-xl">reachvel <span className="text-[#ff5722]">/ admin</span></span>
          </Link>
          <Link to="/" className="text-sm text-white/60 hover:text-white link-underline" data-testid="admin-back-home">← Back to site</Link>
        </header>

        <div className="flex-1 flex items-center justify-center px-5 py-20">
          <form onSubmit={login} className="w-full max-w-md bg-[#0f0f0f] border border-white/10 p-8 md:p-10 rounded-sm">
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">
              Admin · Access required
            </div>
            <h1 className="mt-3 font-display font-black text-3xl tracking-tighter">Sign in</h1>
            <p className="mt-3 text-sm text-white/60">
              Enter the admin password to view client briefings.
            </p>

            <div className="mt-8">
              <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-white/50">Password</label>
              <input
                type="password"
                autoFocus
                data-testid="admin-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full bg-transparent border-b border-white/20 py-2 focus:outline-none focus:border-[#ff5722]"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              data-testid="admin-login-submit"
              disabled={loggingIn}
              className="btn-ghost-light !border-[#ff5722] !text-white bg-[#ff5722] hover:!bg-white hover:!text-black mt-8 w-full justify-center disabled:opacity-60"
            >
              {loggingIn ? "Signing in…" : "Sign in"} <ArrowUpRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="page-admin-dashboard" className="min-h-screen bg-[#f7f6f3]">
      <header className="sticky top-0 z-30 bg-white border-b border-black/10">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="relative h-9 w-9 rounded-md bg-[#0a0a0a] flex items-center justify-center">
              <span className="text-white font-display font-black text-lg leading-none">R</span>
              <span className="absolute -bottom-[2px] left-1/2 -translate-x-1/2 h-4 w-[2px] bg-[#ff5722]" />
            </div>
            <span className="font-display font-black tracking-tight text-xl">reachvel <span className="text-[#ff5722]">/ admin</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAll()}
              data-testid="admin-refresh"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-black/15 rounded-full hover:border-[#ff5722] hover:text-[#ff5722] transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden md:inline">Refresh</span>
            </button>
            <button
              onClick={logout}
              data-testid="admin-logout"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-black/15 rounded-full hover:border-[#0a0a0a] hover:bg-[#0a0a0a] hover:text-white transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-5 md:px-10 py-10 md:py-14">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">
              Briefings
            </div>
            <h1 className="mt-2 font-display font-black text-4xl md:text-5xl tracking-tighter text-[#0a0a0a]">
              Client submissions
            </h1>
          </div>
          <div className="text-xs font-mono text-[#4a4a4a]">
            {submissions.length} total · {loading ? "loading…" : "live"}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-black/10 border border-black/10 mb-10">
          <Stat label="Total briefings" value={stats.total} />
          <Stat label="Today" value={stats.today} />
          <Stat label="With phone" value={submissions.filter((s) => s.phone).length} />
          <Stat label="Services" value={new Set(submissions.map((s) => s.service).filter(Boolean)).size} />
        </div>

        {submissions.length === 0 ? (
          <div className="bg-white border border-black/10 p-14 text-center">
            <div className="font-display font-black text-3xl text-[#0a0a0a]">No briefings yet.</div>
            <div className="mt-3 text-[#4a4a4a]">When someone submits the contact form, they'll appear here.</div>
          </div>
        ) : (
          <div className="bg-white border border-black/10 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-[#f7f6f3] border-b border-black/10 text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
                <tr>
                  <th className="px-5 py-4">When</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4 hidden md:table-cell">Email</th>
                  <th className="px-5 py-4 hidden lg:table-cell">Phone</th>
                  <th className="px-5 py-4 hidden lg:table-cell">Service</th>
                  <th className="px-5 py-4 hidden xl:table-cell">Budget</th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((s) => (
                  <tr
                    key={s.id}
                    data-testid={`admin-row-${s.id}`}
                    className="border-b border-black/5 hover:bg-[#0a0a0a]/[0.02] cursor-pointer transition-colors"
                    onClick={() => setSelected(s)}
                  >
                    <td className="px-5 py-4 text-xs font-mono text-[#4a4a4a] whitespace-nowrap">{formatDate(s.created_at)}</td>
                    <td className="px-5 py-4 font-semibold text-[#0a0a0a]">{s.name}</td>
                    <td className="px-5 py-4 text-sm text-[#4a4a4a] hidden md:table-cell">{s.email}</td>
                    <td className="px-5 py-4 text-sm text-[#4a4a4a] hidden lg:table-cell">{s.phone || "—"}</td>
                    <td className="px-5 py-4 text-sm hidden lg:table-cell">
                      {s.service ? (
                        <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-[0.15em] bg-[#ff5722]/10 text-[#ff5722] rounded">
                          {s.service}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-5 py-4 text-sm text-[#4a4a4a] hidden xl:table-cell">{s.budget || "—"}</td>
                    <td className="px-5 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.15em] text-[#ff5722]">
                        View →
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs font-mono text-[#4a4a4a]">
          Stored locally in MongoDB · collection: <span className="text-[#0a0a0a]">contact_submissions</span>
        </p>
      </main>

      {selected && (
        <div
          data-testid="admin-detail-modal"
          className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="relative w-full max-w-2xl bg-white border border-black/10 max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-black/10 px-6 md:px-8 py-4 flex items-center justify-between">
              <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">
                Briefing · {formatDate(selected.created_at)}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => remove(selected.id)}
                  data-testid="admin-detail-delete"
                  className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.15em] text-[#4a4a4a] hover:text-[#ff5722]"
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
                <button
                  onClick={() => setSelected(null)}
                  data-testid="admin-detail-close"
                  className="h-8 w-8 rounded-full border border-black/10 hover:bg-black hover:text-white flex items-center justify-center"
                >
                  ✕
                </button>
              </div>
            </div>
            <div className="p-6 md:p-10">
              <h3 className="font-display font-black text-3xl md:text-4xl tracking-tighter text-[#0a0a0a]">
                {selected.name}
              </h3>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field icon={<Mail className="h-4 w-4" />} label="Email"
                  value={<a className="link-underline" href={`mailto:${selected.email}`}>{selected.email}</a>} />
                <Field icon={<Phone className="h-4 w-4" />} label="Phone"
                  value={selected.phone ? <a className="link-underline" href={`tel:${selected.phone}`}>{selected.phone}</a> : "—"} />
                <Field icon={<Building2 className="h-4 w-4" />} label="Company" value={selected.company || "—"} />
                <Field icon={<Tag className="h-4 w-4" />} label="Service" value={selected.service || "—"} />
                <Field icon={<Wallet className="h-4 w-4" />} label="Budget" value={selected.budget || "—"} />
              </div>
              <div className="mt-8">
                <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a] mb-3">
                  <MessageSquare className="h-4 w-4" /> Note
                </div>
                <div className="bg-[#f7f6f3] border border-black/10 p-5 text-[#0a0a0a] leading-relaxed whitespace-pre-wrap">
                  {selected.note}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-white p-6 md:p-8">
      <div className="font-display font-black text-4xl md:text-5xl tracking-tighter text-[#0a0a0a]">
        {value}
      </div>
      <div className="mt-3 text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
        {label}
      </div>
    </div>
  );
}

function Field({ icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a] mb-1">
        {icon} {label}
      </div>
      <div className="text-[#0a0a0a] text-sm break-all">{value}</div>
    </div>
  );
}
