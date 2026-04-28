import { useEffect, useState } from "react";
import { crmAnalytics } from "@/lib/api";
import { INR, INR_PRECISE, LEAD_STAGES, PROJECT_STATUSES, TASK_STATUSES } from "./crmUtils";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from "recharts";
import { TrendingUp, Users, Briefcase, CheckSquare, Wallet, ArrowDownCircle, ArrowUpCircle, FileText } from "lucide-react";

const PIE_COLORS = ["#ff5722", "#0a0a0a", "#4a4a4a", "#a8a8a8", "#d4d4d4", "#10b981"];

export default function Analytics({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    crmAnalytics(token).then((d) => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [token]);

  if (loading || !data) {
    return <div className="p-10 text-sm text-[#4a4a4a]">Loading analytics…</div>;
  }

  const s = data.summary;

  const leadsPie = LEAD_STAGES.map((st) => ({ name: st.label, value: data.leads_by_stage?.[st.k] || 0 }));
  const projectsPie = PROJECT_STATUSES.map((st) => ({ name: st.label, value: data.projects_by_status?.[st.k] || 0 }));
  const tasksBar = TASK_STATUSES.map((st) => ({ name: st.label, value: data.tasks_by_status?.[st.k] || 0 }));

  return (
    <div data-testid="crm-analytics">
      <div className="mb-6">
        <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">Overview</div>
        <h2 className="mt-1 font-display font-black text-3xl md:text-4xl tracking-tighter text-[#0a0a0a]">
          Business analytics
        </h2>
        <p className="mt-2 text-sm text-[#4a4a4a]">Live snapshot of leads, projects, tasks and cashflow.</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-black/10 border border-black/10 mb-8">
        <KPI icon={<Wallet className="h-4 w-4" />}      label="Net profit"        value={INR(s.net_profit)} accent={s.net_profit >= 0 ? "text-emerald-600" : "text-rose-600"} />
        <KPI icon={<ArrowUpCircle className="h-4 w-4" />}   label="Revenue collected" value={INR(s.revenue_collected)} />
        <KPI icon={<FileText className="h-4 w-4" />}   label="Pipeline value"    value={INR(s.pipeline_value)} />
        <KPI icon={<ArrowDownCircle className="h-4 w-4" />} label="Total expenses"    value={INR(s.total_expenses + s.total_vendor_outflow + s.total_debit)} />
        <KPI icon={<Users className="h-4 w-4" />}       label="Leads"             value={s.leads_total} />
        <KPI icon={<Briefcase className="h-4 w-4" />}   label="Projects"          value={s.projects_total} />
        <KPI icon={<CheckSquare className="h-4 w-4" />} label="Tasks"             value={s.tasks_total} />
        <KPI icon={<TrendingUp className="h-4 w-4" />}  label="Won deals value"   value={INR(s.won_value)} />
      </div>

      {/* Monthly cashflow */}
      <Card title="Cashflow · last 6 months" testid="chart-monthly-cashflow">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data.monthly} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fontFamily: "monospace" }} stroke="#4a4a4a" />
            <YAxis tick={{ fontSize: 11, fontFamily: "monospace" }} stroke="#4a4a4a" tickFormatter={(v) => INR(v)} width={90} />
            <Tooltip formatter={(v) => INR_PRECISE(v)} labelStyle={{ fontFamily: "monospace" }} contentStyle={{ borderRadius: 0, border: "1px solid #0a0a0a" }} />
            <Legend />
            <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} name="Revenue" dot={{ r: 3 }} />
            <Line type="monotone" dataKey="expenses" stroke="#ff5722" strokeWidth={2} name="Expenses" dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <Card title="Leads by stage" testid="chart-leads-stage">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={leadsPie} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} label={(e) => e.value || ""}>
                {leadsPie.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Projects by status" testid="chart-projects-status">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={projectsPie} dataKey="value" nameKey="name" outerRadius={90} innerRadius={50} label={(e) => e.value || ""}>
                {projectsPie.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Tasks by status" testid="chart-tasks-status">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={tasksBar}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "monospace" }} stroke="#4a4a4a" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fontFamily: "monospace" }} stroke="#4a4a4a" />
              <Tooltip contentStyle={{ borderRadius: 0, border: "1px solid #0a0a0a" }} />
              <Bar dataKey="value" fill="#ff5722" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top vendors · by paid amount" testid="chart-top-vendors">
          {data.top_vendors && data.top_vendors.length > 0 ? (
            <ul className="divide-y divide-black/10">
              {data.top_vendors.map((v) => (
                <li key={v.vendor_id} className="py-3 flex items-center justify-between">
                  <div className="font-semibold text-[#0a0a0a] truncate">{v.name}</div>
                  <div className="font-mono text-sm">{INR(v.total)}</div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-[#4a4a4a] py-8">No vendor payments yet.</div>
          )}
        </Card>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, accent = "text-[#0a0a0a]" }) {
  return (
    <div className="bg-white p-5">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
        {icon} {label}
      </div>
      <div className={`mt-2 font-display font-black text-2xl md:text-3xl tracking-tighter ${accent}`}>
        {value}
      </div>
    </div>
  );
}

function Card({ title, children, testid }) {
  return (
    <div data-testid={testid} className="bg-white border border-black/10 p-5 md:p-6">
      <div className="mb-3 text-[11px] font-mono uppercase tracking-[0.25em] text-[#4a4a4a]">{title}</div>
      {children}
    </div>
  );
}
