import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, Plus, Trash2, Pencil, X, Save, ChevronUp, ChevronDown } from "lucide-react";

// Field types: text | textarea | url | number | select | switch | tags | metrics | paragraphs
const renderField = (f, value, onChange) => {
  const cls =
    "w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]";
  if (f.type === "textarea" || f.type === "paragraphs") {
    return (
      <textarea
        rows={f.rows || 5}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`${cls} resize-y`}
        placeholder={f.placeholder}
        data-testid={`cms-input-${f.name}`}
      />
    );
  }
  if (f.type === "select") {
    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`${cls} appearance-none cursor-pointer`}
        data-testid={`cms-input-${f.name}`}
      >
        {f.options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  }
  if (f.type === "switch") {
    return (
      <label className="inline-flex items-center gap-3 mt-2 cursor-pointer">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-[#ff5722]"
          data-testid={`cms-input-${f.name}`}
        />
        <span className="text-sm text-[#0a0a0a]">{f.checkboxLabel || "Enabled"}</span>
      </label>
    );
  }
  if (f.type === "number") {
    return (
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => onChange(parseInt(e.target.value || "0", 10))}
        className={cls}
        data-testid={`cms-input-${f.name}`}
      />
    );
  }
  return (
    <input
      type={f.type === "url" ? "url" : "text"}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={cls}
      placeholder={f.placeholder}
      data-testid={`cms-input-${f.name}`}
    />
  );
};

// Convert raw form values into payload using field hints
function toPayload(form, fields) {
  const out = {};
  for (const f of fields) {
    let v = form[f.name];
    if (f.type === "tags") {
      v = (v || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (f.type === "paragraphs") {
      v = (v || "")
        .split(/\n{2,}/)
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (f.type === "metrics") {
      v = (v || "")
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [k, ...rest] = line.split("|");
          return { k: (k || "").trim(), v: rest.join("|").trim() };
        })
        .filter((m) => m.k && m.v);
    } else if (f.type === "switch") {
      v = !!v;
    } else if (f.type === "number") {
      v = parseInt(v ?? 0, 10) || 0;
    }
    out[f.name] = v;
  }
  return out;
}

function fromItem(item, fields) {
  const out = {};
  for (const f of fields) {
    let v = item?.[f.name];
    if (f.type === "tags") v = Array.isArray(v) ? v.join(", ") : (v ?? "");
    else if (f.type === "paragraphs") v = Array.isArray(v) ? v.join("\n\n") : (v ?? "");
    else if (f.type === "metrics") v = Array.isArray(v) ? v.map((m) => `${m.k} | ${m.v}`).join("\n") : "";
    else if (f.type === "switch") v = !!v;
    else if (f.type === "number") v = v ?? 0;
    else v = v ?? "";
    out[f.name] = v;
  }
  return out;
}

export default function CrudPanel({
  title,
  entityName,
  fields,
  list,
  create,
  update,
  remove,
  rowLabel = (item) => item.title,
  rowSubtitle = (item) => item.slug || "",
  rowMeta = (item) => "",
  emptyText = "No items yet.",
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | {item} | {} (new)
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await list();
      setItems(data || []);
    } catch {
      toast.error(`Couldn't load ${entityName}.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNew = () => {
    setEditing({});
    setForm(fromItem({}, fields));
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm(fromItem(item, fields));
  };

  const cancel = () => {
    setEditing(null);
    setForm({});
  };

  const save = async (e) => {
    e?.preventDefault?.();
    setBusy(true);
    try {
      const payload = toPayload(form, fields);
      if (editing?.id) {
        await update(editing.id, payload);
        toast.success(`${entityName} updated`);
      } else {
        await create(payload);
        toast.success(`${entityName} created`);
      }
      cancel();
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || `Couldn't save ${entityName}.`);
    } finally {
      setBusy(false);
    }
  };

  const onDelete = async (item) => {
    if (!window.confirm(`Delete this ${entityName}? This can't be undone.`)) return;
    try {
      await remove(item.id);
      toast.success("Deleted");
      load();
    } catch {
      toast.error("Couldn't delete.");
    }
  };

  return (
    <div data-testid={`cms-${entityName}`}>
      <div className="flex items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">
            {entityName}
          </div>
          <h2 className="mt-1 font-display font-black text-3xl md:text-4xl tracking-tighter text-[#0a0a0a]">
            {title}
          </h2>
        </div>
        <button
          onClick={startNew}
          data-testid={`cms-new-${entityName}`}
          className="btn-primary !py-[10px] !px-5 text-[12px]"
        >
          <Plus className="h-4 w-4" /> New
        </button>
      </div>

      <div className="bg-white border border-black/10">
        {loading ? (
          <div className="p-10 text-sm text-[#4a4a4a]">Loading…</div>
        ) : items.length === 0 ? (
          <div className="p-10 text-sm text-[#4a4a4a]">{emptyText}</div>
        ) : (
          <ul className="divide-y divide-black/10">
            {items.map((item) => (
              <li key={item.id} className="px-5 md:px-6 py-4 flex items-center justify-between gap-4 hover:bg-[#0a0a0a]/[0.02] transition-colors" data-testid={`cms-row-${item.id}`}>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-extrabold text-lg md:text-xl tracking-tight text-[#0a0a0a] truncate">
                    {rowLabel(item)}
                  </div>
                  <div className="mt-0.5 text-xs font-mono text-[#4a4a4a] truncate">
                    {rowSubtitle(item)}
                  </div>
                </div>
                <div className="hidden md:block text-[10px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
                  {rowMeta(item)}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => startEdit(item)}
                    data-testid={`cms-edit-${item.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-black/15 rounded-full hover:border-[#ff5722] hover:text-[#ff5722]"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => onDelete(item)}
                    data-testid={`cms-delete-${item.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-black/15 rounded-full hover:border-red-500 hover:text-red-500"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {editing !== null && (
        <div
          data-testid={`cms-form-modal-${entityName}`}
          className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md flex items-start md:items-center justify-center p-4"
          onClick={cancel}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-3xl bg-white border border-black/10 max-h-[92vh] overflow-auto"
          >
            <div className="sticky top-0 bg-white border-b border-black/10 px-6 py-4 flex items-center justify-between">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">
                  {entityName} · {editing?.id ? "edit" : "new"}
                </div>
                <h3 className="mt-1 font-display font-black text-2xl tracking-tighter text-[#0a0a0a]">
                  {editing?.id ? "Update entry" : "Create entry"}
                </h3>
              </div>
              <button type="button" onClick={cancel} className="h-8 w-8 rounded-full border border-black/10 hover:bg-black hover:text-white flex items-center justify-center">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {fields.map((f) => (
                <div key={f.name} className={f.full ? "md:col-span-2" : ""}>
                  <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a] flex items-center gap-2">
                    {f.label}
                    {f.required && <span className="text-[#ff5722]">*</span>}
                  </label>
                  {renderField(f, form[f.name], (v) => setForm({ ...form, [f.name]: v }))}
                  {f.help && <div className="mt-1 text-[10px] font-mono text-[#4a4a4a]">{f.help}</div>}
                </div>
              ))}
            </div>

            <div className="sticky bottom-0 bg-white border-t border-black/10 px-6 py-4 flex items-center justify-end gap-3">
              <button type="button" onClick={cancel} className="btn-ghost !py-[10px] !px-5 text-[12px]">
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                data-testid={`cms-save-${entityName}`}
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
