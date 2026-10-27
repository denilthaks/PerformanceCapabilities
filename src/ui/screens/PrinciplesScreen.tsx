// The Codex: the framework behind the Tower, as something to explore rather
// than read. Three level slabs with flip cards for the twelve principles, the
// Seven Stars as a turning constellation, and the game's own insights as
// collectable cards. Verification status stays on every card; sources and the
// fine print are one click away.

import { useState } from 'react';
import { FRAMEWORK, GAME_CONCEPTS, LEVELS, PRINCIPLES, SEVEN_STARS, type Principle, type Verification } from '../../content/principles';
import { ZONES } from '../../content/zones';
import { useGame } from '../../app/game';
import { Link, StatusBadge } from '../common';
import { RoomArt } from '../sprites';

function firstSentence(text: string): string {
  const m = text.match(/^.*?[.!?](\s|$)/);
  return (m ? m[0] : text).trim();
}

function FlipCard({ front, back, className, label }: { front: React.ReactNode; back: React.ReactNode; className?: string; label: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      className={`flip ${className ?? ''}${flipped ? ' flipped' : ''}`}
      aria-pressed={flipped}
      aria-label={`${label}. ${flipped ? 'Showing details' : 'Turn over for details'}`}
      onClick={() => setFlipped((f) => !f)}
      data-tilt
    >
      <span className="flip-inner">
        <span className="flip-face flip-front">{front}</span>
        <span className="flip-face flip-back">{back}</span>
      </span>
    </button>
  );
}

const GLYPH: Record<Verification | 'game', string> = { title: '✓', summary: '◐', placeholder: '?', game: '✦' };

function PrincipleCard({ p, met }: { p: Principle; met: boolean }) {
  const placeholder = p.titleStatus === 'placeholder';
  const bare = p.title.replace(/^Principle \d+:\s*/, '');
  const title = placeholder ? 'Awaiting Ben' : bare.charAt(0).toUpperCase() + bare.slice(1);
  return (
    <FlipCard
      className={`codex-card principle${placeholder ? ' sealed' : ''}${met ? ' met' : ''}`}
      label={`Principle ${p.number}: ${title}`}
      front={(
        <>
          <span className="card-num">{p.number}</span>
          <span className="card-title">{title}</span>
          <span className="card-foot">
            <span className={`glyph glyph-${p.titleStatus}`} aria-hidden="true">{GLYPH[p.titleStatus]}</span>
            {met && <span className="card-met">Met in play</span>}
          </span>
        </>
      )}
      back={(
        <>
          <span className="card-back-text">{placeholder ? 'This principle\'s title and description are waiting for Ben to supply them.' : firstSentence(p.summary)}</span>
          <StatusBadge status={p.summaryStatus} />
        </>
      )}
    />
  );
}

export function PrinciplesScreen() {
  const { progress } = useGame();
  const found = new Set(progress.principles);

  return (
    <section className="page codex">
      <header className="codex-hero">
        <p className="eyebrow pixel-font">Principles</p>
        <h1>The Codex</h1>
        <p className="lede">The framework behind the Tower: three levels, twelve principles. Turn a card over to read it.</p>
      </header>

      <div className="levels-3d">
        {LEVELS.map((l) => {
          const zone = ZONES.find((z) => z.alignment.startsWith(`Level ${l.number}`));
          return (
            <article key={l.id} className={`slab slab-${l.number}`} data-tilt>
              {zone && <div className="slab-art" aria-hidden="true"><RoomArt room={zone.room} crop={[30, 220]} /></div>}
              <div className="slab-head">
                <span className="slab-level">Level {l.number}</span>
                <h2>{l.name}</h2>
                <p className="slab-sub">{l.subtitle}</p>
                <p className="slab-line">{l.summaryStatus === 'placeholder' ? 'Full description awaiting Ben.' : firstSentence(l.summary)}</p>
                {zone && <Link to={`/zone/${zone.id}`} className="slab-link">Played on {zone.place} ▸</Link>}
              </div>
              <div className="card-row">
                {PRINCIPLES.filter((p) => p.level === l.id).map((p) => <PrincipleCard key={p.id} p={p} met={found.has(p.id)} />)}
              </div>
            </article>
          );
        })}
      </div>

      <section className="stars-3d" aria-labelledby="stars-title">
        <div className="orbit" aria-hidden="true">
          <div className="orbit-spin">
            {Array.from({ length: 7 }, (_, i) => (
              <span key={i} className="orbit-star" style={{ '--i': i } as React.CSSProperties}>★</span>
            ))}
          </div>
        </div>
        <div className="stars-text">
          <h2 id="stars-title">The Seven Stars</h2>
          <p>Seven human needs that drive what people achieve.</p>
          <p className="muted"><StatusBadge status="placeholder" /> Their names are waiting for Ben. The game never scores you against them.</p>
        </div>
      </section>

      <section aria-labelledby="insights-title">
        <h2 id="insights-title" className="codex-h2">Insights <span className="muted">· the game's own lessons, earned in play</span></h2>
        <div className="insight-grid">
          {GAME_CONCEPTS.map((c) => {
            const have = found.has(c.id);
            return (
              <FlipCard
                key={c.id}
                className={`codex-card insight${have ? ' met' : ' unfound'}`}
                label={`${c.title}${have ? ', found in play' : ''}`}
                front={(
                  <>
                    <span className="insight-gem" aria-hidden="true">✦</span>
                    <span className="card-title">{c.title}</span>
                    <span className="card-foot">{have ? <span className="card-met">Found in play</span> : <span className="muted">Not found yet</span>}</span>
                  </>
                )}
                back={(
                  <>
                    <span className="card-back-text">{c.summary}</span>
                    <StatusBadge status="game" />
                  </>
                )}
              />
            );
          })}
        </div>
      </section>

      <section aria-labelledby="floors-title">
        <h2 id="floors-title" className="codex-h2">Where each idea lives</h2>
        <div className="floor-tiles">
          {ZONES.map((z) => (
            <Link key={z.id} to={`/zone/${z.id}`} className="floor-tile" data-tilt>
              <RoomArt room={z.room} crop={[30, 220]} />
              <span className="floor-tile-text">
                <strong>{z.place}</strong>
                <small>{z.publishedLevel ? z.alignment : 'Capstone: all three levels'}</small>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <details className="glass panel-pad codex-fine">
        <summary>Sources and how this content is verified</summary>
        <ul className="legend-list">
          <li><span className="glyph glyph-title">✓</span> <StatusBadge status="title" /> Title as published by Performance Capability.</li>
          <li><span className="glyph glyph-summary">◐</span> <StatusBadge status="summary" /> Summarised from published material; wording to be confirmed by Ben.</li>
          <li><span className="glyph glyph-placeholder">?</span> <StatusBadge status="placeholder" /> Not verified; left for Ben to supply. Nothing is invented.</li>
          <li><span className="glyph glyph-game">✦</span> <StatusBadge status="game" /> Written for the game. Not Ben's material.</li>
        </ul>
        <p className="muted">{FRAMEWORK.summary} {SEVEN_STARS.summary}</p>
        <p className="sources">
          Sources:{' '}
          {[...FRAMEWORK.sources, ...LEVELS.flatMap((l) => l.sources), ...SEVEN_STARS.sources]
            .filter((s, i, all) => all.findIndex((x) => x.url === s.url) === i)
            .map((s, i) => <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></span>)}
        </p>
        <p className="hint">Zone 4 is a game-design capstone that combines the three published levels. It is not a fourth level of the framework.</p>
      </details>
    </section>
  );
}
