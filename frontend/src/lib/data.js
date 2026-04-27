// Reachvel content library
export const BRAND = {
  name: "Reachvel",
  tagline: "AI-powered engineering for the world's most ambitious products.",
  logo: "https://customer-assets.emergentagent.com/job_d1703749-287a-4c8e-a034-6870e45cde56/artifacts/wopxaf1q_reachvel%20logo.JPG",
  email: "hello@reachvel.com",
  phone: "+1 (415) 555-0199",
  address: "One Market Plaza, Suite 3600, San Francisco, CA 94105",
  offices: [
    { city: "San Francisco", line1: "One Market Plaza, Suite 3600", line2: "CA 94105, United States", timezone: "PST" },
    { city: "Toronto", line1: "100 King Street West, 56th Floor", line2: "Ontario M5X 1E1, Canada", timezone: "EST" },
    { city: "Bengaluru", line1: "UB City, Concorde Block", line2: "Karnataka 560001, India", timezone: "IST" },
  ],
  socials: [
    { label: "LinkedIn", href: "#" },
    { label: "X / Twitter", href: "#" },
    { label: "Dribbble", href: "#" },
    { label: "GitHub", href: "#" },
  ],
};

export const SERVICES = [
  {
    id: "web",
    number: "S/01",
    title: "Web Engineering",
    short: "Code. Craft. Convert.",
    description:
      "World-class, high-performance websites engineered for scale — from startup landing pages to enterprise-grade platforms.",
    capabilities: ["UX/UI Design Systems", "Frontend & Backend Architecture", "Headless CMS", "Edge-Rendered SEO", "Core Web Vitals Engineering"],
    stack: ["React", "Next.js", "Remix", "Astro", "Node", "Go"],
  },
  {
    id: "mobile",
    number: "S/02",
    title: "Mobile Applications",
    short: "Mobility, anywhere.",
    description:
      "Intuitive, high-performing iOS & Android applications — from early MVPs to category-defining consumer products.",
    capabilities: ["Native iOS & Android", "Flutter & React Native", "App Store Strategy", "Offline-First Sync", "Performance Budgets"],
    stack: ["Swift", "Kotlin", "Flutter", "React Native", "Expo"],
  },
  {
    id: "ai",
    number: "S/03",
    title: "AI Automation",
    short: "Intelligence as infrastructure.",
    description:
      "AI-driven systems that compound over time — chat agents, voice agents, RAG pipelines, and production LLM workflows.",
    capabilities: ["RAG & Vector Search", "Voice & Conversational AI", "Evals & Guardrails", "Agentic Workflows", "Fine-tuning"],
    stack: ["OpenAI", "Anthropic", "Gemini", "LangGraph", "Pinecone", "Vercel AI"],
  },
  {
    id: "ecom",
    number: "S/04",
    title: "Commerce Platforms",
    short: "Stores engineered to sell.",
    description:
      "Fully customized e-commerce platforms optimized for conversion, performance, and global scale — D2C and B2B.",
    capabilities: ["Storefronts", "Product Information Management", "Payments & Tax", "Subscriptions", "Post-purchase Analytics"],
    stack: ["Shopify Hydrogen", "Medusa", "Stripe", "commercetools"],
  },
  {
    id: "ads",
    number: "S/05",
    title: "Performance Growth",
    short: "Clicks into customers.",
    description:
      "Performance-driven ad systems with razor-sharp targeting, measurable ROAS, and a discipline of experiments.",
    capabilities: ["Paid Search & Social", "Creative Systems", "Attribution", "A/B Testing"],
    stack: ["Google Ads", "Meta", "TikTok", "GA4", "Mixpanel"],
  },
  {
    id: "brand",
    number: "S/06",
    title: "Brand Systems",
    short: "Brands the world remembers.",
    description:
      "Identity systems that connect emotionally and convert commercially — positioning, messaging, visual language.",
    capabilities: ["Positioning", "Visual Identity", "Voice & Messaging", "Design Systems"],
    stack: ["Figma", "After Effects", "Rive"],
  },
  {
    id: "data",
    number: "S/07",
    title: "Data & Insights",
    short: "Decisions backed by data.",
    description:
      "From dashboards to predictive analytics — we turn raw numbers into real-time insights that fuel strategy.",
    capabilities: ["BI Dashboards", "ETL Pipelines", "Warehousing", "Predictive Analytics"],
    stack: ["Snowflake", "dbt", "Looker", "Metabase", "Python"],
  },
];

export const STATS = [
  { value: "1.2M+", label: "Lines of code shipped" },
  { value: "120+", label: "Projects delivered" },
  { value: "28+", label: "Industries served" },
  { value: "14", label: "Countries" },
];

