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
- Navbar: glassmorphic sticky, desktop + mobile overlay hamburger menu
- Footer: 3 offices, nav/social links, live-status ticker
- Home: hero (physics/molecule SVG), ticker strip, clients marquee, services preview 3×3 bento, stats (tetris grid), projects snippet (4 asymmetric), approach 4-step, testimonials 3 cards, orange CTA strip
- About: hero, mission split, 4 values grid, dark stats band, leadership 4-card grid, CTA
- Services: dark theme, 7 discipline rows with stack chips, engagement tiers (Sprint/Engagement/Studio), CTA
- Projects: filter bar (All/Fintech/Healthcare/Retail/Data/AI), 6 asymmetric bento cards with metrics, project modal with mp4 video + metrics + services chips
- Careers: hero, culture 3-image mosaic, 6 benefits grid, 8 open roles with role-level Apply modal (validated form + sonner toast)
- Knowledge: featured article, category + search filters, 6 articles, detail page with drop-cap body + related
- Contact: validated briefing form (service + budget chips, name/email/company/note), submit → sonner toast + success state + reset, 3 office cards + direct channels rail
- ScrollToTop on route change (via useLocation)
- All interactive elements have unique `data-testid` attributes
- 100% mobile responsive verified at 390px

## Testing
- `/app/test_reports/iteration_1.json` — 98% pass, single medium bug (ScrollToTop) **fixed**
- No backend tests (static UI)

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
