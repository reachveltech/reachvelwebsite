import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API });

// Public
export const fetchProjects = () => client.get("/projects").then((r) => r.data);
export const fetchArticles = () => client.get("/articles").then((r) => r.data);
export const fetchArticle  = (slug) => client.get(`/articles/${slug}`).then((r) => r.data);
export const fetchRoles    = () => client.get("/roles").then((r) => r.data);

// Admin (token via X-Admin-Token)
const auth = (t) => ({ headers: { "X-Admin-Token": t } });

export const adminListProjects   = (t) => client.get("/admin/projects", auth(t)).then((r) => r.data);
export const adminCreateProject  = (t, p) => client.post("/admin/projects", p, auth(t)).then((r) => r.data);
export const adminUpdateProject  = (t, id, p) => client.put(`/admin/projects/${id}`, p, auth(t)).then((r) => r.data);
export const adminDeleteProject  = (t, id) => client.delete(`/admin/projects/${id}`, auth(t)).then((r) => r.data);

export const adminListArticles   = (t) => client.get("/admin/articles", auth(t)).then((r) => r.data);
export const adminCreateArticle  = (t, p) => client.post("/admin/articles", p, auth(t)).then((r) => r.data);
export const adminUpdateArticle  = (t, id, p) => client.put(`/admin/articles/${id}`, p, auth(t)).then((r) => r.data);
export const adminDeleteArticle  = (t, id) => client.delete(`/admin/articles/${id}`, auth(t)).then((r) => r.data);

export const adminListRoles      = (t) => client.get("/admin/roles", auth(t)).then((r) => r.data);
export const adminCreateRole     = (t, p) => client.post("/admin/roles", p, auth(t)).then((r) => r.data);
export const adminUpdateRole     = (t, id, p) => client.put(`/admin/roles/${id}`, p, auth(t)).then((r) => r.data);
export const adminDeleteRole     = (t, id) => client.delete(`/admin/roles/${id}`, auth(t)).then((r) => r.data);

// ─────────── CRM (Reachvel Dashboard) ───────────
const crm = "/admin/crm";

export const crmAnalytics = (t) => client.get(`${crm}/analytics`, auth(t)).then((r) => r.data);

// Generic CRUD helpers — pass entity path e.g. "leads", "vendors", "projects", "tasks",
// "expenses", "vendor-payments", "invoices", "project-payments", "reachvel-payments".
export const crmList   = (t, entity, params = {}) => client.get(`${crm}/${entity}`, { ...auth(t), params }).then((r) => r.data);
export const crmGet    = (t, entity, id) => client.get(`${crm}/${entity}/${id}`, auth(t)).then((r) => r.data);
export const crmCreate = (t, entity, payload) => client.post(`${crm}/${entity}`, payload, auth(t)).then((r) => r.data);
export const crmUpdate = (t, entity, id, payload) => client.put(`${crm}/${entity}/${id}`, payload, auth(t)).then((r) => r.data);
export const crmDelete = (t, entity, id) => client.delete(`${crm}/${entity}/${id}`, auth(t)).then((r) => r.data);
