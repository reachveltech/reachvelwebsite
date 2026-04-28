import CrmPanel from "./CrmPanel";
import { crmList, crmCreate, crmUpdate, crmDelete } from "@/lib/api";

export default function Vendors({ token }) {
  const fields = [
    { name: "name",       label: "Contact name", type: "text", required: true, placeholder: "Priya Sharma" },
    { name: "company",    label: "Company",      type: "text", placeholder: "Sharma Cloud Pvt Ltd" },
    { name: "email",      label: "Email",        type: "text", placeholder: "priya@sharma.co" },
    { name: "phone",      label: "Phone",        type: "text", placeholder: "+91 98…" },
    { name: "services",   label: "Services offered", type: "text", full: true, placeholder: "Infra, hosting, cloud" },
    { name: "gst_number", label: "GSTIN",        type: "text", placeholder: "29ABCDE1234F2Z5" },
    { name: "address",    label: "Address",      type: "textarea", full: true, rows: 2 },
    { name: "notes",      label: "Notes",        type: "textarea", full: true, rows: 3 },
  ];

  const columns = [
    { key: "name",       label: "Contact", render: (r) => <div className="font-semibold">{r.name}</div> },
    { key: "company",    label: "Company", render: (r) => r.company || "—" },
    { key: "email",      label: "Email",   render: (r) => r.email || "—" },
    { key: "phone",      label: "Phone",   render: (r) => r.phone || "—" },
    { key: "services",   label: "Services",render: (r) => <span className="text-[#4a4a4a]">{r.services || "—"}</span> },
    { key: "gst_number", label: "GSTIN",   render: (r) => <span className="font-mono text-xs">{r.gst_number || "—"}</span> },
  ];

  return (
    <CrmPanel
      title="Vendors"
      entityName="vendors"
      description="Directory of partners, contractors, and suppliers."
      fields={fields}
      columns={columns}
      list={(p) => crmList(token, "vendors", p)}
      create={(p) => crmCreate(token, "vendors", p)}
      update={(id, p) => crmUpdate(token, "vendors", id, p)}
      remove={(id) => crmDelete(token, "vendors", id)}
    />
  );
}
