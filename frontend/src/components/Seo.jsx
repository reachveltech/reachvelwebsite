import { Helmet } from "react-helmet-async";

const SITE = "Reachvel";
const DEFAULT_DESC =
  "Reachvel — AI-native engineering studio building world-class Web, Mobile, and AI systems for category-defining companies.";
const DEFAULT_OG_IMAGE =
  "https://customer-assets.emergentagent.com/job_reachvel-studio/artifacts/elkurlun_For%20Black%20BG.png";

// Use the deployed origin as canonical base when REACT_APP_BACKEND_URL points to it.
const ORIGIN =
  (typeof window !== "undefined" && window.location && window.location.origin) ||
  process.env.REACT_APP_BACKEND_URL ||
  "https://reachvel.com";

export default function Seo({
  title,
  description = DEFAULT_DESC,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  publishedAt,
  author,
  noindex = false,
  jsonLd,
}) {
  const fullTitle = title ? `${title} · ${SITE}` : `${SITE} — AI-Native Engineering Studio`;
  const url = `${ORIGIN}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:image:alt" content={fullTitle} />
      {publishedAt && <meta property="article:published_time" content={publishedAt} />}
      {author && <meta property="article:author" content={author} />}

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {jsonLd && <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>}
    </Helmet>
  );
}
