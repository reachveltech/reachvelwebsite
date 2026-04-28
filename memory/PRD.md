# Reachvel — Premium Marketing Website + CMS

## Original Problem Statement
Premium UI/UX for Reachvel (AI-powered Web/Mobile/Digital studio): Home, About, Services, Projects (with images & videos), Careers, Knowledge Center, Contact. 100% mobile responsive. Microsoft/Accenture/Infosys-level polish, physics/chemistry metaphor, Lumina + Finch inspirations.

## Architecture
- **Stack**: React 19 + React Router 7 + Tailwind + shadcn/ui + sonner + lucide-react + react-helmet-async + axios
- **Backend**: FastAPI + Motor (Mongo). bcrypt, secrets-based session tokens.
- **Content**: Now CMS-driven (Mongo) for `projects`, `articles`, `roles`. `BRAND`, `SERVICES`, `STATS`, `LEADERSHIP` etc. remain in `/app/frontend/src/lib/data.js`.
- **Auth**: Single-admin, bcrypt-hashed in `admin_config`, opaque 24h tokens in `admin_sessions`, IP rate limiter via `login_attempts`.

## What's Been Implemented (Dec 2025)
**Public site**
- Navbar (theme-aware), Footer (3 offices), Mobile overlay
- Real Reachvel logo (transparent PNGs, light + dark variants) wired everywhere
- Per-page atomic visuals (Home synthesis molecule, About compound, Services benzene ring, Projects trajectory field, Careers nucleation lattice, Knowledge wave interference)
- Pages: Home, About, Services, Projects (filter + modal video), Careers (apply modal), Knowledge (filter + search), Article (drop-cap + related), Contact (validated form, posts to `/api/contact`)
- 100% mobile responsive · animations across the site

**Backend**
- `/api/contact` POST, `contact_submissions` Mongo collection
- Hardened admin auth: `/api/admin/login`, `/logout`, `/rotate-password`, IP rate-limit (5 fails/5min → 15min), 24h sessions
- Submission status lifecycle (`new → reviewing → contacted → won / lost`), search + status filter on list, stats (total / today / by_status)
- **CMS endpoints**: public `GET /api/projects | /api/articles | /api/articles/:slug | /api/roles`; admin CRUD `GET/POST/PUT/DELETE /api/admin/projects | /api/admin/articles | /api/admin/roles`
- Seed on first startup from `/app/backend/seed_data.py`
- Unique slug enforcement, display_order, featured flag for articles, active toggle for roles

**Admin Dashboard `/admin`**
- Tabbed: **Briefings · Projects · Knowledge · Careers** (active tab persists in localStorage)
- Briefings: stats strip, search, status filter chips, S.No, per-row status dropdown, detail modal, change-password modal
- Generic `CrudPanel` + field configs in `cmsConfig.js` for each entity. Forms cover all fields including arrays (services tags, body paragraphs, metrics `VALUE | LABEL`).

**SEO**
- `react-helmet-async` + `<Seo>` component on every page → unique title, description, canonical, OG, Twitter card
- JSON-LD: Organization on Home, Article on Knowledge detail
- `robots.txt` (disallows `/admin` and `/api`), `sitemap.xml`
- Updated `index.html` with default OG/twitter tags + favicon (logo)

## Testing
- Iteration 1: 98% → fixed
- Iteration 2: 100% (16/16 backend + frontend)
- Iteration 3: 100% (22/22) — auth hardening
- **Iteration 4: 100% (49/49 backend + frontend SEO + CMS) — all green**
- Admin password unchanged: `reachvel-admin-2026` (rotate via dashboard)

## Backlog (P1/P2)
- Slack/email notification on new contact submission
- Pagination on public `/api/projects` and `/api/articles` once content scales
- Split `backend/server.py` into routers (auth/cms/submissions) — currently ~630 lines
- CSV export & date-range picker on Briefings tab
- TTL index on `login_attempts`; optional httpOnly-cookie auth
- Image/file uploads in CMS (currently URL-only); rich-text editor for article body
- i18n, smooth-scroll (Lenis), magnetic CTA cursor

## Next Action Items
- Notification webhook for new submissions
- CMS: file uploads + rich-text editor
- Refactor backend into routers
- Real client logos/videos in projects (replace placeholders)
