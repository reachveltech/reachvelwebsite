import { Link } from "react-router-dom";

const LIGHT_SRC = "https://customer-assets.emergentagent.com/job_reachvel-studio/artifacts/8yr8eunh_For%20White%20BG.png";
const DARK_SRC  = "https://customer-assets.emergentagent.com/job_reachvel-studio/artifacts/elkurlun_For%20Black%20BG.png";

// Reachvel wordmark. Uses the official transparent PNG artifacts:
//   - "light" → black wordmark (for use on light backgrounds)
//   - "dark"  → white wordmark (for use on dark backgrounds)
export default function Logo({
  theme = "light",
  className = "h-9 w-auto",
  asLink = true,
  to = "/",
  testid = "nav-logo-link",
}) {
  const src = theme === "dark" ? DARK_SRC : LIGHT_SRC;
  const img = (
    <img
      src={src}
      alt="Reachvel"
      draggable={false}
      className={`${className} object-contain select-none`}
    />
  );
  if (!asLink) return img;
  return (
    <Link to={to} data-testid={testid} className="inline-flex items-center">
      {img}
    </Link>
  );
}
