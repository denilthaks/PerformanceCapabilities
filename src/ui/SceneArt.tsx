// Layered SVG environments, one per zone. Lightweight and resolution-
// independent; the gentle animations are CSS and stop under reduced motion.

import type { ZoneId } from '../engine/types';

const W = 1600;
const H = 900;

function Defs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#0c0d13" />
        <stop offset="0.6" stopColor="#11131A" />
        <stop offset="1" stopColor="#07080C" />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#FF303F" stopOpacity="0.55" />
        <stop offset="1" stopColor="#FF303F" stopOpacity="0" />
      </radialGradient>
      <radialGradient id={`${id}-gold`} cx="0.5" cy="0.5" r="0.5">
        <stop offset="0" stopColor="#F0C66A" stopOpacity="0.4" />
        <stop offset="1" stopColor="#F0C66A" stopOpacity="0" />
      </radialGradient>
      <linearGradient id={`${id}-fog`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#A3A8B5" stopOpacity="0" />
        <stop offset="1" stopColor="#A3A8B5" stopOpacity="0.08" />
      </linearGradient>
      <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#23262f" />
        <stop offset="1" stopColor="#14161d" />
      </linearGradient>
    </defs>
  );
}

function Floor({ id, horizon = 560, color = '#FF303F' }: { id: string; horizon?: number; color?: string }) {
  const lines = [];
  for (let i = -12; i <= 12; i++) lines.push(<line key={`v${i}`} x1={W / 2 + i * 30} y1={horizon} x2={W / 2 + i * 260} y2={H} />);
  for (let j = 1; j <= 7; j++) {
    const y = horizon + (H - horizon) * Math.pow(j / 7, 1.8);
    lines.push(<line key={`h${j}`} x1="0" y1={y} x2={W} y2={y} />);
  }
  return (
    <g>
      <rect x="0" y={horizon} width={W} height={H - horizon} fill="#090a0f" />
      <g stroke={color} strokeOpacity="0.12" strokeWidth="1.2">{lines}</g>
      <rect x="0" y={horizon - 120} width={W} height="320" fill={`url(#${id}-fog)`} />
    </g>
  );
}

function Particles({ seed = 1, count = 26 }: { seed?: number; count?: number }) {
  const dots = [];
  let s = seed * 9301;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let i = 0; i < count; i++) {
    dots.push(<circle key={i} className="scene-particle" style={{ animationDelay: `${(rnd() * 8).toFixed(2)}s` }} cx={rnd() * W} cy={rnd() * H * 0.9} r={0.8 + rnd() * 2} fill={rnd() > 0.85 ? '#F0C66A' : '#FF303F'} opacity={0.25 + rnd() * 0.5} />);
  }
  return <g>{dots}</g>;
}

function Foundation() {
  const id = 'fnd';
  return (
    <>
      <Defs id={id} />
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      {/* Back wall panels and beams */}
      <g fill="#12141b" stroke="#1e2129">
        {Array.from({ length: 9 }, (_, i) => <rect key={i} x={i * 180 - 20} y="60" width="170" height="500" />)}
      </g>
      <g fill="#0d0e14">
        <rect x="0" y="40" width={W} height="34" />
        <rect x="0" y="150" width={W} height="10" />
        {[200, 600, 1000, 1400].map((x) => <rect key={x} x={x} y="40" width="26" height="520" />)}
      </g>
      {/* Work-lights */}
      {[300, 800, 1300].map((x) => (
        <g key={x}>
          <rect x={x - 40} y="74" width="80" height="10" fill="#FF303F" opacity="0.85" />
          <ellipse className="scene-pulse" cx={x} cy="200" rx="260" ry="220" fill={`url(#${id}-glow)`} opacity="0.35" />
        </g>
      ))}
      <Floor id={id} />
      {/* Rig A (left, older) */}
      <g transform="translate(330 300)">
        <rect width="300" height="260" rx="10" fill={`url(#${id}-metal)`} stroke="#2c303b" />
        <rect x="24" y="24" width="120" height="70" rx="4" fill="#0b0c11" stroke="#3a3e4a" />
        <path d="M34 70l20-18 18 10 24-26 22 14" stroke="#A3A8B5" strokeWidth="2" fill="none" opacity="0.6" />
        <rect x="170" y="30" width="100" height="160" rx="6" fill="#1a1c24" />
        <circle cx="220" cy="80" r="26" fill="none" stroke="#A3A8B5" strokeOpacity="0.4" strokeWidth="4" />
        <text x="24" y="235" fill="#A3A8B5" fontSize="26" fontFamily="Sora, sans-serif" opacity="0.7">RIG A</text>
      </g>
      {/* Rig B (right, new, glowing) */}
      <g transform="translate(900 270)">
        <rect width="360" height="290" rx="12" fill={`url(#${id}-metal)`} stroke="#FF303F" strokeOpacity="0.5" />
        <rect x="24" y="24" width="150" height="86" rx="4" fill="#0b0c11" stroke="#FF303F" strokeOpacity="0.6" />
        <path className="scene-dash" d="M34 90l24-30 22 14 26-34 26 18 26-12" stroke="#FF303F" strokeWidth="2.5" fill="none" />
        <rect x="200" y="30" width="130" height="190" rx="6" fill="#1a1c24" />
        {[0, 1, 2].map((i) => <circle key={i} cx={235 + i * 30} cy="80" r="11" fill="none" stroke="#FF303F" strokeWidth="3" opacity={0.5 + i * 0.2} />)}
        <rect x="200" y="140" width="130" height="8" fill="#FF303F" opacity="0.7" className="scene-pulse" />
        <text x="24" y="262" fill="#FF303F" fontSize="26" fontFamily="Sora, sans-serif">RIG B</text>
      </g>
      {/* Illuminated walkway */}
      <path d="M560 900 L760 560 L840 560 L1040 900Z" fill="#FF303F" opacity="0.06" />
      <path d="M560 900 L760 560 M1040 900 L840 560" stroke="#FF303F" strokeWidth="3" opacity="0.6" />
      {/* Training-record terminal and procedure shelf */}
      <g transform="translate(100 210)">
        <rect width="150" height="200" rx="8" fill="#151821" stroke="#2c303b" />
        <rect x="16" y="18" width="118" height="80" rx="3" fill="#0b0c11" stroke="#F0C66A" strokeOpacity="0.5" />
        <text x="26" y="64" fill="#F0C66A" fontSize="22" fontFamily="Sora, sans-serif" opacity="0.8">100%</text>
      </g>
      <g transform="translate(1000 190)" opacity="0.9">
        {[0, 1, 2, 3].map((i) => <rect key={i} x={i * 22} y={i % 2 ? 4 : 0} width="18" height="60" fill={i === 2 ? '#8F1026' : '#2a2d38'} />)}
      </g>
      <Particles seed={1} />
    </>
  );
}

