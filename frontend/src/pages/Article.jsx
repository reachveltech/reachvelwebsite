import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { fetchArticle, fetchArticles } from "@/lib/api";
import Seo from "@/components/Seo";
import SectionLabel from "@/components/SectionLabel";

export default function Article() {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    setLoading(true);
    setNotFound(false);
    Promise.all([
      fetchArticle(slug).catch((e) => {
        if (e?.response?.status === 404) setNotFound(true);
        return null;
      }),
      fetchArticles().catch(() => []),
    ])
      .then(([a, all]) => {
        setArticle(a);
        setRelated((all || []).filter((x) => x.slug !== slug).slice(0, 3));
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (notFound) {
    return (
      <div className="bg-[#f7f6f3] pt-[110px] sm:pt-[160px] pb-24 min-h-screen">
        <Seo title="Essay not found" path={`/knowledge/${slug}`} noindex />
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <h1 className="font-display font-black text-5xl text-[#0a0a0a]">Essay not found.</h1>
          <Link
            to="/knowledge"
            data-testid="article-back-not-found"
            className="mt-6 inline-flex items-center gap-2 btn-ghost"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Knowledge
          </Link>
        </div>
      </div>
    );
  }

  if (loading || !article) {
    return (
      <div className="bg-[#f7f6f3] pt-[110px] sm:pt-[160px] pb-24 min-h-screen">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10 text-[#4a4a4a]">
          Loading…
        </div>
      </div>
    );
  }

  const ogImage = article.cover;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    image: [article.cover],
    datePublished: article.date,
    author: { "@type": "Person", name: article.author },
    publisher: {
      "@type": "Organization",
      name: "Reachvel",
      logo: {
        "@type": "ImageObject",
        url: "https://customer-assets.emergentagent.com/job_reachvel-studio/artifacts/elkurlun_For%20Black%20BG.png",
      },
    },
  };

  return (
    <div data-testid="page-article" className="bg-[#f7f6f3]">
      <Seo
        title={article.title}
        description={article.excerpt}
        path={`/knowledge/${article.slug}`}
        image={ogImage}
        type="article"
        author={article.author}
        publishedAt={article.date}
        jsonLd={jsonLd}
      />

      {/* Hero */}
      <section className="pt-[110px] sm:pt-[140px] md:pt-[180px] pb-10 md:pb-16">
        <div className="mx-auto max-w-3xl px-5 md:px-10">
          <Link
            to="/knowledge"
            data-testid="article-back-link"
            className="inline-flex items-center gap-2 text-sm font-mono uppercase tracking-[0.2em] text-[#4a4a4a] hover:text-[#ff5722]"
          >
            <ArrowLeft className="h-4 w-4" /> All essays
          </Link>
          <div className="mt-8">
            <SectionLabel>{article.category} · {article.read_time}</SectionLabel>
          </div>
          <h1 className="mt-6 font-display font-black text-4xl md:text-6xl lg:text-7xl tracking-tighter leading-[0.95] text-[#0a0a0a]">
            {article.title}
          </h1>
          <div className="mt-8 flex items-center gap-4 text-[11px] font-mono uppercase tracking-[0.25em] text-[#4a4a4a]">
            <span>{article.date}</span>
            <span>·</span>
            <span>by {article.author}</span>
          </div>
        </div>
      </section>

      <section className="pb-14">
        <div className="mx-auto max-w-5xl px-5 md:px-10">
          <div className="relative overflow-hidden aspect-[16/9] rounded-sm bg-black">
            <img
              src={article.cover}
              alt={article.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="pb-24 md:pb-32">
        <div className="mx-auto max-w-3xl px-5 md:px-10">
          {(article.body || []).map((p, i) => (
            <p
              key={i}
              className={`text-lg md:text-xl text-[#0a0a0a]/85 leading-[1.8] font-light mb-6 ${
                i === 0 ? "first-letter:font-display first-letter:text-7xl first-letter:font-black first-letter:float-left first-letter:pr-3 first-letter:leading-[0.8] first-letter:text-[#ff5722]" : ""
              }`}
            >
              {p}
            </p>
          ))}
          <div className="mt-16 pt-8 border-t border-black/10 flex items-center justify-between gap-4 flex-wrap">
            <div className="text-sm text-[#4a4a4a] font-mono uppercase tracking-[0.2em]">
              Share this essay
            </div>
            <div className="flex gap-2">
              {["LinkedIn", "X", "Copy link"].map((s) => (
                <button
                  key={s}
                  data-testid={`share-${s.toLowerCase().replace(/ /g, "-")}`}
                  className="btn-ghost !py-2 !px-4 text-[11px]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section className="bg-white border-y border-black/10 py-20 md:py-28">
          <div className="mx-auto max-w-[1400px] px-5 md:px-10">
            <div className="flex items-end justify-between mb-10 gap-6">
              <h3 className="font-display font-black text-3xl md:text-4xl tracking-tighter text-[#0a0a0a]">
                Keep reading
              </h3>
              <Link to="/knowledge" data-testid="article-related-all" className="hidden md:inline-flex btn-ghost">
                All essays <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {related.map((a) => (
                <Link key={a.slug} to={`/knowledge/${a.slug}`} data-testid={`related-${a.slug}`} className="group block">
                  <div className="relative overflow-hidden aspect-[4/3] rounded-sm bg-black">
                    <img src={a.cover} alt={a.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.2s] group-hover:scale-[1.05]" />
                  </div>
                  <div className="pt-4">
                    <div className="text-[11px] font-mono uppercase tracking-[0.25em] text-[#4a4a4a] mb-2">
                      {a.category} · {a.read_time}
                    </div>
                    <h4 className="font-display font-extrabold text-xl tracking-tight text-[#0a0a0a] group-hover:text-[#ff5722] transition-colors">
                      {a.title}
                    </h4>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
