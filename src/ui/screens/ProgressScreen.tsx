// Progress, achievements, decision history, learning journal and evidence archive.

import { useGame } from '../../app/game';
import { record, totalXp } from '../../engine/progress-store';
import { ACHIEVEMENTS, zoneComplete, zoneState } from '../../engine/progression';
import { decisionStages, exploreStages } from '../../engine/scenario-engine';
import { SCENARIOS, SCENARIO_MAP } from '../../content/scenarios';
import { ZONES } from '../../content/zones';
import { PLAYER_LOOKS } from '../../content/characters';
import { principleById } from '../../content/principles';
import { Constellation, Icon, Link } from '../common';
import { Portrait } from '../Portrait';

function formatDate(ms: number) {
  return ms ? new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

export function ProgressScreen() {
  const { progress } = useGame();
  const zonesDone = ZONES.filter((z) => zoneComplete(progress, z));
  const p = progress.player;

  return (
    <section className="page progress-page">
      <header className="page-head">
        <p className="eyebrow">My Progress</p>
        <h1>{p ? `${p.name}'s journey` : 'Your journey'}</h1>
        {!p && <p className="lede">You haven't started yet. <Link to="/create" className="text-link">Create a character</Link> to begin.</p>}
      </header>

      <div className="stats">
        {p && <div className="stat glass"><Portrait look={PLAYER_LOOKS[p.avatar].look} size={56} /><span><strong>{p.name}</strong><small>{PLAYER_LOOKS[p.avatar].label}</small></span></div>}
        <div className="stat glass"><strong>{totalXp(progress)}</strong><small>Experience (XP)</small></div>
        <div className="stat glass"><strong>{zonesDone.length}/4</strong><small>Zones complete</small></div>
        <div className="stat glass"><strong>{progress.insights.length}</strong><small>Insight fragments</small></div>
        <div className="stat glass"><strong>{progress.evidence.length}</strong><small>Evidence records</small></div>
        <div className="stat glass"><strong>{progress.principles.filter((id) => principleById(id)).length}</strong><small>Principles met</small></div>
      </div>
      <p className="hint">Insight fragments come from strong decisions. XP keeps your best run per scenario, so replays never inflate it.</p>

      <section className="glass panel-pad">
        <h2>Progress map</h2>
        <ol className="progress-map">
          {ZONES.map((z) => {
            const st = zoneState(progress, z, ZONES);
            return (
              <li key={z.id} className={`state-${st}`}>
                <span className="pm-dot">{st === 'complete' ? <Icon name="check" size={16} /> : st === 'locked' ? <Icon name="lock" size={14} /> : z.number}</span>
                <Link to={`/zone/${z.id}`}><strong>{z.name}</strong><small>{z.alignment}</small></Link>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="two-col">
        <section className="glass panel-pad">
          <h2>Capability emblems and artefacts</h2>
          <ul className="emblems">
            {ZONES.map((z) => {
              const done = zoneComplete(progress, z);
              return (
                <li key={z.id} className={done ? 'earned' : 'locked'}>
                  <Constellation lit={done ? 7 : 0} size={48} />
                  <span><strong>{z.artefact.name}</strong><small>{done ? 'Earned' : 'Not yet earned'} · {z.name}</small></span>
                </li>
              );
            })}
          </ul>
        </section>
        <section className="glass panel-pad">
          <h2>Achievements</h2>
          <ul className="achievements">
            {ACHIEVEMENTS.map((a) => {
              const earned = progress.achievements.includes(a.id);
              return (
                <li key={a.id} className={earned ? 'earned' : 'locked'}>
                  <Icon name={earned ? 'star' : 'lock'} size={18} />
                  <span><strong>{a.title}</strong><small>{a.description}</small></span>
                  <span className="visually-hidden">{earned ? 'Earned' : 'Not earned yet'}</span>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <section className="glass panel-pad">
        <h2>Decisions and feedback</h2>
        {SCENARIOS.every((s) => !record(progress, s.id).last) && <p className="muted">Complete a scenario to see your decisions here.</p>}
        {SCENARIOS.map((s) => {
          const rec = record(progress, s.id);
          if (!rec.last) return null;
          return (
            <article key={s.id} className="history-item">
              <h3>{s.title} <small className="muted">· last score {rec.last.overall}% · best {rec.bestOverall}% · played {rec.completions}×</small></h3>
              <ul>
                {decisionStages(s).map((d) => {
                  const o = d.options.find((x) => x.id === rec.last!.choices[d.id]);
                  return o ? <li key={d.id}><span className={`q q-${o.quality}`}>{o.quality}</span> {d.title}: {o.label} <span className="muted">{o.outcome.headline}</span></li> : null;
                })}
              </ul>
              {rec.history.length > 1 && (
                <details>
                  <summary>Earlier runs ({rec.history.length})</summary>
                  <ul>{rec.history.map((h, i) => <li key={i}>{formatDate(h.at)}: {h.overall}%</li>)}</ul>
                </details>
              )}
              <Link to={`/debrief/${s.id}`} className="text-link">Open debrief</Link>
            </article>
          );
        })}
      </section>

      <section className="glass panel-pad">
        <h2>Learning journal</h2>
        {!progress.journal.length && <p className="muted">Your reflections will appear here after each scenario.</p>}
        <ul className="journal">
          {[...progress.journal].reverse().map((j) => (
            <li key={j.id}>
              <p className="muted">{formatDate(j.at)} · {SCENARIO_MAP.get(j.scenarioId)?.title ?? j.scenarioId}</p>
              <ul className="checklist">{j.selected.map((s) => <li key={s}>{s}</li>)}</ul>
              {j.note && (<><p className="muted">{j.prompt}</p><blockquote className="journal-note">{j.note}</blockquote></>)}
            </li>
          ))}
        </ul>
      </section>

      <section className="glass panel-pad">
        <h2>Evidence archive</h2>
        {!progress.evidence.length && <p className="muted">Evidence you examine in scenarios is collected here.</p>}
        {SCENARIOS.map((s) => {
          const items = exploreStages(s).flatMap((st) => st.hotspots).filter((h) => progress.evidence.includes(`${s.id}/${h.id}`));
          if (!items.length) return null;
          return (
            <details key={s.id} className="archive">
              <summary>{s.title}: {items.length} record{items.length === 1 ? '' : 's'}</summary>
              <ul>{items.map((h) => <li key={h.id}><strong>{h.label}:</strong> {h.summary}</li>)}</ul>
            </details>
          );
        })}
      </section>
    </section>
  );
}
