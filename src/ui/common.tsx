// Small shared UI pieces.

import type { ReactNode } from 'react';
import { resolveReference, type Verification } from '../content/principles';
import type { MeterDef } from '../engine/types';

export function Link({ to, className, children, ...rest }: { to: string; className?: string; children: ReactNode } & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return <a href={`#${to}`} className={className} {...rest}>{children}</a>;
}

const STATUS_TEXT: Record<Verification | 'game', string> = {
  title: 'Published',
  summary: 'Published (summarised)',
  placeholder: 'Placeholder for Ben',
  game: 'Written for the game',
};

const STATUS_HELP: Record<Verification | 'game', string> = {
  title: 'Title as published by Performance Capability.',
  summary: 'Summarised from published Performance Capability material. Exact wording to be confirmed by Ben.',
  placeholder: 'Not verified. A placeholder for Ben to supply.',
  game: 'Written for this prototype. Not Ben\'s material.',
};

export function StatusBadge({ status }: { status: Verification | 'game' }) {
  return <span className={`status status-${status}`} title={STATUS_HELP[status]}>{STATUS_TEXT[status]}</span>;
}

export function ReferenceCard({ id, compact = false }: { id: string; compact?: boolean }) {
  const ref = resolveReference(id);
  if (!ref) return null;
  return (
    <div className={`ref-card ref-${ref.kind}${compact ? ' compact' : ''}`}>
      <div className="ref-head">
        <span className="ref-kind">{ref.kind === 'concept' ? 'Game concept' : ref.kind === 'level' ? 'Framework level' : 'Principle'}</span>
        <StatusBadge status={ref.status} />
      </div>
      <strong className="ref-title">{ref.title}</strong>
      {!compact && <p>{ref.summary}</p>}
    </div>
  );
}

export function Meters({ defs, values, before }: { defs: MeterDef[]; values: Record<string, number>; before?: Record<string, number> }) {
  return (
    <ul className="meters" aria-label="Situation in the story (simulated)">
      {defs.map((m) => {
        const v = values[m.id] ?? m.start;
        const delta = before ? v - (before[m.id] ?? m.start) : 0;
        return (
          <li key={m.id} className="meter">
            <span className="meter-label">{m.label}</span>
            <span className="meter-track" aria-hidden="true">
              <span className="meter-fill" style={{ width: `${v * 10}%` }} />
            </span>
            <span className="meter-value">
              {v}/10
              {delta !== 0 && <span className={`delta ${delta > 0 ? 'up' : 'down'}`}>{delta > 0 ? `+${delta}` : delta}</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function ScoreBar({ value, label }: { value: number; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <span className="score-bar" role="img" aria-label={`${label}: ${pct}%`}>
      <span className="score-fill" style={{ width: `${pct}%` }} />
    </span>
  );
}

type IconName = 'back' | 'check' | 'lock' | 'star' | 'menu' | 'close' | 'eye' | 'doc' | 'person' | 'replay' | 'map' | 'spark' | 'arrow';

const PATHS: Record<IconName, string> = {
  back: 'M15 18l-6-6 6-6',
  check: 'M5 12l5 5L20 7',
  lock: 'M7 11V8a5 5 0 0110 0v3M5 11h14v10H5z',
  star: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  close: 'M6 6l12 12M18 6L6 18',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zm10-3a3 3 0 100 6 3 3 0 000-6z',
  doc: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  person: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 9a7 7 0 0114 0',
  replay: 'M4 12a8 8 0 108-8H8M8 1L5 4l3 3',
  map: 'M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14',
  spark: 'M12 2v6M12 16v6M2 12h6M16 12h6M5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4',
  arrow: 'M5 12h14M13 6l6 6-6 6',
};

export function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  return (
    <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={PATHS[name]} />
    </svg>
  );
}

/** The seven-star constellation, used for capability emblems. */
export function Constellation({ lit = 7, size = 64 }: { lit?: number; size?: number }) {
  const pos = [[30, 26], [62, 26], [16, 50], [46, 50], [76, 50], [30, 74], [62, 74]];
  return (
    <svg width={size} height={size} viewBox="0 0 92 100" aria-hidden="true" className="constellation">
      <rect x="3" y="5" width="86" height="90" fill="none" stroke="#8F1026" strokeWidth="3" />
      {pos.map(([x, y], i) => (
        <path key={i} transform={`translate(${x} ${y}) scale(0.62)`} d="M0-14l4 9 10 1.2-7.5 6.8 2.2 10L0 7.8-8.7 13l2.2-10L-14-3.8-4-5z" fill={i < lit ? '#FF303F' : '#2a2d38'} />
      ))}
    </svg>
  );
}
