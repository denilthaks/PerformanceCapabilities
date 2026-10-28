// The Performance Capability horizontal logo as a vector, recreated from the
// supplied artwork (same layout, colours and proportions), so it stays sharp
// at any size and on high-density phone screens.

const RED = '#de3b27';
const STARS: [number, number][] = [[39, 30], [68, 30], [26, 52], [53, 52], [80, 52], [39, 75], [68, 75]];

function star(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    const rr = i % 2 === 0 ? r : r * 0.42;
    pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)},${(cy + rr * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(' ');
}

export function BrandLogo({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 343 106" role="img" aria-label="Performance Capability" xmlns="http://www.w3.org/2000/svg">
      <rect x="9.5" y="8.5" width="87" height="88" fill="#140606" stroke={RED} strokeWidth="2.2" />
      <g fill={RED} stroke="#7a1a10" strokeWidth="0.8" strokeLinejoin="round">
        {STARS.map(([x, y]) => <polygon key={`${x}-${y}`} points={star(x, y, 11.5)} />)}
      </g>
      <rect x="115.5" y="12.5" width="218" height="29" fill="none" stroke={RED} strokeWidth="1.2" />
      <text
        x="224.5" y="36.5" textAnchor="middle" textLength="206" lengthAdjust="spacingAndGlyphs"
        fill="#f4f4f7" fontFamily="Sora, 'Segoe UI', Arial, sans-serif" fontWeight="700" fontSize="25"
      >
        PERFORMANCE
      </text>
      <text
        x="221" y="83" textAnchor="middle" textLength="220" lengthAdjust="spacingAndGlyphs"
        fill={RED} fontFamily="'Libre Caslon Text', Georgia, 'Times New Roman', serif" fontWeight="700" fontSize="36"
      >
        CAPABILITY
      </text>
    </svg>
  );
}