function Shift() {
  const id = 'sft';
  const screens: [number, number, number, number][] = [
    [80, 120, 220, 130], [330, 90, 180, 110], [1120, 90, 180, 110], [1320, 120, 220, 130], [90, 300, 160, 100], [1350, 300, 160, 100],
  ];
  return (
    <>
      <Defs id={id} />
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      {/* Branching corridors */}
      <g fill="none" stroke="#FF303F" strokeOpacity="0.18" strokeWidth="2">
        <path d="M0 0 L620 420 M1600 0 L980 420 M0 900 L620 520 M1600 900 L980 520" />
        <path d="M620 420 L980 420 L980 520 L620 520Z" stroke="#9fb4ff" strokeOpacity="0.3" />
      </g>
      <rect x="620" y="420" width="360" height="100" fill="#0b0c12" />
      {/* Central wall display: rising red line */}
      <g transform="translate(600 120)">
        <rect width="400" height="200" rx="6" fill="#0b0c11" stroke="#FF303F" strokeOpacity="0.6" />
        <path className="scene-dash" d="M20 170 L80 160 L140 150 L200 120 L260 100 L320 60 L380 40" stroke="#FF303F" strokeWidth="4" fill="none" />
        <line x1="20" y1="120" x2="380" y2="120" stroke="#A3A8B5" strokeDasharray="6 8" strokeOpacity="0.5" />
        <text x="20" y="30" fill="#A3A8B5" fontSize="18" fontFamily="Inter, sans-serif">AVG RESPONSE</text>
      </g>
      {screens.map(([x, y, w, h], i) => (
        <g key={i} transform={`translate(${x} ${y})`}>
          <rect width={w} height={h} rx="4" fill="#0e1016" stroke={i % 2 ? '#9fb4ff' : '#FF303F'} strokeOpacity="0.35" />
          {Array.from({ length: 4 }, (_, k) => <rect key={k} x="12" y={14 + k * (h / 5)} width={(w - 24) * (0.3 + ((i + k) % 4) * 0.18)} height="6" fill={k % 2 ? '#9fb4ff' : '#FF303F'} opacity="0.35" />)}
        </g>
      ))}
      <Floor id={id} horizon={540} color="#9fb4ff" />
      {/* Diverging floor paths: the obvious one and the hidden one */}
      <path d="M800 900 C800 760 800 640 800 540" stroke="#FF303F" strokeWidth="4" opacity="0.7" fill="none" />
      <path d="M800 760 C700 700 560 640 380 600" stroke="#FF303F" strokeWidth="3" opacity="0.4" fill="none" strokeDasharray="10 10" />
      <path d="M800 700 C900 650 1060 620 1240 600" stroke="#9fb4ff" strokeWidth="3" opacity="0.45" fill="none" strokeDasharray="10 10" />
      <Particles seed={2} />
    </>
  );
}

