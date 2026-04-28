import {
  adminListProjects, adminCreateProject, adminUpdateProject, adminDeleteProject,
  adminListArticles, adminCreateArticle, adminUpdateArticle, adminDeleteArticle,
  adminListRoles, adminCreateRole, adminUpdateRole, adminDeleteRole,
} from "@/lib/api";

export const PROJECT_FIELDS = [
  { name: "title",   label: "Title",   type: "text", required: true, full: true, placeholder: "Vault — Private Banking, Reimagined" },
  { name: "slug",    label: "Slug (auto if blank)", type: "text", placeholder: "vault-fintech" },
  { name: "client",  label: "Client",  type: "text", placeholder: "Vault Holdings" },
  { name: "domain",  label: "Domain",  type: "select",
    options: [
      { value: "",           label: "—" },
      { value: "Fintech",    label: "Fintech" },
      { value: "Healthcare", label: "Healthcare" },
      { value: "Retail",     label: "Retail" },
      { value: "Data",       label: "Data" },
      { value: "AI",         label: "AI" },
      { value: "Other",      label: "Other" },
    ],
  },
  { name: "year", label: "Year", type: "text", placeholder: "2025" },
  { name: "summary", label: "Summary", type: "textarea", full: true, rows: 3,
    placeholder: "One-paragraph case-study narrative." },
  { name: "cover", label: "Cover image URL", type: "url", full: true, placeholder: "https://…" },
  { name: "video", label: "Showcase video URL (mp4)", type: "url", full: true, placeholder: "https://…" },
  { name: "services", label: "Services (comma separated)", type: "tags", full: true,
    placeholder: "Web, Mobile, AI",
    help: "Comma-separated list of capability tags." },
  { name: "metrics", label: "Metrics (one per line: VALUE | LABEL)", type: "metrics", full: true, rows: 4,
    placeholder: "94ms | p95 latency\n+38% | AUM growth",
    help: "Use `|` to separate the metric value from its label. One metric per line." },
  { name: "display_order", label: "Display order", type: "number", help: "Lower number = appears first." },
];

export const ARTICLE_FIELDS = [
  { name: "title",     label: "Title",   type: "text", required: true, full: true },
  { name: "slug",      label: "Slug (auto if blank)", type: "text", placeholder: "ai-as-infrastructure" },
  { name: "category",  label: "Category", type: "select",
    options: [
      { value: "",       label: "—" },
      { value: "AI",     label: "AI" },
      { value: "Web",    label: "Web" },
      { value: "Mobile", label: "Mobile" },
      { value: "Design", label: "Design" },
      { value: "Other",  label: "Other" },
    ],
  },
  { name: "date",      label: "Date label", type: "text", placeholder: "Dec 10, 2025" },
  { name: "read_time", label: "Read time", type: "text", placeholder: "9 min" },
  { name: "author",    label: "Author", type: "text", placeholder: "Elena Moreau" },
  { name: "cover",     label: "Cover image URL", type: "url", full: true, placeholder: "https://…" },
  { name: "excerpt",   label: "Excerpt / summary", type: "textarea", full: true, rows: 3 },
  { name: "body",      label: "Body — separate paragraphs with a blank line", type: "paragraphs", full: true, rows: 10 },
  { name: "featured",  label: "Featured", type: "switch", checkboxLabel: "Mark as featured (shown on top of Knowledge page)" },
  { name: "display_order", label: "Display order", type: "number" },
];

export const ROLE_FIELDS = [
  { name: "title",       label: "Role title", type: "text", required: true, full: true,
    placeholder: "Senior Staff Engineer, AI Platform" },
  { name: "dept",        label: "Department", type: "select",
    options: [
      { value: "Engineering", label: "Engineering" },
      { value: "Design",      label: "Design" },
      { value: "AI",          label: "AI" },
      { value: "Mobile",      label: "Mobile" },
      { value: "Data",        label: "Data" },
      { value: "Brand",       label: "Brand" },
      { value: "Delivery",    label: "Delivery" },
      { value: "Other",       label: "Other" },
    ],
  },
  { name: "type",        label: "Type", type: "select",
    options: [
      { value: "Full-time",  label: "Full-time" },
      { value: "Part-time",  label: "Part-time" },
      { value: "Contract",   label: "Contract" },
      { value: "Internship", label: "Internship" },
    ],
  },
  { name: "location",    label: "Location", type: "text", full: true, placeholder: "San Francisco · Remote" },
  { name: "description", label: "Description", type: "textarea", full: true, rows: 4 },
  { name: "active",      label: "Status", type: "switch", checkboxLabel: "Active (visible on public Careers page)" },
  { name: "display_order", label: "Display order", type: "number" },
];

export const PROJECT_OPS = (token) => ({
  list:   ()  => adminListProjects(token),
  create: (p) => adminCreateProject(token, p),
  update: (id, p) => adminUpdateProject(token, id, p),
  remove: (id) => adminDeleteProject(token, id),
});
export const ARTICLE_OPS = (token) => ({
  list:   ()  => adminListArticles(token),
  create: (p) => adminCreateArticle(token, p),
  update: (id, p) => adminUpdateArticle(token, id, p),
  remove: (id) => adminDeleteArticle(token, id),
});
export const ROLE_OPS = (token) => ({
  list:   ()  => adminListRoles(token),
  create: (p) => adminCreateRole(token, p),
  update: (id, p) => adminUpdateRole(token, id, p),
  remove: (id) => adminDeleteRole(token, id),
});
