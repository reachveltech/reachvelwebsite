import { Link } from "react-router-dom";

const LIGHT_SRC = "https://customer-assets.emergentagent.com/job_reachvel-studio/artifacts/eqjl6gnc_reachvel%20logo.JPG";
const DARK_SRC  = "https://customer-assets.emergentagent.com/job_reachvel-studio/artifacts/d64a9oqa_logo_type_03.png";

// Renders the Reachvel wordmark. Uses mix-blend-mode to transparently
// knock out the solid background baked into the source files:
//   - "light" variant (black wordmark on white): blend multiply → white disappears
//   - "dark"  variant (white wordmark on black): blend screen   → black disappears
export default function Logo({
  theme = "light",
  className = "h-9 w-auto",
  asLink = true,
  to = "/",
  testid = "nav-logo-link",
}) {
  const src = theme === "dark" ? DARK_SRC : LIGHT_SRC;
  const blend = theme === "dark" ? "mix-blend-screen" : "mix-blend-multiply";
  const img = (
    <img
      src={src}
      alt="Reachvel"
      draggable={false}
      className={`${className} ${blend} select-none object-contain`}
    />
  );
  if (!asLink) return img;
  return (
    <Link to={to} data-testid={testid} className="inline-flex items-center">
      {img}
    </Link>
  );
}
