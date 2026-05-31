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
- Frontend CRM pages with Recharts analytics, sub-tabbed project detail, Indian-locale INR formatting throughout.

**Feb 2026 — CRM v2 (per Word doc spec)**
- Leads: dropdowns for Service Interest (5 opts) + Source (7 opts), Follow-up date field, created/updated columns, summary cards (Total/Pipeline/Won/Follow-ups due 7d).
- Vendors: onboarded_date, Status (Active/Inactive) with vibrant pills, summary cards.
- Projects: project_group (CRM/Website/Mobile App/Full Stack/AI Automation/Others), gst_applicable (GST/Non-GST), vendor dropdown, "Project Budget" rename, total_expenses column on list, 8-card KPI summary.
- Per-record GST/Non-GST flag on Invoices, Expenses, Vendor Payments — gst_applicable=false ⇒ gst_amount=0, total=amount on both create & update.
- Renamed "Client Payments" sub-tab → "Received Payments".
- Project Payments page: now a derived/aggregate read-only view with per-project rollup (S.No, Project, GST, Budget, Invoiced, Received, Gen. Expenses, Vendor Expenses, Profit, Status) + summary cards + Refresh.
- Reachvel Payments: Source, Bank (SBI/Kotak), Project dropdown; credit categories (7) + debit categories (11); category & bank filters; summary cards; "Sync Projects" button materializes project_payments→credits and expenses+paid vendor_payments→debits idempotently (matched by source_type+source_id); Origin column distinguishes Manual vs Synced.
- Vibrant `StatusPill` component replaces dull dots everywhere — colored backgrounds + borders + dots.
- Convert lead → project carries new defaults (gst_applicable=true).

## Testing
- Iteration 1: 98% → fixed
- Iteration 2: 100% (16/16)
- Iteration 3: 100% (22/22) — auth hardening
- Iteration 4: 100% (49/49) — CMS + SEO
- **Iteration 5: 100% (99/99 backend pytest + full frontend verification)** — CRM module green. GST recompute on UPDATE verified, auth-gating on all CRM endpoints verified, Analytics aggregation math verified.
- **Iteration 6: 100% (118/118 backend pytest)** — CRM v2 spec changes verified end-to-end: new dropdowns, GST/Non-GST per record, project aggregates, sync idempotency, vibrant pills.

## Recent Content Updates (Feb 2026)
- Home hero badge: "Now accepting Q2 2026 engagements" → "Transforming Ideas into AI-Powered Reality"
- Home chips above Live Signal: replaced with "120+ Products Delivered · 15+ Industries Served · AI-First Engineering"
- Live Signal marquee tokens replaced with: Building · AI Agents, Shipping · Web Products, Automating · Business Workflows, Scaling · Cloud Systems, Deploying · Mobile Apps, Optimizing · Customer Experiences
- STATS (lib/data.js) updated to: 50+ AI Automations Built, 120+ Projects Delivered, 28+ Industries Served, 14 Countries Served

## CRM Cascade Delete Fix (Feb 2026)
- Fixed `DELETE /api/admin/crm/projects/{pid}` in `crm_routes.py` to cascade-delete all child records: crm_tasks, project_expenses, vendor_payments, project_invoices, project_payments, reachvel_payments. Endpoint now returns `{ok: true, cascaded: {<collection>: <count>}}`.
- One-time orphan cleanup script at `/app/backend/cleanup_orphans.py` (idempotent). Removed 11 orphaned records (4 expenses, 3 invoices, 2 vendor_payments, 2 project_payments) on first run, restoring CRM summary card totals to 0.
- Verified end-to-end via curl: created project + 4 child records, deleted project, confirmed all children wiped.

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
