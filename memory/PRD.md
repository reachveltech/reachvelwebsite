# Reachvel — Premium Marketing Website + CMS + CRM

## Original Problem Statement
Premium UI/UX for Reachvel (AI-powered Web/Mobile/Digital studio): Home, About, Services, Projects (with images & videos), Careers, Knowledge Center, Contact. 100% mobile responsive. Microsoft/Accenture/Infosys-level polish, physics/chemistry metaphor, Lumina + Finch inspirations.

**Phase 2 (CMS + SEO)**: Full admin-managed CMS for Projects, Knowledge, Careers, Briefings. SEO (meta, JSON-LD, sitemap, robots).

**Phase 3 (CRM — this phase)**: Brand-new "Reachvel Dashboard (CRM)" inside the admin panel, completely separate from Website CMS. Modules: Analytics, Leads, Vendors, Reachvel Projects (with Tasks, Expenses, Vendor Payments, Invoices, Client Payments), general Tasks, Project Payments, Reachvel Payments. INR-only currency, manual GST 18% default that auto-computes gst_amount + total on invoices and vendor payments. Single-admin.

## Architecture
- **Stack**: React 19 + React Router 7 + Tailwind + shadcn/ui + sonner + lucide-react + react-helmet-async + recharts + axios
- **Backend**: FastAPI + Motor (Mongo). bcrypt, secrets-based session tokens. CRM split into `crm_routes.py`.
- **Content**: CMS-driven (Mongo) for `projects`, `articles`, `roles`. `BRAND`, `SERVICES`, `STATS`, `LEADERSHIP` etc. remain in `/app/frontend/src/lib/data.js`.
- **CRM**: Mongo collections — `leads`, `vendors`, `crm_projects`, `crm_tasks`, `project_expenses`, `vendor_payments`, `project_invoices`, `project_payments`, `reachvel_payments`
- **Auth**: Single-admin, bcrypt-hashed in `admin_config`, opaque 24h tokens in `admin_sessions`, IP rate limiter via `login_attempts`.

## What's Been Implemented

**Dec 2025 — Public site + CMS + SEO**
- 7 pages with per-page physics/atomic SVG art; theme-aware Navbar, transparent logos; contact form wired to `/api/contact`
- Admin auth (bcrypt, rate-limit, 24h session), Website CMS (Briefings, Projects, Knowledge, Careers) with CrudPanel + cmsConfig
- SEO — `<Seo>` component, JSON-LD, `robots.txt`, `sitemap.xml`

**Feb 2026 — Reachvel Dashboard (CRM)**
- Admin refactored from top-tab layout to sidebar with TWO groups: "Website CMS" (4 existing entities) + "Reachvel Dashboard" (7 new modules).
- Backend (`/app/backend/crm_routes.py`): 9 CRUD entities + analytics endpoint under `/api/admin/crm/*`. GST auto-calc on invoices & vendor_payments (amount + gst_pct → gst_amount, total) on CREATE and UPDATE.
- Frontend CRM pages under `/app/frontend/src/components/admin/crm/`:
  - `CrmPanel.jsx` (generic table CRUD + search + filters + form modal)
  - `Analytics.jsx` — Recharts cashflow line, 3 pie/bar charts, KPI grid (net profit, revenue, pipeline, etc.)
  - `Leads.jsx` — stage funnel, deal value in INR
  - `Vendors.jsx` — directory with GSTIN
  - `CrmProjects.jsx` + `ProjectDetail.jsx` — project list → detail with 5 sub-tabs (Tasks, Expenses, Vendor Payments, Invoices, Client Payments)
  - `Tasks.jsx` — unified tasks (general + project-linked)
  - `ProjectPayments.jsx` — aggregate incoming client payments across all projects
  - `ReachvelPayments.jsx` — company credit/debit ledger
- All monetary fields render in Indian locale (₹ INR). GST default 18% pre-filled, user-editable.

## Testing
- Iteration 1: 98% → fixed
- Iteration 2: 100% (16/16)
- Iteration 3: 100% (22/22) — auth hardening
- Iteration 4: 100% (49/49) — CMS + SEO
- **Iteration 5: 100% (99/99 backend pytest + full frontend verification)** — CRM module green. GST recompute on UPDATE verified, auth-gating on all CRM endpoints verified, Analytics aggregation math verified.

## Backlog (P1/P2)
- CSV export + date-range filters on CRM lists (leads, payments, invoices)
- Split `backend/server.py` further into routers (auth/cms/submissions); CRM already separate
- Email notification on new lead / new submission
- File/image uploads for CMS + receipt attachments on expenses
- Rich-text editor for article body
- Currency/locale toggle (if expanding beyond INR)
- Pagination on public `/api/projects` and `/api/articles` once content scales
- TTL index on `login_attempts`; optional httpOnly-cookie auth

## Next Action Items
- Seed demo CRM data (optional — aids initial user experience)
- Email/webhook notification for new leads and briefings
- CSV export on CRM lists
- Real client logos/videos in projects (replace placeholders)
