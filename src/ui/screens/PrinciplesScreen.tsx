// The principles library. Published material, placeholders and gameplay
// concepts are kept visibly separate.

import { FRAMEWORK, GAME_CONCEPTS, LEVELS, PRINCIPLES, SEVEN_STARS } from '../../content/principles';
import { SCENARIOS } from '../../content/scenarios';
import { ZONES } from '../../content/zones';
import { useGame } from '../../app/game';
import { Constellation, Icon, StatusBadge } from '../common';

function Sources({ sources }: { sources: { label: string; url: string }[] }) {
  return (
    <p className="sources">
      Source{sources.length > 1 ? 's' : ''}:{' '}
      {sources.map((s, i) => (
        <span key={s.url}>{i > 0 && ' · '}<a href={s.url} target="_blank" rel="noopener noreferrer">{s.label}</a></span>
      ))}
    </p>
  );
}

export function PrinciplesScreen() {
  const { progress } = useGame();
  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">Principles</p>
        <h1>The framework behind the game</h1>
        <p className="lede">{FRAMEWORK.summary}</p>
        <Sources sources={FRAMEWORK.sources} />
      </header>

      <section className="glass panel-pad legend">
        <h2>How to read this page</h2>
        <ul className="legend-list">
          <li><StatusBadge status="title" /> Title as published by Performance Capability.</li>
          <li><StatusBadge status="summary" /> Summarised from published material. Exact wording to be confirmed by Ben.</li>
          <li><StatusBadge status="placeholder" /> Couldn't be verified for this prototype. Left for Ben to supply. Nothing here is invented.</li>
          <li><StatusBadge status="game" /> Written for the game to explain scenarios. Not Ben's material.</li>
        </ul>
      </section>

      <h2 className="section-title">Three interconnected levels, twelve principles</h2>
      <div className="levels">
        {LEVELS.map((l) => {
          const zone = ZONES.find((z) => z.alignment.startsWith(`Level ${l.number}`));
          return (
            <article key={l.id} className="glass panel-pad level-card">
              <p className="eyebrow">Level {l.number}{zone ? ` · played in ${zone.name}` : ''}</p>
              <h3>{l.name}</h3>
              <p className="level-sub">{l.subtitle} <StatusBadge status={l.subtitleStatus} /></p>
              <p>{l.summary} <StatusBadge status={l.summaryStatus} /></p>
              <ol className="principle-list">
                {PRINCIPLES.filter((p) => p.level === l.id).map((p) => (
                  <li key={p.id} className={p.titleStatus === 'placeholder' ? 'placeholder' : ''}>
                    <div className="row tight">
                      <strong>{p.number}. {p.title}</strong>
                      <StatusBadge status={p.titleStatus} />
                      {progress.principles.includes(p.id) && <span className="pill state-complete"><Icon name="check" size={14} />Met in play</span>}
                    </div>
                    <p>{p.summary}</p>
                  </li>
                ))}
              </ol>
              <Sources sources={l.sources} />
            </article>
          );
        })}
      </div>

      <section className="glass panel-pad seven-stars">
        <Constellation size={88} />
        <div>
          <h2>The Seven Stars <StatusBadge status={SEVEN_STARS.summaryStatus} /></h2>
          <p>{SEVEN_STARS.summary}</p>
          <p className="muted"><StatusBadge status={SEVEN_STARS.needsStatus} /> {SEVEN_STARS.needsNote}</p>
          <p className="muted">In the game, the Seven Stars appear only as the shape of your capability emblems, and as a prompt in The Horizon to think about what people need from their environment.</p>
          <Sources sources={SEVEN_STARS.sources} />
        </div>
      </section>

      <h2 className="section-title">Gameplay concepts <StatusBadge status="game" /></h2>
      <p className="muted">Short ideas written for this prototype so the feedback can explain each consequence. They are not part of Ben's published framework, and each shows the level it is meant to illustrate.</p>
      <div className="ref-grid">
        {GAME_CONCEPTS.map((c) => (
          <article key={c.id} className="glass panel-pad">
            <h3>{c.title}</h3>
            <p>{c.summary}</p>
            <p className="muted">Illustrates: {c.relatesTo.map((r) => LEVELS.find((l) => l.id === r)?.name ?? PRINCIPLES.find((p) => p.id === r)?.title ?? r).join(', ')}</p>
          </article>
        ))}
      </div>

      <section className="glass panel-pad">
        <h2>How each scenario uses the framework</h2>
        <table className="rubric-table">
          <thead><tr><th scope="col">Zone</th><th scope="col">Scenario</th><th scope="col">Framework alignment</th><th scope="col">What you practise</th></tr></thead>
          <tbody>
            {SCENARIOS.map((s) => {
              const z = ZONES.find((x) => x.id === s.zone)!;
              return (
                <tr key={s.id}>
                  <td>{z.number}. {z.name}</td>
                  <td>{s.title}</td>
                  <td>{z.alignment}</td>
                  <td>{z.theme}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="hint">Zone 4 is a game-design capstone that combines the three published levels. It is not a fourth level of the framework.</p>
      </section>
    </section>
  );
}
