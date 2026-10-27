// The central world map: four zones joined by pathways. The SVG is the
// picture; the zone markers are real buttons laid over it.

import { useState } from 'react';
import { useGame } from '../../app/game';
import { zoneState, type ZoneState } from '../../engine/progression';
import { ZONES } from '../../content/zones';
import { PLAYER_LOOKS } from '../../content/characters';
import { Icon, Link } from '../common';
import { Portrait } from '../Portrait';

const POS: Record<string, [number, number]> = {
  foundation: [16, 70],
  shift: [40, 34],
  horizon: [64, 66],
  trial: [86, 28],
};

const STATE_TEXT: Record<ZoneState, string> = {
  locked: 'Locked',
  open: 'Open',
  'in-progress': 'In progress',
  complete: 'Complete',
};

export function MapScreen() {
  const { progress } = useGame();
  const states = Object.fromEntries(ZONES.map((z) => [z.id, zoneState(progress, z, ZONES)])) as Record<string, ZoneState>;
  const current = ZONES.find((z) => states[z.id] === 'in-progress') ?? ZONES.find((z) => states[z.id] === 'open') ?? ZONES[0];
  const [selected, setSelected] = useState(current.id);
  const zone = ZONES.find((z) => z.id === selected) ?? ZONES[0];
  const look = progress.player ? PLAYER_LOOKS[progress.player.avatar].look : null;

  const path = (a: string, b: string) => {
    const [ax, ay] = POS[a];
    const [bx, by] = POS[b];
    return `M${ax * 10} ${ay * 6} Q${((ax + bx) / 2) * 10} ${((ay + by) / 2) * 6 + 90} ${bx * 10} ${by * 6}`;
  };

  return (
    <section className="page map-page">
      <header className="page-head">
        <p className="eyebrow">The Journey</p>
        <h1>The world</h1>
        <p className="lede">Four zones, connected. Each zone opens when the one before it is complete.</p>
      </header>

      {!progress.player && (
        <p className="callout">
          <Icon name="person" /> Create a character to unlock the first zone. <Link to="/create" className="btn btn-primary btn-sm">Create character</Link>
        </p>
      )}

      <div className="world-map glass">
        <svg viewBox="0 0 1000 600" className="world-map-art" aria-hidden="true" focusable="false">
          <defs>
            <radialGradient id="map-glow"><stop offset="0" stopColor="#FF303F" stopOpacity="0.5" /><stop offset="1" stopColor="#FF303F" stopOpacity="0" /></radialGradient>
          </defs>
          {ZONES.slice(1).map((z, i) => {
            const from = ZONES[i];
            const lit = states[from.id] === 'complete';
            return <path key={z.id} d={path(from.id, z.id)} className={`map-path${lit ? ' lit' : ''}`} />;
          })}
          {ZONES.map((z) => {
            const [x, y] = POS[z.id];
            return states[z.id] !== 'locked' ? <circle key={z.id} cx={x * 10} cy={y * 6} r="90" fill="url(#map-glow)" /> : null;
          })}
        </svg>
        {ZONES.map((z) => {
          const [x, y] = POS[z.id];
          const st = states[z.id];
          return (
            <button
              key={z.id}
              type="button"
              className={`map-node state-${st}${selected === z.id ? ' selected' : ''}`}
              style={{ left: `${x}%`, top: `${y}%` }}
              aria-pressed={selected === z.id}
              onClick={() => setSelected(z.id)}
            >
              {look && z.id === current.id && (
                <span className="map-player" aria-hidden="true"><Portrait look={look} size={40} /></span>
              )}
              <span className="map-node-mark">{st === 'locked' ? <Icon name="lock" size={18} /> : st === 'complete' ? <Icon name="check" size={20} /> : <span>{z.number}</span>}</span>
              <span className="map-node-label">{z.name}<small>{STATE_TEXT[st]}</small></span>
            </button>
          );
        })}
      </div>

      <article className="zone-panel glass" aria-live="polite">
        <div className="zone-panel-head">
          <p className="eyebrow">Zone {zone.number} · {zone.alignment}</p>
          <h2>{zone.name}</h2>
          <span className={`pill state-${states[zone.id]}`}>{STATE_TEXT[states[zone.id]]}</span>
        </div>
        <p>{zone.theme}</p>
        {states[zone.id] === 'locked'
          ? <p className="muted"><Icon name="lock" size={16} /> {progress.player ? zone.unlockText : 'Create a character first.'}</p>
          : <Link to={`/zone/${zone.id}`} className="btn btn-primary">Enter {zone.name}<Icon name="arrow" /></Link>}
        {!zone.publishedLevel && <p className="hint">This capstone zone was designed for the game. It is not a level of the published framework.</p>}
      </article>
    </section>
  );
}
