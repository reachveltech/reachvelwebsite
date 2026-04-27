import { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  ArrowUpRight, LogOut, Trash2, RefreshCw, Mail, Phone, Building2, Tag, Wallet,
  MessageSquare, Search, KeyRound, X,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const TOKEN_KEY = "reachvel_admin_token";

const STATUSES = [
  { k: "new",        label: "New",        dot: "bg-[#ff5722]"   },
  { k: "reviewing",  label: "Reviewing",  dot: "bg-amber-500"   },
  { k: "contacted",  label: "Contacted",  dot: "bg-blue-500"    },
  { k: "won",        label: "Won",        dot: "bg-emerald-500" },
  { k: "lost",       label: "Lost",       dot: "bg-zinc-400"    },
];
const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.k, s]));

function fmtDate(iso) {
  try {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      year: "numeric", month: "short", day: "2-digit",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return iso; }
}

export default function Admin() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY) || "");
  const [password, setPassword] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ total: 0, today: 0, by_status: {} });
  const [loading, setLoading] = useState(false);

  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [pwModalOpen, setPwModalOpen] = useState(false);

  const debounceRef = useRef(null);

  const fetchAll = async (t = token, query = q, filter = statusFilter) => {
    if (!t) return;
    setLoading(true);
    try {
      const params = {};
      if (query) params.q = query;
      if (filter && filter !== "all") params.status = filter;
      const [s, st] = await Promise.all([
        axios.get(`${API}/admin/submissions`, { headers: { "X-Admin-Token": t }, params }),
        axios.get(`${API}/admin/stats`, { headers: { "X-Admin-Token": t } }),
      ]);
      setSubmissions(s.data || []);
      setStats(st.data || { total: 0, today: 0, by_status: {} });
    } catch (err) {
      if (err?.response?.status === 401) {
        toast.error("Session expired. Please sign in again.");
        hardLogout();
      } else {
        toast.error("Couldn't load submissions.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Reachvel · Admin";
    if (token) fetchAll(token, "", "all");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // debounced refresh on q/statusFilter change
  useEffect(() => {
    if (!token) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchAll(token, q, statusFilter), 280);
    return () => debounceRef.current && clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, statusFilter]);

  const login = async (e) => {
    e.preventDefault();
    if (!password) return;
    try {
      setLoggingIn(true);
      const { data } = await axios.post(`${API}/admin/login`, { password });
      localStorage.setItem(TOKEN_KEY, data.token);
      setToken(data.token);
      setPassword("");
      await fetchAll(data.token, "", "all");
      toast.success("Signed in");
    } catch (err) {
      const status = err?.response?.status;
      if (status === 429) toast.error(err.response.data?.detail || "Too many attempts.");
      else if (status === 401) toast.error("Invalid password");
      else toast.error("Sign-in failed");
    } finally {
      setLoggingIn(false);
    }
  };

  const hardLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setSubmissions([]);
    setStats({ total: 0, today: 0, by_status: {} });
    setSelected(null);
    setPwModalOpen(false);
    setQ("");
    setStatusFilter("all");
  };

  const logout = async () => {
    try { await axios.post(`${API}/admin/logout`, {}, { headers: { "X-Admin-Token": token } }); } catch { /* noop */ }
    hardLogout();
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this submission? This can't be undone.")) return;
    try {
      await axios.delete(`${API}/admin/submissions/${id}`, { headers: { "X-Admin-Token": token } });
      toast.success("Deleted");
      setSubmissions((xs) => xs.filter((x) => x.id !== id));
      setSelected(null);
      fetchAll(token, q, statusFilter);
    } catch { toast.error("Couldn't delete"); }
  };

  const changeStatus = async (id, newStatus) => {
    const prev = submissions.find((s) => s.id === id)?.status;
    // optimistic
    setSubmissions((xs) => xs.map((x) => (x.id === id ? { ...x, status: newStatus } : x)));
    if (selected?.id === id) setSelected({ ...selected, status: newStatus });
    try {
      await axios.patch(
        `${API}/admin/submissions/${id}`,
        { status: newStatus },
        { headers: { "X-Admin-Token": token } },
      );
      toast.success(`Marked ${STATUS_MAP[newStatus].label}`);
      fetchAll(token, q, statusFilter);
    } catch {
      toast.error("Couldn't update status");
      setSubmissions((xs) => xs.map((x) => (x.id === id ? { ...x, status: prev } : x)));
    }
  };

  const numbered = useMemo(
    () => submissions.map((s, i) => ({ ...s, sno: i + 1 })),
    [submissions],
  );

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
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPwModalOpen(true)}
              data-testid="admin-change-password"
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border border-black/15 rounded-full hover:border-[#ff5722] hover:text-[#ff5722] transition-colors"
            >
              <KeyRound className="h-4 w-4" /> <span className="hidden md:inline">Change password</span>
            </button>
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

      <main className="mx-auto max-w-[1400px] px-5 md:px-10 py-8 md:py-12">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">
              Briefings
            </div>
            <h1 className="mt-2 font-display font-black text-4xl md:text-5xl tracking-tighter text-[#0a0a0a]">
              Client submissions
            </h1>
          </div>
          <div className="text-xs font-mono text-[#4a4a4a]">
            {numbered.length} shown · {stats.total} total · {loading ? "loading…" : "live"}
          </div>
        </div>

        {/* status cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-px bg-black/10 border border-black/10 mb-8">
          <Stat label="Total" value={stats.total} />
          <Stat label="Today" value={stats.today} />
          {STATUSES.map((s) => (
            <Stat key={s.k} label={s.label} value={stats.by_status?.[s.k] ?? 0} dot={s.dot} />
          ))}
        </div>

        {/* search + filter */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-2 w-full md:w-96">
            <Search className="h-4 w-4 text-[#4a4a4a]" />
            <input
              data-testid="admin-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search name, email, phone, company, note…"
              className="bg-transparent focus:outline-none text-sm flex-1"
            />
            {q && (
              <button
                onClick={() => setQ("")}
                data-testid="admin-search-clear"
                className="text-xs text-[#4a4a4a] hover:text-[#ff5722]"
              >
                clear
              </button>
            )}
          </div>
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {[{ k: "all", label: "All", dot: "bg-[#0a0a0a]" }, ...STATUSES].map((s) => (
              <button
                key={s.k}
                data-testid={`admin-filter-${s.k}`}
                onClick={() => setStatusFilter(s.k)}
                className={`shrink-0 inline-flex items-center gap-2 px-3 py-2 rounded-full border text-xs font-mono uppercase tracking-[0.15em] transition-colors ${
                  statusFilter === s.k
                    ? "bg-[#0a0a0a] border-[#0a0a0a] text-white"
                    : "border-black/15 text-[#4a4a4a] hover:border-[#0a0a0a]"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
                {s.label}
                {s.k !== "all" && (
                  <span className="opacity-60">{stats.by_status?.[s.k] ?? 0}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {numbered.length === 0 ? (
          <div className="bg-white border border-black/10 p-14 text-center">
            <div className="font-display font-black text-3xl text-[#0a0a0a]">
              {q || statusFilter !== "all" ? "No matches." : "No briefings yet."}
            </div>
            <div className="mt-3 text-[#4a4a4a]">
              {q || statusFilter !== "all"
                ? "Try a different search or filter."
                : "When someone submits the contact form, they'll appear here."}
            </div>
          </div>
        ) : (
          <div className="bg-white border border-black/10 overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-[#f7f6f3] border-b border-black/10 text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
                <tr>
                  <th className="px-4 py-4 w-12">S.No</th>
                  <th className="px-4 py-4">When</th>
                  <th className="px-4 py-4">Name</th>
                  <th className="px-4 py-4">Email</th>
                  <th className="px-4 py-4 hidden lg:table-cell">Phone</th>
                  <th className="px-4 py-4 hidden lg:table-cell">Service</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {numbered.map((s) => (
                  <tr
                    key={s.id}
                    data-testid={`admin-row-${s.id}`}
                    className="border-b border-black/5 hover:bg-[#0a0a0a]/[0.02] transition-colors"
                  >
                    <td className="px-4 py-4 text-xs font-mono text-[#4a4a4a]">{String(s.sno).padStart(2, "0")}</td>
                    <td className="px-4 py-4 text-xs font-mono text-[#4a4a4a] whitespace-nowrap">{fmtDate(s.created_at)}</td>
                    <td className="px-4 py-4 font-semibold text-[#0a0a0a] cursor-pointer" onClick={() => setSelected(s)}>{s.name}</td>
                    <td className="px-4 py-4 text-sm text-[#4a4a4a]">{s.email}</td>
                    <td className="px-4 py-4 text-sm text-[#4a4a4a] hidden lg:table-cell">{s.phone || "—"}</td>
                    <td className="px-4 py-4 text-sm hidden lg:table-cell">
                      {s.service ? (
                        <span className="px-2 py-1 text-[10px] font-mono uppercase tracking-[0.15em] bg-[#ff5722]/10 text-[#ff5722] rounded">
                          {s.service}
                        </span>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-4">
                      <StatusSelect value={s.status} onChange={(v) => changeStatus(s.id, v)} testid={`admin-status-${s.id}`} />
                    </td>
                    <td className="px-4 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelected(s)}
                        data-testid={`admin-view-${s.id}`}
                        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-[0.15em] text-[#ff5722] hover:text-[#0a0a0a]"
                      >
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p className="mt-6 text-xs font-mono text-[#4a4a4a]">
          Stored in MongoDB · collection: <span className="text-[#0a0a0a]">contact_submissions</span>
        </p>
      </main>

      {selected && (
        <DetailModal
          s={selected}
          onClose={() => setSelected(null)}
          onDelete={() => remove(selected.id)}
          onStatus={(st) => changeStatus(selected.id, st)}
        />
      )}
      {pwModalOpen && (
        <ChangePasswordModal token={token} onClose={() => setPwModalOpen(false)} onChanged={() => { setPwModalOpen(false); }} />
      )}
    </div>
  );
}

// ───── Subcomponents ─────
function Stat({ label, value, dot }) {
  return (
    <div className="bg-white p-5">
      <div className="font-display font-black text-3xl md:text-4xl tracking-tighter text-[#0a0a0a]">
        {value}
      </div>
      <div className="mt-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
        {dot && <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />}
        {label}
      </div>
    </div>
  );
}

function StatusSelect({ value, onChange, testid }) {
  const cur = STATUS_MAP[value] || STATUS_MAP.new;
  return (
    <div className="relative inline-flex items-center">
      <span className={`absolute left-2.5 h-1.5 w-1.5 rounded-full ${cur.dot}`} />
      <select
        data-testid={testid}
        value={value || "new"}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-6 pr-6 py-1.5 text-xs font-mono uppercase tracking-[0.1em] bg-white border border-black/15 rounded-full hover:border-[#ff5722] focus:outline-none focus:border-[#ff5722] cursor-pointer"
      >
        {STATUSES.map((s) => <option key={s.k} value={s.k}>{s.label}</option>)}
      </select>
    </div>
  );
}

function DetailModal({ s, onClose, onDelete, onStatus }) {
  return (
    <div
      data-testid="admin-detail-modal"
      className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="relative w-full max-w-2xl bg-white border border-black/10 max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white border-b border-black/10 px-6 md:px-8 py-4 flex items-center justify-between gap-3">
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">
            Briefing · {fmtDate(s.created_at)}
          </div>
          <div className="flex items-center gap-2">
            <StatusSelect value={s.status} onChange={onStatus} testid="admin-detail-status" />
            <button
              onClick={onDelete}
              data-testid="admin-detail-delete"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-[0.15em] text-[#4a4a4a] hover:text-[#ff5722]"
            >
              <Trash2 className="h-4 w-4" /> Delete
            </button>
            <button
              onClick={onClose}
              data-testid="admin-detail-close"
              className="h-8 w-8 rounded-full border border-black/10 hover:bg-black hover:text-white flex items-center justify-center"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="p-6 md:p-10">
          <h3 className="font-display font-black text-3xl md:text-4xl tracking-tighter text-[#0a0a0a]">
            {s.name}
          </h3>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            <Field icon={<Mail className="h-4 w-4" />} label="Email"
              value={<a className="link-underline" href={`mailto:${s.email}`}>{s.email}</a>} />
            <Field icon={<Phone className="h-4 w-4" />} label="Phone"
              value={s.phone ? <a className="link-underline" href={`tel:${s.phone}`}>{s.phone}</a> : "—"} />
            <Field icon={<Building2 className="h-4 w-4" />} label="Company" value={s.company || "—"} />
            <Field icon={<Tag className="h-4 w-4" />} label="Service" value={s.service || "—"} />
            <Field icon={<Wallet className="h-4 w-4" />} label="Budget" value={s.budget || "—"} />
          </div>
          <div className="mt-8">
            <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a] mb-3">
              <MessageSquare className="h-4 w-4" /> Note
            </div>
            <div className="bg-[#f7f6f3] border border-black/10 p-5 text-[#0a0a0a] leading-relaxed whitespace-pre-wrap">
              {s.note}
            </div>
          </div>
        </div>
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

function ChangePasswordModal({ token, onClose, onChanged }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (next.length < 8) return toast.error("New password must be ≥ 8 characters");
    if (next !== confirmPw) return toast.error("Passwords don't match");
    try {
      setBusy(true);
      await axios.post(
        `${API}/admin/rotate-password`,
        { current_password: current, new_password: next },
        { headers: { "X-Admin-Token": token } },
      );
      toast.success("Password updated. Other sessions signed out.");
      onChanged();
    } catch (err) {
      const msg = err?.response?.data?.detail || "Couldn't update password";
      toast.error(typeof msg === "string" ? msg : "Couldn't update password");
    } finally { setBusy(false); }
  };

  return (
    <div
      data-testid="admin-password-modal"
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md flex items-center justify-center p-4"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        className="relative w-full max-w-md bg-white border border-black/10 p-6 md:p-10"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          data-testid="admin-password-close"
          className="absolute top-4 right-4 h-8 w-8 rounded-full border border-black/10 hover:bg-black hover:text-white flex items-center justify-center"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">
          Security
        </div>
        <h3 className="mt-2 font-display font-black text-3xl tracking-tighter text-[#0a0a0a]">
          Change password
        </h3>
        <p className="mt-3 text-sm text-[#4a4a4a]">
          This will sign out all other admin sessions.
        </p>

        <div className="mt-6 space-y-4">
          <Pw label="Current password" value={current} onChange={setCurrent} testid="pw-current" />
          <Pw label="New password (min 8)" value={next} onChange={setNext} testid="pw-new" />
          <Pw label="Confirm new password" value={confirmPw} onChange={setConfirmPw} testid="pw-confirm" />
        </div>

        <button
          type="submit"
          disabled={busy}
          data-testid="admin-password-submit"
          className="btn-primary mt-8 w-full justify-center disabled:opacity-60"
        >
          {busy ? "Updating…" : "Update password"} <ArrowUpRight className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}

function Pw({ label, value, onChange, testid }) {
  return (
    <div>
      <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">{label}</label>
      <input
        type="password"
        data-testid={testid}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]"
        placeholder="••••••••"
      />
    </div>
  );
}