function Horizon() {
  const id = 'hzn';
  return (
    <>
      <Defs id={id} />
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      <ellipse cx="800" cy="420" rx="900" ry="220" fill={`url(#${id}-gold)`} />
      <ellipse className="scene-pulse" cx="800" cy="440" rx="700" ry="140" fill={`url(#${id}-glow)`} opacity="0.5" />
      {/* Distant skyline */}
      <g fill="#0f1118">
        {Array.from({ length: 28 }, (_, i) => {
          const h = 60 + ((i * 37) % 140);
          return <rect key={i} x={i * 60} y={420 - h} width="44" height={h} />;
        })}
      </g>
      {/* Terraces */}
      <path d="M0 520 L420 470 L700 500 L700 900 L0 900Z" fill="#12141b" stroke="#2a2d38" />
      <path d="M1600 520 L1180 470 L900 500 L900 900 L1600 900Z" fill="#12141b" stroke="#2a2d38" />
      <path d="M500 620 L1100 620 L1220 900 L380 900Z" fill="#151821" stroke="#2a2d38" />
      <path d="M200 380 L560 360 L600 470 L160 500Z" fill="#14161d" stroke="#2a2d38" />
      <path d="M1040 360 L1400 380 L1440 500 L1000 470Z" fill="#14161d" stroke="#2a2d38" />
      {/* Bridges of light */}
      <g fill="none" strokeWidth="4">
        <path className="scene-dash" d="M520 470 Q800 330 1080 470" stroke="#FF303F" opacity="0.75" />
        <path d="M380 520 Q800 640 1220 520" stroke="#F0C66A" opacity="0.5" />
        <path d="M600 620 Q800 520 1000 620" stroke="#FF303F" opacity="0.45" />
      </g>
      {/* Launch beacon */}
      <rect x="790" y="120" width="20" height="220" fill="#1c1f28" />
      <circle className="scene-pulse" cx="800" cy="110" r="18" fill="#F0C66A" />
      <Particles seed={3} count={34} />
    </>
  );
}

function Trial() {
  const id = 'trl';
  return (
    <>
      <Defs id={id} />
      <rect width={W} height={H} fill={`url(#${id}-sky)`} />
      {/* Three portals: the earlier worlds converging */}
      {[[260, 'RIG'], [800, 'SIGNAL'], [1340, 'MERIDIAN']].map(([x, label], i) => (
        <g key={String(label)} transform={`translate(${x} 110)`}>
          <path d="M-110 300 L-110 60 Q0 -40 110 60 L110 300Z" fill="#0d0e14" stroke={i === 1 ? '#9fb4ff' : i === 2 ? '#F0C66A' : '#FF303F'} strokeOpacity="0.55" strokeWidth="3" />
          <text x="0" y="200" textAnchor="middle" fill="#A3A8B5" opacity="0.5" fontSize="20" fontFamily="Sora, sans-serif">{label}</text>
        </g>
      ))}
      <ellipse className="scene-pulse" cx="800" cy="600" rx="520" ry="220" fill={`url(#${id}-glow)`} opacity="0.6" />
      <Floor id={id} horizon={500} />
      {/* Arena rings and the core */}
      <g fill="none" stroke="#FF303F">
        <ellipse cx="800" cy="680" rx="560" ry="150" strokeOpacity="0.35" strokeWidth="3" />
        <ellipse cx="800" cy="680" rx="380" ry="100" strokeOpacity="0.5" strokeWidth="3" />
        <ellipse className="scene-dash" cx="800" cy="680" rx="200" ry="52" strokeOpacity="0.8" strokeWidth="4" />
      </g>
      <path d="M770 680 L800 470 L830 680Z" fill="#FF303F" opacity="0.8" className="scene-pulse" />
      {/* Incident screens */}
      {[[60, 380], [1360, 380]].map(([x, y]) => (
        <g key={x} transform={`translate(${x} ${y})`}>
          <rect width="180" height="110" rx="4" fill="#0b0c11" stroke="#FF303F" strokeOpacity="0.7" />
          <text x="16" y="40" fill="#FF303F" fontSize="18" fontFamily="Sora, sans-serif">INCIDENT</text>
          <rect x="16" y="60" width="120" height="8" fill="#FF303F" opacity="0.6" className="scene-pulse" />
        </g>
      ))}
      <Particles seed={4} count={40} />
    </>
  );
}

export function SceneArt({ zone, className }: { zone: ZoneId; className?: string }) {
  return (
    <svg className={`scene-art ${className ?? ''}`} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">
      {zone === 'foundation' && <Foundation />}
      {zone === 'shift' && <Shift />}
      {zone === 'horizon' && <Horizon />}
      {zone === 'trial' && <Trial />}
    </svg>
  );
}
