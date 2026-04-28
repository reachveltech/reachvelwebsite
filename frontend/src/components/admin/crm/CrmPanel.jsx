import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, Save, Search } from "lucide-react";

/**
 * Generic CRM table-based CRUD panel.
 *
 * props:
 *  - title, entityName
 *  - fields: array of { name, label, type, options?, required?, full?, help?, placeholder?, rows? }
 *      types: text | textarea | url | number | money | select | switch | date
 *  - columns: array of { label, key, render?, className? } — defines the table
 *  - list({ q, ... }) → array
 *  - create(payload) → item
 *  - update(id, payload) → item
 *  - remove(id)
 *  - filters: optional array of { key, label, options: [{k, label, dot?}] } for chip-style filters
 *  - extraParams: object merged into list() calls
 *  - headerExtra: React node rendered in the header (e.g. totals)
 *  - initialForm: default form state for new entries
 */
export default function CrmPanel({
  title,
  entityName,
  description,
  fields,
  columns,
  list,
  create,
  update,
  remove,
  filters = [],
  extraParams = {},
  headerExtra,
  initialForm = {},
  emptyText,
  searchable = true,
  onChange,
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [filterState, setFilterState] = useState(() =>
    Object.fromEntries(filters.map((f) => [f.key, "all"])),
  );
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = { ...extraParams };
      if (q) params.q = q;
      filters.forEach((f) => {
        if (filterState[f.key] && filterState[f.key] !== "all") params[f.key] = filterState[f.key];
      });
      const data = await list(params);
      setItems(data || []);
    } catch {
      toast.error(`Couldn't load ${entityName}.`);
    } finally {
      setLoading(false);
    }
  };

  // debounce search + filters
  useEffect(() => {
    const t = setTimeout(load, 280);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, JSON.stringify(filterState), JSON.stringify(extraParams)]);

  // Listen for external refresh events e.g. after lead→project conversion
  useEffect(() => {
    const handler = () => load();
    const ev = `crm-${entityName}-refresh`;
    window.addEventListener(ev, handler);
    return () => window.removeEventListener(ev, handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityName, q, JSON.stringify(filterState)]);

  const startNew = () => {
    setEditing({});
    setForm(formFromItem({}, fields, initialForm));
  };

  const startEdit = (item) => {
    setEditing(item);
    setForm(formFromItem(item, fields, initialForm));
  };

  const cancel = () => {
    setEditing(null);
    setForm({});
  };

  const save = async (e) => {
    e?.preventDefault?.();
    // simple validation on required
    for (const f of fields) {
      if (f.required && (form[f.name] === "" || form[f.name] === null || form[f.name] === undefined)) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    setBusy(true);
    try {
      const payload = formToPayload(form, fields);
      if (editing?.id) {
        await update(editing.id, payload);
        toast.success(`${entityName} updated`);
      } else {
        await create(payload);
        toast.success(`${entityName} created`);
      }
      cancel();
      load();
      onChange?.();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : `Couldn't save ${entityName}.`);
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
      onChange?.();
    } catch {
      toast.error("Couldn't delete.");
    }
  };

  const numbered = useMemo(() => items.map((it, i) => ({ ...it, _idx: i + 1 })), [items]);

  return (
    <div data-testid={`crm-${entityName}`}>
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">
            {entityName}
          </div>
          <h2 className="mt-1 crm-h text-3xl md:text-4xl text-[#0a0a0a]">
            {title}
          </h2>
          {description && <p className="mt-2 text-sm text-[#4a4a4a] max-w-2xl">{description}</p>}
        </div>
        <div className="flex items-center gap-3">
          {headerExtra}
          <button
            onClick={startNew}
            data-testid={`crm-new-${entityName}`}
            className="btn-primary !py-[10px] !px-5 text-[12px]"
          >
            <Plus className="h-4 w-4" /> New
          </button>
        </div>
      </div>

      {(searchable || filters.length > 0) && (
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-5">
          {searchable && (
            <div className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-2 w-full md:w-96">
              <Search className="h-4 w-4 text-[#4a4a4a]" />
              <input
                data-testid={`crm-search-${entityName}`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search…"
                className="bg-transparent focus:outline-none text-sm flex-1"
              />
              {q && (
                <button
                  onClick={() => setQ("")}
                  className="text-xs text-[#4a4a4a] hover:text-[#ff5722]"
                >
                  clear
                </button>
              )}
            </div>
          )}
          {filters.map((f) => (
            <div key={f.key} className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">{f.label}:</span>
              {[{ k: "all", label: "All", dot: "bg-[#0a0a0a]" }, ...f.options].map((opt) => (
                <button
                  key={opt.k}
                  data-testid={`crm-filter-${f.key}-${opt.k}`}
                  onClick={() => setFilterState({ ...filterState, [f.key]: opt.k })}
                  className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-mono uppercase tracking-[0.1em] transition-colors ${
                    filterState[f.key] === opt.k
                      ? "bg-[#0a0a0a] border-[#0a0a0a] text-white"
                      : "border-black/15 text-[#4a4a4a] hover:border-[#0a0a0a]"
                  }`}
                >
                  {opt.dot && <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />}
                  {opt.label}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-black/10 overflow-x-auto">
        {loading ? (
          <div className="p-10 text-sm text-[#4a4a4a]">Loading…</div>
        ) : numbered.length === 0 ? (
          <div className="p-10 text-sm text-[#4a4a4a]">{emptyText || `No ${entityName} yet.`}</div>
        ) : (
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-[#f7f6f3] border-b border-black/10 text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a]">
              <tr>
                <th className="px-4 py-4 w-12">#</th>
                {columns.map((c) => (
                  <th key={c.key || c.label} className={`px-4 py-4 ${c.className || ""}`}>{c.label}</th>
                ))}
                <th className="px-4 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {numbered.map((it) => (
                <tr
                  key={it.id}
                  data-testid={`crm-row-${entityName}-${it.id}`}
                  className="border-b border-black/5 hover:bg-[#0a0a0a]/[0.02] transition-colors"
                >
                  <td className="px-4 py-4 text-xs font-mono text-[#4a4a4a]">{String(it._idx).padStart(2, "0")}</td>
                  {columns.map((c) => (
                    <td key={c.key || c.label} className={`px-4 py-4 text-sm text-[#0a0a0a] ${c.className || ""}`}>
                      {c.render ? c.render(it) : (it[c.key] ?? "—")}
                    </td>
                  ))}
                  <td className="px-4 py-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => startEdit(it)}
                        data-testid={`crm-edit-${entityName}-${it.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-black/15 rounded-full hover:border-[#ff5722] hover:text-[#ff5722]"
                      >
                        <Pencil className="h-3.5 w-3.5" /> Edit
                      </button>
                      <button
                        onClick={() => onDelete(it)}
                        data-testid={`crm-delete-${entityName}-${it.id}`}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs border border-black/15 rounded-full hover:border-red-500 hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing !== null && (
        <FormModal
          fields={fields}
          form={form}
          setForm={setForm}
          onCancel={cancel}
          onSave={save}
          busy={busy}
          entityName={entityName}
          isEdit={!!editing?.id}
        />
      )}
    </div>
  );
}

// ─── helpers ───
function formFromItem(item, fields, initial) {
  const out = { ...initial };
  for (const f of fields) {
    let v = item?.[f.name];
    if (f.type === "switch") v = !!v;
    else if (f.type === "number" || f.type === "money") v = v ?? (initial[f.name] ?? 0);
    else if (f.type === "select" && typeof v === "boolean") v = v ? "true" : "false";
    else v = v ?? initial[f.name] ?? "";
    out[f.name] = v;
  }
  return out;
}

function formToPayload(form, fields) {
  const out = {};
  for (const f of fields) {
    let v = form[f.name];
    if (f.type === "number") v = parseInt(v ?? 0, 10) || 0;
    else if (f.type === "money") v = parseFloat(v ?? 0) || 0;
    else if (f.type === "switch") v = !!v;
    out[f.name] = v;
  }
  return out;
}

function FormModal({ fields, form, setForm, onCancel, onSave, busy, entityName, isEdit }) {
  return (
    <div
      data-testid={`crm-form-modal-${entityName}`}
      className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-md flex items-start md:items-center justify-center p-4"
      onClick={onCancel}
    >
      <form
        onSubmit={onSave}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white border border-black/10 max-h-[92vh] overflow-auto"
      >
        <div className="sticky top-0 bg-white border-b border-black/10 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#ff5722] font-bold">
              {entityName} · {isEdit ? "edit" : "new"}
            </div>
            <h3 className="mt-1 font-display font-black text-2xl tracking-tighter text-[#0a0a0a]">
              {isEdit ? "Update" : "Create"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onCancel}
            data-testid={`crm-form-close-${entityName}`}
            className="h-8 w-8 rounded-full border border-black/10 hover:bg-black hover:text-white flex items-center justify-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          {fields.map((f) => (
            <div key={f.name} className={f.full ? "md:col-span-2" : ""}>
              <label className="text-[11px] font-mono uppercase tracking-[0.2em] text-[#4a4a4a] flex items-center gap-2">
                {f.label} {f.required && <span className="text-[#ff5722]">*</span>}
              </label>
              <FieldInput f={f} value={form[f.name]} onChange={(v) => setForm({ ...form, [f.name]: v })} />
              {f.help && <div className="mt-1 text-[10px] font-mono text-[#4a4a4a]">{f.help}</div>}
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-white border-t border-black/10 px-6 py-4 flex items-center justify-end gap-3">
          <button type="button" onClick={onCancel} className="btn-ghost !py-[10px] !px-5 text-[12px]">
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            data-testid={`crm-save-${entityName}`}
            className="btn-primary !py-[10px] !px-5 text-[12px] disabled:opacity-60"
          >
            <Save className="h-4 w-4" /> {busy ? "Saving…" : isEdit ? "Update" : "Create"}
          </button>
        </div>
      </form>
    </div>
  );
}

function FieldInput({ f, value, onChange }) {
  const cls = "w-full bg-transparent border-b border-black/20 py-2 focus:outline-none focus:border-[#ff5722]";
  if (f.type === "textarea") {
    return (
      <textarea
        rows={f.rows || 4}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`${cls} resize-y`}
        placeholder={f.placeholder}
        data-testid={`crm-input-${f.name}`}
      />
    );
  }
  if (f.type === "select") {
    return (
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`${cls} appearance-none cursor-pointer`}
        data-testid={`crm-input-${f.name}`}
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
          data-testid={`crm-input-${f.name}`}
        />
        <span className="text-sm text-[#0a0a0a]">{f.checkboxLabel || "Enabled"}</span>
      </label>
    );
  }
  if (f.type === "date") {
    return (
      <input
        type="date"
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
        data-testid={`crm-input-${f.name}`}
      />
    );
  }
  if (f.type === "number") {
    return (
      <input
        type="number"
        value={value ?? 0}
        onChange={(e) => onChange(e.target.value)}
        className={cls}
        data-testid={`crm-input-${f.name}`}
      />
    );
  }
  if (f.type === "money") {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-mono text-[#4a4a4a]">₹</span>
        <input
          type="number"
          step="0.01"
          min="0"
          value={value ?? 0}
          onChange={(e) => onChange(e.target.value)}
          className={cls}
          placeholder="0.00"
          data-testid={`crm-input-${f.name}`}
        />
      </div>
    );
  }
  return (
    <input
      type={f.type === "url" ? "url" : "text"}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      className={cls}
      placeholder={f.placeholder}
      data-testid={`crm-input-${f.name}`}
    />
  );
}
