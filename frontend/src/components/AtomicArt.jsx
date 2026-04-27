// AtomicArt — physics/chemistry hero visuals, one metaphor per page.
// Each SVG encodes a meaningful narrative for its page.

// ─────────────────────────────────────────────────────────────
// AboutAtom — "The Studio Compound"
// Four disciplines bonded into a stable molecule. A shared orbital
// ring encircles all four nodes — the studio as a whole is more
// stable than any single atom on its own.
// ─────────────────────────────────────────────────────────────
export function AboutAtom({ className = "" }) {
  const nodes = [
    { x: 300, y: 120, label: "Craft",       r: 10, delay: "-0.1s" },
    { x: 470, y: 260, label: "Engineering", r: 14, delay: "-0.8s" },
    { x: 300, y: 420, label: "AI",          r: 12, delay: "-1.5s", accent: true },
    { x: 130, y: 260, label: "Design",      r: 10, delay: "-2.2s" },
  ];
  // complete graph K4 — 6 bonds, every discipline bonded to every other
  const bonds = [
    [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
  ];
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="aboutNode" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5722" />
          <stop offset="100%" stopColor="#ff5722" stopOpacity="0.15" />
        </radialGradient>
      </defs>

      {/* shared orbital shell — the studio itself */}
      <g style={{ transformOrigin: "300px 270px" }} className="animate-spin-slow">
        <circle cx="300" cy="270" r="200" fill="none" stroke="#0a0a0a" strokeOpacity="0.1" strokeDasharray="2 6" />
      </g>
      <g style={{ transformOrigin: "300px 270px" }} className="animate-spin-reverse">
        <circle cx="300" cy="270" r="155" fill="none" stroke="#0a0a0a" strokeOpacity="0.12" />
        {/* two shared electrons that bind the compound */}
        <circle cx="455" cy="270" r="3.5" fill="#ff5722" />
        <circle cx="145" cy="270" r="2.5" fill="#ff5722" />
      </g>

      {/* static bond scaffold */}
      <g stroke="#0a0a0a" strokeOpacity="0.18" strokeWidth="1">
        {bonds.map(([a, b], i) => (
          <line key={i} x1={nodes[a].x} y1={nodes[a].y} x2={nodes[b].x} y2={nodes[b].y} />
        ))}
      </g>
      {/* animated collaboration pulse — bonds carry energy inward */}
      <g stroke="#ff5722" strokeOpacity="0.55" strokeWidth="1" fill="none">
        {bonds.map(([a, b], i) => (
          <line
            key={i}
            x1={nodes[a].x}
            y1={nodes[a].y}
            x2={nodes[b].x}
            y2={nodes[b].y}
            className="bond-flow"
            style={{ animationDelay: `${-i * 0.3}s` }}
          />
        ))}
      </g>

      {/* atoms */}
      {nodes.map((n, i) => (
        <g key={i} className="atom-breathe" style={{ animationDelay: n.delay }}>
          <circle cx={n.x} cy={n.y} r={n.r + 6} fill="url(#aboutNode)" opacity="0.5" />
          <circle cx={n.x} cy={n.y} r={n.r} fill={n.accent ? "#ff5722" : "#0a0a0a"} />
        </g>
      ))}

      {/* labels */}
      <g fontFamily="JetBrains Mono, monospace" fontSize="10" fill="#0a0a0a" opacity="0.55">
        <text x="315" y="118">Craft</text>
        <text x="488" y="262">Engineering</text>
        <text x="318" y="424" fill="#ff5722" opacity="1">AI</text>
        <text x="70" y="262">Design</text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// ServicesAtom — "Periodic Lattice"
// Seven disciplines arranged like a period in the periodic table.
// Electron pulses travel left→right between them — services
// cross-pollinate, never operate in isolation.
// ─────────────────────────────────────────────────────────────
export function ServicesAtom({ className = "" }) {
  const atoms = [
    { x: 90,  y: 300, sym: "W",  name: "Web" },
    { x: 170, y: 300, sym: "M",  name: "Mobile" },
    { x: 250, y: 300, sym: "AI", name: "AI", accent: true },
    { x: 330, y: 300, sym: "EC", name: "Commerce" },
    { x: 410, y: 300, sym: "AD", name: "Ads" },
    { x: 490, y: 300, sym: "BR", name: "Brand" },
    { x: 570, y: 300, sym: "DA", name: "Data" },
  ];
  return (
    <svg viewBox="0 0 660 600" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="svcNode" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5722" />
          <stop offset="100%" stopColor="#ff5722" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* lattice rails */}
      <g stroke="#ffffff" strokeOpacity="0.08" strokeWidth="1">
        <line x1="60" y1="300" x2="600" y2="300" />
        <line x1="60" y1="240" x2="600" y2="240" strokeDasharray="2 6" />
        <line x1="60" y1="360" x2="600" y2="360" strokeDasharray="2 6" />
      </g>

      {/* bonds between atoms — flowing energy */}
      <g stroke="#ff5722" strokeOpacity="0.6" strokeWidth="1.2" fill="none">
        {atoms.slice(0, -1).map((a, i) => (
          <line
            key={i}
            x1={a.x}
            y1="300"
            x2={atoms[i + 1].x}
            y2="300"
            className="bond-flow"
            style={{ animationDelay: `${-i * 0.25}s` }}
          />
        ))}
      </g>

      {/* traveling packet across the whole lattice */}
      <circle r="4" fill="#ff5722">
        <animateMotion
          dur="5s"
          repeatCount="indefinite"
          path={`M${atoms[0].x},300 L${atoms[atoms.length - 1].x},300`}
        />
        <animate attributeName="opacity" dur="5s" repeatCount="indefinite"
          values="0;1;1;0" keyTimes="0;0.1;0.9;1" />
      </circle>

      {/* atoms */}
      {atoms.map((a, i) => (
        <g key={a.sym}>
          <circle cx={a.x} cy="300" r="24" fill="url(#svcNode)" className="lattice-pulse"
            style={{ animationDelay: `${-i * 0.35}s` }} />
          <circle cx={a.x} cy="300" r="16" fill={a.accent ? "#ff5722" : "#ffffff"} fillOpacity={a.accent ? 1 : 0.92} />
          <text x={a.x} y="304" fill={a.accent ? "#ffffff" : "#050505"} fontFamily="JetBrains Mono, monospace"
            fontSize="11" fontWeight="700" textAnchor="middle">{a.sym}</text>
          <text x={a.x} y="350" fill="#ffffff" opacity="0.55" fontFamily="JetBrains Mono, monospace"
            fontSize="9" textAnchor="middle">{a.name}</text>
          <text x={a.x} y="262" fill="#ff5722" opacity="0.6" fontFamily="JetBrains Mono, monospace"
            fontSize="8" textAnchor="middle">S/0{i + 1}</text>
        </g>
      ))}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// ProjectsAtom — "Trajectory Field"
// Every shipped project is a momentum vector. Particles travel along
// curves, leaving their trails behind them — work in motion.
// ─────────────────────────────────────────────────────────────
export function ProjectsAtom({ className = "" }) {
  const paths = [
    { d: "M50,500 C200,400 300,200 550,100", dur: "5s",   delay: "0s"    },
    { d: "M80,100 C250,200 350,400 550,500", dur: "6s",   delay: "-1.5s" },
    { d: "M30,300 C200,250 400,350 570,300", dur: "4.5s", delay: "-0.8s" },
    { d: "M100,560 C200,300 380,260 580,220", dur: "5.5s", delay: "-2.2s" },
    { d: "M40,220 C220,460 360,140 560,420", dur: "6.5s", delay: "-3.3s" },
  ];
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="projNode" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5722" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff5722" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* trajectory paths */}
      <g stroke="#ffffff" strokeOpacity="0.12" strokeWidth="1" fill="none">
        {paths.map((p, i) => <path key={i} d={p.d} />)}
      </g>
      {/* orange highlight trajectory animating */}
      <g stroke="#ff5722" strokeOpacity="0.55" strokeWidth="1.2" fill="none">
        {paths.map((p, i) => (
          <path key={i} d={p.d} className="bond-flow" style={{ animationDelay: p.delay }} />
        ))}
      </g>

      {/* traveling particles — each a project in flight */}
      {paths.map((p, i) => (
        <g key={i}>
          <circle r="18" fill="url(#projNode)">
            <animateMotion dur={p.dur} repeatCount="indefinite" path={p.d} begin={p.delay} />
          </circle>
          <circle r="4" fill="#ff5722">
            <animateMotion dur={p.dur} repeatCount="indefinite" path={p.d} begin={p.delay} />
            <animate attributeName="opacity" dur={p.dur} repeatCount="indefinite"
              values="0;1;1;0" keyTimes="0;0.1;0.9;1" begin={p.delay} />
          </circle>
        </g>
      ))}

      {/* endpoint markers — destinations / shipped outcomes */}
      <g>
        <circle cx="550" cy="100" r="5" fill="#ff5722" />
        <circle cx="550" cy="500" r="5" fill="#ff5722" />
        <circle cx="570" cy="300" r="4" fill="#ffffff" opacity="0.6" />
        <circle cx="580" cy="220" r="4" fill="#ffffff" opacity="0.6" />
        <circle cx="560" cy="420" r="5" fill="#ff5722" />
      </g>

      {/* axis labels */}
      <g fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#ffffff" opacity="0.4">
        <text x="20" y="580">origin</text>
        <text x="520" y="580">→ shipped</text>
        <text x="20" y="30">momentum</text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// CareersAtom — "Nucleation / Crystal Growth"
// A hex lattice where atoms pop into existence with phased delays —
// a team growing outward from a seed, one hire at a time.
// Some nodes are filled (present team), a few are dashed (open roles).
// ─────────────────────────────────────────────────────────────
export function CareersAtom({ className = "" }) {
  const H = 54; // hex spacing
  const cx = 300, cy = 300;
  const ring = (r) => Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k - Math.PI / 2;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
  const atoms = [
    { x: cx, y: cy, r: 14, seed: true },                 // nucleus
    ...ring(H).map((n) => ({ ...n, r: 10 })),            // inner ring
    ...ring(H * 2).map((n) => ({ ...n, r: 8 })),         // middle ring
    ...ring(H * 3).map((n, i) => ({ ...n, r: 7, open: i % 3 === 0 })), // outer ring, some open
  ];
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="careerNode" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5722" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff5722" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* bonds — lines from nucleus outward through every ring */}
      <g stroke="#0a0a0a" strokeOpacity="0.1" strokeWidth="1">
        {atoms.slice(1).map((a, i) => (
          <line key={i} x1={cx} y1={cy} x2={a.x} y2={a.y} />
        ))}
      </g>

      {/* atoms — phased nucleation */}
      {atoms.map((a, i) => {
        const delay = `${-(i * 0.18).toFixed(2)}s`;
        if (a.open) {
          return (
            <g key={i} className="nucleate" style={{ animationDelay: delay }}>
              <circle cx={a.x} cy={a.y} r={a.r + 4} fill="url(#careerNode)" />
              <circle cx={a.x} cy={a.y} r={a.r} fill="none" stroke="#ff5722" strokeWidth="1.5"
                strokeDasharray="2 3" />
            </g>
          );
        }
        return (
          <g key={i} className="nucleate" style={{ animationDelay: delay }}>
            <circle cx={a.x} cy={a.y} r={a.r}
              fill={a.seed ? "#ff5722" : "#0a0a0a"} />
          </g>
        );
      })}

      {/* legend */}
      <g fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#0a0a0a" opacity="0.5">
        <text x="20" y="580">● present</text>
        <text x="130" y="580" fill="#ff5722" opacity="1">◌ open role</text>
        <text x="20" y="30">nucleation · t = 0</text>
      </g>
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────
// KnowledgeAtom — "Wave Interference"
// Essays as waves at different frequencies that overlap and
// resonate — ideas reinforcing each other across disciplines.
// ─────────────────────────────────────────────────────────────
export function KnowledgeAtom({ className = "" }) {
  // three sine-wave paths approximated with cubic curves
  const waves = [
    { d: "M0,300 C75,200 150,200 225,300 S375,400 450,300 S600,200 675,300", stroke: "#0a0a0a", op: 0.35, delay: "0s" },
    { d: "M0,300 C60,380 120,380 180,300 S300,220 360,300 S480,380 540,300 S660,220 720,300", stroke: "#ff5722", op: 0.75, delay: "-1.2s" },
    { d: "M0,300 C100,260 200,340 300,300 S500,260 600,300 S800,340 900,300", stroke: "#0a0a0a", op: 0.2, delay: "-2.4s" },
  ];
  // interference nodes — points where waves cross
  const nodes = [
    { x: 75,  y: 300 },
    { x: 225, y: 300 },
    { x: 375, y: 300 },
    { x: 525, y: 300 },
  ];
  return (
    <svg viewBox="0 0 600 600" className={className} aria-hidden="true">
      <defs>
        <radialGradient id="knowNode" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ff5722" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#ff5722" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* x-axis */}
      <line x1="0" y1="300" x2="600" y2="300" stroke="#0a0a0a" strokeOpacity="0.1" strokeDasharray="2 6" />

      {/* waves */}
      <g fill="none" strokeWidth="1.5">
        {waves.map((w, i) => (
          <g key={i}>
            <path d={w.d} stroke={w.stroke} strokeOpacity={w.op * 0.3} />
            <path d={w.d} stroke={w.stroke} strokeOpacity={w.op} className="wave-flow"
              style={{ animationDelay: w.delay }} />
          </g>
        ))}
      </g>

      {/* interference nodes — pulse at each crossing */}
      {nodes.map((n, i) => (
        <g key={i} className="atom-breathe" style={{ animationDelay: `${-i * 0.6}s` }}>
          <circle cx={n.x} cy={n.y} r="18" fill="url(#knowNode)" />
          <circle cx={n.x} cy={n.y} r="5" fill="#ff5722" />
        </g>
      ))}

      {/* particle riding the orange wave */}
      <circle r="5" fill="#ff5722">
        <animateMotion dur="6s" repeatCount="indefinite"
          path="M0,300 C60,380 120,380 180,300 S300,220 360,300 S480,380 540,300" />
      </circle>

      {/* axis labels */}
      <g fontFamily="JetBrains Mono, monospace" fontSize="9" fill="#0a0a0a" opacity="0.5">
        <text x="20" y="30">amplitude</text>
        <text x="20" y="580">0</text>
        <text x="560" y="580">t</text>
        <text x="20" y="420" fill="#ff5722" opacity="1">f · essays</text>
      </g>
    </svg>
  );
}
