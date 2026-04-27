import { Link } from "react-router-dom";

// Inline SVG recreation of the Reachvel wordmark.
// Truly transparent (no background), adapts to theme via currentColor,
// and stays crisp at any size.
export default function Logo({
  theme = "light",
  className = "h-9 w-auto",
  asLink = true,
  to = "/",
  testid = "nav-logo-link",
}) {
  const ink = theme === "dark" ? "#ffffff" : "#0a0a0a";

  const svg = (
    <svg
      viewBox="0 0 920 180"
      className={`${className} select-none`}
      role="img"
      aria-label="Reachvel"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* rounded square containing the "r" mark */}
      <rect
        x="12" y="12" width="156" height="156"
        rx="30" ry="30"
        fill="none" stroke={ink} strokeWidth="9"
      />

      {/* orange "r" — vertical stem with a curved hook to the right */}
      <path
        d="M 72 148 L 72 78 Q 72 60 90 60 L 116 60"
        fill="none"
        stroke="#ff5722"
        strokeWidth="18"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* upward arrow head at hook tip */}
      <path
        d="M 116 28 L 138 64 L 94 64 Z"
        fill="#ff5722"
      />

      {/* wordmark "reachvel" */}
      <text
        x="202"
        y="134"
        fill={ink}
        fontFamily="'Cabinet Grotesk', 'Outfit', system-ui, sans-serif"
        fontSize="150"
        fontWeight="900"
        letterSpacing="-4"
      >
        reachvel
      </text>
    </svg>
  );

  if (!asLink) return svg;
  return (
    <Link to={to} data-testid={testid} className="inline-flex items-center">
      {svg}
    </Link>
  );
}