export const CLIENTS = [
  { name: "Microsoft", src: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
  { name: "Accenture", src: "https://upload.wikimedia.org/wikipedia/commons/c/cd/Accenture.svg" },
  { name: "Infosys", src: "https://upload.wikimedia.org/wikipedia/commons/9/95/Infosys_logo.svg" },
  { name: "Wipro", src: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Wipro_Primary_Logo_Color_RGB.svg" },
  { name: "Stripe", src: "https://upload.wikimedia.org/wikipedia/commons/b/ba/Stripe_Logo%2C_revised_2016.svg" },
  { name: "Shopify", src: "https://upload.wikimedia.org/wikipedia/commons/0/0e/Shopify_logo_2018.svg" },
  { name: "Atlassian", src: "https://upload.wikimedia.org/wikipedia/commons/7/74/Atlassian-logo.svg" },
  { name: "Airbnb", src: "https://upload.wikimedia.org/wikipedia/commons/6/69/Airbnb_Logo_Bélo.svg" },
];

export const PROJECTS = [
  {
    slug: "vault-fintech",
    title: "Vault — Private Banking, Reimagined",
    client: "Vault Holdings",
    domain: "Fintech",
    year: "2025",
    summary:
      "A zero-trust private banking platform serving 180k high-net-worth clients across 22 countries.",
    metrics: [
      { k: "94ms", v: "p95 latency" },
      { k: "+38%", v: "AUM growth" },
      { k: "SOC 2 II", v: "Certified" },
    ],
    cover: "https://images.unsplash.com/photo-1723785735443-16ffd373f398?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHwzfHxmaW50ZWNoJTIwZGFzaGJvYXJkJTIwYXBwJTIwaW50ZXJmYWNlJTIwbW9kZXJufGVufDB8fHx8MTc3NzI5MjA0OHww&ixlib=rb-4.1.0&q=85",
    video: "https://cdn.pixabay.com/video/2024/04/20/209336-939489619_large.mp4",
    services: ["Web", "Mobile", "AI"],
  },
  {
    slug: "helix-health",
    title: "Helix — Clinician-Grade Care OS",
    client: "Helix Health",
    domain: "Healthcare",
    year: "2025",
    summary:
      "HIPAA-grade clinical workspace powering 4.2M patient encounters annually across 12 hospital networks.",
    metrics: [
      { k: "−42%", v: "Charting time" },
      { k: "99.99%", v: "Uptime" },
      { k: "HL7 FHIR", v: "Compliant" },
    ],
    cover:
      "https://images.unsplash.com/photo-1633098096956-afdc8bcc8552?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDV8MHwxfHNlYXJjaHwyfHxoZWFsdGhjYXJlJTIwdGVjaG5vbG9neSUyMGFic3RyYWN0JTIwc2NyZWVufGVufDB8fHx8MTc3NzI5MjA0N3ww&ixlib=rb-4.1.0&q=85",
    video: "https://cdn.pixabay.com/video/2023/10/11/184416-874659133_large.mp4",
    services: ["Mobile", "AI", "Data"],
  },
  {
    slug: "atlas-analytics",
    title: "Atlas — Institutional Analytics",
    client: "Atlas Capital",
    domain: "Data",
    year: "2024",
    summary:
      "Predictive market intelligence used by 340 hedge funds to price risk across equities, FX, and credit.",
    metrics: [
      { k: "12B", v: "Rows/day" },
      { k: "8ms", v: "Query p50" },
      { k: "23 sources", v: "Real-time feeds" },
    ],
    cover:
      "https://images.pexels.com/photos/32299899/pexels-photo-32299899.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    video: "https://cdn.pixabay.com/video/2024/11/09/240120_large.mp4",
    services: ["Web", "Data", "AI"],
  },
  {
    slug: "noor-commerce",
    title: "Noor — Luxury Commerce",
    client: "Noor Atelier",
    domain: "Retail",
    year: "2024",
    summary:
      "Headless commerce flagship for a luxury fashion house — shipping in 38 countries with white-glove logistics.",
    metrics: [
      { k: "+61%", v: "Conversion" },
      { k: "1.1s", v: "LCP" },
      { k: "38", v: "Markets" },
    ],
    cover:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    video: "https://cdn.pixabay.com/video/2020/07/30/45942-447087782_large.mp4",
    services: ["Web", "Brand"],
  },
  {
    slug: "mira-voice",
    title: "Mira — AI Voice Agent",
    client: "Mira Labs",
    domain: "AI",
    year: "2025",
    summary:
      "Real-time voice AI handling 2.4M customer calls/month across 9 languages with sub-400ms end-to-end latency.",
    metrics: [
      { k: "380ms", v: "End-to-end" },
      { k: "9", v: "Languages" },
      { k: "96%", v: "CSAT" },
    ],
    cover:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    video: "https://cdn.pixabay.com/video/2024/03/18/204306-925350094_large.mp4",
    services: ["AI"],
  },
  {
    slug: "orbital-retail",
    title: "Orbital — AI Merchandising",
    client: "Orbital Retail",
    domain: "Retail",
    year: "2024",
    summary:
      "AI-driven merchandising engine that reprices 1.4M SKUs nightly across 900 retail stores.",
    metrics: [
      { k: "+19%", v: "Gross margin" },
      { k: "1.4M", v: "SKUs" },
      { k: "900", v: "Stores" },
    ],
    cover:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    video: "https://cdn.pixabay.com/video/2019/11/03/28586-371443433_large.mp4",
    services: ["AI", "Data"],
  },
];

export const TESTIMONIALS = [
  {
    quote:
      "Reachvel rebuilt our clinician platform in half the time we budgeted — and raised the ceiling on what we thought was possible.",
    author: "Dr. Priya Ramachandran",
    role: "Chief Digital Officer",
    company: "Helix Health",
  },
  {
    quote:
      "Their AI engineers treat LLMs like infrastructure. Everything ships with evals, observability, and a defensible moat.",
    author: "Marcus Delacroix",
    role: "VP of Engineering",
    company: "Vault Holdings",
  },
  {
    quote:
      "The most thoughtful creative engineering partner we've ever worked with. Editorial, precise, and disarmingly fast.",
    author: "Aiko Tanaka",
    role: "CMO",
    company: "Noor Atelier",
  },
];

export const VALUES = [
  {
    n: "01",
    title: "Craft as a first principle",
    body: "Every pixel, every query, every line — defensible, documented, tested. Craft compounds.",
  },
  {
    n: "02",
    title: "Engineering at the edges",
    body: "We meet customers where physics ends — latency, reliability, scale. Never the happy path alone.",
  },
  {
    n: "03",
    title: "AI as a backbone",
    body: "We design systems where intelligence isn't a feature — it's the substrate the product runs on.",
  },
  {
    n: "04",
    title: "Proof over promises",
    body: "We measure, write it down, and ship the proof. Every engagement ends with a dossier.",
  },
];

export const APPROACH = [
  {
    n: "01",
    title: "Discovery & Briefing",
    body: "A deep understanding of vision, constraints, and the hill we'd die on.",
    points: ["Goals & constraints", "Risk register", "Success metrics"],
  },
  {
    n: "02",
    title: "Research & Architecture",
    body: "Insight-backed, AI-assisted. We architect for 10x the traffic you actually expect.",
    points: ["Competitive teardown", "Stack selection", "Scalable architecture"],
  },
  {
    n: "03",
    title: "Build & Prove",
    body: "Weekly shippable milestones. Transparent pricing. Everything measured.",
    points: ["Biweekly demos", "Continuous delivery", "Observability baked in"],
  },
  {
    n: "04",
    title: "Launch & Compound",
    body: "Post-launch, we monitor, evolve, and compound results with you.",
    points: ["Post-launch SRE", "Engagement analytics", "Roadmap co-pilot"],
  },
];

export const ROLES = [
  { id: "r1", title: "Senior Staff Engineer, AI Platform", dept: "Engineering", location: "San Francisco · Remote", type: "Full-time" },
  { id: "r2", title: "Lead Product Designer", dept: "Design", location: "Toronto · Remote", type: "Full-time" },
  { id: "r3", title: "iOS Engineer", dept: "Mobile", location: "Remote (Americas)", type: "Full-time" },
  { id: "r4", title: "Data Engineer, Warehousing", dept: "Data", location: "Bengaluru · Hybrid", type: "Full-time" },
  { id: "r5", title: "ML Engineer, RAG Systems", dept: "AI", location: "Remote (EU / Americas)", type: "Full-time" },
  { id: "r6", title: "Creative Director", dept: "Brand", location: "Toronto", type: "Full-time" },
  { id: "r7", title: "Technical Program Manager", dept: "Delivery", location: "San Francisco · Hybrid", type: "Full-time" },
  { id: "r8", title: "Engineering Intern — Summer 2026", dept: "Engineering", location: "Bengaluru", type: "Internship" },
];

export const BENEFITS = [
  { t: "Unreasonable Craft Budget", d: "$5,000/yr for books, conferences, tooling, residencies." },
  { t: "Fully Remote, Globally Paid", d: "Work from 14 countries. We pay to local benchmarks, not discounted ones." },
  { t: "Sabbatical Every 4 Years", d: "Six weeks, fully paid. Rest is a load-bearing wall." },
  { t: "Equity in Outcomes", d: "Profit-share on every engagement you ship." },
  { t: "Hardware You'd Never Expense", d: "Studio-grade hardware for every craft — engineering, design, video." },
  { t: "Learning as Infrastructure", d: "Internal fellowship, peer reviews, weekly reading groups." },
];

export const ARTICLES = [
  {
    slug: "ai-as-infrastructure",
    title: "AI as Infrastructure — Why your org chart is wrong",
    excerpt:
      "Most companies treat AI as a feature. The ones pulling ahead treat it as infrastructure. Here's what that actually means in practice.",
    category: "AI",
    date: "Dec 10, 2025",
    readTime: "9 min",
    author: "Elena Moreau",
    cover:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    body: [
      "We've spent the last three years embedded inside product teams shipping LLMs to millions of users. The companies quietly winning share the same posture: AI is not a feature shipped into a product. It's a substrate the product runs on — like a database, like a CDN.",
      "That reframing is load-bearing. If AI is infrastructure, then evals are tests, prompts are contracts, and the operations team owns the uptime of intelligence itself. We'll walk through the exact team topology and the tooling we'd install on day zero.",
      "From there, the playbook is mostly about discipline — guardrails, observability, and the humility to roll back a model the same way you'd roll back a migration.",
    ],
  },
  {
    slug: "performance-budgets-2026",
    title: "Performance Budgets for the AI-Native Web",
    excerpt:
      "A modern web stack now carries 4–6 model calls on a single page load. Your Core Web Vitals haven't changed. Your budget has.",
    category: "Web",
    date: "Nov 24, 2025",
    readTime: "7 min",
    author: "Kenji Park",
    cover:
      "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    body: [
      "LCP, INP, and CLS still define the ceiling of what the web can feel like. But the floor just moved: we're routinely seeing pages ship 4–6 streamed model calls on first paint, and the browser isn't getting faster.",
      "We'll share the exact perf budgets we ship to clients — broken down by route type, and by the nature of the model calls on the page.",
    ],
  },
  {
    slug: "native-or-react-native",
    title: "Native, React Native, or Flutter — The 2026 Decision Tree",
    excerpt:
      "A framework-agnostic decision tree for picking the right mobile stack, shaped by 120 engagements and 11M installs.",
    category: "Mobile",
    date: "Nov 12, 2025",
    readTime: "11 min",
    author: "Ada Okonkwo",
    cover:
      "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    body: [
      "Every mobile framework claim you'll read in 2026 is partially right and totally useless without context. We'll share the decision tree we actually use — broken down by product stage, team topology, and the five or six places native still wins outright.",
    ],
  },
  {
    slug: "ragops",
    title: "RAG-Ops — Running retrieval like a database",
    excerpt:
      "The five SLOs we run against every retrieval pipeline we ship. If you can't answer them, you don't have production RAG — you have a demo.",
    category: "AI",
    date: "Oct 30, 2025",
    readTime: "12 min",
    author: "Samir Bose",
    cover:
      "https://images.unsplash.com/photo-1527474305487-b87b222841cc?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    body: [
      "RAG is the new CRUD. And like CRUD, the difference between a demo and production is mostly about the things no one wants to build — observability, schema migrations, and a team on-call.",
    ],
  },
  {
    slug: "design-systems-physics",
    title: "Design Systems That Obey Physics",
    excerpt:
      "Momentum, friction, and mass are not metaphors in a design system. They're the only way interfaces feel alive.",
    category: "Design",
    date: "Oct 14, 2025",
    readTime: "8 min",
    author: "Lea Vermont",
    cover:
      "https://images.unsplash.com/photo-1558655146-9f40138edfeb?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    body: [
      "Every interface that has ever felt alive obeys a physical model somewhere underneath. Motion without mass is a cartoon; mass without friction is chaos. Here's the physics we bake into every Reachvel design system.",
    ],
  },
  {
    slug: "edge-native-ecommerce",
    title: "Edge-Native Commerce — The 900ms Ceiling",
    excerpt:
      "Why we won't ship a luxury storefront with an LCP above 1.1s — and how we hit it even with live personalization.",
    category: "Web",
    date: "Sep 28, 2025",
    readTime: "6 min",
    author: "Kenji Park",
    cover:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    body: [
      "A luxury storefront that takes 2.3 seconds to render has already lost. We'll walk through the edge architecture we use to hit 900ms LCP — even with live personalization, live inventory, and live recommendations.",
    ],
  },
];

export const LEADERSHIP = [
  { name: "Elena Moreau", role: "Chief Executive", initial: "EM" },
  { name: "Kenji Park", role: "Chief Technology Officer", initial: "KP" },
  { name: "Ada Okonkwo", role: "Chief Product Officer", initial: "AO" },
  { name: "Samir Bose", role: "Head of AI", initial: "SB" },
];
