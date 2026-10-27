// The floors list, and a single floor's door: who's there, the medals and
// what they take, and the way in.

import { useGame } from '../../app/game';
import { navigate } from '../../app/router';
import { record } from '../../engine/progress-store';
import { zoneState, zoneUnlocked } from '../../engine/progression';
import { exploreStages } from '../../engine/scenario-engine';
import { ZONES, zoneById } from '../../content/zones';
import { SCENARIO_MAP } from '../../content/scenarios';
import { characterById } from '../../content/characters';
import { Icon, Link } from '../common';
import { MedalCriteria, MedalIcon, MEDAL_NAMES } from '../medals';
import { Portrait, RoomArt } from '../sprites';

const STATE_TEXT = { locked: 'Locked', open: 'Open', 'in-progress': 'In progress', complete: 'Resolved' } as const;

export function ZonesScreen() {
  const { progress } = useGame();
  return (
    <section className="page">
      <header className="page-head">
        <p className="eyebrow pixel-font">Zones</p>
        <h1>Four floors</h1>
        <p className="lede">Floors 1–3 follow the three published levels of the Performance Capability framework. The top floor is a capstone made for this game.</p>
      </header>
      <ul className="zone-cards">
        {ZONES.map((z) => {
          const st = zoneState(progress, z, ZONES);
          const medal = z.scenarioIds.map((id) => record(progress, id).bestMedal).find(Boolean) ?? null;
          return (
            <li key={z.id} className={`zone-card glass state-${st}`}>
              <Link to={`/zone/${z.id}`} className="zone-card-link">
                <div className="zone-card-art"><RoomArt room={z.room} crop={[30, 210]} /></div>
                <div className="zone-card-body">
                  <p className="eyebrow">Floor {z.floor} · Zone {z.number}: {z.name}</p>
                  <h2>{z.place}</h2>
                  <p className="muted">{SCENARIO_MAP.get(z.scenarioIds[0])?.hook}</p>
                  <div className="row">
                    <span className={`pill state-${st}`}>{st === 'locked' && <Icon name="lock" size={14} />}{STATE_TEXT[st]}</span>
                    {medal && <MedalIcon medal={medal} size={24} label={`${MEDAL_NAMES[medal]} medal`} />}
                  </div>
                </div>
              </Link>
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
    return <section className="page narrow"><h1>Floor not found</h1><Link to="/journey" className="btn btn-primary">Back to the Tower</Link></section>;
  }
  const unlocked = zoneUnlocked(progress, zone, ZONES);
  const st = zoneState(progress, zone, ZONES);

  return (
    <section className="page zone-page">
      <div className="zone-hero">
        <RoomArt room={zone.room} />
        <div className="zone-hero-text">
          <Link to="/journey" className="back-link"><Icon name="back" size={18} />The Tower</Link>
          <p className="eyebrow pixel-font">Floor {zone.floor} · Zone {zone.number}: {zone.name}</p>
          <h1>{zone.place}</h1>
        </div>
      </div>

      {zone.scenarioIds.map((sid) => {
        const s = SCENARIO_MAP.get(sid)!;
        const rec = record(progress, sid);
        const inProgress = rec.run && !rec.run.completed;
        const secrets = exploreStages(s).flatMap((x) => x.hotspots).filter((h) => h.secret);
        const found = secrets.filter((h) => progress.evidence.includes(`${sid}/${h.id}`)).length;
        return (
          <div key={sid} className="two-col">
            <section className="glass panel-pad">
              <p className="hook">{s.hook}</p>
              <div className="cast">
                {s.characters.map((cid) => {
                  const c = characterById(cid)!;
                  return (
                    <div key={cid} className="cast-member">
                      <Portrait characterId={cid} size={48} />
                      <span><strong>{c.name}</strong><small>{c.role}</small></span>
                    </div>
                  );
                })}
              </div>
              {!unlocked ? (
                <p className="muted"><Icon name="lock" size={16} /> {progress.player ? zone.unlockText : 'You need a pass first.'}</p>
              ) : (
                <div className="row">
                  {inProgress && <Link to={`/play/${sid}`} className="btn btn-primary btn-lg">Step back in ▸</Link>}
                  {!inProgress && rec.completions === 0 && <Link to={`/play/${sid}`} className="btn btn-primary btn-lg">Step out of the elevator ▸</Link>}
                  {rec.completions > 0 && (
                    <>
                      <button type="button" className="btn btn-primary btn-lg" onClick={() => { game.replay(sid); navigate(`/play/${sid}`); }}>
                        <Icon name="replay" />Play it differently
                      </button>
                      <Link to={`/debrief/${sid}`} className="btn btn-ghost">Floor report</Link>
                    </>
                  )}
                </div>
              )}
              {!zone.publishedLevel && <p className="hint">This floor is a capstone designed for the game. It is not a fourth level of Ben's framework.</p>}
            </section>
            <aside className="glass panel-pad">
              <h2 className="pixel-font small-heading">Medals</h2>
              <MedalCriteria scenario={s} best={rec.bestMedal} />
              {secrets.length > 0 && (
                <p className="muted secrets-count">Hidden things on this floor: {found} of {secrets.length} found{found < secrets.length ? '. Keep your eyes open.' : '.'}</p>
              )}
              {st === 'complete' && <p className="muted">Artefact earned: <strong>{zone.artefact.name}</strong>. {zone.artefact.description}</p>}
            </aside>
          </div>
        );
      })}
    </section>
  );
}
