import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Save, X, UploadCloud, Eye, EyeOff } from "lucide-react";
import {
  adminListClientLogos, adminCreateClientLogo,
  adminUpdateClientLogo, adminDeleteClientLogo,
} from "@/lib/api";

const MAX_BYTES = 1.5 * 1024 * 1024; // 1.5MB raw file -> ~2MB base64

export default function ClientLogos({ token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(empty());
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const load = async () => {
    setLoading(true);
    try {
      setItems(await adminListClientLogos(token));
    } catch {
      toast.error("Couldn't load client logos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  const startNew = () => {
    setEditing({});
    setForm({ ...empty(), display_order: (items[items.length - 1]?.display_order ?? 0) + 1 });
  };

  const startEdit = (it) => {
    setEditing(it);
    setForm({
      name: it.name || "",
      image: it.image || "",
      website: it.website || "",
      display_order: it.display_order ?? 0,
      active: it.active !== false,
    });
  };

  const cancel = () => { setEditing(null); setForm(empty()); };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please pick an image file (PNG, SVG, JPG…).");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error(`Image is too large (max ${(MAX_BYTES / 1024 / 1024).toFixed(1)} MB).`);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setForm((f) => ({ ...f, image: reader.result }));
      toast.success(`Uploaded ${file.name}`);
    };
    reader.onerror = () => toast.error("Couldn't read the file.");
    reader.readAsDataURL(file);
  };

  const save = async (e) => {
    e?.preventDefault?.();
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.image) return toast.error("Please upload an image or paste a URL");
    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        image: form.image,
        website: form.website.trim(),
        display_order: parseInt(form.display_order ?? 0, 10) || 0,
        active: !!form.active,
      };
      if (editing?.id) await adminUpdateClientLogo(token, editing.id, payload);
      else await adminCreateClientLogo(token, payload);
      toast.success(editing?.id ? "Logo updated" : "Logo added");
      cancel();
      load();
    } catch {
      toast.error("Couldn't save the logo.");
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (it) => {
    if (!window.confirm(`Delete logo "${it.name}"?`)) return;
    try {
      await adminDeleteClientLogo(token, it.id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Couldn't delete.");
    }
  };

  const toggleActive = async (it) => {
    try {
      await adminUpdateClientLogo(token, it.id, {
        name: it.name, image: it.image, website: it.website || "",
        display_order: it.display_order ?? 0, active: !it.active,
      });
      load();
    } catch { toast.error("Couldn't update."); }
  };

  return (
    <div data-testid="admin-client-logos">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">Website CMS</div>
          <h2 className="mt-1 crm-h text-3xl md:text-4xl text-[#0a0a0a]">Client logos</h2>
          <p className="mt-2 text-sm text-[#4a4a4a] max-w-2xl">
            Upload PNG/SVG logos to appear in the homepage marquee. Transparent backgrounds work best.
          </p>
          <div className="mt-3 inline-flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] font-mono text-[#4a4a4a]">
            <span><span className="text-[#ff5722] font-bold">Recommended:</span> 320 × 120 px (≈ 3:1 ratio)</span>
            <span>·</span>
            <span>PNG with transparent background or SVG</span>
            <span>·</span>
            <span>Dark/black artwork (we apply grayscale)</span>
          </div>
        </div>
        <button
          onClick={startNew}
          data-testid="client-logo-new"
          className="btn-primary !py-[10px] !px-5 text-[12px]"
        >
          <Plus className="h-4 w-4" /> New logo
        </button>
      </div>

      <div className="bg-white border border-black/10">
        {loading ? (
          <div className="p-10 text-sm text-[#4a4a4a]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-sm text-[#4a4a4a]">No logos yet. Click <strong>New logo</strong> to add the first one.</div>
        ) : (
          <ul className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-px bg-black/10">
            {items.map((it) => (
              <li
                key={it.id}
                data-testid={`client-logo-row-${it.id}`}
                className={`bg-white p-4 flex flex-col gap-3 ${!it.active ? "opacity-60" : ""}`}
              >
                <div className="aspect-[2/1] bg-[#f7f6f3] border border-black/5 flex items-center justify-center overflow-hidden">
                  <img
                    src={it.image}
                    alt={it.name}
                    className="max-h-12 max-w-[80%] object-contain grayscale"
                    onError={(e) => { e.target.style.opacity = "0.2"; }}
                  />
                </div>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#0a0a0a] truncate">{it.name}</div>
                    <div className="text-[10px] font-mono text-[#4a4a4a]">
                      Order {it.display_order ?? 0} · {it.active ? "Visible" : "Hidden"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(it)}
                    data-testid={`client-logo-edit-${it.id}`}
                    className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] border border-black/15 rounded-full hover:border-[#ff5722] hover:text-[#ff5722]"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => toggleActive(it)}
                    data-testid={`client-logo-toggle-${it.id}`}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] border border-black/15 rounded-full hover:border-[#0a0a0a]"
                    title={it.active ? "Hide from site" : "Show on site"}
                  >
                    {it.active ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                  </button>
                  <button
                    onClick={() => onDelete(it)}
                    data-testid={`client-logo-delete-${it.id}`}
                    className="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] border border-black/15 rounded-full hover:border-red-500 hover:text-red-500"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing !== null && (
        <div
          data-testid="client-logo-modal"
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md flex items-start md:items-center justify-center p-4"
          onClick={cancel}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-2xl bg-white border border-black/10 max-h-[92vh] overflow-auto"
          >
            <div className="sticky top-0 bg-white border-b border-black/10 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">
                  Client logo · {editing?.id ? "edit" : "new"}
                </div>
                <h3 className="mt-1 crm-h text-2xl text-[#0a0a0a]">
                  {editing?.id ? "Update logo" : "Add logo"}
                </h3>
              </div>
              <button
                type="button"
                onClick={cancel}
                data-testid="client-logo-modal-close"
                className="h-8 w-8 rounded-full border border-black/10 hover:bg-black hover:text-white flex items-center justify-center"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              <div className="md:col-span-2">
                <Label>Logo image *</Label>
                <div className="mt-2 flex items-center gap-4 flex-wrap">
                  <div className="h-24 w-44 bg-[#f7f6f3] border border-black/10 flex items-center justify-center overflow-hidden">
                    {form.image ? (
                      <img src={form.image} alt="preview" className="max-h-20 max-w-[80%] object-contain grayscale" />
                    ) : (
                      <span className="text-[10px] font-mono uppercase text-[#4a4a4a]">No image</span>
                    )}
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      data-testid="client-logo-upload-btn"
                      className="inline-flex items-center gap-2 px-4 py-2 text-xs border border-black/15 rounded-full hover:border-[#ff5722] hover:text-[#ff5722] transition-colors"
                    >
                      <UploadCloud className="h-4 w-4" /> Upload PNG / SVG / JPG
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*"
                      data-testid="client-logo-file"
                      onChange={onPickFile}
                      className="hidden"
                    />
                    <span className="text-[10px] font-mono text-[#4a4a4a]">Max 1.5 MB · ideal size 320 × 120 px (3:1) · transparent PNG/SVG</span>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <Label>…or paste an image URL</Label>
                <input
                  type="url"
                  value={form.image?.startsWith("data:") ? "" : (form.image || "")}
                  onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
                  placeholder="https://example.com/logo.png"
                  className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]"
                  data-testid="client-logo-url"
                />
              </div>

              <div>
                <Label>Brand name *</Label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Acme Corp"
                  className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]"
                  data-testid="client-logo-name"
                />
              </div>

              <div>
                <Label>Website (optional)</Label>
                <input
                  type="url"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://acme.com"
                  className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]"
                  data-testid="client-logo-website"
                />
              </div>

              <div>
                <Label>Display order</Label>
                <input
                  type="number"
                  value={form.display_order}
                  onChange={(e) => setForm((f) => ({ ...f, display_order: e.target.value }))}
                  className="mt-1 w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]"
                  data-testid="client-logo-order"
                />
              </div>

              <div>
                <Label>Visibility</Label>
                <label className="inline-flex items-center gap-3 mt-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                    className="h-4 w-4 accent-[#ff5722]"
                    data-testid="client-logo-active"
                  />
                  <span className="text-sm text-[#0a0a0a]">Show on website</span>
                </label>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-black/10 px-6 py-4 flex items-center justify-end gap-3">
              <button type="button" onClick={cancel} className="btn-ghost !py-[10px] !px-5 text-[12px]">
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                data-testid="client-logo-save"
                className="btn-primary !py-[10px] !px-5 text-[12px] disabled:opacity-60"
              >
                <Save className="h-4 w-4" /> {busy ? "Saving…" : (editing?.id ? "Update" : "Create")}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Label({ children }) {
  return (
    <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a] flex items-center gap-2">
      {children}
    </label>
  );
}

function empty() {
  return { name: "", image: "", website: "", display_order: 0, active: true };
}
