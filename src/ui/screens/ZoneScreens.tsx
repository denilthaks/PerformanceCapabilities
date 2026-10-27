// Zones list and a single zone's overview and objectives.

import { useGame } from '../../app/game';
import { navigate } from '../../app/router';
import { record } from '../../engine/progress-store';
import { zoneState, zoneUnlocked } from '../../engine/progression';
import { ZONES, zoneById } from '../../content/zones';
import { SCENARIO_MAP } from '../../content/scenarios';
import { characterById } from '../../content/characters';
import { Icon, Link, ReferenceCard } from '../common';
import { SceneArt } from '../SceneArt';
import { Portrait } from '../Portrait';

const STATE_TEXT = { locked: 'Locked', open: 'Open', 'in-progress': 'In progress', complete: 'Complete' } as const;

export function ZonesScreen() {
  const { progress } = useGame();
  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow">Zones</p>
        <h1>Four zones</h1>
        <p className="lede">Zones 1–3 follow the three published levels of the Performance Capability framework. Zone 4 is a capstone designed for this game.</p>
      </header>
      <ul className="zone-cards">
        {ZONES.map((z) => {
          const st = zoneState(progress, z, ZONES);
          return (
            <li key={z.id} className={`zone-card glass state-${st}`}>
              <div className="zone-card-art"><SceneArt zone={z.id} /></div>
              <div className="zone-card-body">
                <p className="eyebrow">Zone {z.number} · {z.alignment}</p>
                <h2>{z.name}</h2>
                <p>{z.theme}</p>
                <div className="row">
                  <span className={`pill state-${st}`}>{st === 'locked' && <Icon name="lock" size={14} />}{STATE_TEXT[st]}</span>
                  <Link to={`/zone/${z.id}`} className="btn btn-ghost btn-sm">View zone<Icon name="arrow" size={16} /></Link>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

export function ZoneScreen({ id }: { id: string }) {
  const game = useGame();
  const { progress } = game;
  const zone = zoneById(id);
  if (!zone) {
    return (
      <section className="page narrow">
        <h1>Zone not found</h1>
        <Link to="/zones" className="btn btn-primary">All zones</Link>
      </section>
    );
  }
  const st = zoneState(progress, zone, ZONES);
  const unlocked = zoneUnlocked(progress, zone, ZONES);

  return (
    <section className="page zone-page">
      <div className="zone-hero">
        <SceneArt zone={zone.id} />
        <div className="zone-hero-text">
          <Link to="/zones" className="back-link"><Icon name="back" size={18} />All zones</Link>
          <p className="eyebrow">Zone {zone.number} · {zone.alignment}</p>
          <h1>{zone.name}</h1>
          <p className="lede">{zone.theme}</p>
        </div>
      </div>

      <div className="two-col">
        <div>
          <section className="glass panel-pad">
            <h2>Objectives</h2>
            <ul className="checklist">
              {zone.objectives.map((o) => <li key={o}>{o}</li>)}
            </ul>
            <p className="muted">{zone.environment}</p>
            {!zone.publishedLevel && (
              <p className="callout">This zone is a game-design capstone that combines the three published levels. It is not a fourth level of Ben's framework.</p>
            )}
          </section>

          {zone.scenarioIds.map((sid) => {
            const s = SCENARIO_MAP.get(sid)!;
            const rec = record(progress, sid);
            const inProgress = rec.run && !rec.run.completed;
            return (
              <section key={sid} className="glass panel-pad scenario-card">
                <p className="eyebrow">Scenario · about {s.estimatedMinutes} minutes</p>
                <h2>{s.title}</h2>
                <p>{s.tagline}</p>
                <div className="cast">
                  {s.characters.map((cid) => {
                    const c = characterById(cid)!;
                    return (
                      <div key={cid} className="cast-member">
                        <Portrait look={c.look} size={48} />
                        <span><strong>{c.name}</strong><small>{c.role}</small></span>
                      </div>
                    );
                  })}
                </div>
                {rec.completions > 0 && (
                  <p className="muted">Completed {rec.completions} time{rec.completions === 1 ? '' : 's'} · best reasoning score {rec.bestOverall}% · {rec.bestXp} XP</p>
                )}
                {!unlocked ? (
                  <p className="muted"><Icon name="lock" size={16} /> {progress.player ? zone.unlockText : 'Create a character first.'}</p>
                ) : (
                  <div className="row">
                    {inProgress && <Link to={`/play/${sid}`} className="btn btn-primary">Resume<Icon name="arrow" /></Link>}
                    {!inProgress && rec.completions === 0 && <Link to={`/play/${sid}`} className="btn btn-primary">Start scenario<Icon name="arrow" /></Link>}
                    {rec.completions > 0 && (
                      <>
                        <Link to={`/debrief/${sid}`} className="btn btn-ghost">View debrief</Link>
                        <button type="button" className="btn btn-primary" onClick={() => { game.replay(sid); navigate(`/play/${sid}`); }}>
                          <Icon name="replay" />Replay with a different approach
                        </button>
                      </>
                    )}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        <aside>
          <section className="glass panel-pad">
            <h2>Framework links</h2>
            <p className="muted">How this zone relates to the framework. Each card shows whether it is published material or written for the game.</p>
            <div className="ref-list">
              {[...new Set(zone.scenarioIds.flatMap((sid) => SCENARIO_MAP.get(sid)!.principleIds))].map((pid) => <ReferenceCard key={pid} id={pid} compact />)}
            </div>
            <Link to="/principles" className="text-link">Open the principles library</Link>
          </section>
          <section className={`glass panel-pad artefact${st === 'complete' ? ' earned' : ''}`}>
            <h2>Zone artefact</h2>
            <p><strong>{zone.artefact.name}</strong>{st === 'complete' ? ' (earned)' : ' (not yet earned)'}</p>
            <p className="muted">{zone.artefact.description}</p>
          </section>
        </aside>
      </div>
    </section>
  );
}
