// My Progress: medals, the founder's memos, achievements, the notebook and
// the clue archive.

import { useGame } from '../../app/game';
import { record, totalXp } from '../../engine/progress-store';
import { ACHIEVEMENTS, MEMO_IDS, zoneComplete } from '../../engine/progression';
import { decisionStages, exploreStages } from '../../engine/scenario-engine';
import { SCENARIOS, SCENARIO_MAP } from '../../content/scenarios';
import { ZONES, zoneForScenario } from '../../content/zones';
import { Icon, Link } from '../common';
import { MedalIcon, MEDAL_NAMES } from '../medals';
import { PLAYER_LOOKS, PlayerPortrait } from '../sprites';

function formatDate(ms: number) {
  return ms ? new Date(ms).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

function hotspot(key: string) {
  const [sid, hid] = key.split('/');
  const s = SCENARIO_MAP.get(sid);
  return s ? exploreStages(s).flatMap((x) => x.hotspots).find((h) => h.id === hid) : undefined;
}

export function ProgressScreen() {
  const { progress } = useGame();
  const p = progress.player;
  const memos = MEMO_IDS.filter((m) => progress.evidence.includes(m));

  return (
    <section className="page progress-page">
      <header className="page-head">
        <p className="eyebrow pixel-font">My Progress</p>
        <h1>{p ? `${p.name}'s week at the Tower` : 'Your week at the Tower'}</h1>
        {!p && <p className="lede">You haven't started yet. <Link to="/create" className="text-link">Get your pass</Link>.</p>}
      </header>

      <div className="stats">
        {p && <div className="stat glass"><PlayerPortrait look={p.avatar} size={56} /><span><strong>{p.name}</strong><small>{PLAYER_LOOKS[p.avatar].label} · Performance Lead</small></span></div>}
        <div className="stat glass"><strong>{ZONES.filter((z) => zoneComplete(progress, z)).length}/4</strong><small>Floors resolved</small></div>
        <div className="stat glass"><strong>{memos.length}/4</strong><small>Founder's memos</small></div>
        <div className="stat glass"><strong>{progress.insights.length}</strong><small>Insight fragments</small></div>
        <div className="stat glass"><strong>{totalXp(progress)}</strong><small>XP (best runs)</small></div>
      </div>

      <section className="glass panel-pad">
        <h2>Medals</h2>
        <ul className="medal-floors">
          {[...ZONES].reverse().map((z) => {
            const m = z.scenarioIds.map((id) => record(progress, id).bestMedal).find(Boolean) ?? null;
            return (
              <li key={z.id}>
                <MedalIcon medal={m} size={34} />
                <Link to={`/zone/${z.id}`}><strong>{z.place}</strong><small>Floor {z.floor} · {m ? MEDAL_NAMES[m] : 'No medal yet'}</small></Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="glass panel-pad memos">
        <h2>The founder's memos</h2>
        {memos.length === 0 && <p className="muted">Someone has been leaving notes around the Tower. None found yet.</p>}
        <ol>
          {MEMO_IDS.map((m, i) => {
            const h = hotspot(m);
            const have = memos.includes(m);
            return (
              <li key={m} className={have ? 'found' : ''}>
                {have && h?.doc ? <blockquote>{h.doc.body.join(' ')}</blockquote>
                  : have && h?.lines ? <blockquote>{h.lines[h.lines.length - 1].text}</blockquote>
                  : <span className="muted">Memo {i + 1}: somewhere on {zoneForScenario(m.split('/')[0])?.place}.</span>}
              </li>
            );
          })}
        </ol>
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

      <section className="glass panel-pad">
        <h2>Your decisions</h2>
        {SCENARIOS.every((s) => !record(progress, s.id).last) && <p className="muted">Resolve a floor to see your decisions here.</p>}
        {SCENARIOS.map((s) => {
          const rec = record(progress, s.id);
          if (!rec.last) return null;
          return (
            <article key={s.id} className="history-item">
              <h3>{zoneForScenario(s.id)?.place} <small className="muted">· played {rec.completions}×</small></h3>
              <ul>
                {decisionStages(s).map((d) => {
                  const o = d.options.find((x) => x.id === rec.last!.choices[d.id]);
                  return o ? <li key={d.id}><span className={`q q-${o.quality}`}>{o.quality}</span> {o.outcome.headline}</li> : null;
                })}
              </ul>
              <Link to={`/debrief/${s.id}`} className="text-link">Floor report</Link>
            </article>
          );
        })}
      </section>

      <section className="glass panel-pad">
        <h2>Your notebook</h2>
        {!progress.journal.length && <p className="muted">What you write at the end of each floor is kept here, on this device.</p>}
        <ul className="journal">
          {[...progress.journal].reverse().map((j) => (
            <li key={j.id}>
              <p className="muted">{formatDate(j.at)} · {zoneForScenario(j.scenarioId)?.place ?? j.scenarioId}</p>
              <ul className="checklist">{j.selected.map((s) => <li key={s}>{s}</li>)}</ul>
              {j.note && (<><p className="muted">{j.prompt}</p><blockquote className="journal-note">{j.note}</blockquote></>)}
            </li>
          ))}
        </ul>
      </section>

      <section className="glass panel-pad">
        <h2>Clue archive</h2>
        {SCENARIOS.map((s) => {
          const items = exploreStages(s).flatMap((st) => st.hotspots).filter((h) => !h.secret && progress.evidence.includes(`${s.id}/${h.id}`));
          if (!items.length) return null;
          return (
            <details key={s.id} className="archive">
              <summary>{zoneForScenario(s.id)?.place}: {items.length} clue{items.length === 1 ? '' : 's'}</summary>
              <ul>{items.map((h) => <li key={h.id}><strong>{h.label}:</strong> {h.summary}</li>)}</ul>
            </details>
          );
        })}
        {!progress.evidence.length && <p className="muted">Everything you find is kept here.</p>}
      </section>
    </section>
  );
}
