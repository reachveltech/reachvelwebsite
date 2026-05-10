import { useEffect, useState } from "react";
import { toast } from "sonner";
import axios from "axios";
import { Trash2, Mail, Linkedin, Briefcase, Download, Inbox } from "lucide-react";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Applications({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const r = await axios.get(`${API}/admin/applications`, { headers: { "X-Admin-Token": token } });
      setItems(r.data || []);
    } catch {
      toast.error("Couldn't load applications.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  const remove = async (a) => {
    if (!window.confirm(`Delete application from ${a.name}?`)) return;
    try {
      await axios.delete(`${API}/admin/applications/${a.id}`, { headers: { "X-Admin-Token": token } });
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Couldn't delete.");
    }
  };

  const downloadResume = (a) => {
    if (!a.resume?.data) return toast.error("No resume attached.");
    const link = document.createElement("a");
    link.href = a.resume.data;
    link.download = a.resume.filename || `${a.name}-resume`;
    link.click();
  };

  return (
    <div data-testid="admin-applications">
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">Website CMS</div>
          <h2 className="mt-1 crm-h text-3xl md:text-4xl text-[#0a0a0a]">Job applications</h2>
          <p className="mt-2 text-sm text-[#4a4a4a]">Career applicants with attached resumes.</p>
        </div>
        <div className="text-xs font-mono text-[#4a4a4a]">
          {items.length} total · {loading ? "loading…" : "live"}
        </div>
      </div>

      <div className="bg-white border border-black/10 overflow-x-auto">
        {loading ? (
          <div className="p-10 text-sm text-[#4a4a4a]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center">
            <Inbox className="h-8 w-8 mx-auto text-[#4a4a4a]" />
            <div className="mt-3 text-sm text-[#4a4a4a]">No applications yet.</div>
          </div>
        ) : (
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-[#f7f6f3] border-b border-black/10 text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
              <tr>
                <th className="px-4 py-4 w-12">#</th>
                <th className="px-4 py-4">Applicant</th>
                <th className="px-4 py-4">Role</th>
                <th className="px-4 py-4">When</th>
                <th className="px-4 py-4">Resume</th>
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a, i) => (
                <tr key={a.id} data-testid={`application-row-${a.id}`} className="border-b border-black/5 hover:bg-[#0a0a0a]/[0.02]">
                  <td className="px-4 py-4 text-xs font-mono text-[#4a4a4a]">{String(i + 1).padStart(2, "0")}</td>
                  <td className="px-4 py-4">
                    <div className="font-semibold text-[#0a0a0a]">{a.name}</div>
                    <div className="text-xs text-[#4a4a4a] flex items-center gap-3 mt-1">
                      <a className="link-underline inline-flex items-center gap-1" href={`mailto:${a.email}`}><Mail className="h-3 w-3" /> {a.email}</a>
                      {a.linkedin && (
                        <a className="link-underline inline-flex items-center gap-1" href={a.linkedin} target="_blank" rel="noreferrer"><Linkedin className="h-3 w-3" /> LinkedIn</a>
                      )}
                    </div>
                    {a.note && <div className="mt-2 text-sm text-[#4a4a4a] line-clamp-2 max-w-[480px]">{a.note}</div>}
                  </td>
                  <td className="px-4 py-4">
                    <div className="inline-flex items-center gap-2 text-sm">
                      <Briefcase className="h-3.5 w-3.5 text-[#4a4a4a]" /> {a.role_title || "—"}
                    </div>
                  </td>
                  <td className="px-4 py-4 text-xs font-mono text-[#4a4a4a]">
                    {new Date(a.created_at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-4">
                    {a.resume ? (
                      <button
                        onClick={() => downloadResume(a)}
                        data-testid={`application-resume-${a.id}`}
                        className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border border-black/15 hover:border-[#ff5722] hover:text-[#ff5722]"
                        title={`${a.resume.filename} · ${(a.resume.size / 1024).toFixed(0)} KB`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        {a.resume.filename}
                      </button>
                    ) : (
                      <span className="text-xs text-[#4a4a4a]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <button
                      onClick={() => remove(a)}
                      data-testid={`application-delete-${a.id}`}
                      className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-black/15 rounded-full hover:border-red-500 hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
