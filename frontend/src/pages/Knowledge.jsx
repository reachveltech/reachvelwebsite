import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Search } from "lucide-react";
import Reveal from "@/components/Reveal";
import SectionLabel from "@/components/SectionLabel";
import Seo from "@/components/Seo";
import { KnowledgeAtom } from "@/components/AtomicArt";
import { fetchArticles } from "@/lib/api";

const CATS = ["All", "AI", "Web", "Mobile", "Design"];

export default function Knowledge() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticles().then((d) => setArticles(d || [])).catch(() => setArticles([])).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return articles.filter((a) => {
      if (cat !== "All" && a.category !== cat) return false;
      if (q && !(`${a.title} ${a.excerpt}`.toLowerCase().includes(q.toLowerCase()))) return false;
      return true;
    });
  }, [cat, q, articles]);

  const featured = articles.find((a) => a.featured) || articles[0];
  const rest = filtered.filter((a) => !featured || a.slug !== featured.slug);

  return (
    <div data-testid="page-knowledge" className="bg-[#f7f6f3]">
      <Seo
        title="Knowledge — Field notes from the frontier"
        description="Essays, playbooks, and engineering dispatches from Reachvel — on AI, Web, Mobile, and design systems that obey physics."
        path="/knowledge"
      />
      {/* Hero */}
      <section className="relative overflow-hidden pt-[110px] sm:pt-[140px] md:pt-[180px] pb-16 md:pb-24">
        <div className="hero-grid absolute inset-0 opacity-50 pointer-events-none" />
        <KnowledgeAtom className="hidden lg:block absolute right-[-40px] top-[100px] h-[500px] w-[600px] opacity-85 pointer-events-none z-[5]" />
        <div className="relative mx-auto max-w-[1400px] px-5 md:px-10">
          <Reveal>
            <SectionLabel>Knowledge Center</SectionLabel>
          </Reveal>
          <Reveal delay={80}>
            <h1 className="mt-6 font-display font-black text-[12vw] sm:text-7xl md:text-8xl lg:text-[9.5rem] tracking-[-0.04em] leading-[0.88] text-[#0a0a0a] max-w-6xl">
              Field notes
              <br /> from the
              <br /> <span className="text-[#ff5722]">frontier.</span>
            </h1>
          </Reveal>
          <Reveal delay={160}>
            <p className="mt-10 max-w-2xl text-lg md:text-xl text-[#4a4a4a] font-light leading-relaxed">
              Essays, playbooks, and engineering dispatches from our studio. No growth hacks. No hot takes.
              Only what compounds.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Featured */}
      {cat === "All" && !q && featured && (
        <section className="bg-white border-y border-black/10">
          <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-14 md:py-20">
            <Link
              to={`/knowledge/${featured.slug}`}
              data-testid="featured-article"
              className="group grid lg:grid-cols-2 gap-8 md:gap-14 items-center"
            >
              <div className="relative overflow-hidden aspect-[4/3] md:aspect-[5/4] rounded-sm">
                <img
                  src={featured.cover}
                  alt={featured.title}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.04]"
                />
                <div className="absolute top-5 left-5 flex gap-2">
                  <span className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-white text-[#0a0a0a]">
                    Featured
                  </span>
                  <span className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-[#ff5722] text-white">
                    {featured.category}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#4a4a4a] mb-4">
                  {featured.date} · {featured.read_time} · {featured.author}
                </div>
                <h2 className="font-display font-black text-4xl md:text-5xl lg:text-6xl tracking-tighter leading-[0.95] text-[#0a0a0a] group-hover:text-[#ff5722] transition-colors">
                  {featured.title}
                </h2>
                <p className="mt-6 text-lg text-[#4a4a4a] leading-relaxed font-light">
                  {featured.excerpt}
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-[0.2em] text-[#0a0a0a] group-hover:text-[#ff5722] transition-colors">
                  Read essay <ArrowUpRight className="h-4 w-4 group-hover:-translate-y-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* Filter + Search */}
      <section className="sticky top-[72px] z-30 backdrop-blur-xl bg-[#f7f6f3]/80 border-b border-black/10">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 py-4 flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            {CATS.map((c) => (
              <button
                key={c}
                data-testid={`knowledge-filter-${c.toLowerCase()}`}
                onClick={() => setCat(c)}
                className={`shrink-0 px-4 py-2 rounded-full border text-sm font-mono uppercase tracking-[0.15em] transition-all duration-300 ${
                  cat === c
                    ? "bg-[#0a0a0a] border-[#0a0a0a] text-white"
                    : "border-black/20 text-[#4a4a4a] hover:text-[#0a0a0a] hover:border-[#0a0a0a]"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="md:ml-auto flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-2 w-full md:w-72">
            <Search className="h-4 w-4 text-[#4a4a4a]" />
            <input
              data-testid="knowledge-search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search articles…"
              className="bg-transparent focus:outline-none text-sm flex-1"
            />
          </div>
        </div>
      </section>

      {/* Grid */}
      <section className="bg-[#f7f6f3] py-14 md:py-20">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          {rest.length === 0 ? (
            <div className="py-20 text-center text-[#4a4a4a]">
              <div className="font-display font-black text-4xl text-[#0a0a0a]">
                {loading ? "Loading…" : "No essays match."}
              </div>
              {!loading && <div className="mt-3">Try a different category or query.</div>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {rest.map((a, i) => (
                <Reveal key={a.slug} delay={i * 60}>
                  <Link
                    to={`/knowledge/${a.slug}`}
                    data-testid={`article-card-${a.slug}`}
                    className="group block"
                  >
                    <div className="relative overflow-hidden aspect-[4/3] rounded-sm bg-black">
                      <img
                        src={a.cover}
                        alt={a.title}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.05]"
                        loading="lazy"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-white text-[#0a0a0a]">
                          {a.category}
                        </span>
                      </div>
                    </div>
                    <div className="pt-5">
                      <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#4a4a4a] mb-3">
                        {a.date} · {a.read_time}
                      </div>
                      <h3 className="font-display font-extrabold text-2xl tracking-tight text-[#0a0a0a] group-hover:text-[#ff5722] transition-colors">
                        {a.title}
                      </h3>
                      <p className="mt-3 text-[#4a4a4a] leading-relaxed text-sm line-clamp-3">
                        {a.excerpt}
                      </p>
                    </div>
                  </Link>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
