# Reachvel — Premium Marketing Website

## Original Problem Statement
Build a super premium, highly technical website for Reachvel — an AI-powered Web/Mobile/Digital studio. Pages: About, Services, Projects (with images & videos), Careers, Knowledge Center, Contact. Physics/chemistry dynamics metaphor. Microsoft/Accenture/Infosys caliber. 100% mobile responsive. UI/UX only for this phase. Inspirations: lumina-design.co, thefinch.design. Brand logo + content from reachvel.com.

## User Choices (Dec 2025)
- Theme: Hybrid (light Home/Knowledge/Careers/About, dark Services/Projects, mixed Contact)
- Projects: curated placeholders with realistic case-study narratives (Fintech, Healthcare, Data, Retail, AI)
- Careers: full page with 8 sample open roles + culture + apply modal
- Knowledge: article grid + filters + search + article detail pages
- Contact: UI-only with validation + sonner toast + success state

## Architecture
- Stack: React 19 + React Router 7 + Tailwind + shadcn/ui primitives + sonner + lucide-react
- Backend: FastAPI boilerplate (untouched — UI-only project)
- Content: Static from `/app/frontend/src/lib/data.js`
- Fonts: Cabinet Grotesk (display, Fontshare) + Outfit (body) + JetBrains Mono — no Inter/Space Grotesk
- Design tokens: accent `#FF5722`, light `#F7F6F3`, dark `#050505`
- Motion: custom IntersectionObserver `<Reveal>` component, CSS marquee/orbit/float

## What's Been Implemented (Dec 2025)
- Navbar: glassmorphic sticky, theme-aware, desktop + mobile overlay menu
- Footer: 3 offices, nav/social links, live-status ticker
- Home + page-specific atomic visuals (Home molecule, About compound, Services benzene ring, Projects trajectory field, Careers nucleation lattice, Knowledge wave interference)
- Contact: phone field + POST to real backend `/api/contact` (persisted in Mongo `contact_submissions`)
- **Hardened Admin (`/admin`)**:
  - Bcrypt-hashed password stored in Mongo `admin_config` (seeded from `backend/.env → ADMIN_PASSWORD`)
  - Random opaque session tokens in `admin_sessions` (24h TTL), returned on `POST /api/admin/login`, sent via `X-Admin-Token` header
  - **IP-based rate limit**: 5 failed attempts / 5 min → 15 min lockout (429). Successful login clears failure history.
  - `POST /api/admin/rotate-password` — validates current password, invalidates all other sessions
  - Submission **status lifecycle**: new → reviewing → contacted → won/lost (`PATCH /api/admin/submissions/{id}`)
  - Admin dashboard: **S.No column**, **server-side search** (`?q=`), **status filter chips** (`?status=`), per-row status dropdown, change-password modal, 7-card stat strip (Total / Today / by status)
- Brand contact: `info@reachvel.com` / `+91 91214 77 117` (applied site-wide via `BRAND` constant)

## Testing
- Iteration 1 (static pages) — 98% → bug fixed
- Iteration 2 (contact + initial admin) — 100% (16/16)
- **Iteration 3 (hardened auth + status + search + filter) — 100% (22/22 backend + all frontend flows)**

## P0/P1/P2 Backlog (next phases)
- P1: Real project video assets + richer case-study detail pages (dedicated /projects/:slug)
- P1: Wire contact form to FastAPI backend + email/Slack delivery + rate-limit
- P1: CMS for Knowledge Center (Sanity / Notion) + RSS/Atom feed
- P2: i18n (en/fr/ja), dark-mode toggle for light pages
- P2: Lenis smooth-scroll, Framer Motion magnetic buttons, custom cursor
- P2: Analytics event instrumentation (PostHog wired; track CTAs)
- P2: SEO (sitemap, structured data, OG images per page)

## Next Action Items
- Connect Contact form to real email/Slack
- Add dedicated project detail pages with richer narratives
- Replace sample videos with real client footage
